# Architecture

How QueryFish turns an OpenAPI document into typed React Query hooks, and why it is
structured the way it is. If you are here to contribute, this is the right place to start.

Decisions summarised here are recorded in full — with the alternatives that were
rejected — in the [ADRs](./adr/).

---

## The pipeline

QueryFish is a four-stage pipeline. Each stage is pure — it takes data in and returns
data out, with no hidden state — which means every stage can be tested on its own.

```
spec (file | URL | JSON | YAML)
  │
  ├─ 1. loader/   → dereferenced OpenAPI document + source info for errors
  ├─ 2. ir/       → normalized, framework-agnostic Operation[] + schema graph
  ├─ 3. emit/     → TypeScript source strings (one emitter per output file)
  └─ 4. write/    → prettier-format, diff against disk, write or --dry-run
```

### Why an IR?

The obvious design is to walk the OpenAPI document and print TypeScript as you go.
We don't do that, for three reasons:

1. **It is where the hard problems live.** Cycle-breaking, name-collision resolution,
   and pagination metadata all need a normalized model. Solving them mid-print means
   solving them repeatedly, slightly differently, in every emitter.
2. **It keeps emitters small and reviewable.** An emitter is
   `(ir, config) => string` — no spec parsing, no `$ref` chasing.
3. **It is how the roadmap stays cheap.** Zod schemas, MSW handlers, and the plugin
   system are each "another emitter over the same IR" rather than a rewrite. The IR is
   the extension point, chosen deliberately so that adding output formats is never a
   breaking change.

---

## Stage 1 — Loader

`src/loader/`

Accepts a local path, an `http(s)` URL, or a pre-parsed object, and returns a fully
dereferenced document. Parsing is delegated to
[`@redocly/openapi-core`](https://www.npmjs.com/package/@redocly/openapi-core):

```ts
const config = await createConfig({ extends: ['minimal'] });
const results = await bundle({ ref, config, dereference: true });
const doc = results.bundle.parsed;
```

Redocly handles OpenAPI 3.0, 3.1, **and Swagger 2.0**, and resolves `$ref` more
correctly than a hand-rolled resolver — including remote and cross-file references.

Failures are wrapped in a `SpecError` carrying the file, the JSON pointer, and where
available a line/column, so the CLI can point at the exact spot in the spec rather
than printing a stack trace.

> ⚠️ **`dereference: true` can produce circular JavaScript objects.** This is not a
> theoretical concern — any self-referential schema (`Comment.replies`,
> `Category.children`) produces one, and they are common in real specs. See
> [Cycle safety](#cycle-safety-the-one-that-bites) below.

---

## Stage 2 — IR

`src/ir/`

The normalized model everything downstream reads:

```ts
interface Operation {
  operationId: string;         // resolved & collision-free
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | ...;
  path: string;                // '/users/{id}'
  pathSegments: string[];      // ['users', '{id}']  → the query key
  pathParams: Param[];
  queryParams: Param[];
  headerParams: Param[];
  requestBody?: IRSchema;
  response: IRSchema;          // 2xx JSON content
  kind: 'query' | 'mutation';
  pagination?: PaginationSpec; // set ONLY when explicitly opted in
  deprecated: boolean;
  summary?: string;
  description?: string;
  tags: string[];
}
```

**Query vs mutation** is decided by method: `GET` and `HEAD` become queries,
everything else becomes mutations.

### Cycle safety (the one that bites)

Because the loader hands us circular objects, the schema walk in `src/ir/schema.ts`
must never recurse blindly. Two mechanisms prevent it:

- Named component schemas are **registered up front** and emitted once as top-level
  interfaces. A nested reference to one emits _the name_, not an expansion.
- A `WeakSet` of visited schema objects guards the walk itself.

Inline anonymous schemas are hoisted to generated names so they can participate in
the same scheme. There is a dedicated fixture (`test/fixtures/edge-cases.yaml`) whose
whole job is to fail loudly if this regresses.

### Naming

`src/ir/naming.ts` exists because real-world specs routinely break naive generators:

| Case                      | Handling                                                       |
| ------------------------- | -------------------------------------------------------------- |
| Missing `operationId`     | Derive from method + path (`get /users/{id}` → `getUsersById`) |
| Duplicate `operationId`   | Deterministic suffix, with a warning                           |
| Non-identifier characters | Sanitized                                                      |
| Leading digit             | Prefixed                                                       |
| Reserved TypeScript word  | Suffixed                                                       |

Every rule has a unit test. This module is where day-one bug reports come from, so it
is worth over-testing.

---

## Stage 3 — Emitters

`src/emit/` — each emitter is `(ir, config) => string`, one per output file.

### `types.ts`

Interfaces, enums, and unions from component schemas, plus per-operation
`XxxVariables` and `XxxResponse` types. Handles `allOf` (intersection), `oneOf` /
`anyOf` (union), `nullable`, arrays, `additionalProperties` (→ `Record`), enums
(→ string literal unions), and `$ref` cycles via named reference.

### `requests.ts`

Plain async functions — no React, no hooks, usable from anywhere:

```ts
import { client } from '../client';

export const getUser = (variables: GetUserVariables) =>
  client.request<GetUserResponse>({
    method: 'GET',
    url: `/users/${variables.id}`,
  });
```

### `queries.ts`

```ts
export const useGetUser = createQuery<GetUserResponse, GetUserVariables>({
  queryKey: ['users', '{id}'],
  fetcher: getUser,
});
```

### `mutations.ts`

`createMutation` with `mutationFn` pointing at the matching request function.

### `infiniteQueries.ts`

Emitted **only** for operations carrying a `PaginationSpec`. When nothing opts in,
the file is not written at all. See [Pagination](#pagination-opt-in-by-design).

### `index.ts`

A barrel re-export so consumers have a single import path.

All output carries a `// Generated by QueryFish — do not edit.` header and is
formatted with **the user's own Prettier config** when one is present, so generated
code matches the surrounding codebase instead of fighting it.

---

## Stage 4 — Writer

Formats, diffs against what is already on disk, and either writes or — under
`--dry-run` — reports what would change and exits without touching anything.

---

## Key design decisions

### Zero runtime dependencies

QueryFish ships **no runtime**. Generated code imports only from `react-query-kit`,
`@tanstack/react-query`, and _your own client module_.

The config names a module path; generated requests import from it:

```ts
// queryfish.config.ts
export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  client: './src/api/client.ts',
});
```

```ts
// src/api/client.ts — you write this once
import axios from 'axios';
export const client = axios.create({ baseURL: '/api' });
```

Interceptors, auth, retries, and base URLs stay in your code, where you can debug
them. We deliberately do not own that layer. The client is typed against a **minimal
structural interface**, so axios, `fetch`, `ky`, or a custom wrapper all work; the
test suite verifies a `fetch` adapter specifically to keep the interface from
drifting into an axios-shaped hole.

### Query keys are path segments

The key mirrors the URL structure:

```ts
queryKey: ['users', '{id}'];
```

`react-query-kit` **automatically appends variables as the last element**, so the
runtime key is `['users', '{id}', { id: '123' }]` — cache entries are correctly
separated per-variable without us doing anything.

The reason to use path segments rather than the operation name is **prefix
invalidation**, the most common React Query operation there is:

```ts
// invalidate every /users/* query at once
queryClient.invalidateQueries({ queryKey: ['users'] });
```

With operation-name keys (`['getUser']`), every endpoint is an island and you have to
enumerate them by hand.

### Pagination: opt-in by design

OpenAPI has **no standard** for describing pagination. Generators that guess produce
the worst possible failure: a hook that looks right, compiles, and silently fetches
page 2 forever.

So QueryFish does not guess. With no configuration, **no infinite queries are
emitted at all**. You opt in explicitly, either in config:

```ts
pagination: {
  '/users': { param: 'cursor', nextField: 'nextCursor' },
}
```

or in the spec itself:

```yaml
x-queryfish-pagination:
  param: cursor
  nextField: nextCursor
```

When opted in, the cursor parameter is removed from the variables type and injected
from `pageParam` instead, so callers cannot pass it by mistake.

---

## Testing strategy

- **Snapshot tests** over three fixtures — Petstore (realistic), `edge-cases.yaml`
  (circular refs, missing/duplicate `operationId`s, reserved words, `allOf`/`oneOf`,
  204 no-content, nested inline schemas), and a Swagger 2.0 document. Snapshots are
  committed, so an emitter change shows up as a readable output diff in the PR. This
  is the intended review surface, not noise.
- **Unit tests** for `naming.ts` and for `schema.ts` cycle handling.
- **A type-level test**: CI runs `tsc --noEmit` over the generated Petstore output.
  Snapshots prove output did not _change_; only type-checking proves it _compiles_.
  For a code generator, that is the test that actually matters.

---

## Adding a new emitter

The common contribution. Roughly:

1. Add `src/emit/<name>.ts` exporting `(ir, config) => string`.
2. Register it in `src/generate.ts`.
3. Add a config flag if it should be optional.
4. Run tests and commit the resulting snapshot.

If you find yourself needing spec details the IR does not carry, extend the IR rather
than reaching back into the raw document — that boundary is what keeps emitters
simple.

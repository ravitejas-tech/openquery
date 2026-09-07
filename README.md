# OpenQuery

> OpenAPI → Type-safe React Query Kit factories.

OpenQuery is an open-source code generator that transforms your
[OpenAPI/Swagger](https://swagger.io/specification/) specifications into
fully typed API clients powered by
[React Query](https://tanstack.com/query) and
[react-query-kit](https://github.com/HuolalaTech/react-query-kit).

---

## ✨ Features

| Feature                             | Description                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| **TypeScript types**                | Auto-generated request/response types from your OpenAPI spec                   |
| **`createQuery`**                   | Generated query factories for every `GET` endpoint                             |
| **`createMutation`**                | Generated mutation factories for `POST` / `PUT` / `PATCH` / `DELETE` endpoints |
| **`createInfiniteQuery`**           | Opt-in infinite query factories for paginated endpoints                        |
| **Type-safe variables**             | Path params, query params, and request bodies are fully typed                  |
| **Prefix-invalidatable keys**       | Query keys mirror your URL structure                                           |
| **OpenAPI 3.0 · 3.1 · Swagger 2.0** | All three, from local files or URLs                                            |
| **Minimal config**                  | Point at a spec, get production-ready code                                     |
| **Zero runtime**                    | Generated code imports your HTTP client — OpenQuery is a dev dependency only   |

---

## 🚀 Quick Example

Given an OpenAPI spec:

```yaml
paths:
  /pets/{petId}:
    get:
      operationId: getPet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
```

OpenQuery generates a **query factory**:

```ts
import { createQuery } from 'react-query-kit';
import { getPet } from './requests.js';
import type { GetPetVariables, GetPetResponse } from './types.js';

export const useGetPet = createQuery<GetPetResponse, GetPetVariables>({
  queryKey: ['pets', '{petId}'],
  fetcher: getPet,
});
```

Use it in your component:

```tsx
const { data } = useGetPet({
  variables: { petId: '123' },
});
```

### Query keys mirror your URLs

react-query-kit appends `variables` to the key automatically, so the runtime key
is `['pets', '{petId}', { petId: '123' }]` — cache entries stay separated per
variable. Because the prefix is the URL path, you can invalidate a whole
resource tree in one call:

```ts
// Clears every /pets/* query at once
queryClient.invalidateQueries({ queryKey: ['pets'] });
```

### Mutations

```yaml
paths:
  /pets:
    post:
      operationId: createPet
```

Generates:

```ts
import { createMutation } from 'react-query-kit';

export const useCreatePet = createMutation<CreatePetResponse, CreatePetVariables>({
  mutationFn: createPet,
});
```

### Infinite Queries (opt-in)

OpenAPI has no standard way to describe pagination, so **OpenQuery never
guesses**. A generator that infers pagination wrong produces a hook that
compiles fine and then fetches page 2 forever — so you opt in explicitly, either
in your config:

```ts
pagination: {
  '/pets': { param: 'cursor', nextField: 'nextCursor' },
}
```

or in the spec itself:

```yaml
paths:
  /pets:
    get:
      operationId: listPets
      x-openquery-pagination:
        param: cursor
        nextField: nextCursor
```

Which generates:

```ts
export const useListPetsInfinite = createInfiniteQuery<
  ListPetsResponse,
  Omit<ListPetsVariables, 'cursor'>,
  Error,
  string | undefined
>({
  queryKey: ['pets'],
  fetcher: (variables, { pageParam }) => listPets({ ...variables, cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  initialPageParam: undefined,
});
```

The cursor is supplied by `pageParam`, so it's omitted from the hook's variables
— you can't set it by mistake. With no opt-in, `infiniteQueries.ts` isn't
generated at all.

---

## 📦 Installation

```bash
npm install openquery --save-dev
# or
yarn add openquery --dev
```

---

## 🛠️ Usage

### 1. Write a client

OpenQuery ships **no runtime**. Generated request functions import a `client`
that you own, so auth, interceptors, retries, and base URLs stay in your code:

```ts
// src/api/client.ts
import axios from 'axios';

export const client = axios.create({ baseURL: '/api' });
```

An axios instance works as-is. So does anything with a matching `request`
method — see the [fetch-based client](./examples/petstore-react/src/client.ts)
in the example if you'd rather not add a dependency.

### 2. Configure

Create an `openquery.config.ts` in your project root:

```ts
import { defineConfig } from 'openquery';

export default defineConfig({
  input: './openapi.yaml', // path or URL to your OpenAPI spec
  output: './src/api', // output directory for generated code
  client: './src/api/client.ts', // module exporting your `client`
});
```

### 3. Generate

```bash
npx openquery generate
```

### CLI options

```
openquery generate [options]

  -c, --config <path>   Path to config file
  -i, --input <spec>    Path or URL to the OpenAPI document
  -o, --output <dir>    Output directory
      --client <module> Module exporting the HTTP client
      --no-format       Skip Prettier formatting
      --dry-run         Report what would change without writing
      --watch           Regenerate when the spec changes
      --silent          Suppress output
```

### Generated output structure

```
src/api/
├── types.ts           # TypeScript interfaces & enums
├── requests.ts        # Plain async request functions
├── queries.ts         # createQuery factories
├── mutations.ts       # createMutation factories
├── infiniteQueries.ts # createInfiniteQuery factories (only if opted in)
└── index.ts           # Barrel re-export
```

Output is formatted with **your** Prettier config, so it matches the rest of
your codebase.

---

## 📁 Example

A complete React app lives in
[`examples/petstore-react`](./examples/petstore-react) — spec, config, committed
generated output, and hooks in use.

---

## 🎯 Goal

OpenQuery aims to be the best-in-class code generator for teams using
**React Query Kit**.

Instead of trying to support every framework and every pattern, OpenQuery
focuses on doing one thing exceptionally well:

**OpenAPI → `createQuery` · `createMutation` · `createInfiniteQuery`**

---

## 🗺️ Roadmap

- [x] Core code generation (`createQuery`, `createMutation`)
- [x] `createInfiniteQuery` for paginated endpoints (opt-in)
- [x] Custom Axios / fetch instance support
- [x] Watch mode for spec changes
- [x] Swagger 2.0 support
- [ ] Zod schema generation for runtime validation
- [ ] MSW mock handler generation
- [ ] Plugin system for custom output
- [ ] Suspense query variants

---

## 🤝 Contributing

OpenQuery is open source and contributions are welcome.

Start with [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow and
[docs/architecture.md](./docs/architecture.md) for how the generator is put
together. The [conventions](./docs/conventions/) cover commits, code style, and
versioning; the [ADRs](./docs/adr/) record why the significant decisions were
made — worth a look before proposing a change to one.

Feel free to open an issue, suggest an improvement, or submit a pull request.

---

## 📄 License

MIT

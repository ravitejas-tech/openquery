# Code style and contribution rules

Formatting is handled by Prettier and ESLint — run `npm run format` and don't
think about it. This document covers the rules a linter can't check.

## Architectural rules

These are load-bearing. A PR that breaks one will be asked to change.

### Emitters never read the raw OpenAPI document

Everything in `src/emit/` reads the IR and nothing else. If an emitter needs
spec data the IR doesn't carry, extend `src/ir/types.ts` and populate it in
`src/ir/build.ts` first.

Why: it is the boundary that keeps cycle-breaking, naming, and pagination
solved exactly once. See [ADR 0002](../adr/0002-four-stage-pipeline-with-an-ir.md).

### Never guess where OpenAPI is silent

If the spec doesn't say it, QueryFish doesn't infer it. Require an explicit
opt-in instead — config or an `x-queryfish-*` extension.

Why: wrong guesses in generated code produce runtime bugs in a file the user
didn't write, and they compile cleanly. See
[ADR 0005](../adr/0005-opt-in-pagination.md).

### Generated code has no runtime dependency on QueryFish

Generated output may import only `react-query-kit`,
`@tanstack/react-query`, and the user's client module. QueryFish is a
`devDependency` and must stay one. See
[ADR 0006](../adr/0006-user-supplied-http-client.md).

### Generated code should read like a human wrote it

It gets committed, reviewed, and debugged by people. Prefer a named type over
an inline expansion, emit JSDoc from spec descriptions, and don't emit `as`
casts to silence a type error — a cast that hides a real mismatch is a bug
waiting to surface at a call site.

## TypeScript

**`strict` is on, including `noUncheckedIndexedAccess`.** Array and index access
returns `T | undefined`. Handle it rather than asserting it away:

```ts
// Prefer
const first = errors[0]
if (first) throw new SpecError(String(first.message))

// Over
throw new SpecError(String(errors[0]!.message))
```

**`any` is allowed only for raw spec data.** The OpenAPI document is untyped by
nature and `@typescript-eslint/no-explicit-any` is off for that reason. Once
data crosses into the IR it is fully typed, and `any` there is a review comment.

**Prefer `type` imports.** Enforced by ESLint; `npm run lint -- --fix` handles it.

**Exported functions get a doc comment** explaining what the caller needs to
know. Internal helpers only need one if the name isn't enough.

## Comments

**Comment why, not what.** The code says what.

```ts
// Prefer — explains a non-obvious constraint
// Path parameters are always required, whatever the spec says.
required: location === 'path' ? true : parameter['required'] === true,

// Avoid — restates the code
// Set required to true if location is path
```

**Document surprises where they'll be encountered.** If code looks wrong but
isn't, say so at the site and link the ADR. `src/loader/load.ts` is the model:
`dereference: false` looks like an oversight until you read the comment.

**Don't leave commented-out code.** Git remembers.

## Testing

What a change needs before it can merge:

| Change                     | Required                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| Bug fix in generation      | A case in `test/fixtures/edge-cases.yaml` that fails before the fix |
| New emitter                | Snapshot coverage + the compile test must still pass                |
| New OpenAPI feature        | Fixture coverage, plus a Swagger 2.0 case if it applies there       |
| Naming or identifier logic | Unit tests in `test/naming.test.ts`                                 |
| CLI behaviour              | Exercise it end-to-end; don't only test the internals               |

**Add to `edge-cases.yaml` rather than creating a new fixture.** It is the
regression suite — a single file where every shape that has ever broken the
generator lives together. New fixtures fragment that.

**Snapshots are a review surface, not a formality.** When `npm test -- -u`
changes a snapshot, read the diff. If you can't explain why the output changed,
that's the bug.

**Assert behaviour, not formatting.** Generated output is formatted with the
_user's_ Prettier config, so quote style varies. Match either:

```ts
expect(queries).toMatch(/queryKey: \['pets'\]|queryKey: \["pets"\]/)
```

## Errors

User-facing errors carry a location and, where possible, a fix:

```
error: cannot resolve schema
  at paths./users.get.responses.200
  in openapi.yaml:42

  Check that the $ref target exists in components.schemas.
```

Use `QueryFishError` / `SpecError` with `file`, `pointer`, and `hint`. A
generator that fails with a bare stack trace makes the user search thousands of
lines of YAML by hand.

## Dependencies

The dependency list is short on purpose, and adding to it needs justification
in the PR description. Before proposing one, check whether Node's standard
library or an existing dependency covers it.

Never add a `dependencies` entry that would end up in generated output.

## Pull requests

- Branch from `main`.
- Add a changeset (`npx changeset`) for anything user-visible. See
  [versioning.md](./versioning.md).
- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check`
  all pass.
- Explain _why_ in the description. The diff shows what.
- Open an issue first for anything large, so the approach can be agreed before
  you spend the time.

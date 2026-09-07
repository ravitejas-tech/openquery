# 0007. Verify that generated code compiles

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Snapshot tests are the natural fit for a code generator: cheap, and they turn
every emitter change into a readable output diff in review. OpenQuery uses them
heavily.

They have one blind spot that matters more here than almost anywhere else. A
snapshot asserts that output **did not change**. It says nothing about whether
the output is **valid TypeScript**. A generator can emit confidently broken code
and pass a green snapshot suite forever, because the snapshot was recorded from
the same broken emitter.

This is not hypothetical. During v0.1 the infinite-query emitter produced:

```ts
createInfiniteQuery<ListFeedResponse, ListFeedVariables, string | null>({ … })
```

which snapshotted cleanly and does not compile. `createInfiniteQuery`'s third
type parameter is `TError`, not `TPageParam` — that ordering came from reading
the library's README rather than its `.d.ts`. Every user of that hook would
have hit a type error in code they did not write.

Nothing in a snapshot suite catches that. Only a compiler does.

## Decision

`test/compile.test.ts` generates each fixture into a temporary directory,
writes a client stub and a `tsconfig.json` beside it, and runs `tsc --noEmit`
over the result — against the real `react-query-kit` and
`@tanstack/react-query` from `node_modules`.

Any type error fails the test with the compiler's own message.

The example app extends this to a second layer: `examples/petstore-react`
contains hand-written React that _consumes_ the generated hooks, and CI
type-checks it. That catches problems that only appear at the call site, such
as a hook whose variables type is right in isolation but impossible to satisfy.

## Consequences

### What this enables

- Generated code is verified to compile on every run, not assumed to.
- Type-level regressions surface as compiler errors naming the exact line,
  rather than as user bug reports.
- Contributors can refactor emitters with real confidence: snapshots catch
  unintended output changes, compile tests catch invalid ones.
- Upgrades of `react-query-kit` or TanStack Query that change type signatures
  fail here first.

### What this costs

- Slower than the rest of the suite: three `tsc` processes, roughly 2 seconds
  versus milliseconds. Acceptable for what it catches.
- `react-query-kit`, `@tanstack/react-query`, and `react` are devDependencies
  purely so the compile test can resolve them.
- The test harness maintains its own `tsconfig`, which needs occasional
  attention as TypeScript evolves (`baseUrl` deprecation in TS 6, for example).

### What we rejected

**Snapshots alone.** The blind spot above. This ADR exists because that gap
produced a real bug.

**Type-testing with `expectTypeOf` / `tsd`.** Good for asserting specific type
relationships, but it checks the types you think to check. Compiling the whole
generated output checks everything, including what nobody thought to assert.

**Publishing and testing against a real project.** Highest fidelity, far too
slow for a pre-merge check. The example app approximates it at a fraction of
the cost.

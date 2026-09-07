# 0002. Four-stage pipeline with an intermediate representation

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The obvious way to build a code generator is to walk the OpenAPI document and
print TypeScript as you go. It's less code, and for a single output format it
works.

But OpenQuery has to solve three problems that don't fit that shape:

1. **Recursive schemas.** Deciding whether `Comment.replies` becomes
   `Comment[]` or an inline expansion requires knowing which schemas are named
   — a whole-document question, not a local one.
2. **Name collisions.** Duplicate and missing `operationId`s must resolve
   deterministically across the entire spec.
3. **Multiple outputs from one traversal.** `types.ts`, `requests.ts`,
   `queries.ts`, and `mutations.ts` all describe the same operations. Walking
   the spec four times means solving 1 and 2 four times, slightly differently.

The roadmap makes this worse: Zod schemas, MSW handlers, and a plugin system
are all _more outputs over the same operations_.

## Decision

OpenQuery is a four-stage pipeline, each stage pure and separately testable:

```
loader/  spec → self-contained document
ir/      document → Operation[] + named types
emit/    IR → TypeScript source strings
write/   format, diff, write   (in generate.ts)
```

The IR (`src/ir/types.ts`) is the contract. **Emitters never read the raw
OpenAPI document.** If an emitter needs something the IR doesn't carry, the IR
is extended.

## Consequences

### What this enables

- Cycle-breaking, naming, and pagination are solved once, in `ir/`, and every
  emitter inherits the result.
- An emitter is `(ir, config) => string` — small enough that adding one is a
  realistic first contribution.
- Every roadmap output format is a new file in `emit/`, not a rewrite. This is
  the main reason the IR exists.
- Stages can be tested in isolation: `test/naming.test.ts` never touches a spec
  file.

### What this costs

- More indirection than a direct walk. Reading how `/pets/{petId}` becomes
  `useGetPet` means following it through three modules.
- The IR must be extended before an emitter can use new spec data, which is an
  extra step when adding OpenAPI feature support.
- Some OpenAPI detail is deliberately dropped at the IR boundary. Recovering it
  later means an IR change, not a local fix.

### What we rejected

**Direct spec-to-string generation.** Rejected because of the recursion and
collision problems above, and because it makes the roadmap's plugin system a
rewrite instead of an addition.

**Generating an AST via the TypeScript compiler API.** More correct in
principle, but far slower to write, much harder to read in review, and it makes
snapshot tests useless as a review surface — the thing that makes emitter
changes reviewable here.

**Templates (Handlebars/EJS).** Familiar to contributors, but type-aware logic
(precedence when rendering unions inside arrays, for instance) ends up either
in helpers or duplicated across templates. String building in TypeScript keeps
that logic type-checked.

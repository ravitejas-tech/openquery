# 0004. Query keys are URL path segments

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Every generated query needs a `queryKey`. The choice is permanent in a way most
API decisions aren't: the key shape appears in every `invalidateQueries`,
`setQueryData`, and `getQueryData` call a user writes. Changing it later breaks
code that OpenQuery never generated.

Two facts shaped the decision.

**react-query-kit appends variables automatically.** A declared key of
`['pets', '{petId}']` becomes `['pets', '{petId}', { petId: '123' }]` at
runtime. Cache separation per-variable is handled by the library — it is not a
reason to prefer one base key over another.

**Prefix invalidation is the most common cache operation.** After a mutation,
users almost always want "refetch everything about this resource," which
TanStack Query expresses as a prefix match:

```ts
queryClient.invalidateQueries({ queryKey: ['pets'] });
```

Whether that works at all is decided entirely by the base key.

## Decision

The query key is the operation's literal URL path segments
(`Operation.pathSegments`, rendered by `renderQueryKey` in
`src/emit/queries.ts`):

| Path                     | Query key                         |
| ------------------------ | --------------------------------- |
| `/pets`                  | `['pets']`                        |
| `/pets/{petId}`          | `['pets', '{petId}']`             |
| `/owners/{ownerId}/pets` | `['owners', '{ownerId}', 'pets']` |

Path parameters keep their braces. They are structural markers, not values —
the value arrives in the appended variables object.

## Consequences

### What this enables

- One call invalidates a whole resource tree: `['pets']` matches `/pets`,
  `/pets/{petId}`, and anything nested beneath.
- Keys are predictable from the URL, so users can write invalidation calls
  without opening the generated file.
- Related endpoints group naturally in the React Query devtools.

### What this costs

- Two operations on the same path with the same method-kind share a base key.
  In practice they differ by variables, which are appended, so cache entries
  stay distinct — but a prefix invalidation intentionally hits both.
- The literal `'{petId}'` string in a key looks odd on first encounter. It is
  documented in the README and the example app.
- Renaming a path in the spec changes every key derived from it. That is
  correct — it _is_ a different resource — but it will invalidate caches on
  deploy.

### What we rejected

**`operationId` as the key** (`['getPet']`) — what the original README showed.
Simple and collision-free, but every endpoint becomes an island: there is no
prefix relationship between `getPet` and `listPets`, so invalidating "all pets"
means enumerating every operation by hand and updating that list whenever an
endpoint is added.

**OpenAPI `tags`** (`['Pets', 'getPet']`). Semantically appealing, but tags are
optional, frequently missing, and inconsistently applied. A key strategy that
silently degrades on half of real specs isn't one.

**A configurable key strategy.** Tempting, but it makes every downstream
example and doc conditional, and multiplies the test matrix, to serve a
preference rather than a need. Revisit only if concrete cases appear that
path segments genuinely cannot express.

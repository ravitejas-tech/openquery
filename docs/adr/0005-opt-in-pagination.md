# 0005. Pagination is opt-in, never inferred

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

`createInfiniteQuery` needs two things OpenAPI cannot tell us:

1. which query parameter carries the cursor, and
2. where in the response the next cursor lives.

There is no standard for either. Real specs use `cursor`, `page`, `offset`,
`after`, `pageToken`, `since`; responses use `nextCursor`, `next`, `hasMore`,
`meta.next_page`, or a `Link` header. Nothing in the document marks an endpoint
as paginated.

A generator can guess from these conventions. The failure mode is what makes
guessing unacceptable: a wrong guess produces a hook that **type-checks, looks
correct, and misbehaves only at runtime** — `getNextPageParam` reads a field
that is always `undefined` (pagination silently stops after one page), or one
that never becomes empty (it fetches forever). Both surface as a user bug
report about _their_ code, in a file they didn't write.

That is worse than not supporting the feature. Silent wrongness in generated
code is the thing that makes people stop trusting a generator.

## Decision

Infinite queries are generated **only** on an explicit opt-in. There are no
heuristics anywhere in the codebase.

Opt in per path in config:

```ts
pagination: {
  '/pets': { param: 'cursor', nextField: 'nextCursor' },
}
```

or in the spec itself:

```yaml
x-openquery-pagination:
  param: cursor
  nextField: nextCursor
```

Config wins over the extension, and `false` in config suppresses a spec-level
opt-in. With no opt-in anywhere, `infiniteQueries.ts` is not written at all —
the file simply doesn't exist.

When an operation opts in, the cursor parameter stays in the request function's
signature (the fetcher passes `pageParam` through it) but is removed from the
hook's variables via `Omit<…, 'cursor'>`, so a caller cannot set it by hand.

## Consequences

### What this enables

- Default output is entirely predictable: no endpoint becomes an infinite query
  by surprise.
- When a hook is generated, its `getNextPageParam` is right, because a human
  supplied the field name.
- Users who don't paginate carry no unused code and no extra concepts.
- The `paramSchema` recorded on `PaginationSpec` types `pageParam` from the
  spec, so it matches the request function's real signature.

### What this costs

- Zero-config users get no infinite queries, even where a heuristic would have
  guessed right. They must add two lines per endpoint.
- Two opt-in mechanisms (config and extension) mean two code paths and a
  precedence rule to document.
- It reads as a missing feature to anyone comparing feature tables without
  reading the reasoning. This ADR and the README both address it directly.

### What we rejected

**Heuristic detection with config override.** Better first-run demo; wrong
often enough that the demo is the only place it's an advantage. The override
only helps users who _notice_ the hook is wrong, and the failure is silent.

**Emitting both a plain and an infinite query for every collection endpoint.**
No wrong guesses, but it doubles the generated surface, clutters autocomplete,
and still has to guess `getNextPageParam` for the infinite variant — the actual
hard part.

**Dropping infinite queries from v0.1 entirely.** Considered seriously. Opt-in
produces byte-identical output to dropping it for anyone who doesn't opt in,
while keeping the README honest and the IR shaped so adding it later isn't a
breaking change.

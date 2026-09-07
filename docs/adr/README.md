# Architecture Decision Records

An ADR records a decision that was hard to make and would be expensive to
reverse — the context it was made in, what was chosen, and what that costs.

The point is not ceremony. It's that six months from now someone will look at
`bundle({ dereference: false })` and think "that looks wrong, let me fix it."
The ADR is how they find out it was deliberate, and what broke last time.

## Index

| #                                                | Decision                                | Status   |
| ------------------------------------------------ | --------------------------------------- | -------- |
| [0001](./0001-record-architecture-decisions.md)  | Record architecture decisions           | Accepted |
| [0002](./0002-four-stage-pipeline-with-an-ir.md) | Four-stage pipeline with an IR          | Accepted |
| [0003](./0003-bundle-without-dereferencing.md)   | Bundle specs without dereferencing      | Accepted |
| [0004](./0004-path-segment-query-keys.md)        | Query keys are URL path segments        | Accepted |
| [0005](./0005-opt-in-pagination.md)              | Pagination is opt-in, never inferred    | Accepted |
| [0006](./0006-user-supplied-http-client.md)      | The HTTP client is supplied by the user | Accepted |
| [0007](./0007-verify-generated-code-compiles.md) | Verify that generated code compiles     | Accepted |

## When to write one

Write an ADR when a choice:

- is expensive to reverse later (public API, generated output shape, the IR),
- will look wrong to someone who wasn't there,
- was picked over a reasonable alternative, or
- came from a constraint that isn't visible in the code.

Don't write one for things the code already says plainly. A function name is
not a decision record.

## How to add one

1. Copy [`template.md`](./template.md) to `NNNN-short-title.md`, incrementing
   the number.
2. Fill it in. Be specific about what you gave up — the Consequences section is
   the part people actually come back for.
3. Add a row to the index above.
4. Reference it from the code where the decision is enforced, e.g.
   `// See docs/adr/0003-bundle-without-dereferencing.md`.

## Changing a decision

Don't edit an accepted ADR's decision — the record of what was believed at the
time is the value. Instead:

1. Write a new ADR that supersedes it.
2. Mark the old one `Superseded by [NNNN](./NNNN-….md)`.
3. Update the index.

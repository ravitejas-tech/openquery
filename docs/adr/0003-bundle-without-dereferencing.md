# 0003. Bundle specs without dereferencing

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

`@redocly/openapi-core` offers `bundle({ ref, config, dereference })`. Passing
`dereference: true` inlines every `$ref` so downstream code never has to
resolve pointers. That is the obvious choice, and it is what OpenQuery was
originally built on.

It fails on recursive schemas, which are ordinary — `Comment.replies`,
`Category.children`, `Node`/`Edge` pairs.

Measured against `test/fixtures/edge-cases.yaml`:

```js
const res = await bundle({ ref, config, dereference: true });
const Comment = res.bundle.parsed.components.schemas.Comment;
const nested = Comment.properties.replies.items;

nested === Comment; // false — a *copy*, not the same object
nested.$ref; // undefined — the pointer is gone
nested.properties.replies.items === nested; // true — the copy is self-referential
JSON.stringify(res.bundle.parsed); // throws: Converting circular structure to JSON
```

Two consequences, both fatal:

1. **The document is circular.** A naive recursive walk never terminates.
2. **Recursion is no longer expressible.** Because the nested object is a
   _copy_ rather than the original, identity matching against registered
   components fails. The generator has no way to know the nested schema _is_
   `Comment`. The best it can do is inline one level and give up:

   ```ts
   export interface Comment {
     replies?: { id: string; replies?: unknown }[]; // wrong
   }
   ```

The second problem is the real one. Cycle guards stop the hang, but they can't
recover the information that dereferencing destroyed.

Bundling _without_ `dereference` still produces a single self-contained
document — remote and cross-file refs are pulled in — but internal pointers
survive, and the document is acyclic and serializable.

## Decision

OpenQuery bundles with `dereference: false` (`src/loader/load.ts`).

`SchemaConverter` registers every `#/components/schemas` and `#/definitions`
entry up front, mapping JSON pointer → emitted type name. A `$ref` to a
registered schema becomes `{ kind: 'ref', name }`; unregistered pointers are
resolved manually with an in-progress guard.

## Consequences

### What this enables

- Recursive and mutually recursive schemas emit correctly:
  `replies?: Comment[]`, `edge?: Edge`.
- The document stays acyclic and serializable, so it can be logged, inspected,
  and diffed while debugging.
- Named schemas produce named TypeScript types, which is what makes generated
  code readable rather than a wall of nested anonymous objects.

### What this costs

- `SchemaConverter` carries pointer-resolution logic it wouldn't otherwise
  need (`resolvePointer`, the `inProgress` set).
- It must handle both `#/components/schemas/` (OpenAPI 3) and `#/definitions/`
  (Swagger 2) pointer shapes.
- Anyone who assumes a dereferenced document — a reasonable assumption — will
  be surprised. Hence the module comment in `src/loader/load.ts` and this ADR.

### What we rejected

**`dereference: true` plus a WeakSet cycle guard.** This was the original
implementation. It stops the infinite loop but still emits `replies?: unknown`,
because the information needed to emit `Comment` was destroyed by
dereferencing. Caught by `test/generate.test.ts` → "emits self-referential
types by name".

**Dereferencing, then reconstructing names by structural comparison.**
Deep-comparing every nested schema against every component to re-discover which
one it is: quadratic, fragile, and it cannot distinguish two components that
happen to have identical shapes.

**Writing our own `$ref` resolver.** Redocly already handles remote refs,
cross-file refs, and Swagger 2. Not worth reimplementing to avoid one option
flag.

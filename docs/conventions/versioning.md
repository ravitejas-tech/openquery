# Versioning and releases

QueryFish follows [Semantic Versioning](https://semver.org/).

## The part that's different for a code generator

Most libraries version their **API**. QueryFish has two surfaces, and the
second one is the one that catches people out:

1. **The tool's API** — the CLI, `defineConfig`, exported functions.
2. **The generated output** — the code users actually import and call.

A change can leave surface 1 untouched and still break every consumer, because
their application code is written against surface 2. Renaming a generated hook
is as breaking as renaming an exported function, even though nothing in
`src/index.ts` changed.

**The rule: if a user's application code stops compiling or changes behaviour
after regenerating, it's breaking — regardless of what changed internally.**

## What each bump means

### Major — user code breaks after regenerating

- Generated hook, type, or request function names change
- Query key shape changes (invalidation calls silently stop matching)
- The variables or response type of a generated hook changes shape
- The `QueryFishClient` interface gains a required member
- A config option is removed or its meaning changes
- The minimum supported Node or TypeScript version rises
- Output that previously compiled no longer does

Query keys deserve emphasis: changing them breaks
`invalidateQueries({ queryKey: [...] })` calls **at runtime, without a type
error**. Treat any key change as major. See
[ADR 0004](../adr/0004-path-segment-query-keys.md).

### Minor — new capability, existing output unaffected

- A new emitter or output file
- A new config option with a backwards-compatible default
- Support for OpenAPI constructs that previously generated `unknown`
- New CLI flags
- Better generated JSDoc, or types that become _more_ specific in a way that
  cannot break a caller

### Patch — fixes and cosmetics

- Generated code that was invalid TypeScript now compiles
- Bug fixes in schema conversion, naming, or resolution
- Whitespace and formatting changes in output
- Error message improvements
- Documentation

## The grey area: fixing wrong output

A fix that makes wrong output correct can still break someone who worked around
the bug. Judgement call:

- **Output was invalid TypeScript** (didn't compile) → patch. Nobody could
  depend on it.
- **Output compiled but was wrong at runtime** → patch, called out clearly in
  the changeset. Users hitting it were already broken.
- **Output compiled and worked, but was suboptimal** → minor at least; major if
  names or keys change.

When genuinely torn, pick the larger bump. A surprise major is an annoyance; a
surprise break is a bug report.

## Changesets

Releases run on [Changesets](https://github.com/changesets/changesets).

Add one for any user-visible change:

```bash
npx changeset
```

Pick the bump, then write the entry **for a user reading the changelog**, not
for a reviewer reading the diff:

```md
---
'queryfish': patch
---

Fix `$ref` resolution inside `allOf` members. Components referenced from within
a composition schema now emit the named type instead of `unknown`.
```

Skip the changeset for changes with no user-visible effect — internal
refactors, tests, CI, repo docs. CI does not require one, because requiring it
trains people to add empty ones.

### Breaking changes

Say what breaks and how to fix it. This text is what users see when deciding
whether to upgrade:

```md
---
'queryfish': major
---

Query keys now use URL path segments instead of `operationId`.

Invalidation calls must be updated:

    // before
    queryClient.invalidateQueries({ queryKey: ['getPet'] });
    // after
    queryClient.invalidateQueries({ queryKey: ['pets', '{petId}'] });

In exchange, a prefix now invalidates a whole resource tree:
`{ queryKey: ['pets'] }` clears every pet query.
```

## Release process

Fully automated by `.github/workflows/release.yml`:

1. PRs merge to `main` with changesets attached.
2. The workflow opens (or updates) a **Version Packages** PR that applies the
   pending bumps and writes `CHANGELOG.md`.
3. Merging that PR publishes to npm with provenance and tags the release.

Nobody runs `npm publish` by hand, and nobody edits `version` in
`package.json` directly.

### 0.x

While the major version is 0, breaking changes go out as **minor** bumps, per
SemVer. The rules above still apply — a breaking change is still identified and
documented as breaking, it just lands in `0.x` rather than forcing `1.0.0`.

`1.0.0` is for when the generated output shape is stable enough to promise.

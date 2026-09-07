# Commit convention

QueryFish uses [Conventional Commits](https://www.conventionalcommits.org/).
Commit messages are read far more often than they are written — usually by
someone bisecting a regression at an inconvenient hour.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Only the first line is required.

### Example

```
fix(ir): resolve $ref inside allOf members

Composition schemas were converted before pointer resolution, so a component
referenced from inside allOf inlined as `unknown` instead of emitting the
named type.

Fixes #42
```

## Types

| Type       | Use for                                | Version impact |
| ---------- | -------------------------------------- | -------------- |
| `feat`     | New capability                         | minor          |
| `fix`      | Bug fix                                | patch          |
| `perf`     | Performance, no behaviour change       | patch          |
| `refactor` | Restructuring with no behaviour change | none           |
| `docs`     | Documentation only                     | none           |
| `test`     | Tests only                             | none           |
| `build`    | Build system, bundling, dependencies   | none           |
| `ci`       | CI configuration                       | none           |
| `chore`    | Anything else (tooling, housekeeping)  | none           |

Version impact is a guide, not automation — the changeset decides the release.
See [versioning.md](./versioning.md).

## Scopes

Scopes match the pipeline stages, so a reader can tell which stage changed
without opening the diff:

| Scope     | Covers                                              |
| --------- | --------------------------------------------------- |
| `loader`  | `src/loader/` — spec loading, bundling, spec errors |
| `ir`      | `src/ir/` — the IR, schema conversion, naming       |
| `emit`    | `src/emit/` — all emitters                          |
| `cli`     | `src/cli/` — commands, flags, output, watch         |
| `config`  | `src/config/` — config loading, `defineConfig`      |
| `example` | `examples/`                                         |
| `adr`     | `docs/adr/`                                         |

Omit the scope when a change genuinely spans the codebase. Don't invent scopes
for one commit.

## Subject line

- Imperative mood: "add", not "added" or "adds". It completes the sentence
  _"If applied, this commit will …"_.
- No capital letter at the start, no trailing period.
- Under 72 characters.
- Say what changed, not which files. `fix(emit): quote invalid property names`
  beats `fix(emit): update types.ts`.

## Body

Optional, but include one whenever the change isn't self-explanatory.

Explain **why**, not what — the diff already shows what. The most valuable body
answers "why is this the right fix?" or "what breaks without this?".

Wrap at 80 characters. Separate from the subject with a blank line.

If the change implements or changes an architectural decision, reference the
ADR:

```
See docs/adr/0003-bundle-without-dereferencing.md
```

## Footer

- `Fixes #123` / `Closes #123` to link issues.
- `Co-Authored-By: Name <email>` for pairing.
- Breaking changes:

```
BREAKING CHANGE: query keys now use path segments instead of operationId.

Invalidation calls written against the old keys must be updated:
  before: invalidateQueries({ queryKey: ['getPet'] })
  after:  invalidateQueries({ queryKey: ['pets', '{petId}'] })
```

For a code generator, "breaking" usually means **generated output changed in a
way that breaks user code** — see [versioning.md](./versioning.md) for what
counts.

## Practical guidance

**One logical change per commit.** If the subject needs "and", it's probably
two commits.

**Commit generated fixtures with the change that caused them.** A snapshot
update belongs in the same commit as the emitter change — split apart, neither
half makes sense alone.

**Don't commit a broken state to fix it in the next commit.** Every commit on
`main` should pass CI, so bisect stays useful.

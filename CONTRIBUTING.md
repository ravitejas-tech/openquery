# Contributing to OpenQuery

Thanks for being here. This guide should get you from clone to merged PR without
having to ask anyone anything — if it doesn't, that's a bug worth reporting.

## Getting started

```bash
git clone https://github.com/ravitejas-tech/openquery.git
cd openquery
npm install
npm test
```

Node 20.19+ is required. That's it — there is no build step needed for
development, and no external services.

Useful scripts:

| Command              | What it does                |
| -------------------- | --------------------------- |
| `npm test`           | Run the full suite          |
| `npm run test:watch` | Re-run tests as you edit    |
| `npm run typecheck`  | Type-check without emitting |
| `npm run build`      | Build the distributable     |
| `npm run lint`       | Lint                        |
| `npm run format`     | Format with Prettier        |

## How the codebase is laid out

Read [docs/architecture.md](./docs/architecture.md) first — it explains the
four-stage pipeline and, more importantly, _why_ it is built that way. The short
version:

```
loader/  spec → self-contained document ($refs preserved)
ir/      document → normalized Operation[] + named types
emit/    IR → TypeScript source strings
         (writer in generate.ts formats + diffs + writes)
```

The rule that keeps things simple: **emitters never touch the raw OpenAPI
document.** If an emitter needs something the IR doesn't carry, extend the IR.

## Tests

Three kinds, and they catch different things:

- **Unit tests** (`test/naming.test.ts`) — identifier derivation and collision
  rules. Cheap and precise.
- **Snapshot tests** (`test/generate.test.ts`) — full generated output for each
  fixture, committed to the repo. When you change an emitter, the diff in your PR
  _is_ the output change. That is intentional: reviewers should see exactly what
  users will get. Update them with `npm test -- -u` and read the diff before
  committing it.
- **Compile tests** (`test/compile.test.ts`) — generates each fixture to a temp
  directory and runs `tsc` over it against the real `react-query-kit`. Snapshots
  prove the output didn't _change_; only this proves it _compiles_. For a code
  generator, this is the test that matters most.

### The fixtures

- `petstore.yaml` — realistic, covers the common cases.
- `edge-cases.yaml` — everything that has historically broken generators:
  circular `$ref`s, missing and duplicate `operationId`s, reserved words,
  `allOf`/`oneOf`, 204 responses, parameter names that aren't valid identifiers.
  **If you fix a bug, add a case here.**
- `swagger2.json` — Swagger 2.0, which differs enough to be worth covering.

## Common contributions

### Adding a new emitter

The most likely kind of contribution (Zod schemas, MSW handlers, …):

1. Add `src/emit/<name>.ts` exporting `(ir, config) => string`.
2. Register it in `src/generate.ts`.
3. Add a config flag in `src/config/define.ts` if it should be optional.
4. Run `npm test -- -u` and commit the snapshot.

### Fixing a generation bug

1. Add the failing shape to `test/fixtures/edge-cases.yaml`.
2. Confirm it fails.
3. Fix it in `ir/` or `emit/`.
4. `npm test -- -u`, review the snapshot diff, commit.

### Adding OpenAPI feature support

Most of this lives in `src/ir/schema.ts` (schema shapes) or `src/ir/build.ts`
(operation-level concerns). Check whether the IR can already express what you
need before adding to it.

## Conventions

Three short documents cover the rules. Skim them before your first PR:

- **[Commit convention](./docs/conventions/commits.md)** — Conventional Commits,
  with scopes matching the pipeline stages.
- **[Code style](./docs/conventions/code-style.md)** — architectural rules,
  comment policy, and what tests each kind of change needs.
- **[Versioning](./docs/conventions/versioning.md)** — SemVer for a code
  generator, where "breaking" means _generated output_ breaks user code.

Decisions with lasting consequences are recorded as
[ADRs](./docs/adr/). If you're about to change something that looks wrong,
check there first — it may be deliberate, and the reasoning (plus the
alternatives already rejected) will be written down.

## Pull requests

- Branch from `main`.
- Follow the [commit convention](./docs/conventions/commits.md).
- Add a changeset: `npx changeset` — see
  [versioning](./docs/conventions/versioning.md) for choosing the bump.
- Make sure `npm test`, `npm run typecheck`, `npm run lint`, and
  `npm run format:check` pass.
- Explain _why_ in the description, not just what. The diff shows what.

Small PRs get reviewed faster. If you're planning something large, open an issue
first so we can agree on the approach before you spend the time.

## Design principles

Worth knowing before proposing changes, because these shape what gets accepted:

1. **Zero runtime.** Generated code depends on `react-query-kit`,
   `@tanstack/react-query`, and the user's own client module. Nothing else.
   OpenQuery must never need to be installed at runtime.
   ([ADR 0006](./docs/adr/0006-user-supplied-http-client.md))
2. **Never guess.** Where OpenAPI has no standard (pagination being the notable
   case), OpenQuery requires an explicit opt-in rather than inferring. A wrong
   guess that compiles is worse than no feature — it fails silently at runtime.
   ([ADR 0005](./docs/adr/0005-opt-in-pagination.md))
3. **Generated code should read like a human wrote it.** It gets committed,
   reviewed, and debugged by real people.
4. **Generated code is verified to compile**, not assumed to. Snapshots prove
   output didn't change; only the compiler proves it builds.
   ([ADR 0007](./docs/adr/0007-verify-generated-code-compiles.md))
5. **Errors name the location.** A generator that fails with a stack trace makes
   the user hunt through thousands of lines of YAML.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

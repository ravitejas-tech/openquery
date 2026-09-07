# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

OpenQuery's v0.1 was built in a single pass, and several of its choices look
wrong at first glance:

- The loader deliberately _doesn't_ dereference `$ref`s, despite that being the
  obvious thing to do with an OpenAPI parser.
- `createInfiniteQuery` support exists but generates nothing by default.
- Query keys are `['pets', '{petId}']` rather than the operation name.

Each of these was made for a concrete reason, and in at least one case the
reason only emerged after the naive version failed a test. That reasoning
currently lives in commit messages and prose scattered through
`docs/architecture.md` — neither of which a contributor reads before opening a
PR that undoes the decision.

For a project whose goal is attracting outside contributors, "why is it like
this?" needs an answer that doesn't require asking a maintainer.

## Decision

OpenQuery keeps Architecture Decision Records in `docs/adr/`, following
Michael Nygard's format: numbered, immutable once accepted, and superseded
rather than edited.

Decisions already embedded in v0.1 are recorded retroactively, since those are
precisely the ones a new contributor will trip over first.

## Consequences

### What this enables

- A contributor who disagrees with a decision can read the reasoning and the
  rejected alternatives before spending time on a PR.
- Code can point at the reasoning: a one-line comment referencing an ADR beats
  a paragraph repeated in three files.
- Decisions that turn out to be wrong get superseded with a visible trail,
  rather than being quietly reverted and re-litigated later.

### What this costs

- Every significant decision now costs a document. This is real friction, and
  it is the point — if a decision isn't worth 15 minutes of writing, it
  probably isn't architectural.
- ADRs go stale if nobody supersedes them. The index in `README.md` and the
  status field are the mitigation.

### What we rejected

**Comments in the code alone.** Works for local reasoning, but a decision that
spans the loader, the IR, and two emitters has no single place to live — and
the alternatives considered have nowhere to go at all.

**A single DECISIONS.md.** Simpler at first, but grows into a file nobody
reads, with no natural unit to supersede.

**Nothing, relying on git history.** Commit messages are the right place for
_what changed_, not for _what is true now_. Finding a decision means knowing
which commit to look for, which is exactly what a newcomer can't do.

# AI Workflow

How AI coding tools were used to build this assessment. The Running log at the bottom was
written while working; the four sections above it summarise it.

## 1. Tools used and why

_To be finalised at the end (T040)._

## 2. Prompts and outcomes

_To be finalised at the end (T040). Candidates are tagged **[prompt]** in the Running log._

## 3. Where the AI got it wrong

_To be finalised at the end (T040). Candidates are tagged **[wrong]** in the Running log._

## 4. Parallel agents / subagents / worktrees

_To be finalised at the end (T040)._

---

## Running log

### Planning (Spec Kit)

Tool: Claude Code with the Spec Kit skills (`/speckit-*`). Every planning artefact is in
[`specs/001-indie-games-dashboard/`](specs/001-indie-games-dashboard/) and was committed
before any code was written.

| Step | Command | Output |
|---|---|---|
| Constitution | `/speckit-constitution` (no input; derived from the brief) | [`.specify/memory/constitution.md`](.specify/memory/constitution.md): 5 principles mapped to the grading weights |
| Spec | `/speckit-specify indie games dashboard with CRUD, REST API and streaming AI chat` | [`spec.md`](specs/001-indie-games-dashboard/spec.md): 3 prioritised stories, 24 FRs, 8 success criteria |
| Clarify | `/speckit-clarify does it make sense to create a docker-compose …?` | 2 clarifications recorded in the spec |
| Plan | `/speckit-plan` | plan, research, data model, 3 contracts, quickstart |
| Tasks | `/speckit-tasks` | [`tasks.md`](specs/001-indie-games-dashboard/tasks.md): 44 tasks by user story |

- **[prompt] Docker or not.** I asked during `/speckit-clarify` whether to use
  docker-compose with separate app and DB containers. The assistant recommended against it:
  the brief puts deployment out of scope, SQLite is embedded, and reviewers only need Node.
  I accepted. Recorded as clarification Q1, which tightened success criterion SC-006.
- **[prompt] Storage choice.** "The recommendation for storage is SQLite? via better-sqlite3
  or Drizzle?" The answer was Drizzle on better-sqlite3, so that `drizzle-zod` gives one
  validation schema shared by the API, the form and the AI tools (constitution principle III).
  Accepted.
- **Verifying versions instead of trusting memory.** During `/speckit-plan` the assistant ran
  `npm view` for every package and installed the AI SDK in a scratch directory to read its
  bundled docs. That surfaced several AI SDK 7 changes that differ from older examples
  (`isStepCount`, `inputSchema`, `instructions`, `createAgentUIStreamResponse`), recorded in
  [research.md §12](specs/001-indie-games-dashboard/research.md).
- Models: planning used Claude Opus 5.5 and Claude Fable 5.1 (switched with `/model`).

### Setup (T001–T007)

- Scaffolded with `create-next-app@16.4.2` in a scratch directory, then merged into the repo
  so the existing README, `.gitignore` and planning files were not overwritten.
- **[wrong] The plan's Next.js caching advice was out of date.** The plan said to put
  `export const dynamic = 'force-dynamic'` on every route. The scaffold turned on
  `cacheComponents: true` by default, and the Next 16 docs bundled in `node_modules` say
  route segment `dynamic` is *removed* in that mode. A synchronous `better-sqlite3` read
  would then have been **prerendered at build time and served stale**. Fix: call
  `await connection()` before reads and put the dashboard data behind `<Suspense>`. The
  scaffold's own `AGENTS.md` ("This is NOT the Next.js you know") pointed at those docs.
- Also from the bundled docs: `better-sqlite3` is already in Next's built-in
  `serverExternalPackages` list, so the planned config line was dropped.
- `npm i -D vitest@5` failed with ERESOLVE because the scaffold pins `@types/node@^20` and
  vitest 5 needs `^22 || >=24`. Fixed by bumping to `@types/node@^22`, which matches the
  project's `engines.node >= 22`, rather than using `--legacy-peer-deps`.
- The scaffold's `.gitignore` contains `.env*`, which would have ignored `.env.example`. Only
  the non-conflicting lines were merged.
- `tsc --noEmit` failed on a fresh checkout (`Cannot find name 'LayoutProps'`) because Next 16
  generates those global types at dev/build time. Fixed with the
  `next typegen && tsc --noEmit` script.

### Foundation (T008–T017)

- Schema, seed, DB client, repository, REST write routes and 12 repository tests.
- Design change while implementing: the plan had repository functions take an optional `db`
  argument. A `createRepository(db)` factory turned out cleaner. Tests get an in-memory
  repository, and the app uses `getRepository()`, which opens `data/games.db` lazily so
  `next build` never creates or seeds the file.
- The first typecheck failed: a helper typed as `typeof games.title` would not accept the
  `genre` column, because Drizzle column types carry the column name. Fixed with a union type.
- Vite warned that `vitest.config.ts` used ESM in a CommonJS package. Renamed to `.mts`.
- Smoke test against `next dev`: every status code and error body matched
  `contracts/games-api.md` on the first run, including `404` before body validation for
  stale edits.

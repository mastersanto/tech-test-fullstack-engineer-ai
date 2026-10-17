# Indie Games Dashboard

An internal dashboard for a catalog of indie games, plus an AI chat that answers questions
about it ("Which game made the most revenue last month?", "How many games are rated above 4?").
The assistant uses **tool calling** to query the catalog and **streams** its replies. The
catalog is never pasted into the prompt.

Built for the Full Stack Engineer (AI) assessment. The original brief is in the first
commit (`git show 51117ab:README.md`), and the AI-assisted workflow is documented in
[`AI_WORKFLOW.md`](AI_WORKFLOW.md).

## Run it

Prerequisites: **Node.js 22 or newer** (`.nvmrc` pins 24) and an
[Anthropic API key](https://console.anthropic.com/). No Docker or database server is needed.

```bash
cp .env.example .env.local     # then set ANTHROPIC_API_KEY
npm install
npm run dev                    # http://localhost:3000
```

On first start the app creates `data/games.db` and seeds 12 sample games. Delete that file
to reset. The dashboard and REST API work without a key; only the chat needs one.

| Variable | Required | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | for chat | — |
| `ANTHROPIC_MODEL` | no | `claude-opus-5-5` (any Anthropic model with tool use, e.g. `claude-sonnet-5-5`, `claude-haiku-5-5`) |

Other scripts: `npm test` (Vitest), `npm run lint`, `npm run typecheck`, `npm run build`.

## What's inside

**Dashboard (`/`)**: a table of every game, with add, edit and delete in a dialog.
Validation runs in the browser and again in the API, with the same schema and messages per
field. Deleting asks for confirmation.

**Chat (`/chat`)**: plain-language questions with streamed answers. Each lookup the assistant
makes appears as a chip above the answer ("Ranked games · metric: monthly_revenue_usd"), so
you can see where every number came from. Follow-up questions keep the context. Unknown games
are reported as not found instead of invented, and off-topic questions are declined.

**REST API**

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/api/games` | `200` list | — |
| `POST` | `/api/games` | `201` game | `400 invalid_json`, `400 validation_error` |
| `GET` | `/api/games/:id` | `200` game | `400 invalid_id`, `404 not_found` |
| `PUT` | `/api/games/:id` | `200` game (full replace) | `400`, `404` |
| `DELETE` | `/api/games/:id` | `204` | `400 invalid_id`, `404 not_found` |
| `POST` | `/api/chat` | AI SDK UI-message stream (SSE) | `500 ai_not_configured`, `400 invalid_json` |

Errors look like `{ "error": { "code", "message", "fields"? } }`. Full contracts are in
[`specs/001-indie-games-dashboard/contracts/`](specs/001-indie-games-dashboard/contracts/).

```bash
curl -X POST localhost:3000/api/games -H 'content-type: application/json' \
  -d '{"title":"Test","developer":"Me","genre":"Puzzle","monthly_revenue_usd":1000,"monthly_downloads":50,"average_rating":4.2}'
```

## How it works

```
Dashboard (server component) ─┐
REST routes  /api/games ──────┼──► lib/games/repository.ts ──► SQLite (data/games.db)
AI tools  (in-process) ───────┘          ▲
        ▲                                │ one schema: lib/db/schema.ts (Drizzle + drizzle-zod)
/api/chat ── ToolLoopAgent (AI SDK 7) ── Anthropic
```

- **One data-access module.** `repository.ts` is the only code that touches the database.
  The UI, the API and the assistant's tools all go through it, so they can't disagree.
- **One validation schema.** Generated from the Drizzle table with `drizzle-zod`. The API,
  the form and the tools all use it.
- **Narrow tools, not a data dump.** `search_games`, `rank_games`, `count_games` and
  `get_games` each return only the rows they need. The system prompt contains rules only.
  The assistant reads the live database on every question, so a dashboard edit shows up in
  the very next answer.
- **Streaming.** `createAgentUIStreamResponse` on the server and `useChat` on the client.
  Tool calls arrive as typed message parts and are rendered as the lookup chips.

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, Vercel AI SDK 7 with
`@ai-sdk/anthropic`, Drizzle ORM on better-sqlite3, Zod 4, Vitest.

## Trade-offs

- **SQLite file, no migrations.** The table is created with `CREATE TABLE IF NOT EXISTS` on
  first open. That's right for one table in an assessment; a real schema would use
  `drizzle-kit` migrations.
- **Seeded once.** Sample data is inserted only when the database file is first created, so
  an emptied catalog stays empty after a restart.
- **Node 22+ required.** `better-sqlite3` 13 needs it, and ships prebuilt binaries so nothing
  compiles on install.
- **Claude Opus 5.5 by default, at low effort.** Low effort keeps the first token fast for
  simple lookups. Set `ANTHROPIC_MODEL` to use a cheaper model.
- **Chat history is per session.** It's held in the browser and lost on reload.
- **Next.js Cache Components.** better-sqlite3 is synchronous, so pages and `GET` routes call
  `connection()` before reading. Without that, Next would prerender them at build time and
  serve stale data.
- **Out of scope per the brief:** authentication, deployment, production-grade error handling,
  full test coverage. Tests cover the data layer and the tools (19 tests), which is where the
  assistant's correctness comes from.
- **Every table row carries its own edit dialog.** The page is about 470 KB with 100 games,
  and still renders in under 100 ms. With a larger catalog, mounting the dialog on demand
  would fix it.

## Project layout

```
src/app/            pages (/ and /chat) and API routes
src/components/     games table and form, chat view, nav
src/lib/db/         Drizzle schema, SQLite client and seed data
src/lib/games/      repository (all queries) and number formatting
src/lib/ai/         model, tools and agent
tests/              repository and tool tests
specs/              Spec Kit spec, plan, contracts, tasks
```

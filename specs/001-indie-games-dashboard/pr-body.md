# Submission

- **Name:** Jorge Sandoval
- **Email:** jorgeivansandoval@gmail.com
- **Time spent:** about 1 hour of implementation by commit timestamps (16:51–17:50), plus
  the Spec Kit planning session before the first commit

## What I built

An internal dashboard for an indie games catalog, plus a streaming AI chat that answers
questions about it by calling tools.

- **Dashboard (`/`)**: table of games with add, edit and delete. Validation runs in the
  browser and again in the API, from one shared schema. The assistant sits beside the table
  (from 1280 px), so every answer can be checked against the data on screen. On narrower
  screens an "Ask AI" drawer opens it. Edits never reset the conversation.
- **REST API (`/api/games`)**: list, get, create, update, delete, with structured errors
  that list each failing field.
- **AI chat**: AI SDK 7 `ToolLoopAgent` on Claude with four narrow tools
  (`search_games`, `rank_games`, `count_games`, `get_games`). The catalog is never put in
  the prompt. Replies stream, and each tool call shows as a lookup chip so you can see where
  every number came from.
- **Storage**: SQLite through Drizzle and better-sqlite3, seeded with 12 games on first run.
- **Process**: spec-driven with Spec Kit inside Claude Code, in two features. 001 is the
  dashboard, API and chat; 002 moves the chat onto the dashboard after a UX review. Each
  feature's spec, plan, contracts and tasks were committed before its code. See
  `AI_WORKFLOW.md`, including where the AI got things wrong.

## How to run

```bash
cp .env.example .env.local     # set ANTHROPIC_API_KEY
npm install                    # Node 22+
npm run dev                    # http://localhost:3000
```

`npm test` runs 19 tests. `npm run lint`, `npm run typecheck` and `npm run build` all pass.
Verified against the production build: 10/10 scripted chat questions answered correctly, and a
37-check Playwright run of the dashboard and chat-panel layout and behaviour.

## Trade-offs

- SQLite file with `CREATE TABLE IF NOT EXISTS`, no migrations; enough for one table.
- Requires Node 22+ (better-sqlite3 13 ships prebuilt binaries, so nothing compiles).
- Defaults to Claude Opus 5.5 at low effort. Lookup chips appear in 1–2 s, while answer
  text starts at 2.5–4.5 s (two model calls per answer). `ANTHROPIC_MODEL` switches to a
  faster model. All 10 scripted test questions were answered correctly.
- Chat history lives in the browser session only.
- Next 16 Cache Components: reads call `connection()` so production never serves a
  build-time snapshot of the database.
- Automated tests cover the data layer and the tools. UI behaviour was checked with a scratch
  Playwright script and by hand, not with a committed UI test suite.
- Auth, deployment and production error handling are out of scope per the brief.

## Checklist

- [x] Games CRUD
- [x] API
- [x] Chat with streaming
- [x] Assistant uses tool calling
- [x] `AI_WORKFLOW.md` included

🤖 Generated with [Claude Code](https://claude.com/claude-code)

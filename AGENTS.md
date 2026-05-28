# AGENTS.md — mern-todo

Operational instructions for AI coding agents working in this repository.

## 1. Project overview

Full-stack todo list: **React 18 + Vite + MUI 5** (client) and **Express 4 + mysql2** (server). Todos are persisted in **MySQL** only (no in-memory store). Features include CRUD, completion toggle, optional due datetimes, overdue highlighting, client-side filters (All / Active / Completed / Overdue), and sort (newest / due date).

| Layer | Stack |
|-------|--------|
| Client | `client/` — ESM, `"type": "module"`, port **5173** |
| Server | `server/` — CommonJS, port **3000** |
| DB | MySQL 8+ — table `todos`, env via `server/.env` |

Specs and plans live under `docs/superpowers/`. Product requirements under `products/`.

## 2. Repository structure

```
mern-todo/
├── client/                 # React SPA (Vite)
│   └── src/
│       ├── App.jsx         # Theme, todos state, filter, sort
│       ├── config.js       # API_BASE_URL (VITE_API_BASE_URL)
│       ├── components/     # TodoUi (create), AddTodo (list/edit), AppBar
│       └── utils/dates.js  # Pure date helpers (overdue, format, sort)
├── server/
│   ├── index.js            # Express app, CORS, DB health check, graceful shutdown
│   ├── config/database.js  # mysql2 pool from env
│   ├── routes/todos.js     # HTTP handlers (thin)
│   ├── repositories/       # SQL + row ↔ API mapping
│   ├── utils/              # Pure validators (e.g. validateDueDate)
│   ├── db/
│   │   ├── schema.sql      # Canonical DDL for fresh installs
│   │   ├── migrate.js      # Apply schema.sql
│   │   └── migrations/     # Incremental ALTER scripts for existing DBs
│   └── test/               # node:test unit + integration
├── docs/superpowers/       # Design specs + implementation plans
├── products/               # PRDs
└── reference/              # agents.guide.md, agents.template.md (meta, not runtime)
```

**Do not edit:** `.worktrees/` (local git worktrees), `node_modules/`, committed secrets.

## 3. Setup and commands

### Prerequisites

- Node.js + npm
- Local MySQL with database `mern_todo` (and `mern_todo_test` for integration tests)

### One-time server setup

```bash
cd server
cp .env.example .env   # set DB_USER, DB_PASSWORD, etc.
npm install
npm run db:migrate
```

Create test DB and migrate (integration tests):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mern_todo_test;"
npm run db:migrate:test
```

### Email reminders (optional)

Requires `REMINDER_EMAIL`, `SMTP_*`, and optional `REMINDER_LEAD_MINUTES` (default 60) in `server/.env`. The in-process poller runs only while `npm start` is active. Apply `server/db/migrations/003-todo-reminder-sent-at.sql` on existing databases if `npm run db:migrate` did not add `reminder_sent_at`.

### Daily development

| Task | Command | CWD |
|------|---------|-----|
| Start API | `npm start` | `server/` |
| Start UI | `npm run dev` | `client/` |
| Server tests (all) | `npm test` | `server/` |
| Server unit only | `npm run test:unit` | `server/` |
| Server integration | `npm run test:integration` | `server/` |
| Client unit tests | `npm test` | `client/` |
| Client lint | `npm run lint` | `client/` |
| Client production build | `npm run build` | `client/` |

Client API URL: `VITE_API_BASE_URL` (default `http://localhost:3000`).

**No root `package.json`.** Run install/test per package directory.

**No CI workflows** in this repo — agents must run tests locally before claiming success.

## 4. Architecture rules

### Server layering (strict)

```
HTTP request → routes/todos.js → utils/* (validation) → repositories/* → MySQL
```

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| `routes/` | Parse params, call validator, map status codes, call repository | Raw SQL, business date logic |
| `repositories/` | SQL, `mapRowToTodo`, CRUD | HTTP concepts, `req`/`res` |
| `utils/` | Pure validation/helpers | DB access, Express imports |
| `config/` | Pool, env, `testConnection()` | Route handlers |

### Client layering

| Layer | Role |
|-------|------|
| `App.jsx` | Global state: `todos`, `filter`, `sort`, theme |
| `components/*` | UI + `fetch` to API; no shared global store |
| `utils/dates.js` | Pure functions only — overdue, format, sort comparator, `normalizeDateTimeLocal` |

### Dependency direction

- Client → server only via HTTP (`API_BASE_URL`).
- Server → MySQL only via `pool` from `config/database.js`.
- Do not add ORMs (Sequelize/Prisma/Mongoose). `mongoose` was removed intentionally.

### API contract (do not break without updating client + tests)

**Todo JSON shape:**

```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "completed": false,
  "dueDate": "2026-05-24T14:30:00"
}
```

- `dueDate`: `string | null` — local datetime `YYYY-MM-DDTHH:mm:ss` (no timezone suffix), or `null`.
- `id`: number. `completed`: boolean (not 0/1 in JSON).

**Endpoints:**

| Method | Path | Response body |
|--------|------|-----------------|
| GET | `/todos` | `Todo[]` |
| GET | `/todos/:id` | single `Todo` or 404 |
| POST | `/todos` | `201` + created `Todo` |
| PUT | `/todos/:id` | `200` + **full** `Todo[]` |
| DELETE | `/todos/:id` | `200` + **full** `Todo[]` |

**Validation:** invalid `dueDate` → `400` with `{ "error": "Invalid dueDate; expected YYYY-MM-DDTHH:mm:ss or null" }`.

**PUT partial updates:** use `'dueDate' in req.body` to allow clearing with `null`. `title`/`description` currently use truthy checks — empty string will not update.

### Schema changes

1. Update `server/db/schema.sql` for new installs.
2. Add numbered script under `server/db/migrations/` for existing databases.
3. Update `mapRowToTodo` / repository INSERT/UPDATE.
4. Extend unit + integration tests.

DB column `due_date` (snake_case) maps to API `dueDate` (camelCase).

## 5. Coding standards

### Language and modules

- **Server:** CommonJS (`require` / `module.exports`), single quotes typical.
- **Client:** ESM (`import` / `export`), `"type": "module"`; match surrounding file quote style.
- **No TypeScript** unless the project adopts it repo-wide.

### React / MUI

- Functional components with hooks.
- Default exports for components (`export default function AddTodo`).
- Theme-aware colors: use `sx` with palette tokens (`error.main`, `text.secondary`) — not hardcoded hex for overdue/due text (dark mode must work).
- Prefer native `<input type="datetime-local">` for due dates; use `normalizeDateTimeLocal` from `dates.js` before API calls.
- Avoid new UI dependencies unless PRD/plan explicitly approves.

### Server

- Async route handlers with `try/catch` and `next(err)`.
- Parameterized queries only (`?` placeholders) — never interpolate user input into SQL.
- `dateStrings: ['DATE', 'DATETIME']` on pool — format dates in `mapRowToTodo`, not ad hoc per route.

### Scope and style

- Minimal diffs; do not refactor unrelated code.
- No drive-by README updates unless requested.
- Comments only for non-obvious business rules.

## 6. Testing requirements

### Runner

Node built-in **`node:test`** + **`node:assert/strict`** (no Jest/Vitest on server; client tests use `node --test` on plain `.js` files).

### Server

| Suite | File pattern | DB required |
|-------|----------------|-------------|
| Unit | `validateDueDate.test.js`, `mapRowToTodo.test.js` | No |
| Integration | `todosRepository.integration.test.js`, `todosRoutes.integration.test.js` | Yes — **test DB only** |

Integration tests load `test/integrationEnv.js` first — it forces `DB_NAME` to a name containing `test` or throws.

**Before claiming server work is done:**

```bash
cd server && npm test
```

### Client

```bash
cd client && npm test
```

Pure logic belongs in `utils/dates.js` with tests in `dates.test.js`. Use `setNowForTests()` for time-dependent cases.

### TDD expectation

For new server validators or client utils: write failing test → run → implement → run green. Integration tests may follow repository changes.

### Forbidden test practices

- Running integration tests against production `DB_NAME`.
- Skipping tests while asserting "should pass".
- Adding tests that only assert mocks without behavior.

## 7. Security rules

- **Never commit** `server/.env`, passwords, or API keys. Only `.env.example` with placeholders.
- Do not log `DB_PASSWORD` or full connection strings.
- CORS allowlist is in `server/index.js` — add origins explicitly; do not use `origin: '*'` with credentials.
- Validate all write payloads on the server (`validateDueDate` pattern) even if the client validates.
- No auth layer exists — do not assume multi-tenant isolation.

## 8. Agent workflow

### Before changing code

1. Read relevant `products/*.md` PRD and `docs/superpowers/specs/*` design if the task is feature-sized.
2. For multi-step features, follow or create a plan in `docs/superpowers/plans/` before coding.
3. Use **CodeGraph** (`codegraph_*` MCP) for structural questions (callers, impact, definitions) — see `.cursor/rules/codegraph.mdc`. Do not grep-first for symbol lookup.
4. Confirm MySQL is available if touching integration behavior.

### While implementing

- Touch only files required by the task.
- Preserve API contract and PUT/DELETE full-array responses.
- Run targeted tests after each logical chunk.

### After changing code

1. Run `npm test` in affected package(s) and `npm run lint` in `client/` if JSX changed.
2. For schema changes, document migration steps in the PR/plan.
3. Do **not** commit unless the user explicitly asks.
4. Do **not** push or open PRs unless asked.

### Worktrees

Feature isolation may use `.worktrees/<branch>/` (gitignored). Keep paths consistent; run commands from the worktree copy when working there.

### Large features

Follow Superpowers flow when applicable: brainstorm → design spec in `docs/superpowers/specs/` → implementation plan in `docs/superpowers/plans/` → execute task-by-task with verification.

## 9. Domain constraints

### Overdue

A todo is overdue when **all** are true:

1. `completed === false`
2. `dueDate !== null`
3. `dueDate` is strictly before current local datetime (`isOverdue` in `client/src/utils/dates.js`)

Completed todos are never overdue.

### Filters and sort (client-only)

- **Filters:** `all` | `active` | `completed` | `overdue` — applied before sort.
- **Sort:** `newest` (id descending) | `dueDate` (ascending; nulls last; tie-break by id).
- Do not add server-side sort query params unless spec/plan requires it.

### Due date semantics

- Stored and returned as naive local datetime strings (no `Z` offset).
- Server validates calendar + clock components; rejects invalid dates like `2026-02-30T12:00:00`.

### Out of scope unless PRD says otherwise

- Authentication / multi-user
- Recurring todos, calendar sync
- Push or in-app notifications (email due-date reminders are supported — see Email reminders above)
- Timezone-aware server scheduling

## 10. PR checklist

Before opening a pull request (human or agent):

- [ ] `cd server && npm test` — all pass
- [ ] `cd client && npm test` — all pass (if client logic changed)
- [ ] `cd client && npm run lint` — no errors (if client changed)
- [ ] API contract unchanged or client + tests updated together
- [ ] Schema/migration included if DB shape changed
- [ ] No `.env`, secrets, or `node_modules` in diff
- [ ] `Readme.md` updated only if setup/commands changed materially
- [ ] Acceptance criteria from PRD/plan verified manually when UI-facing

## Forbidden patterns

| Pattern | Why |
|---------|-----|
| In-memory todo array in `index.js` | Removed; MySQL is required |
| `mongoose` or new ORM | Repo uses thin `mysql2` repository |
| SQL in route files | Belongs in `repositories/` |
| Breaking PUT/DELETE to return single todo | Client expects full array |
| Hardcoded `http://localhost:3000` in components | Use `API_BASE_URL` from `config.js` |
| `dueDate` as Date object in JSON responses | API uses ISO-like strings |
| Integration tests without `integrationEnv.js` | Risk of wiping prod DB |
| Force-push to `main` | User rule / git safety |
| Commits without user request | User preference |

## Subsystem quick reference

### Server agent focus

Files: `routes/todos.js`, `repositories/todosRepository.js`, `utils/validateDueDate.js`, `utils/reminderDue.js`, `config/reminders.js`, `jobs/reminderPoller.js`, `services/emailService.js`, `db/*`, `test/*`.

### Client agent focus

Files: `App.jsx`, `components/TodoUi.jsx`, `components/AddTodo.jsx`, `utils/dates.js`, `config.js`.

When both sides change for one feature, implement **server + tests first**, then client, unless the plan orders otherwise.

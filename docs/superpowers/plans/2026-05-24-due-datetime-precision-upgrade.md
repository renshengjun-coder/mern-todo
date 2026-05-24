# Due Date-Time Precision Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Follow TDD: failing test first, then minimal implementation.

**Goal:** Upgrade `dueDate` from calendar date (`YYYY-MM-DD`) to local date-time with second precision (`YYYY-MM-DDTHH:mm:ss`) across DB, API, validation, and UI.

**Architecture:** Migrate MySQL `due_date` from `DATE` to `DATETIME`; tighten server validator and repository formatting; update client `dates.js` for instant-based overdue; switch inputs to `datetime-local` with `step="1"`. TDD each layer in the existing `feature/due-dates` worktree.

**Tech Stack:** Node `node:test`, Express, mysql2, React, MUI, Vite

**Prerequisites:** Plan `2026-05-24-due-dates-overdue-highlighting.md` completed (or equivalent on `feature/due-dates`).

**Design spec:** `docs/superpowers/specs/2026-05-24-due-dates-overdue-highlighting-design.md` (v1.1)

**Worktree:**

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/.worktrees/feature/due-dates
```

---

## Delta overview

| Component | Change |
|-----------|--------|
| `server/db/schema.sql` | `due_date DATETIME NULL` |
| `server/db/migrations/002-due-date-to-datetime.sql` | ALTER + legacy end-of-day UPDATE |
| `server/utils/validateDueDate.js` | Datetime regex + component validation |
| `server/repositories/todosRepository.js` | Format `DATETIME` → `YYYY-MM-DDTHH:mm:ss` |
| `server/config/database.js` | `dateStrings` includes `DATETIME` |
| `server/test/*.test.js` | Update fixtures and expectations |
| `client/src/utils/dates.js` | `parseLocalDateTime`, `now` comparison, format with time |
| `client/src/utils/dates.test.js` | Second-boundary overdue cases |
| `client/src/components/TodoUi.jsx` | `datetime-local` + normalize |
| `client/src/components/AddTodo.jsx` | `datetime-local` edit + labels |

---

## Task 1: Database — `DATE` → `DATETIME`

**Files:**
- Modify: `server/db/schema.sql`
- Create: `server/db/migrations/002-due-date-to-datetime.sql`

- [ ] **Step 1: Update `schema.sql`**

```sql
due_date DATETIME NULL,
```

- [ ] **Step 2: Create migration `002-due-date-to-datetime.sql`**

```sql
-- Upgrade date-only column to datetime (idempotent if already DATETIME)
ALTER TABLE todos MODIFY due_date DATETIME NULL;

-- Legacy DATE rows became midnight; set end-of-day for same-day semantics
UPDATE todos
SET due_date = TIMESTAMP(DATE(due_date), '23:59:59')
WHERE due_date IS NOT NULL
  AND TIME(due_date) = '00:00:00';
```

- [ ] **Step 3: Apply to dev + test DBs**

```bash
cd server
set -a && source .env && set +a
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/migrations/002-due-date-to-datetime.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "${DB_NAME_TEST:-mern_todo_test}" < db/migrations/002-due-date-to-datetime.sql
```

- [ ] **Step 4: Commit**

```bash
git add db/schema.sql db/migrations/002-due-date-to-datetime.sql
git commit -m "feat(server): migrate due_date from DATE to DATETIME"
```

---

## Task 2: Validator TDD — `YYYY-MM-DDTHH:mm:ss`

**Files:**
- Modify: `server/test/validateDueDate.test.js`
- Modify: `server/utils/validateDueDate.js`

- [ ] **Step 1: Update tests (RED)**

Replace/add cases:

```js
test('validateDueDate accepts valid datetime', () => {
  assert.deepEqual(validateDueDate('2026-05-24T17:30:45'), {
    valid: true,
    value: '2026-05-24T17:30:45',
  });
});

test('validateDueDate rejects date-only legacy format', () => {
  const result = validateDueDate('2026-05-24');
  assert.equal(result.valid, false);
  assert.match(result.error, /YYYY-MM-DDTHH:mm:ss/);
});

test('validateDueDate rejects invalid time', () => {
  const result = validateDueDate('2026-05-24T25:00:00');
  assert.equal(result.valid, false);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --test test/validateDueDate.test.js
```

- [ ] **Step 3: Implement validator (GREEN)**

```js
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const ERROR = 'Invalid dueDate; expected YYYY-MM-DDTHH:mm:ss or null';

function validateDueDate(value) {
  if (value === null || value === undefined) {
    return { valid: true, value: null };
  }
  if (typeof value !== 'string' || !DATETIME_REGEX.test(value)) {
    return { valid: false, error: ERROR };
  }
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  if (hour > 23 || minute > 59 || second > 59) {
    return { valid: false, error: ERROR };
  }
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return { valid: false, error: ERROR };
  }
  return { valid: true, value };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 3: Repository mapping TDD

**Files:**
- Modify: `server/test/mapRowToTodo.test.js`
- Modify: `server/test/todosRepository.integration.test.js`
- Modify: `server/repositories/todosRepository.js`
- Modify: `server/config/database.js`

- [ ] **Step 1: Update unit tests for `2026-05-24T17:00:00`**

```js
test('mapRowToTodo maps due_date string datetime', () => {
  const todo = mapRowToTodo({
    id: 3,
    title: 'Deadline',
    description: '',
    completed: 0,
    due_date: '2026-05-24 17:00:00',
  });
  assert.equal(todo.dueDate, '2026-05-24T17:00:00');
});
```

- [ ] **Step 2: Update integration tests**

Use `dueDate: '2026-06-01T12:00:00'` in create/update tests.

- [ ] **Step 3: Implement `formatDueDateTime` in repository**

```js
function formatDueDateTime(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    return value.trim().replace(' ', 'T').slice(0, 19);
  }
  // Date fallback: local getters
  const pad = (n) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}
```

- [ ] **Step 4: Set `dateStrings: ['DATE', 'DATETIME']` in `database.js`**

- [ ] **Step 5: Run `npm test` — all server tests PASS**

- [ ] **Step 6: Commit**

---

## Task 4: Route integration tests

**Files:**
- Modify: `server/test/todosRoutes.integration.test.js`

- [ ] **Step 1: Update POST fixtures to `2026-06-01T12:00:00`**

- [ ] **Step 2: Add test rejecting date-only body**

```js
test('POST /todos rejects date-only dueDate with 400', async () => {
  // body: { dueDate: '2026-06-01', ... }
  assert.equal(res.status, 400);
});
```

- [ ] **Step 3: Run — PASS**

- [ ] **Step 4: Commit**

---

## Task 5: Client `dates.js` TDD

**Files:**
- Modify: `client/src/utils/dates.test.js`
- Modify: `client/src/utils/dates.js`

- [ ] **Step 1: Replace `setTodayForTests` with `setNowForTests(isoLocal)`**

```js
// e.g. setNowForTests('2026-05-24T14:00:00')
```

- [ ] **Step 2: Update overdue tests per PRD table**

```js
test('isOverdue false when due later same day', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-24T18:00:00', false), false);
});

test('isOverdue true one second before now', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-24T13:59:59', false), true);
});
```

- [ ] **Step 3: Implement `parseLocalDateTime` + compare to `nowLocal()`**

```js
function parseLocalDateTime(iso) {
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, ss);
}

export function isOverdue(dueDate, completed) {
  if (completed || !dueDate) return false;
  return parseLocalDateTime(dueDate) < nowLocal();
}

export function formatDueDate(dueDate) {
  const dt = parseLocalDateTime(dueDate);
  const formatted = dt.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  return `Due ${formatted}`;
}
```

- [ ] **Step 4: Add `normalizeDateTimeLocal(input)` export for forms**

```js
export function normalizeDateTimeLocal(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}
```

- [ ] **Step 5: `npm test` in client — PASS**

- [ ] **Step 6: Commit**

---

## Task 6: UI — datetime inputs

**Files:**
- Modify: `client/src/components/TodoUi.jsx`
- Modify: `client/src/components/AddTodo.jsx`

- [ ] **Step 1: TodoUi — `type="datetime-local"` `step="1"`**

On submit:

```js
import { normalizeDateTimeLocal } from '../utils/dates.js';
const normalized = normalizeDateTimeLocal(dueDate);
if (normalized) body.dueDate = normalized;
```

- [ ] **Step 2: AddTodo — edit input + labels**

- `type="datetime-local"` `step="1"`
- Label: “Due date & time”
- Button: “Clear date & time”
- `setUpdatedDueDate(todo.dueDate ?? '')` — convert API `T` format for input (already compatible)

- [ ] **Step 3: Manual QA**

| Step | Expected |
|------|----------|
| Create due today 6 PM (now 2 PM) | Not overdue |
| Create due today 1 PM | Overdue |
| Display | Shows time with seconds |
| Edit seconds | Persists after save |

- [ ] **Step 4: `npm test` (server + client) + `npm run build`**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: upgrade dueDate to second-precision datetime"
```

---

## Breaking changes / rollout

| Consumer | Impact |
|----------|--------|
| API clients sending `YYYY-MM-DD` | `400` — must send `YYYY-MM-DDTHH:mm:ss` |
| Existing DB `DATE` rows | Migrated to `DATETIME` end-of-day `23:59:59` |
| Browser QA | Hard refresh after deploy |

---

## Spec coverage (PRD v0.2)

| Requirement | Task |
|-------------|------|
| FR-B4–B6 datetime validation | 2 |
| DATETIME storage | 1, 3 |
| FR-F1, UX-4 datetime input | 6 |
| FR-F5 time in display | 5, 6 |
| §7.2 instant overdue | 5 |
| §13 edge case table | 5 |

---

## Estimated effort

| Task | Time |
|------|------|
| 1 Schema migration | ~10 min |
| 2 Validator | ~15 min |
| 3 Repository | ~20 min |
| 4 Routes tests | ~10 min |
| 5 Client dates | ~20 min |
| 6 UI | ~15 min |
| **Total** | ~1.5 h |

---

## Execution handoff

After review, implement in `feature/due-dates` worktree using TDD per task. Restart server/client after Task 1 migration before manual browser check.

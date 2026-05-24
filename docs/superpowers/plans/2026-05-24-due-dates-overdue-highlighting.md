# Due Dates + Overdue Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional due dates to todos with MySQL persistence, API validation, overdue highlighting, client-side sort-by-due-date, and an Overdue filter.

**Architecture:** Shared `validateDueDate` on the server validates POST/PUT input before repository writes. Repository maps `due_date` ↔ `dueDate`. Client pure helpers in `dates.js` drive overdue styling and sort. Sort state lives in `App.jsx`; filter → sort → render pipeline in `AddTodo.jsx`.

**Tech Stack:** Node.js, Express 4, mysql2, React 18, MUI 5, Vite, Node built-in test runner

**Design spec:** `docs/superpowers/specs/2026-05-24-due-dates-overdue-highlighting-design.md`

**PRD:** `products/2026-05-24-due-dates-overdue-highlighting-prd.md`

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/db/schema.sql` | Modify | Add `due_date DATE NULL` |
| `server/db/migrations/001-add-due-date.sql` | Create | ALTER for existing databases |
| `server/utils/validateDueDate.js` | Create | Format + calendar validation |
| `server/test/validateDueDate.test.js` | Create | Validator unit tests |
| `server/repositories/todosRepository.js` | Modify | dueDate CRUD + row mapping |
| `server/routes/todos.js` | Modify | Accept/validate dueDate on POST/PUT |
| `server/test/mapRowToTodo.test.js` | Modify | dueDate mapping tests |
| `server/test/todosRepository.integration.test.js` | Modify | dueDate integration tests |
| `client/src/utils/dates.js` | Create | isOverdue, formatDueDate, compareDueDates |
| `client/src/utils/dates.test.js` | Create | Client date helper tests |
| `client/package.json` | Modify | Add `test` script |
| `client/src/components/TodoUi.jsx` | Modify | Optional date on create |
| `client/src/components/AddTodo.jsx` | Modify | Display, edit, overdue, filter, sort UI |
| `client/src/App.jsx` | Modify | Sort state |

---

## Prerequisites

Local MySQL running with `mern_todo` database and `server/.env` configured (same as existing MySQL setup).

All server commands assume:

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/server
```

All client commands assume:

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/client
```

After schema changes, run migration on your dev database:

```bash
npm run db:migrate
# For existing DBs that already have todos table without due_date:
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/migrations/001-add-due-date.sql
```

---

### Task 1: Database schema — `due_date` column

**Files:**
- Modify: `server/db/schema.sql`
- Create: `server/db/migrations/001-add-due-date.sql`

- [ ] **Step 1: Add column to `server/db/schema.sql`**

Replace the `CREATE TABLE` block with:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Create `server/db/migrations/001-add-due-date.sql`**

```sql
ALTER TABLE todos ADD COLUMN due_date DATE NULL;
```

Note: If column already exists, this ALTER will error — safe to ignore on fresh installs that used updated `schema.sql`.

- [ ] **Step 3: Apply migration to local dev DB**

```bash
cd server
mysql -u root -p mern_todo < db/migrations/001-add-due-date.sql
```

Expected: no error (or "Duplicate column" if re-run).

- [ ] **Step 4: Commit**

```bash
git add db/schema.sql db/migrations/001-add-due-date.sql
git commit -m "feat(server): add due_date column to todos schema"
```

---

### Task 2: `validateDueDate` utility (TDD)

**Files:**
- Create: `server/test/validateDueDate.test.js`
- Create: `server/utils/validateDueDate.js`

- [ ] **Step 1: Write failing tests**

Create `server/test/validateDueDate.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDueDate } = require('../utils/validateDueDate');

const ERROR = 'Invalid dueDate; expected YYYY-MM-DD or null';

test('validateDueDate accepts null', () => {
  assert.deepEqual(validateDueDate(null), { valid: true, value: null });
});

test('validateDueDate accepts undefined as null', () => {
  assert.deepEqual(validateDueDate(undefined), { valid: true, value: null });
});

test('validateDueDate accepts valid YYYY-MM-DD', () => {
  assert.deepEqual(validateDueDate('2026-05-24'), {
    valid: true,
    value: '2026-05-24',
  });
});

test('validateDueDate rejects wrong format', () => {
  const result = validateDueDate('05/24/2026');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects invalid calendar date', () => {
  const result = validateDueDate('2026-02-30');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects non-string', () => {
  const result = validateDueDate(20260524);
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server
node --test test/validateDueDate.test.js
```

Expected: FAIL — cannot find module `../utils/validateDueDate`

- [ ] **Step 3: Implement `server/utils/validateDueDate.js`**

```js
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ERROR = 'Invalid dueDate; expected YYYY-MM-DD or null';

function validateDueDate(value) {
  if (value === null || value === undefined) {
    return { valid: true, value: null };
  }
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    return { valid: false, error: ERROR };
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, error: ERROR };
  }
  return { valid: true, value };
}

module.exports = { validateDueDate };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test test/validateDueDate.test.js
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add utils/validateDueDate.js test/validateDueDate.test.js
git commit -m "feat(server): add validateDueDate utility with tests"
```

---

### Task 3: Repository — dueDate mapping and CRUD (TDD)

**Files:**
- Modify: `server/repositories/todosRepository.js`
- Modify: `server/test/mapRowToTodo.test.js`
- Modify: `server/test/todosRepository.integration.test.js`

- [ ] **Step 1: Add failing mapRowToTodo tests**

Append to `server/test/mapRowToTodo.test.js`:

```js
test('mapRowToTodo maps due_date string to dueDate', () => {
  const todo = mapRowToTodo({
    id: 3,
    title: 'Deadline',
    description: '',
    completed: 0,
    due_date: '2026-05-24',
  });
  assert.equal(todo.dueDate, '2026-05-24');
});

test('mapRowToTodo maps null due_date to dueDate null', () => {
  const todo = mapRowToTodo({
    id: 4,
    title: 'No date',
    description: '',
    completed: 0,
    due_date: null,
  });
  assert.equal(todo.dueDate, null);
});
```

Update existing assertions to include `dueDate: null` in expected objects:

```js
assert.deepEqual(todo, {
  id: 1,
  title: 'Buy milk',
  description: '2%',
  completed: true,
  dueDate: null,
});
```

- [ ] **Step 2: Run mapRowToTodo tests — expect FAIL**

```bash
node --test test/mapRowToTodo.test.js
```

Expected: FAIL — missing `dueDate` property

- [ ] **Step 3: Update repository**

In `server/repositories/todosRepository.js`:

Add helper after imports:

```js
function formatDueDate(value) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}
```

Update `mapRowToTodo`:

```js
function mapRowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
    dueDate: formatDueDate(row.due_date),
  };
}
```

Update all `SELECT` queries to include `due_date`.

Update `create`:

```js
async function create({ title, description, dueDate = null }) {
  const [result] = await pool.query(
    'INSERT INTO todos (title, description, completed, due_date) VALUES (?, ?, 0, ?)',
    [title, description ?? '', dueDate]
  );
  return findById(result.insertId);
}
```

Update `updateById` signature and body to accept `dueDate`:

```js
async function updateById(id, { title, description, completed, dueDate }) {
  // ... existing findById check ...

  if (dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(dueDate);
  }
  // ... rest unchanged ...
}
```

- [ ] **Step 4: Run mapRowToTodo tests — expect PASS**

```bash
node --test test/mapRowToTodo.test.js
```

- [ ] **Step 5: Add integration tests**

Append to `server/test/todosRepository.integration.test.js`:

```js
test('create with dueDate persists and returns dueDate', async () => {
  const created = await todosRepository.create({
    title: 'Due soon',
    description: '',
    dueDate: '2026-06-01',
  });
  assert.equal(created.dueDate, '2026-06-01');

  const found = await todosRepository.findById(created.id);
  assert.equal(found.dueDate, '2026-06-01');
});

test('create without dueDate returns dueDate null', async () => {
  const created = await todosRepository.create({
    title: 'No deadline',
    description: '',
  });
  assert.equal(created.dueDate, null);
});

test('updateById clears dueDate with null', async () => {
  const created = await todosRepository.create({
    title: 'Clear me',
    description: '',
    dueDate: '2026-06-01',
  });

  const updated = await todosRepository.updateById(created.id, {
    dueDate: null,
  });
  assert.equal(updated.dueDate, null);
});
```

- [ ] **Step 6: Run integration tests**

```bash
node --test test/todosRepository.integration.test.js
```

Expected: all tests PASS (requires MySQL + migrated schema)

- [ ] **Step 7: Commit**

```bash
git add repositories/todosRepository.js test/mapRowToTodo.test.js test/todosRepository.integration.test.js
git commit -m "feat(server): persist dueDate in todos repository"
```

---

### Task 4: Routes — accept and validate dueDate

**Files:**
- Modify: `server/routes/todos.js`

- [ ] **Step 1: Add import**

```js
const { validateDueDate } = require('../utils/validateDueDate');
```

- [ ] **Step 2: Update POST handler**

Replace the POST handler body:

```js
router.post('/', async (req, res, next) => {
  try {
  let dueDate = null;
  if ('dueDate' in req.body) {
    const result = validateDueDate(req.body.dueDate);
    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }
    dueDate = result.value;
  }

  const newTodo = await todosRepository.create({
    title: req.body.title,
    description: req.body.description,
    dueDate,
  });
  res.status(201).send(newTodo);
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 3: Update PUT handler**

Inside PUT, after building `updates` for title/description/completed, add:

```js
if ('dueDate' in req.body) {
  const result = validateDueDate(req.body.dueDate);
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }
  updates.dueDate = result.value;
}
```

- [ ] **Step 4: Manual smoke test**

Start server (`npm start`), then:

```bash
curl -s -X POST http://localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test","description":"","dueDate":"2026-05-30"}' | jq .

curl -s -X POST http://localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Bad","description":"","dueDate":"2026-02-30"}' | jq .
```

Expected: first returns todo with `"dueDate": "2026-05-30"`; second returns `400` with error message.

- [ ] **Step 5: Commit**

```bash
git add routes/todos.js
git commit -m "feat(server): validate and accept dueDate on POST and PUT"
```

---

### Task 5: Client date helpers (TDD)

**Files:**
- Create: `client/src/utils/dates.js`
- Create: `client/src/utils/dates.test.js`
- Modify: `client/package.json`

- [ ] **Step 1: Add test script to `client/package.json`**

In `"scripts"` add:

```json
"test": "node --test src/utils/dates.test.js"
```

- [ ] **Step 2: Write failing tests**

Create `client/src/utils/dates.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOverdue,
  formatDueDate,
  compareDueDates,
  setTodayForTests,
} from './dates.js';

test('isOverdue returns false for null dueDate', () => {
  setTodayForTests('2026-05-24');
  assert.equal(isOverdue(null, false), false);
});

test('isOverdue returns false when completed even if past due', () => {
  setTodayForTests('2026-05-24');
  assert.equal(isOverdue('2026-05-23', true), false);
});

test('isOverdue returns false for today', () => {
  setTodayForTests('2026-05-24');
  assert.equal(isOverdue('2026-05-24', false), false);
});

test('isOverdue returns true for yesterday', () => {
  setTodayForTests('2026-05-24');
  assert.equal(isOverdue('2026-05-23', false), true);
});

test('isOverdue returns false for tomorrow', () => {
  setTodayForTests('2026-05-24');
  assert.equal(isOverdue('2026-05-25', false), false);
});

test('formatDueDate returns readable label', () => {
  const formatted = formatDueDate('2026-05-24');
  assert.match(formatted, /May/);
  assert.match(formatted, /24/);
  assert.match(formatted, /2026/);
});

test('compareDueDates sorts dated before undated', () => {
  const dated = { id: 1, dueDate: '2026-05-01' };
  const undated = { id: 2, dueDate: null };
  assert.ok(compareDueDates(dated, undated) < 0);
  assert.ok(compareDueDates(undated, dated) > 0);
});

test('compareDueDates sorts ascending by date', () => {
  const earlier = { id: 1, dueDate: '2026-05-01' };
  const later = { id: 2, dueDate: '2026-05-10' };
  assert.ok(compareDueDates(earlier, later) < 0);
});

test('compareDueDates tie-breaks by id', () => {
  const a = { id: 1, dueDate: '2026-05-01' };
  const b = { id: 2, dueDate: '2026-05-01' };
  assert.ok(compareDueDates(a, b) < 0);
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd client
npm test
```

Expected: FAIL — cannot find module `./dates.js`

- [ ] **Step 4: Implement `client/src/utils/dates.js`**

```js
let testTodayOverride = null;

export function setTodayForTests(isoDate) {
  testTodayOverride = isoDate;
}

function toLocalDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function todayLocal() {
  if (testTodayOverride) {
    return toLocalDate(testTodayOverride);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isOverdue(dueDate, completed) {
  if (completed || !dueDate) {
    return false;
  }
  return toLocalDate(dueDate) < todayLocal();
}

export function formatDueDate(dueDate) {
  const formatted = toLocalDate(dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Due ${formatted}`;
}

export function compareDueDates(a, b) {
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  if (a.dueDate && b.dueDate) {
    const diff = toLocalDate(a.dueDate) - toLocalDate(b.dueDate);
    if (diff !== 0) return diff;
  }
  return a.id - b.id;
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test
```

Expected: 9 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/dates.js src/utils/dates.test.js package.json
git commit -m "feat(client): add date helpers with unit tests"
```

---

### Task 6: Create form — optional due date (`TodoUi.jsx`)

**Files:**
- Modify: `client/src/components/TodoUi.jsx`

- [ ] **Step 1: Add state and date input**

Add `dueDate` state:

```js
const [dueDate, setDueDate] = useState('');
```

Add below description TextField:

```jsx
<div style={{ paddingTop: 16 }} />
<label htmlFor="create-due-date" style={{ display: 'block', marginBottom: 8 }}>
  Due date (optional)
</label>
<input
  id="create-due-date"
  type="date"
  value={dueDate}
  onChange={(e) => setDueDate(e.target.value)}
  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
/>
```

- [ ] **Step 2: Update POST body and reset form**

In `handleTodo`, build body:

```js
const body = { title, description };
if (dueDate) {
  body.dueDate = dueDate;
}
```

After successful fetch + setTodos, clear fields:

```js
setTitle('');
setDescription('');
setDueDate('');
```

Refactor `handleTodo` to accept no args and read from state, or pass `dueDate` as third param.

- [ ] **Step 3: Manual test**

Run client (`npm run dev`), create todo with and without due date. Verify API receives correct payload and card shows date.

- [ ] **Step 4: Commit**

```bash
git add src/components/TodoUi.jsx
git commit -m "feat(client): optional due date on create form"
```

---

### Task 7: Sort state in `App.jsx`

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/AddTodo.jsx` (props only in this task)

- [ ] **Step 1: Add sort state to App.jsx**

```js
const [sort, setSort] = useState('newest');
```

Pass to AddTodo:

```jsx
<AddTodo
  todos={todos}
  setTodos={setTodos}
  filter={filter}
  setFilter={setFilter}
  sort={sort}
  setSort={setSort}
/>
```

- [ ] **Step 2: Update AddTodo signature**

```js
function AddTodo({ todos, setTodos, filter, setFilter, sort, setSort }) {
```

(Implementation of sort UI and pipeline in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/components/AddTodo.jsx
git commit -m "feat(client): lift sort state to App"
```

---

### Task 8: List — display, edit, overdue, filter, sort (`AddTodo.jsx`)

**Files:**
- Modify: `client/src/components/AddTodo.jsx`

- [ ] **Step 1: Add imports**

```js
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { isOverdue, formatDueDate, compareDueDates } from '../utils/dates.js';
```

Inside component:

```js
const theme = useTheme();
```

- [ ] **Step 2: Add edit state for due date**

```js
const [updatedDueDate, setUpdatedDueDate] = useState('');
```

When entering edit mode, also set:

```js
setUpdatedDueDate(todo.dueDate ?? '');
```

- [ ] **Step 3: Implement filter + sort pipeline**

Replace `visibleTodos` logic:

```js
const filtered = todos.filter((todo) => {
  if (filter === 'active') return !todo.completed;
  if (filter === 'completed') return todo.completed;
  if (filter === 'overdue') return isOverdue(todo.dueDate, todo.completed);
  return true;
});

const visibleTodos = [...filtered].sort((a, b) => {
  if (sort === 'dueDate') {
    return compareDueDates(a, b);
  }
  return b.id - a.id;
});
```

- [ ] **Step 4: Add Overdue filter and sort controls**

Extend filter button row:

```jsx
<Button
  variant={filter === 'overdue' ? 'contained' : 'outlined'}
  onClick={() => setFilter('overdue')}
>
  Overdue
</Button>
```

Add sort control row below filters:

```jsx
<div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 12 }}>
  <Button
    variant={sort === 'newest' ? 'contained' : 'outlined'}
    onClick={() => setSort('newest')}
  >
    Newest first
  </Button>
  <Button
    variant={sort === 'dueDate' ? 'contained' : 'outlined'}
    onClick={() => setSort('dueDate')}
  >
    Due date soonest first
  </Button>
</div>
```

- [ ] **Step 5: Display due date and overdue indicator**

In view mode (not editing), after description Typography:

```jsx
{todo.dueDate && (
  <Typography
    variant="body2"
    sx={{
      margin: 1,
      color: isOverdue(todo.dueDate, todo.completed)
        ? 'error.main'
        : 'text.secondary',
    }}
  >
    {formatDueDate(todo.dueDate)}
    {isOverdue(todo.dueDate, todo.completed) && (
      <Chip
        label="Overdue"
        color="error"
        size="small"
        sx={{ ml: 1 }}
      />
    )}
  </Typography>
)}
```

- [ ] **Step 6: Edit mode — date input and Clear date**

In edit mode block, after description TextField:

```jsx
<div style={{ paddingTop: 12 }}>
  <label htmlFor={`edit-due-${todo.id}`}>Due date</label>
  <input
    id={`edit-due-${todo.id}`}
    type="date"
    value={updatedDueDate}
    onChange={(e) => setUpdatedDueDate(e.target.value)}
    style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
  />
  <Button
    size="small"
    onClick={() => setUpdatedDueDate('')}
    sx={{ mt: 1 }}
  >
    Clear date
  </Button>
</div>
```

- [ ] **Step 7: Update handleEdit to send dueDate**

```js
body: JSON.stringify({
  title: updatedTitle,
  description: updatedDescription,
  dueDate: updatedDueDate || null,
}),
```

- [ ] **Step 8: Manual acceptance test**

Verify PRD acceptance criteria:
- Create without date → null
- Past incomplete → red + Overdue chip
- Complete toggle → overdue styling gone
- Edit add/change/clear → persists
- Sort due date → earliest first, undated last
- Overdue filter → only late incomplete
- Dark mode legible

- [ ] **Step 9: Run all automated tests**

```bash
cd server && npm test
cd ../client && npm test
```

Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add src/components/AddTodo.jsx
git commit -m "feat(client): due date display, overdue UI, filter, and sort"
```

---

## Spec coverage checklist

| Requirement | Task |
|-------------|------|
| FR-B1–B7 API dueDate | Tasks 3–4 |
| FR-B8 partial PUT unchanged | Task 4 |
| FR-F1–F4 create flow | Task 6 |
| FR-F5–F9 list/edit | Task 8 |
| FR-F10–F12 sort/filter | Tasks 7–8 |
| FR-F13–F14 date helpers | Task 5 |
| UX-1–UX-5 | Task 8 |
| MySQL schema | Task 1 |
| Unit tests | Tasks 2, 3, 5 |

## Execution handoff

Plan complete. Choose execution approach when ready to implement.

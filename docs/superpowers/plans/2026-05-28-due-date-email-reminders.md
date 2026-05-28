# Due-Date Email Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send one SMTP email per incomplete todo when its due date-time enters a configurable lead window, using an in-process poller and a `reminder_sent_at` column for deduplication.

**Architecture:** Layered server-only feature: `config/reminders.js` gates startup; `jobs/reminderPoller.js` polls on an interval; `utils/reminderDue.js` applies local wall-clock lead-window logic; `repositories/todosRepository.js` loads candidates and marks sent; `services/emailService.js` sends via Nodemailer. REST API and client unchanged.

**Tech Stack:** Node.js, Express 4, mysql2, nodemailer, Node built-in `node:test`

**Design spec:** `docs/superpowers/specs/2026-05-28-due-date-email-reminders-design.md`

**Worktree (optional):** `superpowers:using-git-worktrees` — isolate on e.g. `feature/email-reminders` if you prefer not to work on `main` directly.

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/db/schema.sql` | Modify | Add `reminder_sent_at DATETIME NULL` |
| `server/db/migrations/003-todo-reminder-sent-at.sql` | Create | ALTER for existing DBs |
| `server/utils/reminderDue.js` | Create | Pure lead-window check |
| `server/test/reminderDue.test.js` | Create | Unit tests |
| `server/config/reminders.js` | Create | Env loading + `isRemindersEnabled()` |
| `server/repositories/todosRepository.js` | Modify | `findTodosPendingReminder`, `markReminderSent` |
| `server/test/todosRepository.integration.test.js` | Modify | Repository reminder tests |
| `server/services/emailService.js` | Create | Nodemailer + message builder |
| `server/test/emailService.test.js` | Create | Subject/body + mock transport |
| `server/jobs/reminderPoller.js` | Create | Interval + `runReminderPollOnce` |
| `server/test/reminderPoller.integration.test.js` | Create | End-to-end poll with mock send |
| `server/index.js` | Modify | Start/stop scheduler |
| `server/package.json` | Modify | Add `nodemailer` |
| `server/.env.example` | Modify | Reminder + SMTP vars |
| `AGENTS.md` | Modify | Document feature; remove from forbidden list |

**Not modified:** `client/`, `server/routes/todos.js`, `mapRowToTodo` (still omits `reminder_sent_at`).

---

## Prerequisites

- MySQL with `mern_todo` and `mern_todo_test` (integration tests).
- `server/.env` with existing DB vars.
- For manual SMTP test later: Mailtrap or Gmail app password (not required for automated tests).

All server commands:

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/server
```

After Task 1, apply schema to dev + test DB:

```bash
npm run db:migrate
npm run db:migrate:test
# If dev DB already had todos table before schema.sql update:
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/migrations/003-todo-reminder-sent-at.sql
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME_TEST" < db/migrations/003-todo-reminder-sent-at.sql
```

---

### Task 1: Database — `reminder_sent_at` column

**Files:**
- Modify: `server/db/schema.sql`
- Create: `server/db/migrations/003-todo-reminder-sent-at.sql`

- [ ] **Step 1: Update `server/db/schema.sql`**

Add column after `due_date`:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  due_date DATETIME NULL,
  reminder_sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Create `server/db/migrations/003-todo-reminder-sent-at.sql`**

```sql
ALTER TABLE todos
  ADD COLUMN reminder_sent_at DATETIME NULL DEFAULT NULL
  AFTER due_date;
```

- [ ] **Step 3: Apply to local databases**

```bash
cd server
npm run db:migrate
npm run db:migrate:test
```

If `ADD COLUMN` fails with duplicate column, column already exists — continue.

- [ ] **Step 4: Commit**

```bash
git add db/schema.sql db/migrations/003-todo-reminder-sent-at.sql
git commit -m "feat(server): add reminder_sent_at column to todos"
```

---

### Task 2: `reminderDue` utility (TDD)

**Files:**
- Create: `server/test/reminderDue.test.js`
- Create: `server/utils/reminderDue.js`

- [ ] **Step 1: Write failing tests**

Create `server/test/reminderDue.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { isReminderDue, parseLocalDateTime } = require('../utils/reminderDue');

test('parseLocalDateTime parses API shape', () => {
  const d = parseLocalDateTime('2026-06-01T12:00:00');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 5);
  assert.equal(d.getDate(), 1);
  assert.equal(d.getHours(), 12);
});

test('isReminderDue is false before lead window', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 10, 59, 59);
  assert.equal(isReminderDue(dueDate, 60, now), false);
});

test('isReminderDue is true at lead boundary', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 11, 0, 0);
  assert.equal(isReminderDue(dueDate, 60, now), true);
});

test('isReminderDue is true after lead boundary', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 11, 30, 0);
  assert.equal(isReminderDue(dueDate, 60, now), true);
});

test('isReminderDue is false for null dueDate', () => {
  assert.equal(isReminderDue(null, 60, new Date()), false);
});

test('isReminderDue is false for invalid dueDate', () => {
  assert.equal(isReminderDue('not-a-date', 60, new Date()), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/reminderDue.test.js
```

Expected: FAIL — cannot find module `../utils/reminderDue`

- [ ] **Step 3: Implement `server/utils/reminderDue.js`**

```javascript
function parseLocalDateTime(value) {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(' ', 'T');
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }
  return date;
}

function isReminderDue(dueDate, leadMinutes, now = new Date()) {
  const due = parseLocalDateTime(dueDate);
  if (!due) {
    return false;
  }
  if (!Number.isFinite(leadMinutes) || leadMinutes < 0) {
    return false;
  }
  const remindAtMs = due.getTime() - leadMinutes * 60 * 1000;
  return now.getTime() >= remindAtMs;
}

module.exports = {
  parseLocalDateTime,
  isReminderDue,
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/reminderDue.test.js
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add utils/reminderDue.js test/reminderDue.test.js
git commit -m "feat(server): add reminderDue lead-window helper"
```

---

### Task 3: Reminder configuration

**Files:**
- Create: `server/config/reminders.js`

- [ ] **Step 1: Create `server/config/reminders.js`**

```javascript
require('dotenv').config();

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function getReminderConfig() {
  const to = process.env.REMINDER_EMAIL?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM?.trim();
  const smtpPort = parsePositiveInt(process.env.SMTP_PORT, 587);
  const leadMinutes = parsePositiveInt(process.env.REMINDER_LEAD_MINUTES, 60);
  const pollIntervalMs = parsePositiveInt(process.env.REMINDER_POLL_INTERVAL_MS, 60000);

  const hasCore =
    Boolean(to) &&
    Boolean(smtpHost) &&
    Boolean(smtpUser) &&
    smtpPass !== undefined &&
    smtpPass !== '' &&
    Boolean(smtpFrom) &&
    leadMinutes !== null &&
    pollIntervalMs !== null &&
    smtpPort !== null;

  if (!hasCore) {
    return { enabled: false };
  }

  return {
    enabled: true,
    to,
    leadMinutes,
    pollIntervalMs,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: parseBoolean(process.env.SMTP_SECURE, false),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    },
    from: smtpFrom,
  };
}

function isRemindersEnabled() {
  return getReminderConfig().enabled;
}

module.exports = {
  getReminderConfig,
  isRemindersEnabled,
};
```

- [ ] **Step 2: Smoke-check in Node REPL (optional)**

```bash
node -e "const { getReminderConfig } = require('./config/reminders'); console.log(getReminderConfig());"
```

Expected: `{ enabled: false }` unless SMTP env is fully set.

- [ ] **Step 3: Commit**

```bash
git add config/reminders.js
git commit -m "feat(server): add reminder SMTP configuration loader"
```

---

### Task 4: Repository reminder methods (TDD)

**Files:**
- Modify: `server/repositories/todosRepository.js`
- Modify: `server/test/todosRepository.integration.test.js`

- [ ] **Step 1: Write failing integration tests**

Append to `server/test/todosRepository.integration.test.js`:

```javascript
test('findTodosPendingReminder excludes completed and sent', async () => {
  const open = await todosRepository.create({
    title: 'Open',
    description: '',
    dueDate: '2030-01-01T12:00:00',
  });
  const done = await todosRepository.create({
    title: 'Done',
    description: '',
    dueDate: '2030-01-01T12:00:00',
  });
  await todosRepository.updateById(done.id, { completed: true });

  const pending = await todosRepository.findTodosPendingReminder();
  const ids = pending.map((t) => t.id);
  assert.ok(ids.includes(open.id));
  assert.equal(pending.every((t) => t.dueDate), true);
});

test('markReminderSent sets reminder_sent_at', async () => {
  const created = await todosRepository.create({
    title: 'Remind me',
    description: '',
    dueDate: '2030-01-01T12:00:00',
  });
  await todosRepository.markReminderSent(created.id);

  const [rows] = await pool.query(
    'SELECT reminder_sent_at FROM todos WHERE id = ?',
    [created.id]
  );
  assert.notEqual(rows[0].reminder_sent_at, null);

  const pending = await todosRepository.findTodosPendingReminder();
  assert.equal(
    pending.some((t) => t.id === created.id),
    false
  );
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
node --test test/todosRepository.integration.test.js
```

Expected: FAIL — `findTodosPendingReminder is not a function`

- [ ] **Step 3: Add methods to `server/repositories/todosRepository.js`**

Add before `module.exports`:

```javascript
async function findTodosPendingReminder() {
  const [rows] = await pool.query(
    `SELECT id, title, description, completed, due_date
     FROM todos
     WHERE due_date IS NOT NULL
       AND completed = 0
       AND reminder_sent_at IS NULL`
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: formatDueDateTime(row.due_date),
  }));
}

async function markReminderSent(id) {
  await pool.query(
    'UPDATE todos SET reminder_sent_at = NOW() WHERE id = ? AND reminder_sent_at IS NULL',
    [id]
  );
}
```

Export them:

```javascript
module.exports = {
  mapRowToTodo,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  findTodosPendingReminder,
  markReminderSent,
};
```

- [ ] **Step 4: Run integration tests**

```bash
node --test test/todosRepository.integration.test.js
```

Expected: all PASS (requires Task 1 migration on test DB).

- [ ] **Step 5: Commit**

```bash
git add repositories/todosRepository.js test/todosRepository.integration.test.js
git commit -m "feat(server): repository support for email reminders"
```

---

### Task 5: Email service (TDD)

**Files:**
- Modify: `server/package.json`
- Create: `server/services/emailService.js`
- Create: `server/test/emailService.test.js`

- [ ] **Step 1: Install nodemailer**

```bash
cd server
npm install nodemailer
```

- [ ] **Step 2: Write failing tests**

Create `server/test/emailService.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildReminderMessage,
  sendReminderEmail,
} = require('../services/emailService');

test('buildReminderMessage formats subject and body', () => {
  const { subject, text } = buildReminderMessage({
    title: 'Buy milk',
    description: '2%',
    dueDate: '2026-06-01T12:00:00',
  });
  assert.equal(subject, 'Reminder: Buy milk due soon');
  assert.match(text, /Buy milk/);
  assert.match(text, /2%/);
  assert.match(text, /2026-06-01T12:00:00/);
});

test('sendReminderEmail uses injected transport', async () => {
  const sent = [];
  const transport = {
    sendMail: async (options) => {
      sent.push(options);
      return { messageId: 'test-id' };
    },
  };

  await sendReminderEmail(
    {
      to: 'user@example.com',
      from: 'noreply@example.com',
      todo: {
        title: 'Task',
        description: '',
        dueDate: '2026-06-01T12:00:00',
      },
    },
    transport
  );

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'user@example.com');
  assert.equal(sent[0].from, 'noreply@example.com');
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
node --test test/emailService.test.js
```

Expected: FAIL — cannot find module

- [ ] **Step 4: Implement `server/services/emailService.js`**

```javascript
const nodemailer = require('nodemailer');
const { getReminderConfig } = require('../config/reminders');

function buildReminderMessage(todo) {
  const subject = `Reminder: ${todo.title} due soon`;
  const lines = [
    `Todo: ${todo.title}`,
    todo.description ? `Description: ${todo.description}` : null,
    `Due: ${todo.dueDate}`,
  ].filter(Boolean);
  return { subject, text: lines.join('\n') };
}

function createTransport(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
}

async function sendReminderEmail({ to, from, todo }, transport) {
  const { subject, text } = buildReminderMessage(todo);
  const transporter = transport ?? createTransport(getReminderConfig().smtp);
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

module.exports = {
  buildReminderMessage,
  createTransport,
  sendReminderEmail,
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
node --test test/emailService.test.js
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json services/emailService.js test/emailService.test.js
git commit -m "feat(server): add Nodemailer reminder email service"
```

---

### Task 6: Reminder poller job

**Files:**
- Create: `server/jobs/reminderPoller.js`
- Create: `server/test/reminderPoller.integration.test.js`

- [ ] **Step 1: Write failing integration test**

Create `server/test/reminderPoller.integration.test.js`:

```javascript
require('./integrationEnv');

const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../config/database');
const todosRepository = require('../repositories/todosRepository');
const { runReminderPollOnce } = require('../jobs/reminderPoller');

async function clearTodos() {
  await pool.query('DELETE FROM todos');
}

test.beforeEach(async () => {
  await clearTodos();
});

test.after(async () => {
  await clearTodos();
  await pool.end();
});

test('runReminderPollOnce sends and marks reminder_sent_at', async () => {
  const created = await todosRepository.create({
    title: 'Due soon',
    description: 'note',
    dueDate: '2026-06-01T12:00:00',
  });

  const sent = [];
  const config = {
    enabled: true,
    to: 'user@example.com',
    from: 'noreply@example.com',
    leadMinutes: 60,
  };

  await runReminderPollOnce(config, {
    now: new Date(2026, 5, 1, 11, 0, 0),
    sendReminderEmail: async ({ to, todo }) => {
      sent.push({ to, todo });
    },
  });

  assert.equal(sent.length, 1);
  assert.equal(sent[0].todo.id, created.id);

  const [rows] = await pool.query(
    'SELECT reminder_sent_at FROM todos WHERE id = ?',
    [created.id]
  );
  assert.notEqual(rows[0].reminder_sent_at, null);
});

test('runReminderPollOnce skips todo outside lead window', async () => {
  await todosRepository.create({
    title: 'Later',
    description: '',
    dueDate: '2026-06-01T12:00:00',
  });

  const sent = [];
  const config = {
    enabled: true,
    to: 'user@example.com',
    from: 'noreply@example.com',
    leadMinutes: 60,
  };

  await runReminderPollOnce(config, {
    now: new Date(2026, 5, 1, 9, 0, 0),
    sendReminderEmail: async () => {
      sent.push(1);
    },
  });

  assert.equal(sent.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/reminderPoller.integration.test.js
```

Expected: FAIL — cannot find `../jobs/reminderPoller`

- [ ] **Step 3: Implement `server/jobs/reminderPoller.js`**

```javascript
const todosRepository = require('../repositories/todosRepository');
const { isReminderDue } = require('../utils/reminderDue');
const { sendReminderEmail } = require('../services/emailService');
const { getReminderConfig } = require('../config/reminders');

async function runReminderPollOnce(config, deps = {}) {
  if (!config?.enabled) {
    return;
  }

  const now = deps.now ?? new Date();
  const repo = deps.repo ?? todosRepository;
  const send = deps.sendReminderEmail ?? sendReminderEmail;
  const leadMinutes = config.leadMinutes;

  const candidates = await repo.findTodosPendingReminder();

  for (const todo of candidates) {
    if (!isReminderDue(todo.dueDate, leadMinutes, now)) {
      continue;
    }
    try {
      await send({
        to: config.to,
        from: config.from,
        todo,
      });
      await repo.markReminderSent(todo.id);
    } catch (err) {
      console.error(
        `Reminder email failed for todo ${todo.id}:`,
        err.message
      );
    }
  }
}

let pollTimer = null;

function startReminderScheduler(config = getReminderConfig()) {
  if (!config.enabled) {
    console.warn(
      'Email reminders disabled: set REMINDER_EMAIL and SMTP_* in .env'
    );
    return () => {};
  }

  console.log(
    `Email reminders enabled (lead ${config.leadMinutes}m, poll ${config.pollIntervalMs}ms)`
  );

  const tick = () => {
    runReminderPollOnce(config).catch((err) => {
      console.error('Reminder poll failed:', err.message);
    });
  };

  tick();
  pollTimer = setInterval(tick, config.pollIntervalMs);

  return () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function stopReminderScheduler() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = {
  runReminderPollOnce,
  startReminderScheduler,
  stopReminderScheduler,
};
```

- [ ] **Step 4: Run integration test**

```bash
node --test test/reminderPoller.integration.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add jobs/reminderPoller.js test/reminderPoller.integration.test.js
git commit -m "feat(server): add in-process reminder poller job"
```

---

### Task 7: Wire scheduler into `index.js`

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add imports and stop hook**

At top of `server/index.js` after existing requires:

```javascript
const { getReminderConfig } = require('./config/reminders');
const {
  startReminderScheduler,
  stopReminderScheduler,
} = require('./jobs/reminderPoller');
```

Add module-level variable:

```javascript
let stopReminders = () => {};
```

- [ ] **Step 2: Update `shutdown`**

Inside `shutdown`, before `pool.end()`:

```javascript
  stopReminders();
  stopReminderScheduler();
```

- [ ] **Step 3: Start scheduler in `start()`**

After successful `testConnection()`, before `app.listen`:

```javascript
    const reminderConfig = getReminderConfig();
    stopReminders = startReminderScheduler(reminderConfig);
```

- [ ] **Step 4: Manual smoke test (optional)**

With full SMTP env set, start server and watch log for `Email reminders enabled`.

```bash
npm start
```

Expected: server listens; reminder line appears if env complete.

- [ ] **Step 5: Run full server test suite**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add index.js
git commit -m "feat(server): start email reminder scheduler on boot"
```

---

### Task 8: Environment example and AGENTS.md

**Files:**
- Modify: `server/.env.example`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update `server/.env.example`**

Append:

```
# Email reminders (optional — server must stay running)
REMINDER_EMAIL=
REMINDER_LEAD_MINUTES=60
REMINDER_POLL_INTERVAL_MS=60000
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

- [ ] **Step 2: Update `AGENTS.md`**

1. Under setup / server section, add a short **Email reminders** subsection:
   - Requires `REMINDER_EMAIL`, `SMTP_*`, optional `REMINDER_LEAD_MINUTES` (default 60).
   - Poller runs in-process while `npm start` is running.
   - Run `db/migrations/003-todo-reminder-sent-at.sql` on existing DBs if needed.

2. Remove `- Email/push notifications` from the **Out of scope** / forbidden list (§9 or Forbidden patterns).

3. Add to subsystem quick reference (server): `config/reminders.js`, `jobs/reminderPoller.js`, `services/emailService.js`, `utils/reminderDue.js`.

- [ ] **Step 3: Update design spec status (optional)**

In `docs/superpowers/specs/2026-05-28-due-date-email-reminders-design.md`, set `Status: Approved`.

- [ ] **Step 4: Commit**

```bash
git add .env.example ../AGENTS.md ../docs/superpowers/specs/2026-05-28-due-date-email-reminders-design.md
git commit -m "docs: document email reminder env and AGENTS setup"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run all server tests**

```bash
cd server
npm test
```

Expected: all files under `test/**/*.test.js` PASS.

- [ ] **Step 2: Confirm API unchanged**

```bash
curl -s http://localhost:3000/todos | head
```

Expected: JSON array; todo objects have `id`, `title`, `description`, `completed`, `dueDate` only (no `reminderSentAt`).

- [ ] **Step 3: Manual reminder test (when SMTP configured)**

1. Set `REMINDER_LEAD_MINUTES=5` and valid SMTP in `.env`.
2. Create todo with due time ~7 minutes from now via UI or POST.
3. Keep `npm start` running.
4. Expect one email ~2 minutes before due; `reminder_sent_at` set in DB.

- [ ] **Step 4: Final commit (if any loose files)**

```bash
git status
```

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
|------------------|------|
| `reminder_sent_at` column + migration | Task 1 |
| API unchanged / omit from `mapRowToTodo` | No change to mapper |
| `REMINDER_EMAIL` + SMTP env gate | Task 3, 8 |
| `REMINDER_LEAD_MINUTES` default 60 | Task 3 |
| `isReminderDue` local wall-clock | Task 2 |
| `findTodosPendingReminder` SQL filter | Task 4 |
| Mark sent only after SMTP success | Task 6 (`markReminderSent` after send) |
| Retry on SMTP failure | Task 6 catch, no mark |
| In-process interval | Task 6, 7 |
| Nodemailer SMTP | Task 5 |
| Shutdown clears interval | Task 7 |
| Unit + integration tests | Tasks 2, 4, 5, 6 |
| `.env.example` + AGENTS.md | Task 8 |
| No client changes | — |

---

## Manual test plan (post-implementation)

- [ ] Server starts without SMTP env → warning, no crash, no poller errors every tick
- [ ] Incomplete todo with due in lead window → one email
- [ ] Complete todo before window → no email
- [ ] Todo without due date → no email
- [ ] Second poll after send → no duplicate email
- [ ] SMTP failure → retry on later poll until success

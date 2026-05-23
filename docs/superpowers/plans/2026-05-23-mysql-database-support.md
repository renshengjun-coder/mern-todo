# MySQL Database Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory todo storage in the Express server with persistent MySQL storage, configurable for local dev and AWS RDS, without changing the REST API contract or the React client.

**Architecture:** `mysql2` connection pool in `config/database.js`; SQL isolated in `repositories/todosRepository.js`; async HTTP handlers in `routes/todos.js`; `index.js` wires middleware and refuses to start until `SELECT 1` succeeds. Env vars (`DB_*`) drive the same code path in dev and prod.

**Tech Stack:** Node.js, Express 4, `mysql2`, `dotenv`, Node built-in test runner (`node:test`)

**Branch / workspace:** `feature/mysql-support` in worktree `.worktrees/feature/mysql-support`

**Design spec:** `docs/superpowers/specs/2026-05-23-mysql-database-design.md`

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/package.json` | Modify | Add `mysql2`, `dotenv`; remove `mongoose`; add `db:migrate`, `test` scripts |
| `server/.env.example` | Create | Document all `DB_*` variables |
| `server/config/database.js` | Create | Pool from env; export `testConnection()` |
| `server/db/schema.sql` | Create | `todos` table DDL |
| `server/db/migrate.js` | Create | Apply `schema.sql` |
| `server/repositories/todosRepository.js` | Create | CRUD + `mapRowToTodo` |
| `server/routes/todos.js` | Create | Async route handlers (same API contract) |
| `server/index.js` | Modify | Mount router; DB health check before listen; error middleware |
| `server/test/mapRowToTodo.test.js` | Create | Unit tests (no DB required) |
| `server/test/todosRepository.integration.test.js` | Create | CRUD integration tests (requires local MySQL) |

---

## Prerequisites (human / one-time)

Before Task 1, ensure local MySQL is running and create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mern_todo;"
```

All implementation commands below assume:

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/.worktrees/feature/mysql-support/server
```

---

### Task 1: Dependencies and environment template

**Files:**
- Modify: `server/package.json`
- Create: `server/.env.example`

- [ ] **Step 1: Install new dependencies and remove mongoose**

```bash
cd server
npm uninstall mongoose
npm install mysql2 dotenv
```

- [ ] **Step 2: Update `server/package.json` scripts**

Replace the `"scripts"` block with:

```json
"scripts": {
  "test": "node --test test/**/*.test.js",
  "test:unit": "node --test test/mapRowToTodo.test.js",
  "test:integration": "node --test test/todosRepository.integration.test.js",
  "start": "nodemon index.js",
  "db:migrate": "node db/migrate.js"
}
```

- [ ] **Step 3: Create `server/.env.example`**

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=mern_todo
DB_SSL=false
```

- [ ] **Step 4: Create local `server/.env` (gitignored)**

```bash
cp .env.example .env
# Edit .env with your real local MySQL credentials
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(server): add mysql2 and dotenv; remove mongoose"
```

---

### Task 2: Database configuration module

**Files:**
- Create: `server/config/database.js`

- [ ] **Step 1: Create `server/config/database.js`**

```javascript
require('dotenv').config();

const mysql = require('mysql2/promise');

function buildPoolConfig() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  };

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

const pool = mysql.createPool(buildPoolConfig());

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
```

- [ ] **Step 2: Smoke-test connection**

Create a temporary script or run in Node REPL:

```bash
node -e "require('dotenv').config(); require('./config/database').testConnection().then(() => console.log('OK')).catch(e => { console.error(e.message); process.exit(1); })"
```

Expected: `OK` (fails with clear error if `.env` is wrong or MySQL is down)

- [ ] **Step 3: Commit**

```bash
git add config/database.js
git commit -m "feat(server): add configurable mysql2 connection pool"
```

---

### Task 3: Schema and migration script

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/migrate.js`

- [ ] **Step 1: Create `server/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Create `server/db/migrate.js`**

```javascript
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await connection.query(schema);
  await connection.end();
  console.log('Migration complete: todos table ready');
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Run migration**

```bash
npm run db:migrate
```

Expected: `Migration complete: todos table ready`

Verify:

```bash
mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "${DB_HOST:-127.0.0.1}" "$DB_NAME" -e "DESCRIBE todos;"
```

Expected: columns `id`, `title`, `description`, `completed`, `created_at`, `updated_at`

- [ ] **Step 4: Commit**

```bash
git add db/schema.sql db/migrate.js
git commit -m "feat(server): add todos schema and db:migrate script"
```

---

### Task 4: Repository layer with unit tests

**Files:**
- Create: `server/repositories/todosRepository.js`
- Create: `server/test/mapRowToTodo.test.js`

- [ ] **Step 1: Write failing unit test**

Create `server/test/mapRowToTodo.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapRowToTodo } = require('../repositories/todosRepository');

test('mapRowToTodo converts completed TINYINT 1 to true', () => {
  const todo = mapRowToTodo({
    id: 1,
    title: 'Buy milk',
    description: '2%',
    completed: 1,
  });
  assert.deepEqual(todo, {
    id: 1,
    title: 'Buy milk',
    description: '2%',
    completed: true,
  });
});

test('mapRowToTodo converts completed TINYINT 0 to false', () => {
  const todo = mapRowToTodo({
    id: 2,
    title: 'Walk dog',
    description: '',
    completed: 0,
  });
  assert.equal(todo.completed, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:unit
```

Expected: FAIL — `Cannot find module '../repositories/todosRepository'`

- [ ] **Step 3: Implement `server/repositories/todosRepository.js`**

```javascript
const { pool } = require('../config/database');

function mapRowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
  };
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed FROM todos ORDER BY id ASC'
  );
  return rows.map(mapRowToTodo);
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed FROM todos WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTodo(rows[0]);
}

async function create({ title, description }) {
  const [result] = await pool.query(
    'INSERT INTO todos (title, description, completed) VALUES (?, ?, 0)',
    [title, description ?? '']
  );
  return findById(result.insertId);
}

async function updateById(id, { title, description, completed }) {
  const existing = await findById(id);
  if (!existing) {
    return null;
  }

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }
  if (completed !== undefined) {
    fields.push('completed = ?');
    values.push(completed ? 1 : 0);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);
  await pool.query(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function deleteById(id) {
  await pool.query('DELETE FROM todos WHERE id = ?', [id]);
}

module.exports = {
  mapRowToTodo,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};
```

- [ ] **Step 4: Run unit tests**

```bash
npm run test:unit
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add repositories/todosRepository.js test/mapRowToTodo.test.js
git commit -m "feat(server): add todos repository with row mapping tests"
```

---

### Task 5: Repository integration tests

**Files:**
- Create: `server/test/todosRepository.integration.test.js`

Requires local MySQL with `mern_todo` database and `.env` configured.

- [ ] **Step 1: Write integration test**

Create `server/test/todosRepository.integration.test.js`:

```javascript
require('dotenv').config();

const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../config/database');
const todosRepository = require('../repositories/todosRepository');

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

test('create and findAll returns inserted todo', async () => {
  const created = await todosRepository.create({
    title: 'Integration todo',
    description: 'from test',
  });

  assert.equal(created.completed, false);
  assert.match(String(created.id), /^\d+$/);

  const all = await todosRepository.findAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].title, 'Integration todo');
});

test('findById returns null for missing id', async () => {
  const result = await todosRepository.findById(99999);
  assert.equal(result, null);
});

test('updateById applies partial fields', async () => {
  const created = await todosRepository.create({
    title: 'Original',
    description: 'desc',
  });

  const updated = await todosRepository.updateById(created.id, {
    title: 'Updated',
    completed: true,
  });

  assert.equal(updated.title, 'Updated');
  assert.equal(updated.completed, true);
  assert.equal(updated.description, 'desc');
});

test('updateById returns null when id missing', async () => {
  const result = await todosRepository.updateById(99999, { title: 'x' });
  assert.equal(result, null);
});

test('deleteById removes row', async () => {
  const created = await todosRepository.create({
    title: 'To delete',
    description: '',
  });

  await todosRepository.deleteById(created.id);
  const all = await todosRepository.findAll();
  assert.equal(all.length, 0);
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm run test:integration
```

Expected: 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add test/todosRepository.integration.test.js
git commit -m "test(server): add todos repository integration tests"
```

---

### Task 6: Express routes (async handlers)

**Files:**
- Create: `server/routes/todos.js`

- [ ] **Step 1: Create `server/routes/todos.js`**

```javascript
const express = require('express');
const todosRepository = require('../repositories/todosRepository');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const todos = await todosRepository.findAll();
    res.status(200).send(todos);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const todo = await todosRepository.findById(id);
    if (!todo) {
      res.status(404).send();
      return;
    }
    res.json(todo);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const newTodo = await todosRepository.create({
      title: req.body.title,
      description: req.body.description,
    });
    res.status(201).send(newTodo);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await todosRepository.deleteById(id);
    const todos = await todosRepository.findAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = {};

    if (req.body.title) {
      updates.title = req.body.title;
    }
    if (req.body.description) {
      updates.description = req.body.description;
    }
    if (typeof req.body.completed === 'boolean') {
      updates.completed = req.body.completed;
    }

    const updated = await todosRepository.updateById(id, updates);
    if (!updated) {
      res.status(404).send('Todo item not found.');
      return;
    }

    const todos = await todosRepository.findAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add routes/todos.js
git commit -m "feat(server): add async todos routes preserving API contract"
```

---

### Task 7: Refactor `index.js` — wire routes and startup health check

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Replace `server/index.js`**

Remove in-memory `todo` array, `counter`, `findIndex`, `deleteItemIndex`, and inline route handlers. Replace with:

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { testConnection } = require('./config/database');
const todosRouter = require('./routes/todos');

const app = express();

app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      'https://mern-todo-mayank.vercel.app',
      'http://localhost:5173',
    ],
  })
);

app.use('/todos', todosRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('*', (req, res) => {
  res.status(404).send('Route not defined');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await testConnection();
    app.listen(3000, () => {
      console.log('Listening at http://localhost:3000');
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
```

- [ ] **Step 2: Start server and verify health check**

```bash
npm start
```

Expected: `Listening at http://localhost:3000`

Stop MySQL or break `.env` and restart — expected: `Database connection failed: ...` and exit code 1.

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "feat(server): start only after DB health check; mount todos router"
```

---

### Task 8: End-to-end API verification

**Files:** None (manual verification)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: 7 tests PASS (2 unit + 5 integration)

- [ ] **Step 2: curl CRUD smoke test**

With server running:

```bash
# Create
curl -s -X POST http://localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Plan task","description":"mysql"}' | tee /tmp/todo.json

# List
curl -s http://localhost:3000/todos

# Get id from created todo (example id=1)
curl -s http://localhost:3000/todos/1

# Update (returns full array)
curl -s -X PUT http://localhost:3000/todos/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

# Delete (returns full array)
curl -s -X DELETE http://localhost:3000/todos/1
```

Expected shapes match spec:
- POST → 201, single todo with `completed: false`
- PUT/DELETE → 200, **full array**
- GET missing id → 404 empty body

- [ ] **Step 3: Restart server and confirm persistence**

```bash
# Create a todo via curl or UI, stop server, start again
npm start
curl -s http://localhost:3000/todos
```

Expected: todos still present after restart

- [ ] **Step 4: React client smoke test**

```bash
cd ../client
npm run dev
```

Open `http://localhost:5173` — add, edit, toggle complete, filter (All/Active/Completed), delete. No client code changes required.

- [ ] **Step 5: Final commit (if any doc tweaks)**

Optional README note in `server/README` or root README about `.env` setup — only if missing. Otherwise skip.

```bash
git status
# working tree clean after all task commits
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `mysql2` pool + env config | Task 1, 2 |
| `DB_SSL` for RDS | Task 2 (`buildPoolConfig`) |
| Startup `SELECT 1` health check | Task 2, 7 |
| `schema.sql` + `db:migrate` | Task 3 |
| Repository CRUD API | Task 4 |
| `mapRowToTodo` boolean mapping | Task 4 |
| REST contract unchanged | Task 6, 8 |
| PUT/DELETE return full array | Task 6 |
| 404 on missing PUT | Task 6 |
| 500 generic error, log server-side | Task 7 |
| Remove `mongoose` | Task 1 |
| `.env.example` | Task 1 |
| No client changes | Task 8 (verify only) |
| Persistence across restart | Task 8 |

---

## Production (RDS) deployment notes

After merge, on the production host:

1. Create RDS MySQL instance and database `mern_todo`.
2. Run `schema.sql` against RDS (same as local).
3. Set env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`.
4. Ensure security group allows app → RDS on port 3306.
5. Deploy server; confirm startup log shows listening (health check passed).

---

## Out of scope (do not implement in this plan)

- Client changes
- Authentication / multi-user todos
- Docker Compose for MySQL
- RDS CA bundle pinning
- Connection pool tuning beyond defaults

require('./integrationEnv');

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { pool } = require('../config/database');
const todosRouter = require('../routes/todos');

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.use('/todos', todosRouter);
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

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

test('POST /todos rejects invalid dueDate with 400', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bad',
        description: '',
        dueDate: '2026-02-30',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Invalid dueDate/);
  });
});

test('POST /todos rejects date-only dueDate with 400', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Date only',
        description: '',
        dueDate: '2026-06-01',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Invalid dueDate/);
  });
});

test('POST /todos accepts valid dueDate', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Good',
        description: '',
        dueDate: '2026-06-01T12:00:00',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.dueDate, '2026-06-01T12:00:00');
  });
});

test('PUT /todos/:id rejects date-only dueDate with 400', async () => {
  await withServer(async (port) => {
    const createRes = await fetch(`http://127.0.0.1:${port}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Existing',
        description: '',
      }),
    });
    const created = await createRes.json();

    const res = await fetch(`http://127.0.0.1:${port}/todos/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: '2026-06-01' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Invalid dueDate/);
  });
});

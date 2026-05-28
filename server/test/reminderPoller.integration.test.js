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

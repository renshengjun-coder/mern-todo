require('./integrationEnv');

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

test('create with dueDate persists and returns dueDate', async () => {
  const created = await todosRepository.create({
    title: 'Due soon',
    description: '',
    dueDate: '2026-06-01T12:00:00',
  });
  assert.equal(created.dueDate, '2026-06-01T12:00:00');

  const found = await todosRepository.findById(created.id);
  assert.equal(found.dueDate, '2026-06-01T12:00:00');
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
    dueDate: '2026-06-01T12:00:00',
  });

  const updated = await todosRepository.updateById(created.id, {
    dueDate: null,
  });
  assert.equal(updated.dueDate, null);
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

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

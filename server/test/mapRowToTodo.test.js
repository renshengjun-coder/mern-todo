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
    dueDate: null,
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
  assert.equal(todo.dueDate, null);
});

test('mapRowToTodo maps due_date datetime string to dueDate', () => {
  const todo = mapRowToTodo({
    id: 3,
    title: 'Deadline',
    description: '',
    completed: 0,
    due_date: '2026-05-24 17:00:00',
  });
  assert.equal(todo.dueDate, '2026-05-24T17:00:00');
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

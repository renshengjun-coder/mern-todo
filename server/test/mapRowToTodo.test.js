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

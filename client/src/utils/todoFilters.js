import { compareDueDates, isOverdue } from './dates.js';

export function computeStats(todos) {
  return {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };
}

export function filterTodos(todos, { filter, sort, search }) {
  const q = (search || '').trim().toLowerCase();

  let list = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    if (filter === 'overdue') return isOverdue(todo.dueDate, todo.completed);
    return true;
  });

  if (q) {
    list = list.filter(
      (todo) =>
        todo.title.toLowerCase().includes(q) ||
        (todo.description || '').toLowerCase().includes(q),
    );
  }

  return [...list].sort((a, b) => {
    if (sort === 'dueDate') {
      return compareDueDates(a, b);
    }
    return b.id - a.id;
  });
}

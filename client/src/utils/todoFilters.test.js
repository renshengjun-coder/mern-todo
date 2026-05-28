import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterTodos, computeStats } from './todoFilters.js';
import { setNowForTests } from './dates.js';

const sample = [
  { id: 1, title: 'Alpha', description: 'first', completed: false, dueDate: '2026-05-20T10:00:00' },
  { id: 2, title: 'Beta', description: 'second', completed: true, dueDate: null },
  { id: 3, title: 'Gamma', description: 'third task', completed: false, dueDate: '2026-06-01T10:00:00' },
];

describe('computeStats', () => {
  it('returns total, active, completed counts', () => {
    assert.deepEqual(computeStats(sample), { total: 3, active: 2, completed: 1 });
  });
});

describe('filterTodos', () => {
  it('filter active excludes completed', () => {
    const result = filterTodos(sample, { filter: 'active', sort: 'newest', search: '' });
    assert.equal(result.length, 2);
    assert.ok(result.every((t) => !t.completed));
  });

  it('filter completed excludes active', () => {
    const result = filterTodos(sample, { filter: 'completed', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [2]);
  });

  it('filter overdue uses isOverdue', () => {
    setNowForTests('2026-05-25T12:00:00');
    const result = filterTodos(sample, { filter: 'overdue', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [1]);
    setNowForTests(null);
  });

  it('search matches title or description case-insensitively', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'newest', search: 'THIRD' });
    assert.deepEqual(result.map((t) => t.id), [3]);
  });

  it('sort newest orders by id descending', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [3, 2, 1]);
  });

  it('sort dueDate uses compareDueDates (nulls last)', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'dueDate', search: '' });
    assert.deepEqual(result.map((t) => t.id), [1, 3, 2]);
  });
});

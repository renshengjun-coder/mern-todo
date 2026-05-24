import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOverdue,
  formatDueDate,
  compareDueDates,
  normalizeDateTimeLocal,
  setNowForTests,
} from './dates.js';

test('isOverdue returns false for null dueDate', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue(null, false), false);
});

test('isOverdue returns false when completed even if past due', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-23T10:00:00', true), false);
});

test('isOverdue returns false when due at same second as now', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-24T14:00:00', false), false);
});

test('isOverdue returns true one second before now', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-24T13:59:59', false), true);
});

test('isOverdue returns false when due later same day', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-24T18:00:00', false), false);
});

test('isOverdue returns false for tomorrow', () => {
  setNowForTests('2026-05-24T14:00:00');
  assert.equal(isOverdue('2026-05-25T00:00:00', false), false);
});

test('formatDueDate returns readable label with time', () => {
  const formatted = formatDueDate('2026-05-24T14:30:45');
  assert.match(formatted, /May/);
  assert.match(formatted, /24/);
  assert.match(formatted, /2026/);
  assert.match(formatted, /30/);
  assert.match(formatted, /45/);
});

test('compareDueDates sorts dated before undated', () => {
  const dated = { id: 1, dueDate: '2026-05-01T00:00:00' };
  const undated = { id: 2, dueDate: null };
  assert.ok(compareDueDates(dated, undated) < 0);
  assert.ok(compareDueDates(undated, dated) > 0);
});

test('compareDueDates sorts ascending by datetime', () => {
  const earlier = { id: 1, dueDate: '2026-05-01T09:00:00' };
  const later = { id: 2, dueDate: '2026-05-01T12:00:00' };
  assert.ok(compareDueDates(earlier, later) < 0);
});

test('compareDueDates tie-breaks by id', () => {
  const a = { id: 1, dueDate: '2026-05-01T12:00:00' };
  const b = { id: 2, dueDate: '2026-05-01T12:00:00' };
  assert.ok(compareDueDates(a, b) < 0);
});

test('normalizeDateTimeLocal appends seconds when missing', () => {
  assert.equal(normalizeDateTimeLocal('2026-05-24T14:30'), '2026-05-24T14:30:00');
});

test('normalizeDateTimeLocal leaves full datetime unchanged', () => {
  assert.equal(normalizeDateTimeLocal('2026-05-24T14:30:45'), '2026-05-24T14:30:45');
});

test('normalizeDateTimeLocal returns empty string for falsy input', () => {
  assert.equal(normalizeDateTimeLocal(''), '');
  assert.equal(normalizeDateTimeLocal(null), '');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { isReminderDue, parseLocalDateTime } = require('../utils/reminderDue');

test('parseLocalDateTime parses API shape', () => {
  const d = parseLocalDateTime('2026-06-01T12:00:00');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 5);
  assert.equal(d.getDate(), 1);
  assert.equal(d.getHours(), 12);
});

test('isReminderDue is false before lead window', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 10, 59, 59);
  assert.equal(isReminderDue(dueDate, 60, now), false);
});

test('isReminderDue is true at lead boundary', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 11, 0, 0);
  assert.equal(isReminderDue(dueDate, 60, now), true);
});

test('isReminderDue is true after lead boundary', () => {
  const dueDate = '2026-06-01T12:00:00';
  const now = new Date(2026, 5, 1, 11, 30, 0);
  assert.equal(isReminderDue(dueDate, 60, now), true);
});

test('isReminderDue is false for null dueDate', () => {
  assert.equal(isReminderDue(null, 60, new Date()), false);
});

test('isReminderDue is false for invalid dueDate', () => {
  assert.equal(isReminderDue('not-a-date', 60, new Date()), false);
});

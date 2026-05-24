const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDueDate } = require('../utils/validateDueDate');

const ERROR = 'Invalid dueDate; expected YYYY-MM-DDTHH:mm:ss or null';

test('validateDueDate accepts null', () => {
  assert.deepEqual(validateDueDate(null), { valid: true, value: null });
});

test('validateDueDate accepts undefined as null', () => {
  assert.deepEqual(validateDueDate(undefined), { valid: true, value: null });
});

test('validateDueDate accepts valid datetime', () => {
  assert.deepEqual(validateDueDate('2026-05-24T17:30:45'), {
    valid: true,
    value: '2026-05-24T17:30:45',
  });
});

test('validateDueDate rejects date-only legacy format', () => {
  const result = validateDueDate('2026-05-24');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects invalid time', () => {
  const result = validateDueDate('2026-05-24T25:00:00');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects wrong format', () => {
  const result = validateDueDate('05/24/2026');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects invalid calendar date', () => {
  const result = validateDueDate('2026-02-30T00:00:00');
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

test('validateDueDate rejects non-string', () => {
  const result = validateDueDate(20260524);
  assert.equal(result.valid, false);
  assert.equal(result.error, ERROR);
});

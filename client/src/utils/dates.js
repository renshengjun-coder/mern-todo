let testNowOverride = null;

export function setNowForTests(isoLocal) {
  testNowOverride = isoLocal;
}

export function parseLocalDateTime(iso) {
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, ss);
}

function nowLocal() {
  if (testNowOverride) {
    return parseLocalDateTime(testNowOverride);
  }
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );
}

export function isOverdue(dueDate, completed) {
  if (completed || !dueDate) {
    return false;
  }
  return parseLocalDateTime(dueDate) < nowLocal();
}

export function formatDueDate(dueDate) {
  const dt = parseLocalDateTime(dueDate);
  const formatted = dt.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  return `Due ${formatted}`;
}

export function compareDueDates(a, b) {
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  if (a.dueDate && b.dueDate) {
    const diff = parseLocalDateTime(a.dueDate) - parseLocalDateTime(b.dueDate);
    if (diff !== 0) return diff;
  }
  return a.id - b.id;
}

export function normalizeDateTimeLocal(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

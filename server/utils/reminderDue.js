function parseLocalDateTime(value) {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(' ', 'T');
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }
  return date;
}

function isReminderDue(dueDate, leadMinutes, now = new Date()) {
  const due = parseLocalDateTime(dueDate);
  if (!due) {
    return false;
  }
  if (!Number.isFinite(leadMinutes) || leadMinutes < 0) {
    return false;
  }
  const remindAtMs = due.getTime() - leadMinutes * 60 * 1000;
  return now.getTime() >= remindAtMs;
}

module.exports = {
  parseLocalDateTime,
  isReminderDue,
};

const { pool } = require('../config/database');

function formatDueDateTime(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    return value.trim().replace(' ', 'T').slice(0, 19);
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

function mapRowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
    dueDate: formatDueDateTime(row.due_date),
  };
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed, due_date FROM todos ORDER BY id ASC'
  );
  return rows.map(mapRowToTodo);
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed, due_date FROM todos WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTodo(rows[0]);
}

async function create({ title, description, dueDate = null }) {
  const [result] = await pool.query(
    'INSERT INTO todos (title, description, completed, due_date) VALUES (?, ?, 0, ?)',
    [title, description ?? '', dueDate]
  );
  return findById(result.insertId);
}

async function updateById(id, { title, description, completed, dueDate }) {
  const existing = await findById(id);
  if (!existing) {
    return null;
  }

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }
  if (completed !== undefined) {
    fields.push('completed = ?');
    values.push(completed ? 1 : 0);
  }
  if (dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(dueDate);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);
  await pool.query(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function deleteById(id) {
  await pool.query('DELETE FROM todos WHERE id = ?', [id]);
}

async function findTodosPendingReminder() {
  const [rows] = await pool.query(
    `SELECT id, title, description, completed, due_date
     FROM todos
     WHERE due_date IS NOT NULL
       AND completed = 0
       AND reminder_sent_at IS NULL`
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: formatDueDateTime(row.due_date),
  }));
}

async function markReminderSent(id) {
  await pool.query(
    'UPDATE todos SET reminder_sent_at = NOW() WHERE id = ? AND reminder_sent_at IS NULL',
    [id]
  );
}

module.exports = {
  mapRowToTodo,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  findTodosPendingReminder,
  markReminderSent,
};

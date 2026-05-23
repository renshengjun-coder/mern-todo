const { pool } = require('../config/database');

function mapRowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
  };
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed FROM todos ORDER BY id ASC'
  );
  return rows.map(mapRowToTodo);
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, title, description, completed FROM todos WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTodo(rows[0]);
}

async function create({ title, description }) {
  const [result] = await pool.query(
    'INSERT INTO todos (title, description, completed) VALUES (?, ?, 0)',
    [title, description ?? '']
  );
  return findById(result.insertId);
}

async function updateById(id, { title, description, completed }) {
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

module.exports = {
  mapRowToTodo,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};

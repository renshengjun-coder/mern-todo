const express = require('express');
const path = require('path');
const cors = require('cors');
const { testConnection, pool } = require('./config/database');
const todosRouter = require('./routes/todos');

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      'https://mern-todo-mayank.vercel.app',
      'http://localhost:5173',
    ],
  })
);

app.use('/todos', todosRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('*', (req, res) => {
  res.status(404).send('Route not defined');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

let server;

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
  process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown(signal).catch((err) => {
      console.error('Shutdown failed:', err.message);
      process.exit(1);
    });
  });
}

async function start() {
  try {
    await testConnection();
    server = app.listen(3000, () => {
      console.log('Listening at http://localhost:3000');
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;

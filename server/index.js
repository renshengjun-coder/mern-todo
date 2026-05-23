const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { testConnection } = require('./config/database');
const todosRouter = require('./routes/todos');

const app = express();

app.use(bodyParser.json());
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

async function start() {
  try {
    await testConnection();
    app.listen(3000, () => {
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

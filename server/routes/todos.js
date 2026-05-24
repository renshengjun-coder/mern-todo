const express = require('express');
const todosRepository = require('../repositories/todosRepository');
const { validateDueDate } = require('../utils/validateDueDate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const todos = await todosRepository.findAll();
    res.status(200).send(todos);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const todo = await todosRepository.findById(id);
    if (!todo) {
      res.status(404).send();
      return;
    }
    res.json(todo);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    let dueDate = null;
    if ('dueDate' in req.body) {
      const result = validateDueDate(req.body.dueDate);
      if (!result.valid) {
        res.status(400).json({ error: result.error });
        return;
      }
      dueDate = result.value;
    }

    const newTodo = await todosRepository.create({
      title: req.body.title,
      description: req.body.description,
      dueDate,
    });
    res.status(201).send(newTodo);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await todosRepository.deleteById(id);
    const todos = await todosRepository.findAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = {};

    if (req.body.title) {
      updates.title = req.body.title;
    }
    if (req.body.description) {
      updates.description = req.body.description;
    }
    if (typeof req.body.completed === 'boolean') {
      updates.completed = req.body.completed;
    }
    if ('dueDate' in req.body) {
      const result = validateDueDate(req.body.dueDate);
      if (!result.valid) {
        res.status(400).json({ error: result.error });
        return;
      }
      updates.dueDate = result.value;
    }

    const updated = await todosRepository.updateById(id, updates);
    if (!updated) {
      res.status(404).send('Todo item not found.');
      return;
    }

    const todos = await todosRepository.findAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

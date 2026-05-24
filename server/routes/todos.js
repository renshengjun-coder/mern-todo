const express = require('express');
const todosRepository = require('../repositories/todosRepository');

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
    const newTodo = await todosRepository.create({
      title: req.body.title,
      description: req.body.description,
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

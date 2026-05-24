import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { API_BASE_URL } from '../config';
import { isOverdue, formatDueDate, compareDueDates, normalizeDateTimeLocal } from '../utils/dates.js';

function AddTodo({ todos, setTodos, filter, setFilter, sort, setSort }) {
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [updatedTitle, setUpdatedTitle] = useState('');
    const [updatedDescription, setUpdatedDescription] = useState('');
    const [updatedDueDate, setUpdatedDueDate] = useState('');

    if (!Array.isArray(todos)) {
        return null;
    }

    const filtered = todos.filter((todo) => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        if (filter === 'overdue') return isOverdue(todo.dueDate, todo.completed);
        return true;
    });

    const visibleTodos = [...filtered].sort((a, b) => {
        if (sort === 'dueDate') {
            return compareDueDates(a, b);
        }
        return b.id - a.id;
    });

    const handleDel = (id) => {
        fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE'
        }).then((resp) => {
            resp.json().then((data) => {
                setTodos(data);
            });
        });
    }

    const handleEdit = (id) => {
        fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: updatedTitle,
                description: updatedDescription,
                dueDate: normalizeDateTimeLocal(updatedDueDate) || null,
            })
        }).then((resp) => {
            resp.json().then((data) => {
                setTodos(data);
                setEditMode(false);
                setEditId(null);
            });
        });
    }

    const handleToggleCompleted = (todo) => {
        fetch(`${API_BASE_URL}/todos/${todo.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                completed: !todo.completed
            })
        }).then((resp) => {
            resp.json().then((data) => {
                setTodos(data);
            });
        });
    }

    const startEdit = (todo) => {
        setEditMode(true);
        setEditId(todo.id);
        setUpdatedTitle(todo.title);
        setUpdatedDescription(todo.description);
        setUpdatedDueDate(todo.dueDate ?? '');
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 20, flexWrap: 'wrap' }}>
                <Button
                    variant={filter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={filter === 'active' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('active')}
                >
                    Active
                </Button>
                <Button
                    variant={filter === 'completed' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </Button>
                <Button
                    variant={filter === 'overdue' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('overdue')}
                >
                    Overdue
                </Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 12, flexWrap: 'wrap' }}>
                <Button
                    variant={sort === 'newest' ? 'contained' : 'outlined'}
                    onClick={() => setSort('newest')}
                >
                    Newest first
                </Button>
                <Button
                    variant={sort === 'dueDate' ? 'contained' : 'outlined'}
                    onClick={() => setSort('dueDate')}
                >
                    Due date soonest first
                </Button>
            </div>
            {visibleTodos.map((todo) => (
                <div key={todo.id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 20 }}>
                    <Paper
                        style={{
                            width: '30%',
                            marginLeft: '6%',
                            marginRight: 10,
                            padding: 12,
                            opacity: todo.completed ? 0.7 : 1,
                            backgroundColor: todo.completed ? '#f0f4f0' : undefined
                        }}
                    >
                        {editMode && editId === todo.id ? (
                            <>
                                <TextField
                                    label="Title"
                                    fullWidth
                                    value={updatedTitle}
                                    onChange={e => setUpdatedTitle(e.target.value)}
                                />
                                <TextField
                                    label="Description"
                                    fullWidth
                                    value={updatedDescription}
                                    onChange={e => setUpdatedDescription(e.target.value)}
                                />
                                <div style={{ paddingTop: 12 }}>
                                    <label htmlFor={`edit-due-${todo.id}`}>Due date & time</label>
                                    <input
                                        id={`edit-due-${todo.id}`}
                                        type="datetime-local"
                                        step="1"
                                        value={updatedDueDate}
                                        onChange={(e) => setUpdatedDueDate(e.target.value)}
                                        style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
                                    />
                                    <Button
                                        size="small"
                                        onClick={() => setUpdatedDueDate('')}
                                        sx={{ mt: 1 }}
                                    >
                                        Clear date & time
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            margin: 1,
                                            textDecoration: todo.completed ? 'line-through' : 'none',
                                            color: todo.completed ? 'text.secondary' : 'text.primary'
                                        }}
                                    >
                                        {todo.title}
                                    </Typography>
                                    <Checkbox
                                        checked={Boolean(todo.completed)}
                                        onChange={() => handleToggleCompleted(todo)}
                                    />
                                </div>
                                <Typography
                                    sx={{
                                        margin: 1,
                                        textDecoration: todo.completed ? 'line-through' : 'none',
                                        color: todo.completed ? 'text.secondary' : 'text.primary'
                                    }}
                                >
                                    {todo.description}
                                </Typography>
                                {todo.dueDate && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            margin: 1,
                                            color: isOverdue(todo.dueDate, todo.completed)
                                                ? 'error.main'
                                                : 'text.secondary',
                                        }}
                                    >
                                        {formatDueDate(todo.dueDate)}
                                        {isOverdue(todo.dueDate, todo.completed) && (
                                            <Chip
                                                label="Overdue"
                                                color="error"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Paper>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Button onClick={() => handleDel(todo.id)} variant="contained" color="error">Delete</Button>
                        {editMode && editId === todo.id ? (
                            <Button onClick={() => handleEdit(todo.id)} variant="contained" color="success">Save</Button>
                        ) : (
                            <Button onClick={() => startEdit(todo)} variant="contained" color="success">Edit</Button>
                        )}
                    </div >
                </div>
            ))}
        </>
    )
}

export default AddTodo;

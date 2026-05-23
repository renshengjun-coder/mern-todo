import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { API_BASE_URL } from '../config';

function AddTodo({ todos, setTodos, filter, setFilter }) {
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [updatedTitle, setUpdatedTitle] = useState('');
    const [updatedDescription, setUpdatedDescription] = useState('');

    if (!Array.isArray(todos)) {
        return null;
    }

    const visibleTodos = todos.filter((todo) => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });

    const handleDel = (id) => {
        fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE'
        }).then((resp) => {
            resp.json().then((data) => {
                console.log("Deleted data:", data); // Check the data returned by the API
                const updatedTodos = data; // Make sure data is the updated list of todos
                console.log("Updated todos:", updatedTodos); // Verify the updated todos
                setTodos(updatedTodos); // Update the todos state with the new array
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
                description: updatedDescription
            })
        }).then((resp) => {
            resp.json().then((data) => {
                console.log("Updated data:", data);
                const updatedTodos = data;
                console.log("Updated todos:", updatedTodos);
                setTodos(updatedTodos);
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

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 20 }}>
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
                            </>
                        )}
                    </Paper>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Button onClick={() => handleDel(todo.id)} variant="contained" color="error">Delete</Button>
                        {editMode && editId === todo.id ? (
                            <Button onClick={() => handleEdit(todo.id)} variant="contained" color="success">Save</Button>
                        ) : (
                            <Button onClick={() => { setEditMode(true); setEditId(todo.id); setUpdatedTitle(todo.title); setUpdatedDescription(todo.description); }} variant="contained" color="success">Edit</Button>
                        )}
                    </div >
                </div>
            ))}
        </>
    )
}

export default AddTodo;

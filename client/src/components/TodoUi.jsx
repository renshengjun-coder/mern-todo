import React, { useState } from 'react';
import { Card } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { API_BASE_URL } from '../config';
import { normalizeDateTimeLocal } from '../utils/dates.js';

function TodoUi({ darkMode, setTodos }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleTodo = () => {
        const body = { title, description };
        const normalized = normalizeDateTimeLocal(dueDate);
        if (normalized) {
            body.dueDate = normalized;
        }

        fetch(`${API_BASE_URL}/todos`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then((resp) => {
            fetch(`${API_BASE_URL}/todos`, {
                method: "GET",
            }).then((resp) => {
                resp.json().then((data) => {
                    setTodos(data);
                    setTitle('');
                    setDescription('');
                    setDueDate('');
                });
            });
        })
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 20 }}>
            <Card style={{ width: '30%' }}>
                <div style={{ padding: 16 }}>
                    <TextField
                        id="outlined-basic"
                        label="Title"
                        variant="outlined"
                        fullWidth
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: '#942fad'
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: '#942fad'
                            }
                        }}
                    />
                    <div style={{ paddingTop: 16 }} />
                    <TextField
                        id="outlined-basic"
                        label="Description"
                        variant="outlined"
                        fullWidth
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: '#942fad'
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: '#942fad'
                            }
                        }}
                    />
                    <div style={{ paddingTop: 16 }} />
                    <label htmlFor="create-due-date" style={{ display: 'block', marginBottom: 8 }}>
                        Due date & time (optional)
                    </label>
                    <input
                        id="create-due-date"
                        type="datetime-local"
                        step="1"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                    <Button variant="contained" onClick={handleTodo} sx={{
                        backgroundColor: '#942fad',
                        color: darkMode ? 'white' : 'white',
                        ":hover": {
                            backgroundColor: '#ada32f',
                            color: "black"
                        }
                    }}>Add Todo</Button>
                </div>
            </Card>
        </div>
    )
}

export default TodoUi;

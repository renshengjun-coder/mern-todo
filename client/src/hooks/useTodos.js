import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/config';
import { normalizeDateTimeLocal } from '@/utils/dates';
import { computeStats, filterTodos } from '@/utils/todoFilters';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/todos`);
      if (!resp.ok) throw new Error(`Failed to load todos (${resp.status})`);
      const data = await resp.json();
      setTodos(data);
    } catch (err) {
      setError(err.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const stats = useMemo(() => computeStats(todos), [todos]);

  const visibleTodos = useMemo(
    () => filterTodos(todos, { filter, sort, search }),
    [todos, filter, sort, search],
  );

  const createTodo = useCallback(async ({ title, description, dueDate }) => {
    const body = { title, description };
    const normalized = normalizeDateTimeLocal(dueDate);
    if (normalized) body.dueDate = normalized;

    const resp = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      throw new Error(payload.error || `Create failed (${resp.status})`);
    }
    await refetch();
  }, [refetch]);

  const updateTodo = useCallback(async (id, patch) => {
    const resp = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      throw new Error(payload.error || `Update failed (${resp.status})`);
    }
    const data = await resp.json();
    setTodos(data);
  }, []);

  const deleteTodo = useCallback(async (id) => {
    const resp = await fetch(`${API_BASE_URL}/todos/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error(`Delete failed (${resp.status})`);
    const data = await resp.json();
    setTodos(data);
  }, []);

  const toggleCompleted = useCallback(
    (todo) => updateTodo(todo.id, { completed: !todo.completed }),
    [updateTodo],
  );

  return {
    todos,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    stats,
    visibleTodos,
    refetch,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleCompleted,
  };
}

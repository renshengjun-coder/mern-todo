import { Button } from '@/components/ui/button';
import TodoCard from './TodoCard';

export default function TodoList({
  todos,
  loading,
  error,
  onRetry,
  onToggleCompleted,
  onUpdate,
  onDelete,
  onNewTodo,
  hasAnyTodos,
}) {
  if (loading) {
    return (
      <p className="py-12 text-center text-dashboard-muted dark:text-slate-400">
        Loading todos...
      </p>
    );
  }

  if (error) {
    return (
      <div className="glass-panel mt-8 rounded-2xl p-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button type="button" className="mt-4" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!hasAnyTodos) {
    return (
      <div className="glass-panel mt-8 rounded-2xl p-12 text-center">
        <p className="text-dashboard-muted dark:text-slate-400">No todos yet.</p>
        <Button type="button" className="mt-4 bg-cta-gradient text-white" onClick={onNewTodo}>
          New Todo
        </Button>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <p className="py-12 text-center text-dashboard-muted dark:text-slate-400">
        No todos match your filters.
      </p>
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-4">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoCard
            todo={todo}
            onToggleCompleted={onToggleCompleted}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

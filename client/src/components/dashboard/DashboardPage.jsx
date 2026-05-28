import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTodos } from '@/hooks/useTodos';
import DashboardHeader, { applyTheme, readStoredTheme } from './DashboardHeader';
import StatsCards from './StatsCards';
import DashboardToolbar from './DashboardToolbar';
import NewTodoDialog from './NewTodoDialog';
import TodoList from './TodoList';

export default function DashboardPage() {
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [newOpen, setNewOpen] = useState(false);
  const {
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
  } = useTodos();

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="min-h-screen bg-page-gradient dark:bg-page-gradient-dark">
      <div className="mx-auto max-w-[1024px] px-4 py-8">
        <DashboardHeader theme={theme} onToggleTheme={handleToggleTheme} />
        <Card className="glass-panel border-0 shadow-glass">
          <CardContent className="p-6">
            <StatsCards stats={stats} />
            <DashboardToolbar
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              onNewTodo={() => setNewOpen(true)}
            />
          </CardContent>
        </Card>
        <TodoList
          todos={visibleTodos}
          loading={loading}
          error={error}
          onRetry={refetch}
          onToggleCompleted={toggleCompleted}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          onNewTodo={() => setNewOpen(true)}
          hasAnyTodos={todos.length > 0}
        />
        <NewTodoDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          onCreate={createTodo}
        />
      </div>
    </div>
  );
}

import { ListTodo, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const THEME_KEY = 'theme';

export function readStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

export default function DashboardHeader({ theme, onToggleTheme }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-icon-tile shadow-glass">
          <ListTodo className="h-8 w-8 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dashboard-text dark:text-slate-100">
            My Todos
          </h1>
          <p className="text-sm text-dashboard-muted dark:text-slate-400">
            Organize your tasks beautifully
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="glass-inner shrink-0"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </header>
  );
}

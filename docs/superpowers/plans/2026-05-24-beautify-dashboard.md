# Beautify Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MUI todo client with a Figma-aligned glassmorphism dashboard using shadcn/ui, Tailwind CSS, and lucide-react while preserving all existing todo behavior (CRUD, due datetime, overdue, filters, sort, dark mode) and adding client-side search.

**Architecture:** Full client swap on branch `feature/beautify-dashboard`. Pure `filterTodos` / `computeStats` in `utils/todoFilters.js`. `useTodos` owns API sync and UI state. Presentational components under `components/dashboard/`. shadcn primitives under `components/ui/`. Thin `App.jsx` applies theme class and renders `DashboardPage`. No server or API changes.

**Tech Stack:** React 18, Vite 4, Tailwind CSS 3, shadcn/ui, lucide-react, class-variance-authority, clsx, tailwind-merge, Node built-in test runner

**Design spec:** `docs/superpowers/specs/2026-05-24-beautify-dashboard-design.md`

**PRD (reference only; spec wins on conflicts):** `products/beautify-FT.md` — Table/Recharts are **out of scope** per spec.

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/package.json` | Modify | Add Tailwind/shadcn deps; remove MUI; extend `test` script |
| `client/vite.config.js` | Modify | `@` → `src` alias |
| `client/tailwind.config.js` | Create | Tailwind + design tokens, `darkMode: 'class'` |
| `client/postcss.config.js` | Create | PostCSS pipeline |
| `client/components.json` | Create | shadcn config (via CLI) |
| `client/jsconfig.json` | Create | Path alias for editor/ESLint |
| `client/index.html` | Modify | Inter font link |
| `client/src/index.css` | Modify | Tailwind layers + shadcn CSS variables |
| `client/src/lib/utils.js` | Create | `cn()` helper |
| `client/src/components/ui/*` | Create | shadcn primitives (CLI) |
| `client/src/utils/todoFilters.js` | Create | Pure filter/sort/search + stats |
| `client/src/utils/todoFilters.test.js` | Create | Unit tests |
| `client/src/hooks/useTodos.js` | Create | Fetch, mutations, derived list |
| `client/src/components/dashboard/DashboardPage.jsx` | Create | Page layout, gradient shell |
| `client/src/components/dashboard/DashboardHeader.jsx` | Create | Title, subtitle, theme toggle |
| `client/src/components/dashboard/StatsCards.jsx` | Create | Total / Active / Completed |
| `client/src/components/dashboard/DashboardToolbar.jsx` | Create | Search, pills, sort, New Todo |
| `client/src/components/dashboard/NewTodoDialog.jsx` | Create | Create modal |
| `client/src/components/dashboard/TodoList.jsx` | Create | List + loading/error/empty |
| `client/src/components/dashboard/TodoCard.jsx` | Create | Glass card row |
| `client/src/components/dashboard/TodoEditDialog.jsx` | Create | Edit modal |
| `client/src/App.jsx` | Modify | Theme bootstrap + `DashboardPage` only |
| `client/src/main.jsx` | Modify | Import `index.css` (unchanged path) |
| `client/src/components/AppBar.jsx` | Delete | Replaced by header |
| `client/src/components/TodoUi.jsx` | Delete | Replaced by `NewTodoDialog` |
| `client/src/components/AddTodo.jsx` | Delete | Replaced by dashboard components |
| `client/src/utils/dates.js` | Unchanged | Keep existing exports |

---

## Prerequisites

Work in the isolated worktree (already created):

```bash
cd /Users/andy/work/Projects/ClientProject/mern-todo/.worktrees/beautify-dashboard
```

API server for manual QA (separate terminal):

```bash
cd server
cp ../server/.env .env 2>/dev/null || true   # only if missing; usually already copied
npm start
```

Client dev server:

```bash
cd client
npm run dev
```

Baseline before Task 1:

```bash
cd client && npm test && npm run lint && npm run build
```

Expected: 13 passing date tests; lint/build succeed on MUI baseline.

---

### Task 1: Tailwind, PostCSS, Vite alias, Inter font

**Files:**
- Modify: `client/package.json`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Modify: `client/vite.config.js`
- Modify: `client/index.html`

- [ ] **Step 1: Install dependencies**

```bash
cd client
npm install tailwindcss postcss autoprefixer class-variance-authority clsx tailwind-merge lucide-react @fontsource/inter
npm install -D tailwindcss-animate
```

- [ ] **Step 2: Create `client/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        glass: '24px',
        glassInner: '16px',
        pill: '10px',
        control: '14px',
      },
      colors: {
        dashboard: {
          text: '#1e2939',
          muted: '#4a5565',
          placeholder: '#99a1af',
          statTotal: '#155dfc',
          statActive: '#f54900',
          statCompleted: '#00a63e',
        },
      },
      backgroundImage: {
        'page-gradient':
          'linear-gradient(153.94deg, #dbeafe 0%, #faf5ff 50%, #fce7f3 100%)',
        'page-gradient-dark':
          'linear-gradient(153.94deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%)',
        'cta-gradient': 'linear-gradient(90deg, #2b7fff 0%, #ad46ff 100%)',
        'icon-tile': 'linear-gradient(135deg, #2b7fff 0%, #ad46ff 100%)',
      },
      boxShadow: {
        glass: '0 25px 50px rgba(0, 0, 0, 0.25)',
        pillActive: '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

- [ ] **Step 3: Create `client/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Update `client/vite.config.js`**

```javascript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 5: Add Inter to `client/index.html` inside `<head>`**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 6: Verify Tailwind compiles (temporary smoke)**

Add to top of `client/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Run: `cd client && npm run build`  
Expected: build succeeds (MUI still present).

- [ ] **Step 7: Commit**

```bash
git add client/package.json client/package-lock.json client/tailwind.config.js client/postcss.config.js client/vite.config.js client/index.html client/src/index.css
git commit -m "chore(client): add Tailwind, PostCSS, and Vite path alias"
```

---

### Task 2: shadcn/ui init and `cn()` helper

**Files:**
- Create: `client/components.json`
- Create: `client/jsconfig.json`
- Create: `client/src/lib/utils.js`
- Modify: `client/src/index.css` (full shadcn theme — replaces smoke-only directives from Task 1)

- [ ] **Step 1: Initialize shadcn (non-interactive)**

```bash
cd client
npx shadcn@latest init --defaults --force --src-dir --css-variables
```

If CLI prompts fail, create `client/components.json` manually:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 2: Create `client/jsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `client/src/lib/utils.js`**

```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Replace `client/src/index.css` with shadcn base + dashboard utilities**

Use the file generated by `shadcn init` if present; ensure it includes at minimum:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}

@layer components {
  .glass-panel {
    @apply rounded-glass border border-white/50 bg-white/40 shadow-glass backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60;
  }

  .glass-inner {
    @apply rounded-glassInner border border-white/50 bg-white/50 dark:border-white/10 dark:bg-slate-900/50;
  }

  .filter-pill-active {
    @apply bg-white shadow-pillActive dark:bg-slate-800;
  }
}
```

Run: `cd client && npm run build` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/components.json client/jsconfig.json client/src/lib/utils.js client/src/index.css
git commit -m "chore(client): initialize shadcn/ui and cn helper"
```

---

### Task 3: Add shadcn UI primitives

**Files:**
- Create: `client/src/components/ui/button.jsx` (and siblings via CLI)

- [ ] **Step 1: Add components**

```bash
cd client
npx shadcn@latest add button card badge dialog input textarea select alert-dialog label -y
```

Expected files under `client/src/components/ui/`.

- [ ] **Step 2: Verify build**

```bash
cd client && npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui client/package.json client/package-lock.json
git commit -m "chore(client): add shadcn ui primitives"
```

---

### Task 4: `todoFilters` pure helpers (TDD)

**Files:**
- Create: `client/src/utils/todoFilters.test.js`
- Create: `client/src/utils/todoFilters.js`
- Modify: `client/package.json` (`test` script)

- [ ] **Step 1: Update `client/package.json` test script**

```json
"test": "node --test src/utils/dates.test.js src/utils/todoFilters.test.js"
```

- [ ] **Step 2: Write failing tests — `client/src/utils/todoFilters.test.js`**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterTodos, computeStats } from './todoFilters.js';
import { setNowForTests } from './dates.js';

const sample = [
  { id: 1, title: 'Alpha', description: 'first', completed: false, dueDate: '2026-05-20T10:00:00' },
  { id: 2, title: 'Beta', description: 'second', completed: true, dueDate: null },
  { id: 3, title: 'Gamma', description: 'third task', completed: false, dueDate: '2026-06-01T10:00:00' },
];

describe('computeStats', () => {
  it('returns total, active, completed counts', () => {
    assert.deepEqual(computeStats(sample), { total: 3, active: 2, completed: 1 });
  });
});

describe('filterTodos', () => {
  it('filter active excludes completed', () => {
    const result = filterTodos(sample, { filter: 'active', sort: 'newest', search: '' });
    assert.equal(result.length, 2);
    assert.ok(result.every((t) => !t.completed));
  });

  it('filter completed excludes active', () => {
    const result = filterTodos(sample, { filter: 'completed', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [2]);
  });

  it('filter overdue uses isOverdue', () => {
    setNowForTests('2026-05-25T12:00:00');
    const result = filterTodos(sample, { filter: 'overdue', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [1]);
    setNowForTests(null);
  });

  it('search matches title or description case-insensitively', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'newest', search: 'THIRD' });
    assert.deepEqual(result.map((t) => t.id), [3]);
  });

  it('sort newest orders by id descending', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'newest', search: '' });
    assert.deepEqual(result.map((t) => t.id), [3, 2, 1]);
  });

  it('sort dueDate uses compareDueDates (nulls last)', () => {
    const result = filterTodos(sample, { filter: 'all', sort: 'dueDate', search: '' });
    assert.deepEqual(result.map((t) => t.id), [1, 3, 2]);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd client && npm test
```

Expected: `Cannot find module './todoFilters.js'` or export errors.

- [ ] **Step 4: Implement `client/src/utils/todoFilters.js`**

```javascript
import { compareDueDates, isOverdue } from './dates.js';

export function computeStats(todos) {
  return {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };
}

export function filterTodos(todos, { filter, sort, search }) {
  const q = (search || '').trim().toLowerCase();

  let list = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    if (filter === 'overdue') return isOverdue(todo.dueDate, todo.completed);
    return true;
  });

  if (q) {
    list = list.filter(
      (todo) =>
        todo.title.toLowerCase().includes(q) ||
        (todo.description || '').toLowerCase().includes(q),
    );
  }

  return [...list].sort((a, b) => {
    if (sort === 'dueDate') {
      return compareDueDates(a, b);
    }
    return b.id - a.id;
  });
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd client && npm test
```

Expected: all dates + todoFilters tests pass.

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/src/utils/todoFilters.js client/src/utils/todoFilters.test.js
git commit -m "feat(client): add pure todo filter, sort, search helpers"
```

---

### Task 5: `useTodos` hook

**Files:**
- Create: `client/src/hooks/useTodos.js`

- [ ] **Step 1: Create `client/src/hooks/useTodos.js`**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useTodos.js
git commit -m "feat(client): add useTodos hook for API and list state"
```

---

### Task 6: `DashboardHeader` + theme persistence

**Files:**
- Create: `client/src/components/dashboard/DashboardHeader.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/DashboardHeader.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/DashboardHeader.jsx
git commit -m "feat(client): add dashboard header with theme toggle"
```

---

### Task 7: `StatsCards`

**Files:**
- Create: `client/src/components/dashboard/StatsCards.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/StatsCards.jsx`**

```jsx
import { Card, CardContent } from '@/components/ui/card';

const items = [
  { key: 'total', label: 'Total', color: 'text-dashboard-statTotal' },
  { key: 'active', label: 'Active', color: 'text-dashboard-statActive' },
  { key: 'completed', label: 'Completed', color: 'text-dashboard-statCompleted' },
];

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map(({ key, label, color }) => (
        <Card key={key} className="glass-inner border-0 shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-dashboard-muted dark:text-slate-400">{label}</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>
              {stats[key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/StatsCards.jsx
git commit -m "feat(client): add dashboard stats cards"
```

---

### Task 8: `DashboardToolbar`

**Files:**
- Create: `client/src/components/dashboard/DashboardToolbar.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/DashboardToolbar.jsx`**

```jsx
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'overdue', label: 'Overdue' },
];

export default function DashboardToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onNewTodo,
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-placeholder" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search todos..."
          className="h-11 rounded-control border-white/50 bg-white/60 pl-10 dark:border-white/10 dark:bg-slate-900/40"
          aria-label="Search todos"
        />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-control bg-white/30 p-1 dark:bg-slate-900/30">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(value)}
              className={cn(
                'rounded-pill px-3 py-2 text-sm font-medium transition-colors',
                filter === value
                  ? 'filter-pill-active text-dashboard-text dark:text-slate-100'
                  : 'text-dashboard-muted hover:text-dashboard-text dark:text-slate-400',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[220px] rounded-control glass-inner border-0">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="dueDate">Due date soonest first</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={onNewTodo}
            className="rounded-control bg-cta-gradient text-white hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Todo
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/DashboardToolbar.jsx
git commit -m "feat(client): add dashboard toolbar with search and filters"
```

---

### Task 9: `NewTodoDialog`

**Files:**
- Create: `client/src/components/dashboard/NewTodoDialog.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/NewTodoDialog.jsx`**

```jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewTodoDialog({ open, onOpenChange, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ title, description, dueDate });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="glass-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-description">Description</Label>
            <Textarea
              id="new-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-due">Due date &amp; time (optional)</Label>
            <input
              id="new-due"
              type="datetime-local"
              step="1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-cta-gradient text-white">
              {submitting ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/NewTodoDialog.jsx
git commit -m "feat(client): add new todo dialog"
```

---

### Task 10: `TodoEditDialog`, delete confirm, and `TodoCard`

**Files:**
- Create: `client/src/components/dashboard/TodoEditDialog.jsx`
- Create: `client/src/components/dashboard/TodoCard.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/TodoEditDialog.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { normalizeDateTimeLocal } from '@/utils/dates';

export default function TodoEditDialog({ todo, open, onOpenChange, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!todo) return;
    setTitle(todo.title);
    setDescription(todo.description || '');
    setDueDate(todo.dueDate ?? '');
    setError(null);
  }, [todo]);

  if (!todo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave(todo.id, {
        title,
        description,
        dueDate: normalizeDateTimeLocal(dueDate) || null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-due">Due date &amp; time</Label>
            <input
              id="edit-due"
              type="datetime-local"
              step="1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setDueDate('')}>
              Clear date &amp; time
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `client/src/components/dashboard/TodoCard.jsx`**

```jsx
import { useState } from 'react';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDueDate, isOverdue } from '@/utils/dates';
import TodoEditDialog from './TodoEditDialog';

export default function TodoCard({ todo, onToggleCompleted, onUpdate, onDelete }) {
  const [editOpen, setEditOpen] = useState(false);
  const overdue = isOverdue(todo.dueDate, todo.completed);

  return (
    <>
      <Card
        className={cn(
          'glass-panel rounded-2xl border-0',
          todo.completed && 'opacity-70',
        )}
      >
        <CardContent className="flex gap-4 p-5">
          <button
            type="button"
            onClick={() => onToggleCompleted(todo)}
            aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
            className={cn(
              'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
              todo.completed
                ? 'border-dashboard-statCompleted bg-dashboard-statCompleted'
                : 'border-[#d1d5dc]',
            )}
          >
            {todo.completed && <span className="h-2 w-2 rounded-full bg-white" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                className={cn(
                  'text-lg font-medium text-dashboard-text dark:text-slate-100',
                  todo.completed && 'line-through text-dashboard-muted',
                )}
              >
                {todo.title}
              </h3>
              {overdue && (
                <Badge variant="destructive" className="shrink-0">
                  Overdue
                </Badge>
              )}
            </div>
            {todo.description && (
              <p
                className={cn(
                  'mt-1 text-sm text-dashboard-muted dark:text-slate-400',
                  todo.completed && 'line-through',
                )}
              >
                {todo.description}
              </p>
            )}
            {todo.dueDate && (
              <p
                className={cn(
                  'mt-3 flex items-center gap-2 text-sm',
                  overdue ? 'text-destructive' : 'text-dashboard-muted dark:text-slate-400',
                )}
              >
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                {formatDueDate(todo.dueDate)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="glass-inner"
              onClick={() => setEditOpen(true)}
              aria-label="Edit todo"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="glass-inner text-destructive"
                  aria-label="Delete todo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this todo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(todo.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      <TodoEditDialog
        todo={todo}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onUpdate}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/dashboard/TodoEditDialog.jsx client/src/components/dashboard/TodoCard.jsx
git commit -m "feat(client): add todo card with edit and delete confirmation"
```

---

### Task 11: `TodoList` loading / error / empty states

**Files:**
- Create: `client/src/components/dashboard/TodoList.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/TodoList.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/TodoList.jsx
git commit -m "feat(client): add todo list with loading and empty states"
```

---

### Task 12: `DashboardPage` composition

**Files:**
- Create: `client/src/components/dashboard/DashboardPage.jsx`

- [ ] **Step 1: Create `client/src/components/dashboard/DashboardPage.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/dashboard/DashboardPage.jsx
git commit -m "feat(client): compose dashboard page"
```

---

### Task 13: Wire `App.jsx` and theme bootstrap

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/main.jsx` (optional: call `applyTheme` before render)

- [ ] **Step 1: Replace `client/src/App.jsx`**

```jsx
import { useEffect } from 'react';
import DashboardPage from './components/dashboard/DashboardPage';
import { applyTheme, readStoredTheme } from './components/dashboard/DashboardHeader';

export default function App() {
  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  return <DashboardPage />;
}
```

- [ ] **Step 2: Manual smoke — dev server**

```bash
cd client && npm run dev
```

With API running, verify: load list, create via New Todo, edit, delete confirm, toggle complete, filters (including **Done** label), sort, search, overdue badge, dark mode toggle persists after refresh.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(client): wire dashboard as root app"
```

---

### Task 14: Remove MUI and legacy components

**Files:**
- Delete: `client/src/components/AppBar.jsx`, `TodoUi.jsx`, `AddTodo.jsx`
- Modify: `client/package.json` (remove MUI deps)

- [ ] **Step 1: Uninstall MUI**

```bash
cd client
npm uninstall @mui/material @emotion/react @emotion/styled
```

- [ ] **Step 2: Delete legacy components**

```bash
rm client/src/components/AppBar.jsx client/src/components/TodoUi.jsx client/src/components/AddTodo.jsx
```

- [ ] **Step 3: Grep for stray MUI imports**

```bash
cd client && rg "@mui" src || true
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add -A client
git commit -m "chore(client): remove MUI and legacy todo components"
```

---

### Task 15: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run client tests**

```bash
cd client && npm test
```

Expected: dates + todoFilters tests pass (≥ 19 tests).

- [ ] **Step 2: Lint**

```bash
cd client && npm run lint
```

Fix any `react/prop-types` or unused import issues; shadcn files may need `eslint-disable` only if absolutely required — prefer fixing imports.

- [ ] **Step 3: Production build**

```bash
cd client && npm run build
```

Expected: `dist/` created with no errors.

- [ ] **Step 4: Server regression (unchanged API)**

```bash
cd server && npm test
```

Expected: 24/24 pass (client-only feature; confirms no accidental server edits).

- [ ] **Step 5: Commit any lint fixes**

```bash
git add -A && git commit -m "chore(client): fix lint after dashboard migration"
```

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
|------------------|------|
| shadcn Card, Button, Badge | 3, 7, 8, 10, 12 |
| lucide icons | 6, 8, 10 |
| `components/dashboard/*` layout | 6–12 |
| Thin `App.jsx` | 13 |
| `useTodos` + API contract | 5 |
| `filterTodos` + search | 4 |
| Modals create/edit | 9, 10 |
| Delete AlertDialog | 10 |
| Dark mode `class` + localStorage | 6, 13 |
| Glass tokens / gradient page | 1, 2, 12 |
| Filter label Done, key `completed` | 8 |
| Preserve dates.js behavior | 4 (imports), unchanged file |
| Loading / error / empty states | 11 |
| Responsive toolbar/stats | 7, 8, 12 (Tailwind breakpoints) |
| No server changes | (no server tasks) |
| Out of scope: Table, Recharts | omitted |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-24-beautify-dashboard.md` (in worktree `feature/beautify-dashboard`).

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task with review between tasks (`superpowers:subagent-driven-development`).

2. **Inline Execution** — run tasks in this session with checkpoints (`superpowers:executing-plans`).

Which approach do you want?

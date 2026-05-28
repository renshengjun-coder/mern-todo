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

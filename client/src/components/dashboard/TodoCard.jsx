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

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

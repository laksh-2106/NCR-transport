type StatusBadgeProps = {
  status: string;
  type?: 'default' | 'severity';
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  maintenance: 'bg-amber-100 text-amber-700',
  retired: 'bg-red-100 text-red-600',
  scheduled: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-cyan-100 text-cyan-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
  delayed: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  reported: 'bg-orange-100 text-orange-700',
  'under-investigation': 'bg-blue-100 text-blue-700',
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  on_leave: 'bg-sky-100 text-sky-700',
  suspended: 'bg-red-100 text-red-600',
  routine: 'bg-blue-100 text-blue-700',
  breakdown: 'bg-red-100 text-red-600',
  accident: 'bg-orange-100 text-orange-700',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status.toLowerCase().replace(' ', '-')] ?? 'bg-slate-100 text-slate-600';
  const label = status.replace(/_/g, ' ').replace(/-/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

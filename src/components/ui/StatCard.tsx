import { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'cyan' | 'slate';
  trend?: { value: number; label: string };
};

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', text: 'text-blue-600', trend: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-600', trend: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600', trend: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-600', text: 'text-red-600', trend: 'text-red-600' },
  cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-600', text: 'text-cyan-600', trend: 'text-cyan-600' },
  slate: { bg: 'bg-slate-50', icon: 'bg-slate-600', text: 'text-slate-600', trend: 'text-slate-600' },
};

export default function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${c.trend}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          <div className={`${c.text}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

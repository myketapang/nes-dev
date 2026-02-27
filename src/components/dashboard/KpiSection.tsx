import { useMemo } from 'react';
import { MaintenanceTicket } from '@/types/maintenance';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface KpiSectionProps {
  data: MaintenanceTicket[];
}

export function KpiSection({ data }: KpiSectionProps) {
  const kpis = useMemo(() => {
    const total = data.length;
    const open = data.filter(d => d.status === 'Open').length;
    const closed = data.filter(d => d.status === 'Closed').length;
    const inProgress = data.filter(d => d.status === 'In Progress').length;

    return [
      { label: 'Total Tickets', value: total, icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Open', value: open, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
      { label: 'In Progress', value: inProgress, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
      { label: 'Closed', value: closed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <div key={kpi.label} className="kpi-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
          </div>
          <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

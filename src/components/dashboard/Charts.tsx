import { useMemo } from 'react';
import { MaintenanceTicket } from '@/types/maintenance';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
  'hsl(172, 66%, 50%)',
];

function countBy(data: MaintenanceTicket[], key: keyof MaintenanceTicket) {
  const counts: Record<string, number> = {};
  data.forEach(d => {
    const val = String(d[key] ?? 'Unknown');
    counts[val] = (counts[val] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

interface ChartProps {
  data: MaintenanceTicket[];
  onDrillDown?: (key: string, value: string) => void;
}

export function StatusChart({ data, onDrillDown }: ChartProps) {
  const chartData = useMemo(() => countBy(data, 'status'), [data]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            onClick={d => onDrillDown?.('status', d.name)}
            className="cursor-pointer"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityChart({ data, onDrillDown }: ChartProps) {
  const chartData = useMemo(() => countBy(data, 'priority'), [data]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Priority Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            onClick={d => onDrillDown?.('priority', d.name)}
            className="cursor-pointer"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TypeChart({ data, onDrillDown }: ChartProps) {
  const chartData = useMemo(() => countBy(data, 'maintenance_type').slice(0, 8), [data]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Maintenance Types</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar
            dataKey="value"
            fill={COLORS[0]}
            onClick={d => onDrillDown?.('type', d.name)}
            className="cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeSeriesChart({ data }: ChartProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      if (d.registered_month) {
        counts[d.registered_month] = (counts[d.registered_month] ?? 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  }, [data]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Tickets Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ left: 4, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PhaseChart({ data, onDrillDown }: ChartProps) {
  const chartData = useMemo(() => countBy(data, 'phase'), [data]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Phase Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ left: 4, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar
            dataKey="value"
            fill={COLORS[1]}
            onClick={d => onDrillDown?.('phase', d.name)}
            className="cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

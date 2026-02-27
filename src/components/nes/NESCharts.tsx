import { useMemo } from 'react';
import { NESRecord } from '@/types/nes';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  LineChart, Line, AreaChart, Area,
} from 'recharts';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
  'hsl(172, 66%, 50%)',
  'hsl(310, 70%, 55%)',
  'hsl(50, 85%, 50%)',
];

interface ChartProps {
  data: NESRecord[];
}

// ─── Overview Dashboard ───────────────────────────────────────────────────────
export function OverviewDashboard({ data }: ChartProps) {
  const monthlyData = useMemo(() => {
    const counts: Record<string, { participants: number; events: Set<string> }> = {};
    data.forEach(d => {
      const key = d.event_month_name || 'Unknown';
      if (!counts[key]) counts[key] = { participants: 0, events: new Set() };
      counts[key].participants++;
      if (d.event_id) counts[key].events.add(String(d.event_id));
    });
    return Object.entries(counts)
      .map(([month, v]) => ({ month, participants: v.participants, events: v.events.size }))
      .slice(0, 12);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Participants by Month</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Area type="monotone" dataKey="participants" stroke={COLORS[0]} fill={`${COLORS[0]}33`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Events by Month</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="events" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── State Performance Chart ──────────────────────────────────────────────────
export function StatePerformanceChart({ data }: ChartProps) {
  const stateData = useMemo(() => {
    const map: Record<string, { participants: number; events: Set<string> }> = {};
    data.forEach(d => {
      const state = d.state_name || 'Unknown';
      if (!map[state]) map[state] = { participants: 0, events: new Set() };
      map[state].participants++;
      if (d.event_id) map[state].events.add(String(d.event_id));
    });
    return Object.entries(map)
      .map(([state, v]) => ({ state: state.slice(0, 12), participants: v.participants, events: v.events.size }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 10);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={stateData} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="state" tick={{ fontSize: 10 }} width={90} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Legend />
        <Bar dataKey="participants" fill={COLORS[0]} name="Participants" />
        <Bar dataKey="events" fill={COLORS[1]} name="Events" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Program Category Radar ───────────────────────────────────────────────────
export function ProgramCategoryRadar({ data }: ChartProps) {
  const radarData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      const cat = d.category_name || 'Uncategorized';
      map[cat] = (map[cat] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([subject, A]) => ({ subject: subject.slice(0, 16), A }));
  }, [data]);

  if (radarData.length < 3) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Insufficient category data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis tick={{ fontSize: 9 }} />
        <Radar name="Records" dataKey="A" stroke={COLORS[0]} fill={`${COLORS[0]}33`} strokeWidth={2} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Demographics Dashboard ───────────────────────────────────────────────────
export function DemographicsDashboard({ data }: ChartProps) {
  const ageData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      const ag = d.age_group || 'Unknown';
      map[ag] = (map[ag] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const genderData = useMemo(() => {
    let male = 0, female = 0;
    data.forEach(d => {
      male += d.male_count ?? 0;
      female += d.female_count ?? 0;
    });
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ].filter(d => d.value > 0);
  }, [data]);

  const timeData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      const t = d.time_of_day || 'Unknown';
      map[t] = (map[t] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Age Groups</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Gender Distribution</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
              {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Time of Day</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={timeData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
              {timeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Performance Scatter Chart ────────────────────────────────────────────────
export function PerformanceScatterChart({ data }: ChartProps) {
  const scatterData = useMemo(() =>
    data
      .filter(d => d.attendance_rate_percent > 0 && d.target_achievement_percent > 0)
      .slice(0, 200)
      .map(d => ({
        x: Math.min(100, d.attendance_rate_percent ?? 0),
        y: Math.min(200, d.target_achievement_percent ?? 0),
        z: d.event_total_participants ?? 1,
      })),
  [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="x" name="Attendance %" unit="%" tick={{ fontSize: 10 }} />
        <YAxis dataKey="y" name="Target %" unit="%" tick={{ fontSize: 10 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Scatter name="Events" data={scatterData} fill={COLORS[0]} opacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── Top SSO Chart ────────────────────────────────────────────────────────────
export function TopSSOChart({ data }: ChartProps) {
  const ssoData = useMemo(() => {
    const map: Record<string, { participants: number; events: Set<string> }> = {};
    data.forEach(d => {
      const sso = d.sso_name || 'Unknown';
      if (!map[sso]) map[sso] = { participants: 0, events: new Set() };
      map[sso].participants++;
      if (d.event_id) map[sso].events.add(String(d.event_id));
    });
    return Object.entries(map)
      .map(([sso, v]) => ({ sso: sso.slice(0, 20), participants: v.participants, events: v.events.size }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 8);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={ssoData} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="sso" tick={{ fontSize: 9 }} width={110} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Bar dataKey="participants" fill={COLORS[0]} name="Participants" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Participant Overview Chart ───────────────────────────────────────────────
export function ParticipantOverviewChart({ data }: ChartProps) {
  const chartData = useMemo(() => {
    const map: Record<string, { members: Set<string | number>; participants: number }> = {};
    data.forEach(d => {
      const month = d.event_month_name || String(d.event_month) || 'Unknown';
      if (!map[month]) map[month] = { members: new Set(), participants: 0 };
      map[month].participants++;
      if (d.member_id) map[month].members.add(d.member_id);
    });
    return Object.entries(map).slice(0, 12).map(([month, v]) => ({
      month,
      participants: v.participants,
      members: v.members.size,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Legend />
        <Line type="monotone" dataKey="participants" stroke={COLORS[0]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="members" stroke={COLORS[1]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Program List Table ───────────────────────────────────────────────────────
export function ProgramListTable({ data }: ChartProps) {
  const programs = useMemo(() => {
    const map: Record<string, { participants: number; events: Set<string>; attendance: number[] }> = {};
    data.forEach(d => {
      const name = d.program_name || d.category_name || 'Unknown';
      if (!map[name]) map[name] = { participants: 0, events: new Set(), attendance: [] };
      map[name].participants++;
      if (d.event_id) map[name].events.add(String(d.event_id));
      if (d.attendance_rate_percent) map[name].attendance.push(d.attendance_rate_percent);
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        participants: v.participants,
        events: v.events.size,
        avgAttendance: v.attendance.length
          ? v.attendance.reduce((a, b) => a + b, 0) / v.attendance.length
          : 0,
      }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 20);
  }, [data]);

  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th className="text-left p-2 font-semibold text-xs text-muted-foreground uppercase">Program</th>
            <th className="text-right p-2 font-semibold text-xs text-muted-foreground uppercase">Participants</th>
            <th className="text-right p-2 font-semibold text-xs text-muted-foreground uppercase">Events</th>
            <th className="text-right p-2 font-semibold text-xs text-muted-foreground uppercase">Avg Attendance</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p, i) => (
            <tr key={p.name} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
              <td className="p-2 max-w-[200px] truncate">{p.name}</td>
              <td className="p-2 text-right">{p.participants.toLocaleString()}</td>
              <td className="p-2 text-right">{p.events.toLocaleString()}</td>
              <td className="p-2 text-right">{p.avgAttendance.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

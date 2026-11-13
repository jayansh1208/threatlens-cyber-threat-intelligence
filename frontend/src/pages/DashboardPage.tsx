import { Activity, ShieldAlert, Shield, Bug, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MetricCard from '../components/MetricCard';
import { fetchAnalytics, fetchDashboardStats } from '../services/api';

const chartColors = ['#22d3ee', '#38bdf8', '#60a5fa', '#a78bfa', '#f59e0b', '#f87171'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({ categories: [], severity: [], timeline: [], top_sources: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchAnalytics()])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading dashboard metrics...</div>;
  }

  const categoryData = (analytics.categories || []).map((entry: any) => ({ name: entry._id, value: entry.count }));
  const severityData = (analytics.severity || []).map((entry: any) => ({ name: entry._id, value: entry.count }));
  const timelineData = (analytics.timeline || []).map((entry: any) => ({ name: entry._id, count: entry.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">ThreatLens</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Security operations dashboard</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total threat reports" value={stats.total_reports ?? 0} icon={<Activity className="text-cyan-400" size={16} />} />
        <MetricCard title="Critical" value={stats.critical_reports ?? 0} icon={<AlertCircle className="text-red-400" size={16} />} />
        <MetricCard title="High severity" value={stats.high_severity_reports ?? 0} icon={<ShieldAlert className="text-orange-400" size={16} />} />
        <MetricCard title="Malware" value={stats.malware_reports ?? 0} icon={<Bug className="text-amber-400" size={16} />} />
        <MetricCard title="Phishing" value={stats.phishing_reports ?? 0} icon={<Shield className="text-emerald-400" size={16} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Threat distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie dataKey="value" data={categoryData} innerRadius={52} outerRadius={92} paddingAngle={3}>
                {categoryData.map((entry: any, index: number) => (
                  <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Severity distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Reports over time</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Top threat sources</h2>
          <div className="space-y-3">
            {(analytics.top_sources || []).slice(0, 5).map((source: any, index: number) => (
              <div key={`${source._id}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                <span className="text-sm text-slate-200">Source {source._id}</span>
                <span className="font-medium text-cyan-400">{source.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

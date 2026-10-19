import React from 'react';
import { Users, FileText, Activity, ShieldAlert, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card, { CardContent } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : v ?? '—');

export default function AdminOverview() {
  const { data, loading, error, reload } = useApi('/admin/analytics');

  const stats = [
    { title: 'Total Users', value: fmt(data?.total_users), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Pending Verifications', value: fmt(data?.pending_verifications), icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'AI Queries (24h)', value: fmt(data?.queries_24h), icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Active Lawyers', value: fmt(data?.active_lawyers), icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  const chartData = Array.isArray(data?.query_volume) ? data.query_volume : [];
  const recent = Array.isArray(data?.recent_activity) ? data.recent_activity : [];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">Admin Overview</h1>
          <p className="text-zinc-400 mt-1">System metrics and platform health.</p>
        </div>

        {loading ? (
          <LoadingState label="Loading analytics..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <EmptyState icon={BarChart3} title="No analytics yet" description="Platform metrics will appear here once there is activity." />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-zinc-50">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-zinc-50 mb-6">AI Query Volume (7 Days)</h3>
                {chartData.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-24">No query data yet</p>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                        <Line type="monotone" dataKey="queries" name="Total Queries" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-zinc-50 mb-6">Recent Activity</h3>
                <div className="space-y-4 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-2">
                  {recent.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
                  ) : (
                    recent.slice(0, 8).map((log, i) => (
                      <div key={log.id ?? i} className="flex items-start gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-zinc-300">
                            <span className="font-semibold text-zinc-50">{log.actor}</span> {log.action}{' '}
                            <span className="text-blue-400">{log.target}</span>
                          </p>
                          {log.timestamp && (
                            <p className="text-xs text-zinc-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Users, FileText, Activity, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card, { CardContent } from '../../components/ui/Card';

export default function AdminOverview() {
  const stats = [
    { title: 'Total Users', value: '4,291', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Pending Verifications', value: '18', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'AI Queries (24h)', value: '1,842', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Active Lawyers', value: '342', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  const chartData = [
    { name: 'Mon', queries: 4000, rag: 2400 },
    { name: 'Tue', queries: 3000, rag: 1398 },
    { name: 'Wed', queries: 2000, rag: 9800 },
    { name: 'Thu', queries: 2780, rag: 3908 },
    { name: 'Fri', queries: 1890, rag: 4800 },
    { name: 'Sat', queries: 2390, rag: 3800 },
    { name: 'Sun', queries: 3490, rag: 4300 },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">Admin Overview</h1>
          <p className="text-zinc-400 mt-1">System metrics and platform health.</p>
        </div>

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

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-6">AI Query Volume (7 Days)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Line type="monotone" dataKey="queries" name="Total Queries" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rag" name="RAG Queries" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 justify-center mt-4 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-zinc-400">Total Queries</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-zinc-400">RAG (Pro)</span></div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-6">System Health</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Vector Database Load</span>
                  <span className="text-zinc-50 font-medium">42%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-[42%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">LLM API Latency (Avg)</span>
                  <span className="text-amber-400 font-medium">850ms</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-[65%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">PostgreSQL Storage</span>
                  <span className="text-zinc-50 font-medium">18GB / 50GB</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-[36%]"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

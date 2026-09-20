import React, { useState } from 'react';
import { Building2, Users, Calendar, TrendingUp, Wallet, CheckCircle2, ShieldCheck, Clock, Plus, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data
const INITIAL_TEAM = [
  { id: 1, name: 'Adv. Karim Uddin', barId: 'BC-2015-2210', specialty: 'Corporate', status: 'verified' },
  { id: 2, name: 'Adv. Sultana Begum', barId: 'BC-2017-3384', specialty: 'Family', status: 'verified' },
  { id: 3, name: 'Adv. Tanvir Ahmed', barId: 'BC-2020-5567', specialty: 'Property', status: 'pending' },
  { id: 4, name: 'Adv. Farhana Haque', barId: 'BC-2016-2891', specialty: 'Labour', status: 'verified' },
];

const MOCK_BOOKINGS = [
  { id: 1, client: 'Mehedi Hasan', lawyer: 'Adv. Karim Uddin', date: 'Sep 22, 2026 10:00', status: 'confirmed' },
  { id: 2, client: 'Rina Akter', lawyer: 'Adv. Sultana Begum', date: 'Sep 22, 2026 14:30', status: 'confirmed' },
  { id: 3, client: 'Jamil Chowdhury', lawyer: 'Adv. Tanvir Ahmed', date: 'Sep 23, 2026 11:00', status: 'pending' },
  { id: 4, client: 'Shefali Das', lawyer: 'Adv. Farhana Haque', date: 'Sep 20, 2026 16:00', status: 'completed' },
  { id: 5, client: 'Arif Khan', lawyer: 'Adv. Karim Uddin', date: 'Sep 19, 2026 12:00', status: 'completed' },
  { id: 6, client: 'Nila Paul', lawyer: 'Adv. Sultana Begum', date: 'Sep 24, 2026 09:30', status: 'confirmed' },
];

const ANALYTICS_DATA = [
  { week: 'W1', bookings: 22, revenue: 96 },
  { week: 'W2', bookings: 28, revenue: 120 },
  { week: 'W3', bookings: 31, revenue: 138 },
  { week: 'W4', bookings: 26, revenue: 129 },
  { week: 'W5', bookings: 34, revenue: 164 },
  { week: 'W6', bookings: 30, revenue: 184 },
];

export default function FirmDashboard() {
  const [activeTab, setActiveTab] = useState('team');
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    setTimeout(() => {
      setTeam([...team, {
        id: Date.now(),
        name: inviteEmail,
        barId: '—',
        specialty: '—',
        status: 'invited'
      }]);
      setInviteEmail('');
      setIsInviting(false);
    }, 1000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-xs font-medium border border-emerald-500/20"><ShieldCheck className="h-3 w-3" /> Verified</span>;
      case 'pending': return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md text-xs font-medium border border-amber-500/20"><Clock className="h-3 w-3" /> Pending</span>;
      case 'invited': return <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 px-2 py-1 rounded-md text-xs font-medium border border-violet-500/20"><CheckCircle2 className="h-3 w-3" /> Invited</span>;
      case 'confirmed': return <span className="inline-flex items-center bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-medium border border-blue-500/20">Confirmed</span>;
      case 'completed': return <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-xs font-medium border border-emerald-500/20">Completed</span>;
      default: return null;
    }
  };

  // Custom Tooltip component for Recharts to enforce dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-400 text-sm mb-1 font-medium">{label}</p>
          <p className="text-zinc-50 font-bold" style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="shrink-0 h-20 w-20 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-violet-500" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50">Rahman & Associates</h1>
              <span className="inline-flex bg-violet-600/20 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                Firm Account
              </span>
            </div>
            <div className="text-sm text-zinc-400 font-medium">
              Reg-2018-1122 &middot; Dhaka &middot; Est. 2018
            </div>
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active lawyers</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">12</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Bookings this month</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">34</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Completion rate</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">96%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Wallet className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">৳1,84,500</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-800 mb-6 overflow-x-auto scrollbar-none">
          {['team', 'bookings', 'analytics'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium whitespace-nowrap capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-violet-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'team' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Bar ID</th>
                        <th className="px-6 py-4 font-medium">Specialty</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {team.map(member => (
                        <tr key={member.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-50">{member.name}</td>
                          <td className="px-6 py-4 text-zinc-400 font-mono">{member.barId}</td>
                          <td className="px-6 py-4 text-zinc-400">{member.specialty}</td>
                          <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-zinc-400 hover:text-zinc-50 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors">
                              View profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invite Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-zinc-50 mb-4">Add to Firm</h3>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input 
                    type="email" 
                    placeholder="Lawyer's email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                  <button 
                    onClick={handleInvite}
                    disabled={!inviteEmail || isInviting}
                    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Invite Lawyer</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Client</th>
                        <th className="px-6 py-4 font-medium">Lawyer</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {MOCK_BOOKINGS.map(booking => (
                        <tr key={booking.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-50">{booking.client}</td>
                          <td className="px-6 py-4 text-zinc-300">{booking.lawyer}</td>
                          <td className="px-6 py-4 text-zinc-400">{booking.date}</td>
                          <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-50 mb-6">Bookings per week</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                      <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-50 mb-6">Revenue (৳k)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#09090b' }} activeDot={{ r: 6 }} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

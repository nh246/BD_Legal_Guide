import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, DollarSign, Clock, Check, X } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function LawyerDashboard() {
  const stats = [
    { title: 'Upcoming Bookings', value: '3', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Completed Sessions', value: '14', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Total Earnings', value: 'Tk. 28,000', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  const pendingRequests = [
    { id: 'b4', clientName: 'Mohammed Ali', date: 'Oct 19, 2026', time: '11:00 AM', brief: 'Need consultation regarding property inheritance laws.' },
    { id: 'b5', clientName: 'Ayesha Rahman', date: 'Oct 20, 2026', time: '04:00 PM', brief: 'Drafting a commercial lease agreement.' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Welcome back, Adv. Sarah.</p>
          </div>
          <Link to="/lawyer/availability">
            <Button variant="secondary" className="gap-2">
              <Calendar className="h-4 w-4" /> Manage Availability
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
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

        {/* Pending Requests */}
        <h2 className="text-xl font-semibold text-zinc-50 mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <div className="text-zinc-500 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800/50 border-dashed text-center">
            No pending booking requests at the moment.
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {pendingRequests.map(req => (
              <Card key={req.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                      <Clock className="h-4 w-4" /> {req.date} at {req.time}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-50 mb-2">{req.clientName}</h3>
                    <p className="text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider font-semibold">Case Brief</span>
                      {req.brief}
                    </p>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col gap-3 shrink-0">
                    <Link to={`/lawyer/bookings/${req.id}`} className="flex-1 lg:w-40">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                    </Link>
                    <Button variant="secondary" className="flex-1 lg:w-40 gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

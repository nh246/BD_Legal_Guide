import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, DollarSign, Clock, Check, X, Inbox, User } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useApi } from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { useToastStore } from '../../store/useToastStore';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';

export default function LawyerDashboard() {
  const { data: meData, loading: meLoading, error: meError, reload: reloadMe } = useApi('/lawyer/me');
  const { data: reqData, loading: reqLoading, error: reqError, reload: reloadReq, setData: setReqData } = useApi('/lawyer/requests');
  const addToast = useToastStore((state) => state.addToast);

  const loading = meLoading || reqLoading;
  const error = meError || reqError;

  const reloadAll = () => {
    reloadMe();
    reloadReq();
  };

  const requests = asList(reqData, 'requests');

  const stats = [
    {
      title: 'Upcoming Bookings',
      value: meData?.upcoming_bookings ?? meData?.upcomingBookings ?? meData?.pending ?? requests.length ?? 0,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Completed Sessions',
      value: meData?.completed_sessions ?? meData?.completedSessions ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Total Earnings',
      value: typeof meData?.earnings === 'number' ? `Tk. ${meData.earnings}` : (meData?.earnings || 'Tk. 0'),
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/lawyer/requests/${id}`, { status });
      addToast({
        title: status === 'confirmed' ? 'Request Accepted' : 'Request Declined',
        variant: status === 'confirmed' ? 'success' : 'default'
      });
      // Optimistically update
      setReqData((prev) => {
        const list = asList(prev, 'requests');
        return list.filter((r) => r.id !== id);
      });
    } catch (err) {
      addToast({
        title: 'Action failed',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <LoadingState message="Loading lawyer dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <ErrorState error={error} onRetry={reloadAll} />
      </div>
    );
  }

  const lawyerName = meData?.name || meData?.full_name || 'Advocate';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Lawyer Dashboard</h1>
            <p className="text-zinc-400 mt-1">Welcome back, {lawyerName}.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/lawyer/profile">
              <Button variant="secondary" className="gap-2">
                <User className="h-4 w-4" /> Profile
              </Button>
            </Link>
            <Link to="/lawyer/availability">
              <Button variant="secondary" className="gap-2">
                <Calendar className="h-4 w-4" /> Manage Availability
              </Button>
            </Link>
          </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-50">Consultation Requests</h2>
          <Button variant="ghost" size="sm" onClick={reloadReq} className="text-xs text-zinc-400">
            Refresh
          </Button>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No consultation requests"
            description="You do not have any pending consultation requests at this time."
            actionLabel="Refresh Requests"
            onAction={reloadReq}
          />
        ) : (
          <div className="space-y-4 mb-8">
            {requests.map((req) => (
              <Card key={req.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span>{req.date || req.scheduled_at || 'Date pending'}</span>
                      {req.time && <span>at {req.time}</span>}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-50 mb-2">
                      {req.client_name || req.clientName || req.user?.name || 'Client'}
                    </h3>
                    <p className="text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider font-semibold">
                        Case Brief
                      </span>
                      {req.brief || req.case_brief || req.notes || 'No details provided.'}
                    </p>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-3 shrink-0">
                    <Link to={`/lawyer/requests/${req.id}`} className="flex-1 lg:w-40">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                        <Check className="h-4 w-4" /> Review & Accept
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={() => handleAction(req.id, 'declined')}
                      className="flex-1 lg:w-40 gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                    >
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

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Calendar, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import useAuthStore from '../../store/useAuthStore';
import { asList } from '../../lib/api';

export default function ClientDashboard() {
  const { user, token } = useAuthStore();
  const { data: bookingsData, loading, error, reload } = useApi('/bookings/mine');
  const { data: subData } = useApi(token ? '/subscriptions/mine' : null);

  const bookings = asList(bookingsData, 'bookings');
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');

  const isPro = (subData?.status === 'active' && subData?.plan_code === 'user_pro') ||
                user?.plan === 'user_pro' || user?.is_pro === true;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Welcome back, {user?.full_name || user?.name || 'Client'}</h1>
            <p className="text-zinc-400 mt-1">Manage your legal consultations and AI guidance sessions.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/client/chat">
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" /> Start AI Chat
              </Button>
            </Link>
            <Link to="/client/lawyers">
              <Button variant="secondary" className="gap-2">
                <Users className="h-4 w-4" /> Find Lawyers
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Upcoming Consultations</p>
                <p className="text-2xl font-bold text-zinc-50">{upcomingBookings.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Membership Tier</p>
                <p className="text-2xl font-bold text-zinc-50">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Total Consultations</p>
                <p className="text-2xl font-bold text-zinc-50">{bookings.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-50">Recent & Upcoming Consultations</h2>
            <Link to="/client/bookings" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingState label="Loading your consultations..." />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No consultations yet"
              description="Browse our verified Bangladesh Bar Council lawyers to book your first video consultation."
              action={
                <Link to="/client/lawyers">
                  <Button variant="secondary" className="gap-2">
                    <Users className="h-4 w-4" /> Browse Lawyer Directory
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 3).map((b) => (
                <Card key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-50">{b.lawyer_name || b.lawyerName || 'Advocate'}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {b.start ? new Date(b.start).toLocaleString() : b.scheduled_time || 'Time to be arranged'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'completed' ? 'default' : 'warning'}>
                      {b.status || 'Pending'}
                    </Badge>
                    <Link to={`/client/consultation/${b.id}`}>
                      <Button size="sm" variant="secondary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

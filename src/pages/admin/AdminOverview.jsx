import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Briefcase,
  AlertCircle,
  Sparkles,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Calendar,
  Star,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
} from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';

export default function AdminOverview() {
  const { data, loading, error, reload } = useApi('/admin/overview');

  const pendingCount = data?.pending_lawyers ?? data?.pending_verifications ?? 0;
  const isPendingAlert = pendingCount > 0;

  const statCards = [
    {
      title: 'Total Users',
      value: data?.total_users != null ? Number(data.total_users).toLocaleString() : '0',
      subtext: 'Registered citizen clients',
      icon: User,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      link: '/admin/users',
    },
    {
      title: 'Active Lawyers',
      value: data?.total_lawyers != null ? Number(data.total_lawyers).toLocaleString() : '0',
      subtext: 'Practicing advocates & counsel',
      icon: Briefcase,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      link: '/admin/lawyers',
    },
    {
      title: 'Pending Verifications',
      value: pendingCount != null ? Number(pendingCount).toLocaleString() : '0',
      subtext: isPendingAlert ? 'Requires document review' : 'All applications reviewed',
      icon: AlertCircle,
      // Requirement: red text if > 0
      valueColor: isPendingAlert ? 'text-red-500' : 'text-zinc-50',
      color: isPendingAlert ? 'text-red-500 animate-pulse' : 'text-zinc-400',
      bg: isPendingAlert ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-800/30 border-zinc-700/40',
      link: '/admin/lawyers',
      alert: isPendingAlert,
    },
    {
      title: 'Open Case Board',
      value: data?.open_cases != null ? Number(data.open_cases).toLocaleString() : '0',
      subtext: 'Matters open for lawyer bidding',
      icon: Sparkles,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      link: '/admin/audit-logs',
    },
    {
      title: 'Monthly AI Messages',
      value: data?.monthly_messages != null ? Number(data.monthly_messages).toLocaleString() : '0',
      subtext: 'AI chat queries this month',
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      link: '/admin/queries',
    },
    {
      title: 'Est. Monthly Revenue',
      value: data?.monthly_revenue_est != null ? `৳${Number(data.monthly_revenue_est).toLocaleString()}` : '৳0',
      subtext: 'Pro subscriptions & badge fees',
      icon: DollarSign,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      link: '/admin/payments',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with live refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-3">
              <span>Legal Bridge Admin</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-normal">
                Live Metrics
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Real-time system health, user acquisition, verified lawyers, and platform revenue.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold gap-2 h-9 px-3.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh Metrics</span>
            </Button>
          </div>
        </div>

        {/* Error Handling */}
        {error && !loading && (
          <ErrorState error={error} onRetry={reload} />
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-zinc-900/60 border-zinc-800/80">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-zinc-800 rounded" />
                    <div className="h-7 w-20 bg-zinc-700/80 rounded" />
                    <div className="h-3 w-36 bg-zinc-800/60 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 6 Stat Cards Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <Card
                    key={idx}
                    className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-sm hover:shadow-md"
                  >
                    <CardContent className="p-6 flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
                          {stat.title}
                        </p>
                        <p
                          className={`text-3xl font-extrabold tracking-tight ${
                            stat.valueColor || 'text-zinc-50'
                          }`}
                        >
                          {stat.value}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{stat.subtext}</p>
                      </div>

                      <div
                        className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${stat.bg}`}
                      >
                        <IconComponent className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Platform Highlights & Operational Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Card className="bg-zinc-900/40 border-zinc-800/80 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" /> Consultations & Reviews
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                    <p className="text-xs text-zinc-400">Total Bookings</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1">
                      {data?.total_bookings != null ? Number(data.total_bookings).toLocaleString() : '0'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Scheduled client sessions</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                    <p className="text-xs text-zinc-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1 flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span>{data?.total_reviews != null ? Number(data.total_reviews).toLocaleString() : '0'}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Client feedback ratings</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800/80 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Quick Administrative Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/admin/lawyers"
                    className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between text-xs text-zinc-300 font-semibold group transition-colors"
                  >
                    <span>Verify Lawyers</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/admin/queries"
                    className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between text-xs text-zinc-300 font-semibold group transition-colors"
                  >
                    <span>AI Query Logs</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/admin/payments"
                    className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between text-xs text-zinc-300 font-semibold group transition-colors"
                  >
                    <span>Payment Records</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/admin/users"
                    className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between text-xs text-zinc-300 font-semibold group transition-colors"
                  >
                    <span>Manage Users</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

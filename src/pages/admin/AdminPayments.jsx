import React, { useMemo, useState } from 'react';
import { CreditCard, Search, ArrowUpDown, Calendar, Mail, DollarSign } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function AdminPayments() {
  const { data, loading, error, reload } = useApi('/admin/payments');
  const [searchTerm, setSearchTerm] = useState('');

  const payments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return asList(data, 'payments').filter((p) =>
      `${p.user_email || p.email || ''} ${p.client_name || ''} ${p.type || ''} ${p.provider || ''} ${p.status || ''} ${p.transaction_id || p.id || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, searchTerm]);

  const getTypeBadge = (type) => {
    if (type === 'subscription') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Subscription
        </span>
      );
    }
    if (type === 'verification' || type === 'verification_one_time') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Verification
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
        {type || 'General'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge variant="success">Paid</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Payments & Transactions</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Audit subscription charges, lawyer verification fees, and platform revenue.
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : asList(data, 'payments').length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records yet"
            description="Transaction records from Demo, Stripe, and Paddle will appear here."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-payments-search"
                  type="text"
                  placeholder="Search by email, type, provider, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">User Email</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Provider</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                        No transactions match your search.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id || p.transaction_id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-50 font-mono text-xs">
                          {p.user_email || p.email || p.client_name || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(p.type)}</td>
                        <td className="px-6 py-4 text-emerald-400 font-semibold font-mono">
                          ৳{p.amount ? Number(p.amount).toLocaleString() : 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="uppercase text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {p.provider || p.method || 'demo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

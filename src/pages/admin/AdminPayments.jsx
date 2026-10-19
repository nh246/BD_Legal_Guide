import React, { useMemo, useState } from 'react';
import { CreditCard, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function AdminPayments() {
  const { data, loading, error, reload } = useApi('/admin/payments');
  const [searchTerm, setSearchTerm] = useState('');

  const payments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return asList(data, 'payments').filter((p) =>
      `${p.user || p.client_name || ''} ${p.lawyer || p.lawyer_name || ''} ${p.transaction_id || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, searchTerm]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Payments & Transactions</h1>
          <p className="text-sm text-zinc-400 mt-1">Audit subscription charges, consultation fees, and payouts.</p>
        </div>

        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : asList(data, 'payments').length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records yet"
            description="Transaction records from bKash, Nagad, and card payments will appear here."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Tx ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Client</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Method</th>
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
                        <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{p.transaction_id || p.id}</td>
                        <td className="px-6 py-4 text-zinc-400">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-50 font-medium">{p.client_name || p.user || '—'}</td>
                        <td className="px-6 py-4 text-emerald-400 font-semibold">
                          ৳{p.amount ? Number(p.amount).toLocaleString() : 0}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 uppercase text-xs font-mono">{p.method || 'bKash'}</td>
                        <td className="px-6 py-4">
                          {p.status === 'completed' ? (
                            <Badge variant="success">Completed</Badge>
                          ) : p.status === 'failed' ? (
                            <Badge variant="danger">Failed</Badge>
                          ) : (
                            <Badge variant="warning">{p.status || 'Pending'}</Badge>
                          )}
                        </td>
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

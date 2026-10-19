import React, { useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function AdminFirms() {
  const { data, loading, error, reload } = useApi('/admin/firms');
  const [search, setSearch] = useState('');

  const firms = useMemo(() => {
    const term = search.toLowerCase();
    return asList(data, 'firms').filter((f) =>
      `${f.name || ''} ${f.email || ''} ${f.tier || ''}`.toLowerCase().includes(term)
    );
  }, [data, search]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Firm Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage law firm accounts, rosters, and limits.</p>
        </div>

        {loading ? (
          <LoadingState label="Loading firms..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : asList(data, 'firms').length === 0 ? (
          <EmptyState icon={Building2} title="No firms registered" description="Enterprise and law firm accounts will appear here." />
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-firms-search"
                  type="text"
                  placeholder="Search firms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Firm Name</th>
                    <th className="px-6 py-4 font-medium">Contact</th>
                    <th className="px-6 py-4 font-medium">Lawyers</th>
                    <th className="px-6 py-4 font-medium">Tier</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {firms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                        No firms match your search.
                      </td>
                    </tr>
                  ) : (
                    firms.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-50">{f.name || '—'}</td>
                        <td className="px-6 py-4 text-zinc-400">{f.email || f.contact_email || '—'}</td>
                        <td className="px-6 py-4 text-zinc-300">{f.lawyers_count ?? f.team_size ?? 0}</td>
                        <td className="px-6 py-4">
                          <Badge variant="pro">{f.tier || 'Enterprise'}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {f.status === 'suspended' ? (
                            <Badge variant="danger">Suspended</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
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

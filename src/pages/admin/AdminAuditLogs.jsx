import React, { useMemo, useState } from 'react';
import { Search, History } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function AdminAuditLogs() {
  const { data, loading, error, reload } = useApi('/admin/audit-logs');
  const [searchTerm, setSearchTerm] = useState('');

  const logs = asList(data, 'audit_logs');

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return logs.filter((log) => {
      const actor = (log.actor || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const target = (log.target || '').toLowerCase();
      return actor.includes(term) || action.includes(term) || target.includes(term);
    });
  }, [logs, searchTerm]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Audit Logs</h1>
          <p className="text-sm text-zinc-400 mt-1">Immutable record of administrative actions.</p>
        </div>

        {loading ? (
          <LoadingState label="Loading audit logs..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit logs recorded"
            description="System changes, approvals, and moderator actions will appear here."
          />
        ) : (
          <Card className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by actor, action, or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-zinc-400 font-medium">No logs match your search</h3>
                  <p className="text-sm text-zinc-600 mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-zinc-800">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 text-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <History className="h-4 w-4" />
                      </div>

                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-zinc-50 text-sm">{log.actor}</span>
                          <span className="text-xs font-mono text-zinc-500">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                          <span className="text-blue-400 font-medium">{log.action}</span>
                          {log.target && (
                            <>
                              <br />
                              <span className="text-zinc-500">Target:</span> {log.target}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

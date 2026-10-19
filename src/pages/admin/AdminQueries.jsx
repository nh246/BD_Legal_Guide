import React, { useMemo, useState } from 'react';
import { Search, Bot, Zap, Filter, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function AdminQueries() {
  const { data, loading, error, reload } = useApi('/admin/queries');
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');

  const allQueries = asList(data, 'queries');

  const filteredQueries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allQueries.filter((q) => {
      const matchText = (q.text || q.query || '').toLowerCase().includes(term);
      const matchUser = (q.user || q.user_email || q.user_name || '').toLowerCase().includes(term);
      const matchMode = modeFilter === 'all' || q.mode === modeFilter;
      return (matchText || matchUser) && matchMode;
    });
  }, [allQueries, searchTerm, modeFilter]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">Query Logs</h1>
          <p className="text-zinc-400 mt-1">Monitor AI usage, query patterns, and mode distribution.</p>
        </div>

        {loading ? (
          <LoadingState label="Loading query logs..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : allQueries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No query logs yet"
            description="User queries through the AI assistant will be logged here for auditing."
          />
        ) : (
          <Card className="overflow-hidden border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50">
              <div className="w-full max-w-sm">
                <Input
                  iconLeft={Search}
                  placeholder="Search queries or users..."
                  className="h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                {['all', 'rag', 'standard'].map((mode) => (
                  <Button
                    key={mode}
                    variant={modeFilter === mode ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setModeFilter(mode)}
                    className="capitalize text-xs"
                  >
                    {mode === 'rag' ? 'RAG' : mode === 'standard' ? 'Standard' : 'All Modes'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium w-48">Timestamp</th>
                    <th className="px-6 py-4 font-medium w-48">User</th>
                    <th className="px-6 py-4 font-medium">Query Text</th>
                    <th className="px-6 py-4 font-medium w-32">AI Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                  {filteredQueries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                        No queries match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredQueries.map((q) => (
                      <tr key={q.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                          {q.created_at || q.time ? new Date(q.created_at || q.time).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-300">
                          {q.user || q.user_email || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-zinc-100 max-w-md truncate">
                          {q.text || q.query}
                        </td>
                        <td className="px-6 py-4">
                          {q.mode === 'rag' ? (
                            <Badge variant="pro" className="gap-1 px-2">
                              <Zap className="h-3 w-3" /> RAG
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 px-2 text-zinc-300 bg-zinc-800 border border-zinc-700">
                              <Bot className="h-3 w-3" /> Standard
                            </Badge>
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

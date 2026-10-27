import React, { useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  FileText,
  User,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  ShieldAlert,
  Eye,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return String(dateString);
  }
}

export default function AdminQueries() {
  const { data, loading, error, reload } = useApi('/admin/queries');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all'); // all | pro | free
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal states for Audited Reveal
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [justification, setJustification] = useState('');
  const [revealedContent, setRevealedContent] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [copied, setCopied] = useState(false);

  const rawQueries = asList(data, 'queries');

  const filteredQueries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let list = rawQueries.filter((q) => {
      const user = (q.user_name || q.user || q.user_email || '').toLowerCase();
      const matchesSearch = !term || user.includes(term);

      const isPro = (q.plan_code || '').toLowerCase().includes('pro');
      const matchesPlan =
        planFilter === 'all' ||
        (planFilter === 'pro' && isPro) ||
        (planFilter === 'free' && !isPro);

      return matchesSearch && matchesPlan;
    });

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (sortField === 'char_count') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [rawQueries, searchTerm, planFilter, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for new field
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />;
    }
    return sortAsc ? (
      <ArrowUp className="h-3 w-3 text-blue-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-400" />
    );
  };

  const handleOpenRevealModal = (queryItem) => {
    setSelectedQuery(queryItem);
    setJustification('');
    setRevealedContent(null);
    setRevealError(null);
    setCopied(false);
  };

  const handleCloseModal = () => {
    setSelectedQuery(null);
    setJustification('');
    setRevealedContent(null);
    setRevealError(null);
    setCopied(false);
  };

  const handleSubmitReveal = async (e) => {
    e?.preventDefault?.();
    if (!selectedQuery || !justification.trim() || isRevealing) return;

    setIsRevealing(true);
    setRevealError(null);

    try {
      const res = await api.post(`/admin/queries/${selectedQuery.id}/reveal`, {
        reason: justification.trim(),
      });
      const content = res.data?.content != null ? res.data.content : String(res.data || '');
      setRevealedContent(content);
      toast('Access logged to audit trail.', 'success');
    } catch (err) {
      setRevealError(getErrorMessage(err, 'Failed to reveal query content.'));
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyContent = () => {
    if (!revealedContent) return;
    navigator.clipboard?.writeText(revealedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Title and Refresh button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-3">
              <span>AI Query Logs</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-normal flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Privacy-Protected
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Audit recorded AI queries, view user plans, and request audited access when authorized.
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
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Banner above table: Privacy Notice & Audit Requirement */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start sm:items-center gap-3.5 text-amber-300 text-sm shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="font-medium leading-relaxed">
            Query content is privacy-masked. Revealing content requires justification and is permanently audited.
          </span>
        </div>

        {/* Loading and Error states */}
        {loading && rawQueries.length === 0 ? (
          <LoadingState label="Loading AI queries..." />
        ) : error && rawQueries.length === 0 ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rawQueries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No AI queries logged yet."
            description="When citizens ask legal questions to the AI assistant, their queries will appear here."
          />
        ) : (
          <Card className="overflow-hidden border-zinc-800 bg-zinc-900/60 shadow-lg">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80">
              <div className="w-full max-w-sm">
                <Input
                  iconLeft={Search}
                  placeholder="Search by user name..."
                  className="h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium mr-1">Plan:</span>
                {[
                  { id: 'all', label: 'All Plans' },
                  { id: 'pro', label: 'Pro' },
                  { id: 'free', label: 'Free' },
                ].map((p) => (
                  <Button
                    key={p.id}
                    variant={planFilter === p.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setPlanFilter(p.id)}
                    className="text-xs h-8 px-3"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Table: User, Plan, Chars, Timestamp, and View content button */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 select-none">
                  <tr>
                    {/* Column 1: User */}
                    <th
                      onClick={() => toggleSort('user_name')}
                      className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:text-zinc-200 transition-colors group w-64"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-zinc-500" />
                        <span>User</span>
                        {renderSortIcon('user_name')}
                      </div>
                    </th>

                    {/* Column 2: Plan */}
                    <th
                      onClick={() => toggleSort('plan_code')}
                      className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:text-zinc-200 transition-colors group w-40"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Plan</span>
                        {renderSortIcon('plan_code')}
                      </div>
                    </th>

                    {/* Column 3: Chars */}
                    <th
                      onClick={() => toggleSort('char_count')}
                      className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:text-zinc-200 transition-colors group w-36"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Chars</span>
                        {renderSortIcon('char_count')}
                      </div>
                    </th>

                    {/* Column 4: Timestamp */}
                    <th
                      onClick={() => toggleSort('created_at')}
                      className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:text-zinc-200 transition-colors group w-48"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Timestamp</span>
                        {renderSortIcon('created_at')}
                      </div>
                    </th>

                    {/* Column 5: View content Action */}
                    <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase text-right w-44">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
                  {filteredQueries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        {rawQueries.length === 0
                          ? 'No AI queries logged yet.'
                          : 'No queries match your current search or plan filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredQueries.map((q) => {
                      const isPro = (q.plan_code || '').toLowerCase().includes('pro');
                      const exactDate = q.created_at ? new Date(q.created_at).toLocaleString() : '';
                      const charCount = q.char_count != null ? q.char_count : 0;

                      return (
                        <tr
                          key={q.id}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          {/* User */}
                          <td className="px-6 py-4 font-semibold text-zinc-200">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                                {(q.user_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[200px]">
                                {q.user_name || 'Anonymous'}
                              </span>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-6 py-4">
                            {isPro ? (
                              <Badge
                                variant="pro"
                                className="gap-1 px-2.5 py-0.5 text-xs font-bold shadow-sm shadow-blue-900/20"
                              >
                                <Zap className="h-3 w-3" /> Pro
                              </Badge>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Free
                              </span>
                            )}
                          </td>

                          {/* Chars */}
                          <td className="px-6 py-4 text-zinc-300 font-mono text-xs">
                            {charCount.toLocaleString()} chars
                          </td>

                          {/* Timestamp */}
                          <td className="px-6 py-4 text-zinc-400 whitespace-nowrap text-xs">
                            <span
                              className="cursor-help border-b border-dotted border-zinc-700"
                              title={exactDate}
                            >
                              {formatRelativeTime(q.created_at)}
                            </span>
                          </td>

                          {/* View content button */}
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenRevealModal(q)}
                              className="h-8 px-3 text-xs font-semibold gap-1.5 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 cursor-pointer shadow-sm hover:border-zinc-600"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-400" />
                              <span>View content</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="p-3.5 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 px-6">
              <span>Showing {filteredQueries.length} of {rawQueries.length} recorded queries</span>
              <span>All unmasking actions are permanently audited</span>
            </div>
          </Card>
        )}

        {/* Audited Reveal Modal */}
        <Modal
          isOpen={Boolean(selectedQuery)}
          onClose={handleCloseModal}
          title={revealedContent !== null ? "Query Content (Revealed)" : "Audited Query Access"}
          description={
            revealedContent !== null
              ? "Access logged to permanent audit trail."
              : "Reviewing this query requires explicit justification and will be permanently logged."
          }
          maxWidth="max-w-lg"
        >
          {selectedQuery && (
            <div className="space-y-4">
              {/* Query Metadata Card */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Target User:</span>
                  <span className="font-semibold text-zinc-200">{selectedQuery.user_name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Plan Tier:</span>
                  <span className="capitalize font-medium text-zinc-300">{selectedQuery.plan_code || 'user_free'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Length:</span>
                  <span className="font-mono text-zinc-300">{(selectedQuery.char_count || 0).toLocaleString()} characters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Timestamp:</span>
                  <span className="text-zinc-300">{new Date(selectedQuery.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Reveal Error */}
              {revealError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{revealError}</span>
                </div>
              )}

              {/* State 1: Form to enter justification before reveal */}
              {revealedContent === null ? (
                <form onSubmit={handleSubmitReveal} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Justification for access (required)
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Specify legitimate reason (e.g. security investigation, ticket #1234, policy violation review)..."
                      rows={3}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-[11px] text-zinc-500 italic">
                      Your admin identity and this justification will be permanently stored in the audit logs.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseModal}
                      className="text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!justification.trim() || isRevealing}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 h-9 px-4 disabled:opacity-50"
                    >
                      {isRevealing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Logging & Revealing...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Confirm & Reveal</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                /* State 2: Content revealed */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Access logged to audit trail.</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyContent}
                      className="h-7 px-2 text-[11px] text-emerald-300 hover:bg-emerald-500/20 gap-1"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Query Full Text:
                    </label>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                      <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-mono select-text">
                        {revealedContent}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-zinc-800">
                    <Button
                      size="sm"
                      onClick={handleCloseModal}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-4 h-8.5"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

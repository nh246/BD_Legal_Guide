import React, { useMemo, useState } from 'react';
import { Scale, Search, Check, X, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function AdminLawyers() {
  const { data, loading, error, reload } = useApi('/admin/lawyers');
  const [search, setSearch] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const lawyers = useMemo(() => {
    const term = search.toLowerCase();
    return asList(data, 'lawyers').filter((l) =>
      `${l.name || ''} ${l.district || ''} ${l.specialization || ''} ${l.verification_status || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, search]);

  const handleAction = async (lawyerId, newStatus) => {
    setActionLoading(lawyerId);
    try {
      await api.patch(`/admin/lawyers/${lawyerId}`, { verification_status: newStatus });
      toast(`Lawyer verification status updated to ${newStatus}`, 'success');
      if (selectedLawyer?.id === lawyerId) {
        setSelectedLawyer(null);
      }
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update lawyer status'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
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
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50 mb-2">Lawyer Verification</h1>
            <p className="text-zinc-400 font-medium text-sm">
              Review advocate credentials, bar council registrations, and approve or reject listings.
            </p>
          </div>

          {loading ? (
            <LoadingState label="Loading lawyers..." />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : asList(data, 'lawyers').length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No lawyer applications"
              description="Lawyer registrations will appear here for verification review."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    id="admin-lawyers-search"
                    type="text"
                    placeholder="Search by name, district, or specialization..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">District</th>
                      <th className="px-6 py-4 font-medium">Specialization</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {lawyers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                          No lawyers match your search.
                        </td>
                      </tr>
                    ) : (
                      lawyers.map((l) => (
                        <tr
                          key={l.id}
                          onClick={() => setSelectedLawyer(l)}
                          className={`hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                            selectedLawyer?.id === l.id ? 'bg-zinc-800/40' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-medium text-zinc-50">
                            <div className="flex items-center gap-2">
                              <span>{l.name}</span>
                              {l.verification_paid && (
                                <span title="Verified Badge Fee Paid" className="text-amber-400">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{l.district || '—'}</td>
                          <td className="px-6 py-4 text-zinc-300 max-w-[200px] truncate">
                            {l.specialization || 'General Practice'}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(l.verification_status)}</td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {l.verification_status !== 'approved' && (
                                <button
                                  onClick={() => handleAction(l.id, 'approved')}
                                  disabled={actionLoading === l.id}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </button>
                              )}
                              {l.verification_status !== 'rejected' && (
                                <button
                                  onClick={() => handleAction(l.id, 'rejected')}
                                  disabled={actionLoading === l.id}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </button>
                              )}
                            </div>
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

      {/* Right Drawer with Full Lawyer Details */}
      {selectedLawyer && (
        <div className="w-full max-w-md border-l border-zinc-800 bg-zinc-900 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 z-20 shadow-2xl absolute right-0 top-0 bottom-0 lg:static">
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
            <div>
              <h2 className="font-semibold text-zinc-50">Lawyer Details</h2>
              <p className="text-xs text-zinc-500 font-mono">{selectedLawyer.id}</p>
            </div>
            <button
              onClick={() => setSelectedLawyer(null)}
              className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-zinc-50">{selectedLawyer.name}</h3>
                {getStatusBadge(selectedLawyer.verification_status)}
              </div>
              <p className="text-sm text-zinc-400">{selectedLawyer.specialization || 'General Practice'}</p>
            </div>

            <div className="space-y-3 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">District:</span>
                <span className="text-zinc-200 font-medium">{selectedLawyer.district || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Bar Council ID:</span>
                <span className="text-zinc-200 font-mono font-medium">{selectedLawyer.bar_council_id || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Phone:</span>
                <span className="text-zinc-200 font-medium">{selectedLawyer.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Verified Badge:</span>
                <span className={selectedLawyer.verification_paid ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                  {selectedLawyer.verification_paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                disabled={actionLoading === selectedLawyer.id}
                onClick={() => handleAction(selectedLawyer.id, 'approved')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
              <button
                disabled={actionLoading === selectedLawyer.id}
                onClick={() => handleAction(selectedLawyer.id, 'rejected')}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

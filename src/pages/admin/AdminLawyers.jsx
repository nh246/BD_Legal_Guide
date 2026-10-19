import React, { useState } from 'react';
import { Image as ImageIcon, AlertTriangle, Check, ShieldCheck, BadgeCheck, X, FileText, Scale } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending': return <span className="inline-flex px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">Pending Review</span>;
    case 'gold': return <span className="inline-flex px-2 py-1 rounded bg-amber-500 text-white text-xs font-medium shadow-sm"><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Gold</span>;
    case 'standard': return <span className="inline-flex px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium shadow-sm"><BadgeCheck className="h-3.5 w-3.5 mr-1" /> Standard</span>;
    case 'rejected': return <span className="inline-flex px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">Rejected</span>;
    default: return <span className="inline-flex px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-medium capitalize">{status || 'unknown'}</span>;
  }
};

const specialtyText = (l) => (Array.isArray(l.specialties) ? l.specialties.join(', ') : l.specialty || '—');

export default function AdminLawyers() {
  const { data, loading, error, reload } = useApi('/admin/lawyers');
  const lawyers = asList(data, 'lawyers');
  const [selectedApp, setSelectedApp] = useState(null);
  const [auditNote, setAuditNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (status) => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await api.patch(`/admin/lawyers/${selectedApp.id}`, { status, note: auditNote });
      toast(`${selectedApp.name} — ${status === 'rejected' ? 'Application Rejected' : `Approved as ${status}`}`, 'success');
      setSelectedApp(null);
      setAuditNote('');
      reload();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const extraction = selectedApp?.extraction;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 overflow-hidden relative">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-50 mb-2">Lawyers</h1>
            <p className="text-zinc-500 font-medium">Review and approve lawyer identities and credentials.</p>
          </div>

          {loading ? (
            <LoadingState label="Loading lawyers..." />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : lawyers.length === 0 ? (
            <EmptyState icon={Scale} title="No lawyer applications" description="Lawyer registrations awaiting verification will appear here." />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Bar ID</th>
                      <th className="px-6 py-4 font-medium">Specialty</th>
                      <th className="px-6 py-4 font-medium">Submitted</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {lawyers.map(app => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`transition-colors cursor-pointer ${
                          selectedApp?.id === app.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-zinc-50">{app.name}</td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">{app.bar_id || app.barId || '—'}</td>
                        <td className="px-6 py-4 text-zinc-400 truncate max-w-[150px]">{specialtyText(app)}</td>
                        <td className="px-6 py-4 text-zinc-500">{app.submitted_at ? new Date(app.submitted_at).toLocaleString() : '—'}</td>
                        <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Drawer */}
      {selectedApp && (
        <div className="w-full max-w-md border-l border-zinc-800 bg-zinc-900 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 z-20 shadow-2xl absolute right-0 top-0 bottom-0 lg:static">

          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
            <div>
              <h2 className="font-semibold text-zinc-50">Application Review</h2>
              <p className="text-xs text-zinc-500 font-mono">{selectedApp.id}</p>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">

            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-zinc-50">{selectedApp.name}</h3>
                {getStatusBadge(selectedApp.status)}
              </div>
              <p className="text-sm text-zinc-400">{specialtyText(selectedApp)}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Submitted Document
              </h4>
              {selectedApp.document_url ? (
                <a href={selectedApp.document_url} target="_blank" rel="noopener noreferrer" className="block aspect-[3/2] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <img src={selectedApp.document_url} alt="Bar Council ID" className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="aspect-[3/2] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 relative overflow-hidden group">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-sm font-medium">Document preview unavailable</span>
                </div>
              )}
            </div>

            {extraction && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300">AI Extraction Analysis</span>
                  {extraction.confidence != null && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">
                      {extraction.confidence}% Match
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-[1fr_1fr_24px] gap-3 items-center">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Claimed</div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Extracted</div>
                    <div></div>

                    <div className="text-sm text-zinc-300 font-medium truncate">{selectedApp.name}</div>
                    <div className={`text-sm font-medium truncate ${extraction.name_match ? 'text-zinc-300' : 'text-amber-400'}`}>{extraction.name}</div>
                    <div>{extraction.name_match ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}</div>

                    <div className="text-sm text-zinc-300 font-medium font-mono">{selectedApp.bar_id}</div>
                    <div className={`text-sm font-medium font-mono ${extraction.bar_id_match ? 'text-zinc-300' : 'text-red-400'}`}>{extraction.bar_id}</div>
                    <div>{extraction.bar_id_match ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Audit Note (Internal)</h4>
              <textarea
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="Add notes about this verification..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none h-24"
              />
            </div>
          </div>

          {selectedApp.status === 'pending' && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/80 shrink-0 space-y-3">
              <div className="flex gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction('gold')}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" /> Approve Gold
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction('standard')}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <BadgeCheck className="h-4 w-4" /> Approve Standard
                </button>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => handleAction('rejected')}
                className="w-full bg-transparent hover:bg-red-500/10 text-red-500 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors border border-transparent hover:border-red-500/30 disabled:opacity-50"
              >
                Reject Application
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

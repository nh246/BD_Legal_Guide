import React, { useMemo, useState, useEffect } from 'react';
import {
  Scale,
  Search,
  Check,
  X,
  ShieldCheck,
  FileText,
  Eye,
  Star,
  Award,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Crown,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function AdminLawyers() {
  const { data, loading, error, reload } = useApi('/admin/lawyers');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' (default) | 'approved' | 'rejected' | 'all'
  const [search, setSearch] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lawyer Submitted Documents (verification assets)
  const [lawyerAssets, setLawyerAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [viewingAssetId, setViewingAssetId] = useState(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(null);

  const rawLawyers = asList(data, 'lawyers');

  // Load assets for selected lawyer
  useEffect(() => {
    if (!selectedLawyer) {
      setLawyerAssets([]);
      return;
    }
    const targetId = selectedLawyer.user_id || selectedLawyer.id;
    setAssetsLoading(true);
    api.get(`/users/${targetId}/assets`)
      .then((res) => {
        const list = asList(res.data, 'assets');
        setLawyerAssets(list);
      })
      .catch(() => {
        setLawyerAssets([]);
      })
      .finally(() => {
        setAssetsLoading(false);
      });
  }, [selectedLawyer]);

  const verificationDocs = useMemo(() => {
    // If backend already passed verification_asset_ids and assets are loaded
    if (lawyerAssets.length > 0) {
      return lawyerAssets.filter((a) => a.kind === 'verification');
    }
    // Fallback placeholder representations if asset IDs are available before detailed assets query
    if (selectedLawyer?.verification_asset_ids?.length > 0) {
      return selectedLawyer.verification_asset_ids.map((id) => ({
        id,
        kind: 'verification',
        filename: 'Bar Council Verification Document',
        size_bytes: 0,
      }));
    }
    return [];
  }, [lawyerAssets, selectedLawyer]);

  const lawyerAvatar = lawyerAssets.find((a) => a.kind === 'avatar');

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleViewDocument = async (assetId) => {
    setViewingAssetId(assetId);
    try {
      const res = await api.get(`/assets/${assetId}/file`, { responseType: 'blob' });
      const mimeType = res.headers['content-type'] || 'application/pdf';
      const blob = new Blob([res.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to open document'), 'error');
    } finally {
      setViewingAssetId(null);
    }
  };

  // Tab counts
  const counts = useMemo(() => {
    const pending = rawLawyers.filter((l) => (l.verification_status || '').toLowerCase() === 'pending').length;
    const approved = rawLawyers.filter((l) => (l.verification_status || '').toLowerCase() === 'approved').length;
    const rejected = rawLawyers.filter((l) => (l.verification_status || '').toLowerCase() === 'rejected').length;
    return {
      pending,
      approved,
      rejected,
      all: rawLawyers.length,
    };
  }, [rawLawyers]);

  // Filtered lawyers
  const filteredLawyers = useMemo(() => {
    let list = rawLawyers;
    if (activeTab !== 'all') {
      list = list.filter((l) => (l.verification_status || '').toLowerCase() === activeTab);
    }
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((l) =>
        `${l.name || ''} ${l.email || ''} ${l.district || ''} ${l.specialization || ''} ${l.bar_council_id || ''}`
          .toLowerCase()
          .includes(term)
      );
    }
    return list;
  }, [rawLawyers, activeTab, search]);

  // Actions
  const handleApprove = async (lawyer) => {
    if (!lawyer || actionLoading) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/lawyers/${lawyer.id}/approve`, {});
      toast(`Advocate ${lawyer.name} approved successfully.`, 'success');
      setSelectedLawyer(null);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to approve lawyer'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectReason('');
    setRejectError(null);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e?.preventDefault?.();
    if (!selectedLawyer || !rejectReason.trim() || actionLoading) return;

    setActionLoading(true);
    setRejectError(null);
    try {
      await api.post(`/admin/lawyers/${selectedLawyer.id}/reject`, {
        reason: rejectReason.trim(),
      });
      toast(`Advocate ${selectedLawyer.name} verification rejected.`, 'error');
      setRejectModalOpen(false);
      setSelectedLawyer(null);
      reload();
    } catch (err) {
      setRejectError(getErrorMessage(err, 'Failed to reject lawyer'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleGold = async (lawyer) => {
    if (!lawyer || actionLoading) return;
    const newGoldState = !lawyer.verification_paid;
    setActionLoading(true);
    try {
      await api.post(`/admin/lawyers/${lawyer.id}/gold`, { grant: newGoldState });
      toast(
        newGoldState
          ? `Gold badge granted to ${lawyer.name}.`
          : `Gold badge revoked from ${lawyer.name}.`,
        'success'
      );
      setSelectedLawyer((prev) => (prev ? { ...prev, verification_paid: newGoldState } : null));
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update gold status'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const norm = (status || '').toLowerCase();
    switch (norm) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 shadow-xs">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 overflow-hidden relative">
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-3">
                <span>Lawyer Verification</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-normal flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" /> Bar Council Review
                </span>
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Inspect advocate credentials, examine uploaded certificates, approve listings, and manage Gold status.
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
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Filter Tabs Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none">
              {[
                { id: 'pending', label: 'Pending', count: counts.pending, color: 'text-amber-400 bg-amber-500/20' },
                { id: 'approved', label: 'Approved', count: counts.approved, color: 'text-emerald-400 bg-emerald-500/20' },
                { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-400 bg-red-500/20' },
                { id: 'all', label: 'All Lawyers', count: counts.all, color: 'text-zinc-400 bg-zinc-800' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : tab.color
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="admin-lawyers-search"
                type="text"
                placeholder="Search name, district, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table or States */}
          {loading && rawLawyers.length === 0 ? (
            <LoadingState label="Loading advocate applications..." />
          ) : error && rawLawyers.length === 0 ? (
            <ErrorState error={error} onRetry={reload} />
          ) : rawLawyers.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No lawyer applications found"
              description="When advocates register, their verification documents will appear here."
            />
          ) : (
            <Card className="overflow-hidden border-zinc-800 bg-zinc-900/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 select-none">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Advocate</th>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Bar Council ID</th>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">District</th>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Specialization</th>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Status</th>
                      <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
                    {filteredLawyers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-xs">
                          No lawyers found for "{activeTab}" filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLawyers.map((l) => {
                        const isSelected = selectedLawyer?.id === l.id;
                        return (
                          <tr
                            key={l.id}
                            onClick={() => setSelectedLawyer(l)}
                            className={`hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                              isSelected ? 'bg-zinc-800/60' : ''
                            }`}
                          >
                            {/* Advocate */}
                            <td className="px-6 py-4 font-semibold text-zinc-100">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                                  {(l.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[200px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{l.name}</span>
                                    {l.verification_paid && (
                                      <span title="Gold Verified" className="text-amber-400 shrink-0">
                                        <Crown className="h-3.5 w-3.5 fill-amber-400/20" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 truncate font-normal">
                                    {l.email || 'No email provided'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Bar Council ID */}
                            <td className="px-6 py-4 text-xs font-mono text-zinc-300">
                              {l.bar_council_id || '—'}
                            </td>

                            {/* District */}
                            <td className="px-6 py-4 text-xs text-zinc-300">
                              {l.district || '—'}
                            </td>

                            {/* Specialization */}
                            <td className="px-6 py-4 text-xs text-zinc-300 max-w-[180px] truncate">
                              {l.specialization || 'General Practice'}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              {renderStatusBadge(l.verification_status)}
                            </td>

                            {/* Action Button */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedLawyer(l)}
                                className="h-8 px-3 text-xs font-semibold gap-1.5 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 cursor-pointer shadow-sm hover:border-zinc-600"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-400" />
                                <span>Review</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="p-3.5 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 px-6">
                <span>Showing {filteredLawyers.length} of {rawLawyers.length} lawyers</span>
                <span>Click any row to open the complete evidence review drawer</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Backdrop overlay when drawer is open */}
      {selectedLawyer && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setSelectedLawyer(null)}
        />
      )}

      {/* Right Drawer with Evidence and Actions */}
      {selectedLawyer && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-50 truncate">{selectedLawyer.name}</h2>
                {selectedLawyer.verification_paid && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                    <Crown className="h-3 w-3 text-amber-400" /> Gold
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3 text-zinc-500" />
                <span>{selectedLawyer.email || 'No email attached'}</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedLawyer(null)}
              className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
              title="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & Profile Top Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              {lawyerAvatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/assets/${lawyerAvatar.id}/file`}
                  alt={selectedLawyer.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-zinc-700 shadow-md shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl font-black shadow-md shrink-0">
                  {(selectedLawyer.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-zinc-400 font-mono">ID: {selectedLawyer.id.slice(0, 8)}...</span>
                  {renderStatusBadge(selectedLawyer.verification_status)}
                </div>
                <div className="text-sm font-semibold text-zinc-200 truncate">
                  {selectedLawyer.specialization || 'General Legal Practice'}
                </div>
                <div className="text-xs text-zinc-500">
                  Registered {selectedLawyer.created_at ? new Date(selectedLawyer.created_at).toLocaleDateString() : ''}
                </div>
              </div>
            </div>

            {/* Previous Rejection Note Callout if applicable */}
            {selectedLawyer.verification_note && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Admin Recorded Note:</span>
                </div>
                <p className="leading-relaxed pl-5 text-amber-200/90 font-mono">
                  {selectedLawyer.verification_note}
                </p>
              </div>
            )}

            {/* Credentials Block */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-blue-400" /> Professional Credentials
              </h3>
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-2.5 divide-y divide-zinc-800/50">
                <div className="flex justify-between items-center pt-0">
                  <span className="text-zinc-400">Bar Council ID:</span>
                  <span className="font-mono font-bold text-zinc-100 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                    {selectedLawyer.bar_council_id || 'Not Provided'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-zinc-400">District / Jurisdiction:</span>
                  <span className="font-medium text-zinc-200">{selectedLawyer.district || '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-zinc-400">Specialization:</span>
                  <span className="font-medium text-zinc-200">{selectedLawyer.specialization || 'General Practice'}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-zinc-400">Experience:</span>
                  <span className="font-medium text-zinc-200">
                    {selectedLawyer.years_experience || selectedLawyer.years_exp || 0} Years
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-zinc-400">Phone:</span>
                  <span className="font-mono text-zinc-200">{selectedLawyer.phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Stats Block */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-400" /> Platform Track Record
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-400 mb-0.5 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> Rating
                  </div>
                  <div className="text-lg font-extrabold text-zinc-100">
                    {selectedLawyer.avg_rating ? selectedLawyer.avg_rating.toFixed(1) : '5.0'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-400 mb-0.5">Reviews</div>
                  <div className="text-lg font-extrabold text-zinc-100">
                    {selectedLawyer.review_count || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-400 mb-0.5">Bookings</div>
                  <div className="text-lg font-extrabold text-zinc-100">
                    {selectedLawyer.booking_count || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-blue-400" /> Verification Documents & Evidence
                </h3>
                {verificationDocs.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                    {verificationDocs.length} {verificationDocs.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>

              {assetsLoading ? (
                <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-400 mx-auto mb-2" />
                  <span>Loading evidence documents...</span>
                </div>
              ) : verificationDocs.length === 0 ? (
                <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center text-xs text-zinc-500">
                  <FileText className="h-6 w-6 text-zinc-600 mx-auto mb-1.5" />
                  <span>No verification documents uploaded yet.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {verificationDocs.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            {doc.filename || `Verification Evidence #${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {formatBytes(doc.size_bytes) || 'Official Certificate'}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={viewingAssetId === doc.id}
                        onClick={() => handleViewDocument(doc.id)}
                        className="h-8 px-3 text-xs font-semibold gap-1.5 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-blue-300 shrink-0"
                      >
                        <Eye className="h-3 w-3 text-blue-400" />
                        <span>{viewingAssetId === doc.id ? 'Opening...' : 'View'}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-zinc-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-5 border-t border-zinc-800 bg-zinc-950/90 shrink-0 space-y-3">
            {/* Primary Decisions: Approve & Reject */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedLawyer)}
                disabled={actionLoading || selectedLawyer.verification_status === 'approved'}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{selectedLawyer.verification_status === 'approved' ? 'Approved' : 'Approve'}</span>
              </Button>

              <Button
                variant="danger"
                onClick={handleOpenRejectModal}
                disabled={actionLoading || selectedLawyer.verification_status === 'rejected'}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-10 text-xs gap-1.5 shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>{selectedLawyer.verification_status === 'rejected' ? 'Rejected' : 'Reject'}</span>
              </Button>
            </div>

            {/* Secondary Action: Gold Override Toggle */}
            <Button
              variant="secondary"
              onClick={() => handleToggleGold(selectedLawyer)}
              disabled={actionLoading}
              className={`w-full h-9 text-xs font-semibold gap-1.5 border transition-all ${
                selectedLawyer.verification_paid
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <Crown className={`h-3.5 w-3.5 ${selectedLawyer.verification_paid ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span>{selectedLawyer.verification_paid ? 'Revoke Gold Badge' : 'Grant Gold Badge'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal with Required Reason */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Lawyer Verification"
        description="Provide a mandatory reason for rejecting this advocate's application."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          {rejectError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{rejectError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Rejection Reason (required)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Bar council registration number is unverified, certificates blurred or missing..."
              rows={3}
              required
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
            />
            <p className="text-[11px] text-zinc-500">
              This reason will be recorded in the audit logs and stored on the lawyer's profile.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs gap-1.5 h-9 px-4 disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

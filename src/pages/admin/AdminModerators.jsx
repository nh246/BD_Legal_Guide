import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Edit2,
  UserMinus,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  Mail,
  User,
  CheckSquare,
  Square,
  Lock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

export const MODERATOR_SCOPES = [
  { key: 'analytics:view', label: 'analytics:view', name: 'Analytics View', desc: 'Access platform analytics and dashboard overview metrics.' },
  { key: 'users:view', label: 'users:view', name: 'View Users', desc: 'Inspect user accounts, usage, and metrics.' },
  { key: 'users:edit', label: 'users:edit', name: 'Manage Users', desc: 'Update user profiles and change account status.' },
  { key: 'lawyers:view', label: 'lawyers:view', name: 'View Lawyers', desc: 'Browse and inspect lawyer verification applications and credentials.' },
  { key: 'lawyers:approve', label: 'lawyers:approve', name: 'Verify Lawyers', desc: 'Approve, reject, or toggle Gold status for lawyers.' },
  { key: 'queries:view', label: 'queries:view', name: 'View AI Queries', desc: 'Inspect AI conversation queries and audit query access.' },
  { key: 'audit:view', label: 'audit:view', name: 'View Audit Logs', desc: 'Access platform-wide administrative audit logs.' },
  { key: 'cases:view', label: 'cases:view', name: 'View Cases', desc: 'Review case board listings, bids, and discussion threads.' },
  { key: 'payments:view', label: 'payments:view', name: 'View Payments', desc: 'Inspect subscription payments and financial transactions.' },
  { key: 'plans:edit', label: 'plans:edit', name: 'Manage Plans', desc: 'Create and update subscription pricing plans.' },
];

export default function AdminModerators() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { data, loading, error, reload } = useApi(isAdmin ? '/admin/moderators' : null);
  const moderators = asList(data, 'moderators');

  // Search filter for moderators list
  const [modSearch, setModSearch] = useState('');

  // Promote Modal state
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [promoteScopes, setPromoteScopes] = useState(['users:view', 'lawyers:view', 'queries:view']);
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [editName, setEditName] = useState('');
  const [editScopes, setEditScopes] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Demote Confirm Modal state
  const [demoteModalOpen, setDemoteModalOpen] = useState(false);
  const [demotingMod, setDemotingMod] = useState(null);
  const [demoteLoading, setDemoteLoading] = useState(false);

  // Fetch candidate users (role='user') when Promote modal opens
  useEffect(() => {
    if (promoteModalOpen) {
      setCandidatesLoading(true);
      setSelectedCandidate(null);
      setCandidateSearch('');
      setPromoteScopes(['users:view', 'lawyers:view', 'queries:view']);
      api
        .get('/admin/users?role=user')
        .then((res) => {
          setCandidates(asList(res.data, 'users'));
        })
        .catch((err) => {
          toast(getErrorMessage(err, 'Failed to fetch candidate users'), 'error');
        })
        .finally(() => {
          setCandidatesLoading(false);
        });
    }
  }, [promoteModalOpen]);

  const filteredModerators = useMemo(() => {
    const term = modSearch.toLowerCase();
    return moderators.filter((m) => {
      const name = m.full_name || m.name || '';
      const email = m.email || '';
      const scopes = Array.isArray(m.scopes) ? m.scopes.join(' ') : '';
      return `${name} ${email} ${scopes}`.toLowerCase().includes(term);
    });
  }, [moderators, modSearch]);

  const filteredCandidates = useMemo(() => {
    const term = candidateSearch.toLowerCase();
    return candidates.filter((u) => {
      const name = u.full_name || u.name || '';
      const email = u.email || '';
      return `${name} ${email}`.toLowerCase().includes(term);
    });
  }, [candidates, candidateSearch]);

  // Handlers for Promote
  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast('Please select an existing user to promote', 'error');
      return;
    }
    setPromoteLoading(true);
    try {
      await api.post('/admin/moderators/promote', {
        user_id: selectedCandidate.id,
        scopes: promoteScopes,
      });
      toast(`User ${selectedCandidate.full_name || selectedCandidate.email} promoted to moderator`, 'success');
      setPromoteModalOpen(false);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to promote user to moderator'), 'error');
    } finally {
      setPromoteLoading(false);
    }
  };

  const togglePromoteScope = (scopeKey) => {
    setPromoteScopes((prev) =>
      prev.includes(scopeKey) ? prev.filter((s) => s !== scopeKey) : [...prev, scopeKey]
    );
  };

  // Handlers for Edit
  const openEditModal = (mod) => {
    setEditingMod(mod);
    setEditName(mod.full_name || mod.name || '');
    setEditScopes(Array.isArray(mod.scopes) ? [...mod.scopes] : []);
    setEditModalOpen(true);
  };

  const toggleEditScope = (scopeKey) => {
    setEditScopes((prev) =>
      prev.includes(scopeKey) ? prev.filter((s) => s !== scopeKey) : [...prev, scopeKey]
    );
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMod) return;
    if (!editName.trim()) {
      toast('Moderator name cannot be empty', 'error');
      return;
    }
    setEditLoading(true);
    try {
      await api.post(`/admin/moderators/${editingMod.id}/edit`, {
        name: editName.trim(),
        scopes: editScopes,
      });
      toast('Moderator profile and scopes updated', 'success');
      setEditModalOpen(false);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update moderator'), 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handlers for Demote
  const openDemoteModal = (mod) => {
    setDemotingMod(mod);
    setDemoteModalOpen(true);
  };

  const handleDemoteSubmit = async () => {
    if (!demotingMod) return;
    setDemoteLoading(true);
    try {
      await api.post(`/admin/moderators/${demotingMod.id}/demote`);
      toast(`Moderator ${demotingMod.full_name || demotingMod.name || ''} demoted back to user`, 'success');
      setDemoteModalOpen(false);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to demote moderator'), 'error');
    } finally {
      setDemoteLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 mb-3">Access Restricted</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Moderator management is restricted to superusers only.
          </p>
          <div className="inline-flex bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-300">
            Requires: <span className="text-red-400 ml-2">ADMIN_ONLY</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2.5">
              <Shield className="h-7 w-7 text-blue-400" />
              <span>Moderator Management</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Promote trusted users to staff moderators, configure granular permission scopes, and manage administrative privileges.
            </p>
          </div>
          <button
            id="btn-promote-user"
            onClick={() => setPromoteModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Promote User</span>
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading staff moderators..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : moderators.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No staff moderators yet"
            description="Promote an existing platform user to assign moderator roles and permission scopes."
          />
        ) : (
          <Card className="overflow-hidden border border-zinc-800">
            {/* Search filter bar */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="search-moderators"
                  type="text"
                  placeholder="Filter by name, email, or scope..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                />
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {filteredModerators.length} of {moderators.length} active moderators
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Scopes</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredModerators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        No moderators match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredModerators.map((mod) => {
                      const scopes = Array.isArray(mod.scopes) ? mod.scopes : [];
                      const displayName = mod.full_name || mod.name || 'Unnamed Moderator';

                      return (
                        <tr key={mod.id} className="hover:bg-zinc-800/30 transition-colors">
                          {/* Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="font-semibold text-zinc-100">{displayName}</div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                            {mod.email || '—'}
                          </td>

                          {/* Scopes */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {scopes.length === 0 ? (
                                <span className="text-zinc-500 italic text-xs">No scopes assigned</span>
                              ) : (
                                scopes.map((scope) => (
                                  <span
                                    key={scope}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-blue-300 border border-zinc-700/60"
                                  >
                                    {scope}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(mod)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-zinc-700 hover:border-blue-500/40 transition-colors"
                              >
                                <Edit2 className="h-3 w-3 text-blue-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => openDemoteModal(mod)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors"
                              >
                                <UserMinus className="h-3 w-3 text-red-400" />
                                <span>Demote</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* PROMOTE USER MODAL */}
      <Modal
        isOpen={promoteModalOpen}
        onClose={() => setPromoteModalOpen(false)}
        title="Promote User to Staff Moderator"
        description="Select an existing platform user account and configure their administrative permission scopes."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handlePromoteSubmit} className="space-y-5">
          {/* User Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
              <span>Select Candidate User (Role: User):</span>
              {selectedCandidate && (
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-[11px] text-blue-400 hover:underline capitalize"
                >
                  Change Selection
                </button>
              )}
            </label>

            {!selectedCandidate ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search candidate by name or email..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950/80 divide-y divide-zinc-800/60">
                  {candidatesLoading ? (
                    <div className="p-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      <span>Loading candidate users...</span>
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      No candidate users found matching &quot;{candidateSearch}&quot;.
                    </div>
                  ) : (
                    filteredCandidates.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedCandidate(u)}
                        className="p-3 hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-xs text-zinc-200 block truncate">
                              {u.full_name || 'Unnamed User'}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary" className="text-xs h-7 px-2.5">
                          Select
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-base shrink-0">
                    {(selectedCandidate.full_name || selectedCandidate.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-50">
                      {selectedCandidate.full_name || 'Unnamed User'}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">{selectedCandidate.email}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Ready to Promote
                </span>
              </div>
            )}
          </div>

          {/* Scopes Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span>Permission Scopes ({promoteScopes.length} selected):</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPromoteScopes(MODERATOR_SCOPES.map((s) => s.key))}
                  className="text-blue-400 hover:underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => setPromoteScopes([])}
                  className="text-zinc-400 hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {MODERATOR_SCOPES.map((scope) => {
                const isSelected = promoteScopes.includes(scope.key);
                return (
                  <div
                    key={scope.key}
                    onClick={() => togglePromoteScope(scope.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 text-zinc-100 ring-1 ring-blue-500/30'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-500' : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-blue-300 truncate">
                        {scope.label}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-200 mt-0.5">
                        {scope.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {scope.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPromoteModalOpen(false)}
              disabled={promoteLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedCandidate || promoteLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 shadow-lg shadow-blue-950/40 disabled:opacity-50"
            >
              {promoteLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>Confirm Promotion</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODERATOR MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Staff Moderator"
        description="Update moderator profile details and fine-tune administrative scopes."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          {/* Moderator Name & Email display */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">
                Moderator Full Name:
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">
                Email Address (Permanent):
              </label>
              <input
                type="text"
                disabled
                value={editingMod?.email || ''}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 font-mono cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Pre-filled Scopes selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span>Permission Scopes ({editScopes.length} selected):</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditScopes(MODERATOR_SCOPES.map((s) => s.key))}
                  className="text-blue-400 hover:underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => setEditScopes([])}
                  className="text-zinc-400 hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {MODERATOR_SCOPES.map((scope) => {
                const isSelected = editScopes.includes(scope.key);
                return (
                  <div
                    key={scope.key}
                    onClick={() => toggleEditScope(scope.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 text-zinc-100 ring-1 ring-blue-500/30'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-500' : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-blue-300 truncate">
                        {scope.label}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-200 mt-0.5">
                        {scope.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {scope.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={editLoading || !editName.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 shadow-lg shadow-blue-950/40"
            >
              {editLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* DEMOTE MODERATOR CONFIRM MODAL */}
      <Modal
        isOpen={demoteModalOpen}
        onClose={() => setDemoteModalOpen(false)}
        title="Demote Staff Moderator"
        description="Are you sure you want to revoke moderator privileges for this account?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
            <div className="font-bold flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Privilege Revocation</span>
            </div>
            <p className="leading-relaxed">
              Target moderator:{' '}
              <strong className="text-zinc-100">
                {demotingMod?.full_name || demotingMod?.name || demotingMod?.email}
              </strong>
              . Their account role will be reverted back to standard <strong className="text-zinc-100">User</strong> and
              all administrative permission scopes will be immediately cleared.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDemoteModalOpen(false)}
              disabled={demoteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDemoteSubmit}
              disabled={demoteLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5"
            >
              {demoteLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Confirm Demotion</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

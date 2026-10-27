import React, { useMemo, useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Crown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
  MessageSquare,
  Briefcase,
  Star,
  Activity,
  Clock,
  RefreshCw,
  Ban,
  Check,
  ChevronRight,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function AdminUsers() {
  const { data, loading, error, reload } = useApi('/admin/users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Modals state
  const [grantModalUser, setGrantModalUser] = useState(null);
  const [grantDuration, setGrantDuration] = useState(30);
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeModalUser, setRevokeModalUser] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [statusModalUser, setStatusModalUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [statusLoading, setStatusLoading] = useState(false);

  // Load live usage statistics when drawer opens
  useEffect(() => {
    if (!selectedUser) {
      setUsageData(null);
      return;
    }
    setUsageLoading(true);
    api
      .get(`/admin/users/${selectedUser.id}/usage`)
      .then((res) => {
        setUsageData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load usage data:', err);
      })
      .finally(() => {
        setUsageLoading(false);
      });
  }, [selectedUser]);

  const rawUsers = asList(data, 'users');

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return rawUsers.filter((u) => {
      const matchesSearch =
        `${u.full_name || u.name || ''} ${u.email || ''} ${u.role || ''} ${u.status || ''} ${u.plan_code || ''}`
          .toLowerCase()
          .includes(term);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rawUsers, search, roleFilter, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isPro = (planCode) => {
    if (!planCode) return false;
    return planCode.startsWith('user_pro') && planCode !== 'user_free';
  };

  const getPlanLabel = (planCode) => {
    switch (planCode) {
      case 'user_pro_monthly':
        return 'Pro Monthly';
      case 'user_pro_6m':
        return 'Pro 6 Months';
      case 'user_pro_1y':
        return 'Pro 1 Year';
      case 'user_pro':
        return 'Pro';
      default:
        return 'Free';
    }
  };

  // Status badge with green Active, amber Restricted, red Blocked
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Restricted
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Blocked
          </span>
        );
      default:
        return <Badge variant="default">{status || 'Active'}</Badge>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Moderator
          </span>
        );
      case 'lawyer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Lawyer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/40">
            User
          </span>
        );
    }
  };

  // Actions handlers
  const handleGrantPlan = async (e) => {
    e.preventDefault();
    if (!grantModalUser) return;
    setGrantLoading(true);
    try {
      const res = await api.post(`/admin/users/${grantModalUser.id}/plan`, {
        action: 'grant',
        duration_days: parseInt(grantDuration, 10),
      });
      toast(res.data.message || 'Pro plan granted successfully', 'success');
      setGrantModalUser(null);
      reload();
      if (selectedUser?.id === grantModalUser.id) {
        setSelectedUser((prev) => ({
          ...prev,
          plan_code: res.data.plan_code,
          plan_expires_at: res.data.expires_at,
        }));
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to grant plan'), 'error');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokePlan = async () => {
    if (!revokeModalUser) return;
    setRevokeLoading(true);
    try {
      const res = await api.post(`/admin/users/${revokeModalUser.id}/plan`, {
        action: 'revoke',
      });
      toast(res.data.message || 'Pro plan revoked successfully', 'success');
      setRevokeModalUser(null);
      reload();
      if (selectedUser?.id === revokeModalUser.id) {
        setSelectedUser((prev) => ({
          ...prev,
          plan_code: 'user_free',
          plan_expires_at: null,
        }));
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to revoke plan'), 'error');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleSetStatus = async (e) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setStatusLoading(true);
    try {
      const res = await api.post(`/admin/users/${statusModalUser.id}/status`, {
        status: selectedStatus,
      });
      toast(res.data.message || 'User status updated', 'success');
      setStatusModalUser(null);
      reload();
      if (selectedUser?.id === statusModalUser.id) {
        setSelectedUser((prev) => ({
          ...prev,
          status: res.data.status,
        }));
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update user status'), 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const openGrantModal = (user, e) => {
    if (e) e.stopPropagation();
    setGrantModalUser(user);
    setGrantDuration(30);
  };

  const openRevokeModal = (user, e) => {
    if (e) e.stopPropagation();
    setRevokeModalUser(user);
  };

  const openStatusModal = (user, e) => {
    if (e) e.stopPropagation();
    setStatusModalUser(user);
    setSelectedStatus(user.status || 'active');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2.5">
              <Users className="h-7 w-7 text-blue-400" />
              <span>User Management & Access Control</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Grant Pro subscriptions, inspect active usage, and enforce role-based platform restrictions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
              Total: {rawUsers.length} users
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading users..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rawUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Registered user and lawyer accounts will appear here."
          />
        ) : (
          <Card className="overflow-hidden border border-zinc-800">
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-users-search"
                  type="text"
                  placeholder="Search by name, email, plan, or status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users (Clients)</option>
                  <option value="lawyer">Lawyers</option>
                  <option value="moderator">Moderators</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Plan</th>
                    <th className="px-4 py-3.5">Messages This Month</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                        No users match the active search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userIsPro = isPro(u.plan_code);
                      const isSelected = selectedUser?.id === u.id;

                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-950/20' : 'hover:bg-zinc-800/40'
                          }`}
                        >
                          {/* User info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-sm shrink-0">
                                {(u.full_name || u.name || u.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-zinc-100 truncate">
                                  {u.full_name || u.name || 'Unnamed User'}
                                </div>
                                <div className="text-xs text-zinc-400 font-mono truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4">{getRoleBadge(u.role)}</td>

                          {/* Status */}
                          <td className="px-4 py-4">{renderStatusBadge(u.status)}</td>

                          {/* Plan */}
                          <td className="px-5 py-4">
                            {userIsPro ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <Crown className="h-3 w-3 text-amber-400" />
                                  <span>{getPlanLabel(u.plan_code)}</span>
                                </span>
                                {u.plan_expires_at && (
                                  <span className="text-[11px] text-zinc-400 font-mono">
                                    Exp: {formatDate(u.plan_expires_at)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                Free
                              </span>
                            )}
                          </td>

                          {/* Messages this month */}
                          <td className="px-4 py-4">
                            {userIsPro ? (
                              <div className="flex items-center gap-1.5 font-mono text-xs text-amber-300 font-bold">
                                <span>{u.messages_this_month || 0}</span>
                                <span className="text-zinc-500 font-normal">/</span>
                                <span className="text-base text-zinc-300 font-normal">∞</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span
                                  className={`font-semibold ${
                                    (u.messages_this_month || 0) >= 15 ? 'text-red-400' : 'text-zinc-200'
                                  }`}
                                >
                                  {u.messages_this_month || 0}
                                </span>
                                <span className="text-zinc-500">/</span>
                                <span className="text-zinc-400">15</span>
                              </div>
                            )}
                          </td>

                          {/* Actions buttons */}
                          <td className="px-5 py-4 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {userIsPro ? (
                                <button
                                  type="button"
                                  onClick={(e) => openRevokeModal(u, e)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-300 border border-red-500/20 hover:border-red-500/40 transition-colors"
                                  title="Revoke Pro Subscription"
                                >
                                  Revoke Pro
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => openGrantModal(u, e)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                                  title="Grant Pro Subscription"
                                >
                                  <Crown className="h-3 w-3 text-amber-400" />
                                  <span>Grant Pro...</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => openStatusModal(u, e)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                                title="Change User Account Status"
                              >
                                Set Status...
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

            {/* Table Footer */}
            <div className="p-3.5 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 px-6">
              <span>
                Showing {filteredUsers.length} of {rawUsers.length} users
              </span>
              <span>Click any row to open the complete Usage & Activity Drawer</span>
            </div>
          </Card>
        )}
      </div>

      {/* Backdrop overlay for Drawer */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setSelectedUser(null)}
        />
      )}

      {/* USAGE DRAWER */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-50 truncate">
                  {selectedUser.full_name || selectedUser.name || 'User Profile'}
                </h2>
                {isPro(selectedUser.plan_code) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                    <Crown className="h-3 w-3 text-amber-400" /> Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
              title="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top User Summary Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="h-14 w-14 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl font-black shrink-0">
                {(selectedUser.full_name || selectedUser.name || selectedUser.email || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-zinc-400 font-mono">
                    ID: {selectedUser.id ? selectedUser.id.slice(0, 8) : '—'}...
                  </span>
                  {renderStatusBadge(selectedUser.status)}
                </div>
                <div className="text-sm font-semibold text-zinc-200">
                  Account Role: <span className="capitalize text-zinc-400">{selectedUser.role}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Platform User since{' '}
                  {selectedUser.created_at ? formatDate(selectedUser.created_at) : 'Registration'}
                </div>
              </div>
            </div>

            {/* Current Restriction Notice if applicable */}
            {selectedUser.status === 'restricted' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Account Restricted</span>
                </div>
                <p className="leading-relaxed text-amber-200/90 pl-5">
                  This user can browse the platform and read data, but cannot book consultations, send
                  direct messages, post legal cases, or submit bids.
                </p>
              </div>
            )}

            {selectedUser.status === 'blocked' && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-red-400">
                  <XCircle className="h-4 w-4" />
                  <span>Account Blocked</span>
                </div>
                <p className="leading-relaxed text-red-200/90 pl-5">
                  This user is completely blocked from logging in. Any authentication attempt returns 403
                  Forbidden.
                </p>
              </div>
            )}

            {/* Plan Tier & Subscription Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> Plan Tier & Subscription
              </h3>
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Current Plan:</span>
                  <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                    {isPro(selectedUser.plan_code) ? (
                      <>
                        <Crown className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-amber-300">{getPlanLabel(selectedUser.plan_code)}</span>
                      </>
                    ) : (
                      <span className="text-zinc-300">Free Tier</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Subscription Expiration:</span>
                  <span className="font-mono text-zinc-200">
                    {selectedUser.plan_expires_at ? formatDate(selectedUser.plan_expires_at) : 'Never (Free)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">AI Query Allowance:</span>
                  <span className="font-semibold text-zinc-200">
                    {isPro(selectedUser.plan_code) ? 'Unlimited Queries (∞)' : '15 Queries / month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Usage & Activity Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-blue-400" /> Usage & Platform Metrics
                </h3>
                {usageLoading && (
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-400" /> Loading metrics...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Messages this month */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Messages (Month)</span>
                    <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {usageData?.messages_this_month ?? selectedUser.messages_this_month ?? 0}
                    <span className="text-xs text-zinc-500 font-normal ml-1">
                      / {isPro(selectedUser.plan_code) ? '∞' : '15'}
                    </span>
                  </div>
                </div>

                {/* Chat Sessions */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Chat Sessions</span>
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {usageData?.sessions_count ?? 0}
                  </div>
                </div>

                {/* Consultations Booked */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Bookings</span>
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {usageData?.bookings_count ?? 0}
                  </div>
                </div>

                {/* Cases Posted */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Cases Posted</span>
                    <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {usageData?.cases_count ?? 0}
                  </div>
                </div>

                {/* Reviews Given */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 col-span-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Reviews Given</span>
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <div className="text-xl font-black text-zinc-100 font-mono">
                    {usageData?.reviews_given ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-zinc-800 bg-zinc-950/90 shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              {isPro(selectedUser.plan_code) ? (
                <Button
                  variant="secondary"
                  onClick={() => openRevokeModal(selectedUser)}
                  className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold h-10 text-xs gap-1.5"
                >
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span>Revoke Pro</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => openGrantModal(selectedUser)}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold h-10 text-xs gap-1.5 shadow-lg shadow-amber-950/40"
                >
                  <Crown className="h-4 w-4" />
                  <span>Grant Pro...</span>
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={() => openStatusModal(selectedUser)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold h-10 text-xs gap-1.5 border-zinc-700"
              >
                <Shield className="h-4 w-4 text-blue-400" />
                <span>Set Status...</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GRANT PRO MODAL */}
      <Modal
        isOpen={Boolean(grantModalUser)}
        onClose={() => setGrantModalUser(null)}
        title="Grant Pro Subscription"
        description={`Upgrade ${grantModalUser?.full_name || grantModalUser?.email || 'user'} to BD Legal Guide Pro.`}
      >
        <form onSubmit={handleGrantPlan} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
              Subscription Duration:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { days: 30, label: '30 Days', desc: '1 Month' },
                { days: 180, label: '180 Days', desc: '6 Months' },
                { days: 365, label: '365 Days', desc: '1 Year' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.days}
                  onClick={() => setGrantDuration(opt.days)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    grantDuration === opt.days
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-100">{opt.label}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Included with Pro Grant:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-zinc-400 text-[11px]">
              <li>Unlimited AI legal questions per month</li>
              <li>Case Board access to post legal cases for lawyer bids</li>
              <li>Direct messaging with verified advocates</li>
              <li>Free of charge (payment logged as admin_grant)</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setGrantModalUser(null)}
              disabled={grantLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={grantLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold gap-1.5"
            >
              {grantLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              <span>Grant {grantDuration} Days Pro</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* REVOKE PRO CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(revokeModalUser)}
        onClose={() => setRevokeModalUser(null)}
        title="Revoke Pro Subscription"
        description="Are you sure you want to revert this user back to the Free tier?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
            <div className="font-bold flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Immediate Subscription Cancellation</span>
            </div>
            <p className="leading-relaxed">
              Target user: <strong className="text-zinc-100">{revokeModalUser?.full_name || revokeModalUser?.email}</strong>
              . Their active subscription will be cancelled immediately and they will be restricted to the Free plan
              limit of 15 AI messages per month.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRevokeModalUser(null)}
              disabled={revokeLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRevokePlan}
              disabled={revokeLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5"
            >
              {revokeLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Confirm Revoke</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* SET STATUS MODAL */}
      <Modal
        isOpen={Boolean(statusModalUser)}
        onClose={() => setStatusModalUser(null)}
        title="Set User Account Status"
        description={`Update platform access restrictions for ${statusModalUser?.full_name || statusModalUser?.email || 'user'}.`}
      >
        <form onSubmit={handleSetStatus} className="space-y-4">
          <div className="space-y-2.5">
            {[
              {
                id: 'active',
                title: 'Active (Full Access)',
                desc: 'Unrestricted access. Can browse, create bookings, chat with AI, send direct messages, and post cases.',
                badge: (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                ),
                color: 'border-emerald-500/40 bg-emerald-500/5',
              },
              {
                id: 'restricted',
                title: 'Restricted (Browse Only)',
                desc: 'Can read and browse directory/cases, but CANNOT create bookings, send messages, post cases, or submit bids.',
                badge: (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Restricted
                  </span>
                ),
                color: 'border-amber-500/40 bg-amber-500/5',
              },
              {
                id: 'blocked',
                title: 'Blocked (No Login)',
                desc: 'Complete lockout. The user cannot log in and authentication requests are rejected with 403 Forbidden.',
                badge: (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    Blocked
                  </span>
                ),
                color: 'border-red-500/40 bg-red-500/5',
              },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === opt.id
                    ? `${opt.color} ring-1 ring-blue-500/50`
                    : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="userStatus"
                  value={opt.id}
                  checked={selectedStatus === opt.id}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-700 bg-zinc-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-sm text-zinc-100">{opt.title}</span>
                    {opt.badge}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStatusModalUser(null)}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={statusLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5"
            >
              {statusLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Apply Status</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

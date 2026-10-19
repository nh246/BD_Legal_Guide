import React, { useMemo, useState } from 'react';
import { Users, Search, Shield, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function AdminUsers() {
  const { data, loading, error, reload } = useApi('/admin/users');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const users = useMemo(() => {
    const term = search.toLowerCase();
    return asList(data, 'users').filter((u) =>
      `${u.full_name || u.name || ''} ${u.email || ''} ${u.role || ''} ${u.status || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, search]);

  const handleAction = async (userId, updatePayload) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}`, updatePayload);
      toast('User updated successfully', 'success');
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update user'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'restricted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Restricted
          </span>
        );
      case 'blocked':
      case 'suspended':
        return <Badge variant="danger">Blocked</Badge>;
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Lawyer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
            User
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">User Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage roles, view client accounts, and control platform access permissions.
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading users..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : asList(data, 'users').length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Registered user and lawyer accounts will appear here."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-users-search"
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-50">
                          {u.full_name || u.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              defaultValue=""
                              disabled={actionLoading === u.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                if (val === 'activate') handleAction(u.id, { status: 'active' });
                                else if (val === 'restrict') handleAction(u.id, { status: 'restricted' });
                                else if (val === 'block') handleAction(u.id, { status: 'blocked' });
                                else if (val === 'make_mod') handleAction(u.id, { role: 'moderator' });
                                else if (val === 'remove_mod') handleAction(u.id, { role: 'user' });
                                e.target.value = '';
                              }}
                              className="text-xs bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="" disabled>
                                Actions...
                              </option>
                              <option value="activate">Activate</option>
                              <option value="restrict">Restrict</option>
                              <option value="block">Block</option>
                              {u.role !== 'moderator' && <option value="make_mod">Make Moderator</option>}
                              {u.role === 'moderator' && <option value="remove_mod">Remove Moderator</option>}
                            </select>

                            {/* Quick Toggle Buttons */}
                            {u.status === 'blocked' ? (
                              <button
                                onClick={() => handleAction(u.id, { status: 'active' })}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              >
                                Activate
                              </button>
                            ) : u.status === 'restricted' ? (
                              <button
                                onClick={() => handleAction(u.id, { status: 'active' })}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(u.id, { status: 'blocked' })}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                Block
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
  );
}

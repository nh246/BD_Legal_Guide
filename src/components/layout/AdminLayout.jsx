import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  Activity,
  Users,
  Shield,
  Scale,
  FileText,
  Cpu,
  CreditCard,
  History,
  Lock,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * adminOnly: visible to role "admin" only.
 * scope:     moderators see the link only if user.scopes includes it. Admins see everything.
 */
export const ADMIN_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: Activity, scope: 'analytics:view', exact: true },
  { path: '/admin/users', label: 'Users', icon: Users, scope: 'users:view' },
  { path: '/admin/lawyers', label: 'Lawyers', icon: Scale, scope: 'lawyers:view' },
  { path: '/admin/queries', label: 'Queries', icon: FileText, scope: 'queries:view' },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard, scope: 'payments:view' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: History, scope: 'audit:view' },
  { path: '/admin/moderators', label: 'Moderators', icon: Shield, adminOnly: true },
  { path: '/admin/llm-config', label: 'LLM Config', icon: Cpu, adminOnly: true },
];

export function canSeeLink(user, link) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (link.adminOnly) return false;
  if (user.role !== 'moderator') return false;
  const scopes = Array.isArray(user.scopes)
    ? user.scopes.map((s) => (typeof s === 'string' ? s.toLowerCase().trim() : ''))
    : [];
  if (!link.scope) return true;
  return scopes.includes(link.scope.toLowerCase().trim());
}

export default function AdminLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  const visibleLinks = ADMIN_LINKS.filter((link) => canSeeLink(user, link));

  // Determine if the current route is the admin root (/admin or /admin/)
  const isRootAdmin = location.pathname === '/admin' || location.pathname === '/admin/';

  // Find the link matching the current route (longest match first)
  const currentLink = [...ADMIN_LINKS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((link) => (link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path)));

  const isAuthorized = !currentLink || canSeeLink(user, currentLink);
  const missing = currentLink?.adminOnly ? 'ADMIN_ONLY' : currentLink?.scope;

  // Default admin route redirect: send moderator to FIRST permitted module
  if (isRootAdmin && !canSeeLink(user, ADMIN_LINKS[0])) {
    if (visibleLinks.length > 0) {
      return <Navigate to={visibleLinks[0].path} replace />;
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col md:flex-row">

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 shrink-0 flex flex-col gap-1">

        <div className="mb-4 px-2 pb-3 border-b border-zinc-800/80 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-100 block leading-tight">
              Legal Bridge
            </span>
            <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase block">
              Admin
            </span>
          </div>
        </div>

        <div className="mb-6 px-2">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            {user?.role === 'admin' ? 'Superuser' : 'Moderator'}
          </div>
          <div className="text-sm font-medium text-zinc-300 truncate">
            {user?.name || user?.email}
          </div>
        </div>

        {visibleLinks.length === 0 && (
          <div className="px-3 py-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
            <Shield className="h-5 w-5 text-zinc-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-400 font-medium">No modules assigned yet.</p>
            <p className="text-[11px] text-zinc-500">Contact your administrator.</p>
          </div>
        )}

        {visibleLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.exact}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <link.icon className="h-4 w-4" /> {link.label}
          </NavLink>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {visibleLinks.length === 0 && isRootAdmin ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-50 mb-2">No Modules Assigned Yet</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                No modules assigned yet. Contact your administrator.
              </p>
              <div className="inline-flex bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-400">
                Contact: administrator
              </div>
            </div>
          </div>
        ) : !isAuthorized ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-50 mb-3">Access Restricted</h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                You do not have the required permissions to view this module.
              </p>
              <div className="inline-flex bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-300">
                Requires: <span className="text-red-400 ml-2">{missing}</span>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>

    </div>
  );
}

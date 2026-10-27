import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
const ADMIN_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: Activity, scope: 'ANALYTICS_VIEW', exact: true },
  { path: '/admin/users', label: 'Users', icon: Users, scope: 'USER_MANAGEMENT' },
  { path: '/admin/moderators', label: 'Moderators', icon: Shield, adminOnly: true },
  { path: '/admin/lawyers', label: 'Lawyers', icon: Scale, scope: 'VERIFICATION_REVIEW' },
  { path: '/admin/queries', label: 'Queries', icon: FileText, scope: 'QUERY_LOG_VIEW' },
  { path: '/admin/llm-config', label: 'LLM Config', icon: Cpu, adminOnly: true },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard, adminOnly: true },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: History, scope: 'AUDIT_LOG_VIEW' },
];

export function canSeeLink(user, link) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (link.adminOnly) return false;
  if (user.role !== 'moderator') return false;
  const scopes = Array.isArray(user.scopes) ? user.scopes : [];
  return !link.scope || scopes.includes(link.scope);
}

export default function AdminLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  const visibleLinks = ADMIN_LINKS.filter((link) => canSeeLink(user, link));

  // Find the link matching the current route (longest match first)
  const currentLink = [...ADMIN_LINKS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((link) => (link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path)));

  const isAuthorized = !currentLink || canSeeLink(user, currentLink);
  const missing = currentLink?.adminOnly ? 'ADMIN_ONLY' : currentLink?.scope;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col md:flex-row">

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 shrink-0 flex flex-col gap-1">

        <div className="mb-6 px-2">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            {user?.role === 'admin' ? 'Superuser' : 'Moderator'}
          </div>
          <div className="text-sm font-medium text-zinc-300 truncate">
            {user?.name || user?.email}
          </div>
        </div>

        {visibleLinks.length === 0 && (
          <p className="px-3 text-xs text-zinc-500 italic">No modules assigned to your account.</p>
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
        {!isAuthorized ? (
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

import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import useAdminStore, { PERMISSIONS } from '../../store/useAdminStore';
import { 
  Shield, 
  Users, 
  FileText, 
  MessageSquareWarning, 
  Building2, 
  Activity, 
  Flag, 
  Lock 
} from 'lucide-react';

const ADMIN_LINKS = [
  { path: '/admin', label: 'Overview', icon: Activity, scope: 'ANALYTICS_VIEW', exact: true },
  { path: '/admin/verifications', label: 'Verifications', icon: Shield, scope: 'VERIFICATION_REVIEW' },
  { path: '/admin/users', label: 'Users', icon: Users, scope: 'USER_MANAGEMENT' },
  { path: '/admin/queries', label: 'Query Logs', icon: FileText, scope: 'QUERY_LOG_VIEW' },
  { path: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning, scope: 'COMPLAINT_HANDLING' },
  { path: '/admin/firms', label: 'Firms', icon: Building2, scope: 'FIRM_MANAGEMENT' },
  { path: '/admin/moderation', label: 'Moderation', icon: Flag, scope: 'CONTENT_MODERATION' },
];

export default function AdminLayout() {
  const { adminRole, hasScope, getCurrentActor } = useAdminStore();
  const location = useLocation();

  // Find if current route requires a specific scope
  const currentLink = ADMIN_LINKS.find(link => 
    link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path)
  );

  let isAuthorized = true;
  let missingScope = null;

  if (currentLink && !hasScope(currentLink.scope)) {
    isAuthorized = false;
    missingScope = currentLink.scope;
  }

  // Admin only routes that aren't in the sidebar per se (Moderators, Audit Logs)
  // We'll add them to the sidebar only for ADMIN
  if ((location.pathname.startsWith('/admin/moderators') || location.pathname.startsWith('/admin/audit-logs')) && adminRole !== 'ADMIN') {
    isAuthorized = false;
    missingScope = 'SUPERUSER_ONLY';
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 shrink-0 flex flex-col gap-1">
        
        <div className="mb-6 px-2">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            {adminRole === 'ADMIN' ? 'Superuser' : 'Moderator'}
          </div>
          <div className="text-sm font-medium text-zinc-300">
            {getCurrentActor()}
          </div>
        </div>

        {ADMIN_LINKS.filter(link => hasScope(link.scope)).map(link => (
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

        {adminRole === 'ADMIN' && (
          <>
            <div className="my-4 border-t border-zinc-800"></div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Administration</div>
            <NavLink
              to="/admin/moderators"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="h-4 w-4" /> Staff Management
            </NavLink>
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="h-4 w-4" /> Audit Logs
            </NavLink>
          </>
        )}
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
                Requires: <span className="text-red-400 ml-2">{missingScope}</span>
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

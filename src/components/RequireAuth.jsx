import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { toast } from '../store/useToastStore';

/**
 * Route guard. Renders children (or <Outlet/>) only for authenticated users
 * whose role is in `roles` (if provided).
 */
export default function RequireAuth({ roles = [], children }) {
  const { user, token, fetchMe } = useAuthStore();
  const location = useLocation();
  // Only show the spinner if we have a token but no user yet
  const [checking, setChecking] = useState(!user && Boolean(token));

  useEffect(() => {
    let active = true;
    if (!user && token) {
      fetchMe().finally(() => active && setChecking(false));
    } else {
      setChecking(false);
    }
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const denied = Boolean(user && roles.length > 0 && !roles.includes(user.role));

  useEffect(() => {
    if (denied) toast('Access denied', 'error');
  }, [denied]);

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (denied) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}

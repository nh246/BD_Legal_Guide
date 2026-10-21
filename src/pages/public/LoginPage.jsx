import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Scale, AlertTriangle, Sparkles } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import { homeForRole } from '../../lib/roles';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : homeForRole(user?.role), { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    try {
      const loggedUser = await login(demoEmail, 'Password123!');
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : homeForRole(loggedUser?.role), { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <Scale className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Welcome back</h1>
          <p className="text-zinc-400">Log in to BD Legal Guide AI</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div id="login-error" role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Input
                id="login-email"
                label="Email"
                type="email"
                autoComplete="email"
                iconLeft={Mail}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="login-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                iconLeft={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                id="login-submit"
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={!email || !password}
              >
                Log In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Demo Logins Section */}
        <div className="mt-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>One-Click Demo Logins</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Password: Password123!</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('free_user@bdlegal.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">Free Client</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">FREE</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">free_user@bdlegal.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pro_user@bdlegal.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300">Pro Client</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">PRO</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">pro_user@bdlegal.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('free_lawyer@bdlegal.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">Free Lawyer</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">BASIC</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">free_lawyer@bdlegal.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pro_lawyer@bdlegal.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">Verified Lawyer</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">GOLD</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">pro_lawyer@bdlegal.ai</p>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}

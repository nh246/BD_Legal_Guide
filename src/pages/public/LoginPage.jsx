import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Scale, AlertTriangle } from 'lucide-react';
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

        <p className="text-center text-sm text-zinc-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}

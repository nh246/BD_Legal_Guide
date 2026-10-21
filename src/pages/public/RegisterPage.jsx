import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Scale, AlertTriangle } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import { homeForRole } from '../../lib/roles';

// Self-registration is only allowed for clients and lawyers.
// Admin/moderator accounts are created by an admin; firms are an Enterprise module.
const ACCOUNT_TYPES = [
  { id: 'user', title: 'Client', desc: 'I need legal guidance', icon: User },
  { id: 'lawyer', title: 'Lawyer', desc: 'I provide legal services', icon: Briefcase },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading } = useAuthStore();
  const initialRole = searchParams.get('role') === 'lawyer' ? 'lawyer' : 'user';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: initialRole });
  const [error, setError] = useState(null);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'lawyer' || r === 'user') {
      setForm((f) => ({ ...f, role: r }));
    }
  }, [searchParams]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    try {
      const user = await register({
        full_name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(homeForRole(user?.role || form.role), { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const canSubmit = form.name && form.email && form.password && form.confirm;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <Scale className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Join BD Legal Guide AI</h1>
          <p className="text-zinc-400">Create your account to continue.</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div id="register-error" role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-zinc-300 block mb-1.5">Account type</span>
                <div className="grid grid-cols-2 gap-3">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      id={`register-role-${t.id}`}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: t.id }))}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        form.role === t.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <t.icon className={`h-5 w-5 mb-2 ${form.role === t.id ? 'text-blue-400' : 'text-zinc-500'}`} />
                      <div className="text-sm font-semibold text-zinc-50">{t.title}</div>
                      <div className="text-xs text-zinc-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Input id="register-name" label="Full name" iconLeft={User} placeholder="Your name" value={form.name} onChange={update('name')} autoComplete="name" />
              <Input id="register-email" label="Email" type="email" iconLeft={Mail} placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="email" />
              <Input id="register-password" label="Password" type="password" iconLeft={Lock} placeholder="At least 8 characters" value={form.password} onChange={update('password')} autoComplete="new-password" />
              <Input id="register-confirm" label="Confirm password" type="password" iconLeft={Lock} placeholder="Repeat password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" />

              <Button id="register-submit" type="submit" className="w-full" isLoading={loading} disabled={!canSubmit}>
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Scale, AlertTriangle, Sparkles, Copy, ExternalLink, Info, AlertCircle, Check } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useAuthStore from '../../store/useAuthStore';
import { homeForRole } from '../../lib/roles';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(() => {
    return new URLSearchParams(location.search).get('forgot') === 'true';
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [demoResetUrl, setDemoResetUrl] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
      });
      setForgotSubmitted(true);
      if (res.data?.reset_url) {
        setDemoResetUrl(res.data.reset_url);
      } else {
        toast('If an account exists, a reset link has been sent.', 'success');
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to process password reset request'), 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCopyResetLink = () => {
    const fullLink = `${window.location.origin}${demoResetUrl}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast('Reset link copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <Scale className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Welcome back</h1>
          <p className="text-zinc-400">Log in to Legal Bridge</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              <PasswordInput
                id="login-password"
                label="Password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  id="link-forgot-password"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotSubmitted(false);
                    setDemoResetUrl('');
                    setCopied(false);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

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

        {/* Forgot Password Modal */}
        <Modal
          isOpen={isForgotModalOpen}
          onClose={() => {
            setIsForgotModalOpen(false);
            setForgotSubmitted(false);
            setDemoResetUrl('');
          }}
          title="Reset your password"
          description="Enter your registered email and we'll help you reset your password."
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {!forgotSubmitted ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  id="forgot-email"
                  label="Account Email"
                  type="email"
                  autoComplete="email"
                  iconLeft={Mail}
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={forgotLoading}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    id="btn-send-reset-link"
                    isLoading={forgotLoading}
                    disabled={forgotLoading || !forgotEmail}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Always show neutral message for privacy */}
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    If an account exists for this email, a reset link has been generated.
                  </span>
                </div>

                {/* Demo Mode Dev Box */}
                {demoResetUrl && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>DEMO MODE — no email server configured.</span>
                    </div>

                    <p className="text-xs text-zinc-300">
                      In production, this link would be emailed to the user. For testing and development, you can open or copy the generated link below:
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}${demoResetUrl}`}
                        id="demo-reset-link-input"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 font-mono select-all outline-none"
                      />
                      <Button
                        type="button"
                        id="btn-copy-reset-link"
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyResetLink}
                        className="text-xs gap-1.5 shrink-0"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Link'}</span>
                      </Button>
                    </div>

                    <div className="pt-1">
                      <Button
                        type="button"
                        id="btn-open-reset-page"
                        size="sm"
                        onClick={() => {
                          setIsForgotModalOpen(false);
                          navigate(demoResetUrl);
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Reset Page
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSubmitted(false);
                      setDemoResetUrl('');
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

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
              onClick={() => handleQuickLogin('free_user@legalbridge.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">Free Client</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">FREE</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">free_user@legalbridge.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pro_user@legalbridge.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300">Pro Client</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">PRO</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">pro_user@legalbridge.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('free_lawyer@legalbridge.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">Free Lawyer</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">BASIC</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">free_lawyer@legalbridge.ai</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pro_lawyer@legalbridge.ai')}
              className="text-left p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">Verified Lawyer</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">GOLD</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate font-mono">pro_lawyer@legalbridge.ai</p>
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

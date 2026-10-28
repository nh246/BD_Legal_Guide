import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Scale, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [success, setSuccess] = useState(false);

  const isLengthValid = newPassword.length >= 8;
  const isMatch = Boolean(confirmPassword && newPassword === confirmPassword);
  const isMismatch = Boolean(confirmPassword && newPassword !== confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorStatus(null);

    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });

      setSuccess(true);
      toast('Password reset successful. You can now log in.', 'success');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const errCode = err.response?.data?.error;
      if (errCode === 'invalid_or_expired_token' || err.response?.status === 400) {
        setErrorStatus('invalid_or_expired');
        toast('This reset link is invalid or has expired.', 'error');
      } else {
        const msg = getErrorMessage(err, 'Failed to reset password');
        toast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <Scale className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Reset Password</h1>
          <p className="text-zinc-400 text-sm">Create a new secure password for your account</p>
        </div>

        {/* Case 1: Missing Token from URL */}
        {!token ? (
          <Card className="border-zinc-800">
            <CardContent className="p-6 sm:p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Invalid reset link</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  The password reset token is missing from this link. Please request a new reset link.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="secondary" className="w-full gap-2 text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : errorStatus === 'invalid_or_expired' ? (
          /* Case 2: Invalid or Expired Token Error Card */
          <Card className="border-red-500/30 bg-red-950/10">
            <CardContent className="p-6 sm:p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-300">Link Invalid or Expired</h2>
                <p className="text-sm text-zinc-300 mt-1">
                  This reset link is invalid or has expired.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login?forgot=true">
                  <Button id="btn-request-new-link" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm">
                    Request a new link
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : success ? (
          /* Case 3: Success Confirmation */
          <Card className="border-emerald-500/30 bg-emerald-950/10">
            <CardContent className="p-6 sm:p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-300">Password Reset Successful!</h2>
                <p className="text-sm text-zinc-300 mt-1">
                  Your password has been updated. Redirecting you to login...
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs">
                    Go to Login Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Case 4: Reset Password Form */
          <Card className="border-zinc-800">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <PasswordInput
                    id="reset-new-password"
                    label="New Password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    {newPassword.length === 0 ? (
                      <span className="text-zinc-500">Must be at least 8 characters.</span>
                    ) : isLengthValid ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Good password length (8+ characters)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> At least {8 - newPassword.length} more character{8 - newPassword.length > 1 ? 's' : ''} required
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <PasswordInput
                    id="reset-confirm-password"
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs">
                      {isMatch ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                        </span>
                      ) : isMismatch ? (
                        <span className="text-red-400 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    id="btn-submit-reset-password"
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 shadow-sm"
                    isLoading={loading}
                    disabled={loading || !newPassword || !confirmPassword || isMismatch || !isLengthValid}
                  >
                    Reset Password
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card, { CardContent } from './Card';
import Button from './Button';
import PasswordInput from './PasswordInput';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function SecurityCard({ className = '' }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isLengthValid = newPassword.length >= 8;
  const isMatch = Boolean(confirmPassword && newPassword === confirmPassword);
  const isMismatch = Boolean(confirmPassword && newPassword !== confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      toast('Please enter your current password', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
    } catch (err) {
      if (err.response?.data?.error === 'current_password_incorrect') {
        toast('Current password is incorrect', 'error');
        setErrorMsg('Current password is incorrect.');
      } else {
        const msg = getErrorMessage(err, 'Failed to update password');
        toast(msg, 'error');
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`border-zinc-800 ${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Card Header */}
        <div className="pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-bold text-zinc-50">Security & Password</h3>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Ensure your account is protected with a secure password of at least 8 characters.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <PasswordInput
              id="security-current-password"
              label="Current Password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              required
            />
          </div>

          {/* New Password */}
          <div>
            <PasswordInput
              id="security-new-password"
              label="New Password"
              placeholder="Enter new password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              required
            />

            {/* Simple strength hint */}
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              {newPassword.length === 0 ? (
                <span className="text-zinc-500">Hint: Use 8 or more characters for a strong password.</span>
              ) : isLengthValid ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Good password length (8+ characters)
                </span>
              ) : (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Needs at least {8 - newPassword.length} more character{8 - newPassword.length > 1 ? 's' : ''} (min. 8 chars)
                </span>
              )}
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <PasswordInput
              id="security-confirm-password"
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              required
            />

            {/* Match hint */}
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
              id="btn-update-password"
              type="submit"
              isLoading={loading}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || isMismatch || !isLengthValid}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 shadow-sm"
            >
              Update Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { User, Save, ArrowLeft, Award, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import CheckoutModal from '../../components/ui/CheckoutModal';
import { useApi } from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';

export default function LawyerProfilePage() {
  const { data, loading, error, reload } = useApi('/lawyer/me');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bio: '',
    bar_council_no: '',
    years_exp: '',
    hourly_rate: '',
    specializations: '',
  });
  const [saving, setSaving] = useState(false);

  // Verification Checkout State (TASK 3)
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({
    isOpen: false,
    payment_id: null,
    amount: 999,
    product_name: 'Gold Verification Badge',
  });

  // Handle URL query params on mount for status=success|failed|cancelled (TASK 3)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      if (statusParam === 'success') {
        toast.success('Verification payment successful! Badge activated.');
        reload();
      } else if (statusParam === 'failed') {
        toast.error('Payment failed. Please try again.');
      } else if (statusParam === 'cancelled') {
        toast.warning('Payment cancelled.');
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      newParams.delete('reason');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate, reload]);

  useEffect(() => {
    if (data) {
      setFormData({
        bio: data.bio || '',
        bar_council_no: data.bar_council_no || data.barId || '',
        years_exp: data.years_exp || data.experience || '',
        hourly_rate: data.hourly_rate || data.rate || '',
        specializations: Array.isArray(data.specializations)
          ? data.specializations.join(', ')
          : (data.specializations || data.specialties || ''),
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/lawyer/me', {
        ...formData,
        hourly_rate: Number(formData.hourly_rate) || 0,
        years_exp: Number(formData.years_exp) || 0,
      });
      toast.success('Your advocate profile information has been saved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  // Buy Gold Verification Handler (TASK 3)
  const handleBuyVerification = async () => {
    setCheckoutLoading(true);
    try {
      const res = await api.post('/lawyer/verification-purchase');
      const paymentId = res.data?.payment_id;
      if (paymentId) {
        setCheckoutModal({
          isOpen: true,
          payment_id: paymentId,
          amount: 999,
          product_name: 'Gold Verification Badge',
        });
      } else {
        toast.error('Failed to initiate verification checkout.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to purchase verification badge.'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <LoadingState message="Loading lawyer profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const isVerified = Boolean(data?.verification_paid || data?.verification_status === 'approved');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/lawyer"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-50 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-50">Lawyer Profile</h1>
              <p className="text-zinc-400 text-sm">Update your public details and credentials</p>
            </div>
          </div>
        </div>

        {/* TASK 3: Gold Verification Banner / Status Card */}
        <div className="mb-6">
          {isVerified ? (
            <Card className="bg-emerald-950/20 border-emerald-500/30 p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-300 flex items-center gap-2">
                      Bar Council Gold Verified Badge Active
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Your profile displays the verified badge and receives priority placement in directory searches.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-zinc-900 border-amber-500/30 p-5 shadow-xl shadow-amber-950/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                      Gold Verification Badge
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        999 BDT One-Time
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 max-w-lg">
                      Stand out from thousands of advocates with a verified trust badge, top search ranking, and priority consultation routing.
                    </p>
                  </div>
                </div>

                <Button
                  id="buy-gold-verification-btn"
                  type="button"
                  variant="primary"
                  disabled={checkoutLoading}
                  isLoading={checkoutLoading}
                  onClick={handleBuyVerification}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Buy Gold Verification
                </Button>
              </div>
            </Card>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                    Bangladesh Bar Council No.
                  </label>
                  <Input
                    name="bar_council_no"
                    placeholder="e.g. BD-2021-892"
                    value={formData.bar_council_no}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                    Years of Experience
                  </label>
                  <Input
                    name="years_exp"
                    type="number"
                    placeholder="e.g. 8"
                    value={formData.years_exp}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                    Hourly Consultation Rate (BDT)
                  </label>
                  <Input
                    name="hourly_rate"
                    type="number"
                    placeholder="e.g. 2500"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                    Specializations (comma-separated)
                  </label>
                  <Input
                    name="specializations"
                    placeholder="e.g. Criminal Law, Family Law, Property"
                    value={formData.specializations}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                  Professional Bio
                </label>
                <Textarea
                  name="bio"
                  rows={4}
                  placeholder="Summarize your legal practice and background..."
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Global Checkout Modal */}
        <CheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
          payment_id={checkoutModal.payment_id}
          amount={checkoutModal.amount}
          product_name={checkoutModal.product_name}
          onSuccess={() => reload()}
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { User, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { useApi } from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import { useToastStore } from '../../store/useToastStore';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';

export default function LawyerProfilePage() {
  const { data, loading, error, reload } = useApi('/lawyer/me');
  const addToast = useToastStore((state) => state.addToast);

  const [formData, setFormData] = useState({
    bio: '',
    bar_council_no: '',
    years_exp: '',
    hourly_rate: '',
    specializations: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        bio: data.bio || '',
        bar_council_no: data.bar_council_no || data.barId || '',
        years_exp: data.years_exp || data.experience || '',
        hourly_rate: data.hourly_rate || data.rate || '',
        specializations: Array.isArray(data.specializations)
          ? data.specializations.join(', ')
          : (data.specializations || data.specialties || '')
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
        years_exp: Number(formData.years_exp) || 0
      });
      addToast({
        title: 'Profile updated',
        description: 'Your advocate profile information has been saved.',
        variant: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Update failed',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
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
      </div>
    </div>
  );
}

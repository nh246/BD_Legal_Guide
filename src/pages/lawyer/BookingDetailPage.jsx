import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Check, Clock, X, User, FileText, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useApi } from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import { useToastStore } from '../../store/useToastStore';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: req, loading, error, reload } = useApi(`/lawyer/requests/${id}`);
  const [meetLink, setMeetLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleUpdateStatus = async (status) => {
    try {
      setSubmitting(true);
      await api.patch(`/lawyer/requests/${id}`, {
        status,
        meet_link: meetLink || undefined
      });
      addToast({
        title: status === 'confirmed' ? 'Booking Confirmed' : 'Booking Declined',
        description: status === 'confirmed' ? 'Meeting link sent to client.' : 'Request has been declined.',
        variant: status === 'confirmed' ? 'success' : 'default'
      });
      navigate('/lawyer');
    } catch (err) {
      addToast({
        title: 'Action failed',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <LoadingState message="Loading booking request details..." />
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

  if (!req) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <EmptyState
          icon={AlertCircle}
          title="Booking request not found"
          description="The requested booking could not be located."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/lawyer')}
        />
      </div>
    );
  }

  const clientName = req.client_name || req.clientName || req.user?.name || 'Client';
  const clientEmail = req.client_email || req.clientEmail || req.user?.email || '';
  const dateStr = req.date || req.scheduled_at || 'Date pending';
  const timeStr = req.time || '';
  const brief = req.brief || req.case_brief || req.notes || 'No description provided.';
  const currentStatus = req.status || 'pending';

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-zinc-50">Review Booking Request</h1>
            <span
              className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                currentStatus === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : currentStatus === 'declined'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        <Card className="p-6 md:p-8 border-blue-500/20 shadow-xl shadow-blue-900/10 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-400 font-medium mb-6 bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">
            <Clock className="h-4 w-4" /> Requested for: {dateStr} {timeStr ? `at ${timeStr}` : ''}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                <User className="h-3.5 w-3.5" /> Client Information
              </div>
              <p className="text-lg font-semibold text-zinc-50">{clientName}</p>
              {clientEmail && <p className="text-sm text-zinc-400">{clientEmail}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                <FileText className="h-3.5 w-3.5" /> Case Brief
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-zinc-300 leading-relaxed text-sm">
                {brief}
              </div>
            </div>
          </div>
        </Card>

        {currentStatus === 'pending' && (
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">Accept & Send Link</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Provide a Google Meet or Zoom link to confirm this consultation.
            </p>

            <div className="space-y-4">
              <Input
                iconLeft={Video}
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={submitting || !meetLink.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  <Check className="h-4 w-4" /> Confirm & Send Link
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateStatus('declined')}
                  disabled={submitting}
                  className="flex-1 gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                >
                  <X className="h-4 w-4" /> Decline Request
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

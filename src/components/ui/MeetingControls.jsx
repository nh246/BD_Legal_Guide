import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  PhoneOff,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Star,
  Send,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export function normalizeMeetingUrl(link) {
  if (!link) return '';
  const trimmed = String(link).trim();
  if (/^https?:\/\//i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[+0-9\s-]+$/.test(trimmed)) {
    return `tel:${trimmed.replace(/\s+/g, '')}`;
  }
  return `https://${trimmed}`;
}

export default function MeetingControls({
  booking,
  isLawyer = false,
  currentUserId,
  onBookingUpdate,
  onOpenReviewModal,
  compact = false,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [now, setNow] = useState(Date.now());

  const isStarted = Boolean(booking?.meeting_started_at);
  const isEnded = Boolean(booking?.meeting_ended_at);
  const isActive = isStarted && !isEnded;

  // Live timer interval
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive, booking?.meeting_started_at]);

  if (!booking) return null;

  // Calculate live elapsed time
  let formattedTime = '00:00';
  if (isActive && booking.meeting_started_at) {
    const startMs = new Date(booking.meeting_started_at).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const handleStartMeeting = async () => {
    setLoadingAction('start');
    try {
      const res = await api.post(`/bookings/${booking.id}/start-meeting`);
      toast('Meeting started! Live timer is now active.', 'success');
      onBookingUpdate?.(res.data);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to start meeting'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExtendMeeting = async () => {
    setLoadingAction('extend');
    try {
      const res = await api.post(`/bookings/${booking.id}/extend-meeting`);
      toast('Meeting extended by 30 minutes!', 'success');
      onBookingUpdate?.(res.data);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg =
        errorData?.message ||
        (typeof errorData?.detail === 'object' ? errorData?.detail?.message : errorData?.detail) ||
        getErrorMessage(err, 'Failed to extend meeting');
      toast(errorMsg, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEndMeeting = async () => {
    setLoadingAction('end');
    try {
      const res = await api.post(`/bookings/${booking.id}/end-meeting`);
      toast('Meeting ended. You can now request consultation completion.', 'info');
      onBookingUpdate?.(res.data);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to end meeting'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestCompletion = async () => {
    setLoadingAction('request-completion');
    try {
      const res = await api.post(`/bookings/${booking.id}/request-completion`);
      toast('Completion requested! Waiting for the other party to confirm.', 'success');
      onBookingUpdate?.(res.data);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to request completion'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmCompletion = async () => {
    setLoadingAction('confirm-completion');
    try {
      const res = await api.post(`/bookings/${booking.id}/confirm-completion`);
      toast('Consultation completed successfully!', 'success');
      onBookingUpdate?.(res.data);
      if (onOpenReviewModal && !res.data?.has_reviewed) {
        onOpenReviewModal(res.data);
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to confirm completion'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // State 1: Booking is Completed
  if (booking.status === 'completed') {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 ${
          compact
            ? 'py-1'
            : 'p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl shadow-lg'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Consultation Completed</span>
        </div>

        {onOpenReviewModal && !booking.has_reviewed && (
          <button
            type="button"
            onClick={() => onOpenReviewModal(booking)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>Leave a Review</span>
          </button>
        )}
      </div>
    );
  }

  // State 2: Booking is Completion Requested
  if (booking.status === 'completion_requested') {
    const isRequester =
      (currentUserId && booking.completion_requester_id === currentUserId) ||
      (booking.completion_requested_by
        ? (isLawyer ? booking.completion_requested_by === 'lawyer' : booking.completion_requested_by === 'client')
        : false);

    return (
      <div
        className={`flex flex-wrap items-center gap-3 ${
          compact
            ? 'py-1'
            : 'p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl shadow-lg'
        }`}
      >
        {isRequester ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/80 text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-zinc-500 animate-pulse" />
            <span>Waiting for the other party to confirm...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirmCompletion}
            disabled={loadingAction === 'confirm-completion'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loadingAction === 'confirm-completion' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Confirm Completion</span>
          </button>
        )}
      </div>
    );
  }

  // State 3: Confirmed with Meeting Ended -> Show "Request Completion"
  if (booking.status === 'confirmed' && isEnded) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 ${
          compact
            ? 'py-1'
            : 'p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl shadow-lg'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/80 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
          <span>Meeting Ended</span>
        </div>

        <button
          type="button"
          onClick={handleRequestCompletion}
          disabled={loadingAction === 'request-completion'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {loadingAction === 'request-completion' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>Request Completion</span>
        </button>
      </div>
    );
  }

  // Only confirmed bookings have active meeting controls
  if (booking.status !== 'confirmed') {
    return null;
  }


  const meetingLink = booking.meeting_link;
  const normalizedLink = normalizeMeetingUrl(meetingLink);

  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 ${
        compact
          ? 'py-1'
          : 'p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl shadow-lg'
      }`}
    >
      {/* 1. Green "Join Meeting" Button (if link exists) */}
      {meetingLink && (
        <a
          href={normalizedLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-emerald-600/20 shrink-0"
        >
          <Video className="h-4 w-4" />
          <span>Join Meeting</span>
          <ExternalLink className="h-3 w-3 opacity-80" />
        </a>
      )}

      {/* 2. Blue "Start Meeting" Button (if not yet started) */}
      {!isStarted && (
        <button
          type="button"
          onClick={handleStartMeeting}
          disabled={loadingAction === 'start'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {loadingAction === 'start' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          <span>Start Meeting</span>
        </button>
      )}

      {/* 3. Active Meeting: Live Timer Chip */}
      {isActive && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs md:text-sm font-semibold shadow-sm shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Meeting in progress: {formattedTime}</span>
          {(booking.extended_minutes || 0) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +{booking.extended_minutes}m extended
            </span>
          )}
        </div>
      )}

      {/* 4. Active Meeting: Lawyer "Extend +30 min" Button */}
      {isActive && isLawyer && (
        <button
          type="button"
          onClick={handleExtendMeeting}
          disabled={loadingAction === 'extend'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {loadingAction === 'extend' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          <span>Extend +30 min</span>
        </button>
      )}

      {/* 5. Active Meeting: Red "End Meeting" Button */}
      {isActive && (
        <button
          type="button"
          onClick={handleEndMeeting}
          disabled={loadingAction === 'end'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs md:text-sm transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {loadingAction === 'end' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PhoneOff className="h-3.5 w-3.5" />
          )}
          <span>End Meeting</span>
        </button>
      )}
    </div>
  );
}

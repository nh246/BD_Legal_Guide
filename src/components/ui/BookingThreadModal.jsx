import React, { useState, useEffect, useCallback } from 'react';
import { X, Video, ShieldCheck, MessageSquare, User } from 'lucide-react';
import DirectMessageThread from './DirectMessageThread';
import CaseDiscussionModal from './CaseDiscussionModal';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function BookingThreadModal({
  isOpen,
  onClose,
  booking: initialBooking,
  currentUser,
  onReviewClick,
  isLawyerView = false,
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync state with prop
  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  // If passed booking has only an ID, hydrate it via GET /bookings/{id}
  useEffect(() => {
    if (isOpen && initialBooking?.id && (!initialBooking.lawyer_id || !initialBooking.user_id)) {
      api
        .get(`/bookings/${initialBooking.id}`)
        .then((res) => {
          if (res.data) setBooking((prev) => ({ ...prev, ...res.data }));
        })
        .catch(() => {});
    }
  }, [isOpen, initialBooking]);

  const effectiveIsLawyer = Boolean(isLawyerView || currentUser?.role === 'lawyer');
  const lawyerId = booking?.lawyer_id || booking?.lawyerId;
  const citizenId = booking?.user_id || booking?.citizen_id || booking?.userId;
  const isCaseBoard = Boolean(booking?.case_id && booking?.bid_id);
  const isCompleted = booking?.status === 'completed';

  const loadMessages = useCallback(async () => {
    if (!isOpen || isCaseBoard) return;
    setLoading(true);
    setError(null);
    try {
      if (effectiveIsLawyer) {
        if (!citizenId) return;
        const res = await api.get(`/messages/lawyer/thread/${citizenId}`);
        const list = res.data?.thread || res.data?.messages || res.data || [];
        if (Array.isArray(list)) setMessages(list);
      } else {
        if (!lawyerId) return;
        const res = await api.get(`/messages/lawyer/${lawyerId}`);
        const list = res.data?.messages || res.data || [];
        if (Array.isArray(list)) setMessages(list);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load messages.'));
    } finally {
      setLoading(false);
    }
  }, [isOpen, lawyerId, citizenId, isCaseBoard, effectiveIsLawyer]);

  useEffect(() => {
    if (isOpen && !isCaseBoard) {
      loadMessages();
      const interval = setInterval(() => {
        if (effectiveIsLawyer && citizenId) {
          api
            .get(`/messages/lawyer/thread/${citizenId}`)
            .then((res) => {
              const list = res.data?.thread || res.data?.messages || res.data || [];
              if (Array.isArray(list)) setMessages(list);
            })
            .catch(() => {});
        } else if (!effectiveIsLawyer && lawyerId) {
          api
            .get(`/messages/lawyer/${lawyerId}`)
            .then((res) => {
              const list = res.data?.messages || res.data || [];
              if (Array.isArray(list)) setMessages(list);
            })
            .catch(() => {});
        }
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
      setError(null);
    }
  }, [isOpen, lawyerId, citizenId, isCaseBoard, effectiveIsLawyer, loadMessages]);

  if (!isOpen || !booking) return null;

  // If this booking has case_id and bid_id, delegate to CaseDiscussionModal
  if (isCaseBoard) {
    return (
      <CaseDiscussionModal
        isOpen={isOpen}
        onClose={onClose}
        caseItem={{
          id: booking.case_id,
          title: booking.case_title || 'Case Discussion',
          status: booking.status === 'completed' ? 'closed' : 'assigned',
          category: booking.category || 'Legal Consultation',
          user_name: booking.client_name || booking.user_name || 'Client',
        }}
        bid={{
          id: booking.bid_id,
          status: booking.bid_status || (booking.status === 'completed' ? 'completed' : 'accepted'),
          lawyer_name: booking.lawyer_name || 'Advocate',
        }}
        currentUser={currentUser}
        isLawyerView={effectiveIsLawyer}
      />
    );
  }

  const recipientName = effectiveIsLawyer
    ? (booking.client_name || booking.user_name || booking.userName || 'Client')
    : (booking.lawyer_name || booking.lawyerName || 'Advocate');

  const meetLink = booking.meet_link || booking.meeting_link;

  const handleSendMessage = async ({ content, attachmentAssetIds }) => {
    try {
      if (effectiveIsLawyer) {
        if (!citizenId) return;
        const res = await api.post(`/messages/lawyer/reply/${citizenId}`, {
          content: content || '',
          attachment_asset_ids: attachmentAssetIds || [],
        });
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
        } else {
          loadMessages();
        }
      } else {
        if (!lawyerId) return;
        const res = await api.post(`/messages/lawyer/${lawyerId}`, {
          content: content || '',
          attachment_asset_ids: attachmentAssetIds || [],
        });
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
        } else {
          loadMessages();
        }
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'booking_completed') {
        toast('This consultation is completed. Thread is read-only.', 'info');
      } else {
        toast(getErrorMessage(err, 'Failed to send message.'), 'error');
      }
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header Banner */}
        <div className="p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <MessageSquare className="h-3 w-3" /> Consultation Thread
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {isCompleted ? 'Completed' : 'Confirmed'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate">
              {recipientName}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5 truncate">
              {effectiveIsLawyer ? (
                <>
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>Citizen Consultation Client</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verified Bar Council Advocate</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Join Video Call</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thread Component */}
        <div className="flex-1 overflow-hidden min-h-[420px] max-h-[620px] flex flex-col">
          <DirectMessageThread
            messages={messages}
            currentUserId={currentUser?.id}
            recipientName={recipientName}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
            onRetry={loadMessages}
            isReadOnly={isCompleted}
            isLawyerView={effectiveIsLawyer}
            readOnlyMessage="Consultation completed. This thread is read-only."
            placeholder={`Write a message to ${recipientName}...`}
            booking={booking}
            onOpenReviewModal={onReviewClick}
          />
        </div>
      </div>
    </div>
  );
}

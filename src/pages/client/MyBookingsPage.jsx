import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Video, FileText, X, CheckCircle2, Calendar, MessageSquare, CreditCard, Clock, Star, Briefcase } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import CompletePaymentModal from '../../components/ui/CompletePaymentModal';
import ReviewModal from '../../components/ui/ReviewModal';
import BookingThreadModal from '../../components/ui/BookingThreadModal';
import CaseDiscussionModal from '../../components/ui/CaseDiscussionModal';
import {
  isUpcoming,
  isPast,
  isCancelled,
  formatSlot,
  chatAllowed,
  isCaseBoardBooking,
  getBookingDateStr,
} from '../../utils/bookings';
import useAuthStore from '../../store/useAuthStore';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function MyBookingsPage() {
  const { user } = useAuthStore();
  const { data, loading, error, reload } = useApi('/bookings/mine');
  const bookings = asList(data, 'bookings');

  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Thread & Case Discussion modal states
  const [threadModalBooking, setThreadModalBooking] = useState(null);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [caseDiscussionCase, setCaseDiscussionCase] = useState(null);
  const [caseDiscussionBid, setCaseDiscussionBid] = useState(null);
  const [isCaseDiscussionOpen, setIsCaseDiscussionOpen] = useState(false);

  const handleOpenCaseDiscussion = (b) => {
    setCaseDiscussionCase({
      id: b.case_id,
      title: b.case_title || 'Case Discussion',
      status: 'assigned',
      category: 'Case Matter',
    });
    setCaseDiscussionBid({
      id: b.bid_id,
      lawyer_name: b.lawyer_name || b.lawyerName || 'Advocate',
    });
    setIsCaseDiscussionOpen(true);
  };

  const handleOpenThread = (b) => {
    setThreadModalBooking(b);
    setIsThreadModalOpen(true);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === 'upcoming') return isUpcoming(b);
      if (activeTab === 'past') return isPast(b);
      if (activeTab === 'cancelled') return isCancelled(b);
      return false;
    });
  }, [bookings, activeTab]);

  const getInitials = (name = '') =>
    name
      .replace('Adv. ', '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'L';

  const formatDateEnGB = (dateVal) => {
    if (!dateVal) return 'Date to be confirmed';
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRequestCompletion = async (bookingId) => {
    if (!bookingId) return;
    setActionLoading(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/request-completion`);
      toast('Completion requested. Waiting for lawyer confirmation.', 'info');
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to request completion'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCompletion = async (bookingId) => {
    if (!bookingId) return;
    setActionLoading(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/confirm-completion`);
      toast('Consultation completed! Please leave a review.', 'success');
      reload();
      if (res.data) {
        setReviewModalBooking(res.data);
        setIsReviewModalOpen(true);
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to confirm completion'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status, booking) => {
    switch (status) {
      case 'awaiting_payment':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPaymentModalBooking(booking);
              setIsPaymentModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors cursor-pointer shadow-sm animate-pulse"
            title="Click to complete payment"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Action Required: Pay</span>
          </button>
        );
      case 'payment_submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Payment Under Review</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'completion_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Completion Requested</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending Confirmation
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 capitalize">
            {status || 'pending'}
          </span>
        );
    }
  };

  const cancelBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}`, { status: 'cancelled' });
      toast('Booking cancelled', 'info');
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Could not cancel booking'), 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">My Consultations</h1>
          <p className="text-zinc-500 font-medium">Manage your video consultation bookings.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-none">
          {['upcoming', 'past', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium whitespace-nowrap capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab} Consultations
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState label="Loading consultations..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={`No ${activeTab} bookings`}
            description={
              activeTab === 'upcoming'
                ? 'You have no upcoming consultations scheduled. Book a lawyer from the directory.'
                : activeTab === 'past'
                ? 'You have not completed any consultations yet.'
                : 'You have no cancelled consultations.'
            }
            action={
              activeTab === 'upcoming' ? (
                <Link
                  to="/client/lawyers"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Find Lawyers
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const lawyerName = booking.lawyer_name || booking.lawyerName || 'Advocate';
              return (
                <div
                  key={booking.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-zinc-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-lg border border-blue-500/20">
                      {getInitials(lawyerName)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-zinc-50">{lawyerName}</h3>
                        {isCaseBoardBooking(booking) && (
                          <Link
                            to="/client/cases"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                            title="View on Case Board"
                          >
                            <Briefcase className="h-3 w-3" />
                            <span>Case Board</span>
                          </Link>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mb-2 flex items-center gap-2 font-mono">
                        <span>{formatDateEnGB(getBookingDateStr(booking))}</span>
                        <span>•</span>
                        <span>{formatSlot(booking)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(booking.status, booking)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    {booking.status === 'awaiting_payment' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalBooking(booking);
                            setIsPaymentModalOpen(true);
                          }}
                          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-amber-600/20 transition-colors cursor-pointer"
                        >
                          <CreditCard className="h-4 w-4" /> Pay Now ৳{booking.fee || 2000}
                        </button>

                        {isCaseBoardBooking(booking) && (
                          <button
                            type="button"
                            onClick={() => handleOpenCaseDiscussion(booking)}
                            className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4 text-blue-400" /> Discuss Case
                          </button>
                        )}
                      </>
                    )}

                    {chatAllowed(booking) && (
                      <button
                        type="button"
                        onClick={() => handleOpenThread(booking)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" /> Open Thread
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleOpenThread(booking)}
                        className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-zinc-400" /> Open Thread
                      </button>
                    )}

                    {booking.case_brief || booking.caseBrief ? (
                      <button
                        onClick={() => setSelectedBrief(booking)}
                        className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-zinc-500" /> View brief
                      </button>
                    ) : null}

                    {booking.status === 'completion_requested' && (
                      booking.completion_requested_by === 'client' ? (
                        <span className="text-xs text-zinc-400 italic">Waiting for lawyer to confirm...</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmCompletion(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Confirm Completion
                        </button>
                      )
                    )}

                    {booking.status === 'confirmed' && booking.meeting_ended_at && (
                      <button
                        type="button"
                        onClick={() => handleRequestCompletion(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-colors"
                      >
                        Request Completion
                      </button>
                    )}

                    {booking.status === 'completed' && !booking.has_reviewed && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalBooking(booking);
                          setIsReviewModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Leave Review
                      </button>
                    )}

                    {(booking.status === 'pending' || booking.status === 'awaiting_payment') && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="flex items-center gap-2 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    )}

                    {chatAllowed(booking) && (booking.meet_link || booking.meeting_link) && (
                      <a
                        href={booking.meet_link || booking.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-colors bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      >
                        <Video className="h-4 w-4" /> Join Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Brief Modal */}
      {selectedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBrief(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-50">Case Brief</h2>
                <p className="text-sm text-zinc-400 mt-1">Submitted for {selectedBrief.lawyer_name || selectedBrief.lawyerName}</p>
              </div>
              <button
                onClick={() => setSelectedBrief(null)}
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-6">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedBrief.case_brief || selectedBrief.caseBrief}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-400">
                You securely shared this brief when booking. It helps the lawyer prepare for your consultation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Payment Modal */}
      <CompletePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentModalBooking(null);
        }}
        booking={paymentModalBooking}
        onPaymentSubmitted={() => {
          reload();
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewModalBooking(null);
        }}
        booking={reviewModalBooking}
        revieweeName={reviewModalBooking?.lawyer_name || reviewModalBooking?.lawyerName || 'Advocate'}
        onReviewSubmitted={() => {
          reload();
        }}
      />

      {/* Booking Direct Message Thread Modal */}
      <BookingThreadModal
        isOpen={isThreadModalOpen}
        onClose={() => {
          setIsThreadModalOpen(false);
          setThreadModalBooking(null);
        }}
        booking={threadModalBooking}
        currentUser={user}
        onReviewClick={(b) => {
          setIsThreadModalOpen(false);
          setReviewModalBooking(b);
          setIsReviewModalOpen(true);
        }}
      />

      {/* Case Discussion Modal */}
      <CaseDiscussionModal
        isOpen={isCaseDiscussionOpen}
        onClose={() => {
          setIsCaseDiscussionOpen(false);
          setCaseDiscussionCase(null);
          setCaseDiscussionBid(null);
        }}
        caseItem={caseDiscussionCase}
        bid={caseDiscussionBid}
        currentUser={user}
        isLawyerView={false}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Gavel, Star, Check, X, Clock, AlertCircle, ArrowRight, UserCheck, ShieldCheck, MessageSquare } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { LoadingState } from './PageStates';
import CaseDiscussionModal from './CaseDiscussionModal';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

export default function CaseBidsList({
  isOpen,
  onClose,
  caseId,
  onBidAccepted,
  onBidRejected,
}) {
  const { user } = useAuthStore();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'
  const [discussionBid, setDiscussionBid] = useState(null);

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/cases/${caseId}`);
      setCaseData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load case details.'));
    } finally {
      setLoading(false);
    }
  }, [caseId, isOpen]);

  useEffect(() => {
    if (isOpen && caseId) {
      fetchCaseDetails();
    } else {
      setCaseData(null);
      setError(null);
    }
  }, [isOpen, caseId, fetchCaseDetails]);

  const handleAcceptBid = async (bid) => {
    setActionLoadingId(bid.id);
    setActionType('accept');
    try {
      const res = await api.post(`/cases/${caseId}/bids/${bid.id}/accept`);
      if (res.data?.booking_status === 'confirmed') {
        toast('Bid accepted! Free consultation booking confirmed.', 'success');
      } else {
        toast('Bid accepted! Booking created. Proceed to payment.', 'success');
      }
      if (onBidAccepted) {
        onBidAccepted({
          bookingId: res.data?.booking_id,
          caseId,
          bidId: bid.id,
          bookingStatus: res.data?.booking_status,
          fee: res.data?.fee,
        });
      }
      onClose();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to accept bid.'), 'error');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleRejectBid = async (bid) => {
    setActionLoadingId(bid.id);
    setActionType('reject');
    try {
      await api.post(`/cases/${caseId}/bids/${bid.id}/reject`);
      toast('Bid rejected.', 'info');
      // Update local state to reflect rejection
      setCaseData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bids: (prev.bids || []).map((b) =>
            b.id === bid.id ? { ...b, status: 'rejected' } : b
          ),
        };
      });
      if (onBidRejected) {
        onBidRejected(bid.id);
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to reject bid.'), 'error');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const bids = caseData?.bids || [];
  const caseTitle = caseData?.title || 'Case Bids';
  const isCaseOpen = caseData?.status === 'open';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={caseTitle}
      description={
        caseData
          ? `Category: ${caseData.category} • Status: ${caseData.status?.toUpperCase()} • ${bids.length} proposal(s) received`
          : 'Review lawyer proposals and proposed fees.'
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8">
            <LoadingState label="Loading advocate proposals..." />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-sm">
            <p>{error}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchCaseDetails}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <Gavel className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-zinc-100">No Bids Received Yet</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Verified Gold advocates are reviewing open cases on the board. You will receive an in-app notification when a lawyer submits a pitch.
            </p>
          </div>
        ) : (
          bids.map((bid) => {
            const isPending = bid.status === 'pending';
            const isAccepted = bid.status === 'accepted';
            const isRejected = bid.status === 'rejected';
            const isActing = actionLoadingId === bid.id;
            const rating = bid.lawyer_avg_rating ?? 5.0;

            return (
              <div
                key={bid.id}
                className={`border rounded-xl p-4 sm:p-5 transition-all ${
                  isAccepted
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isRejected
                    ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Top Row: Lawyer Info & Proposed Fee */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center justify-center font-bold text-base shadow-sm">
                      {bid.lawyer_avatar_asset_id ? (
                        <img
                          src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${bid.lawyer_avatar_asset_id}/file`}
                          alt={bid.lawyer_name || 'Lawyer'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{(bid.lawyer_name || 'Advocate')[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-zinc-100">
                          {bid.lawyer_name || 'Advocate'}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <ShieldCheck className="h-3 w-3 text-amber-400" /> Gold Verified
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{Number(rating).toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span>Bangladesh Bar Council</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Fee Callout */}
                  <div className="sm:text-right bg-zinc-950/60 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-zinc-800 flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">
                      Proposed Fee
                    </span>
                    {bid.proposed_fee != null ? (
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                        ৳{Number(bid.proposed_fee).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Fee: To be discussed
                      </span>
                    )}
                  </div>
                </div>

                {/* Pitch Message */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3.5 text-sm text-zinc-300 leading-relaxed my-3 font-normal">
                  <p className="text-xs uppercase font-semibold text-zinc-500 mb-1 tracking-wider">
                    Lawyer's Pitch & Strategy
                  </p>
                  <p className="italic text-zinc-200">
                    "{bid.pitch_message}"
                  </p>
                </div>

                {/* Status or Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/40">
                  <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      Submitted {bid.created_at ? new Date(bid.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Discuss Outline Button */}
                    <button
                      type="button"
                      onClick={() => setDiscussionBid(bid)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Discuss</span>
                    </button>

                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Check className="h-3.5 w-3.5" />
                        <span>Accepted Proposal</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <X className="h-3 w-3" />
                        <span>Rejected</span>
                      </span>
                    ) : isCaseOpen && isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectBid(bid)}
                          disabled={isActing}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isActing && actionType === 'reject' ? 'Rejecting...' : 'Reject Bid'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptBid(bid)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isActing && actionType === 'accept' ? 'Accepting...' : 'Accept Bid'}</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">
                        {caseData?.status === 'assigned'
                          ? 'Case assigned to another lawyer'
                          : 'Not available for action'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end pt-3 border-t border-zinc-800/60 mt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      {discussionBid && (
        <CaseDiscussionModal
          isOpen={Boolean(discussionBid)}
          onClose={() => setDiscussionBid(null)}
          caseItem={caseData}
          bid={discussionBid}
          currentUser={user}
          isLawyerView={false}
        />
      )}
    </Modal>
  );
}

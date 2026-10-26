import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Gavel, Calendar, Clock, CheckCircle2, ChevronRight, FileText, ArrowRight, ShieldCheck, Sparkles, Filter, CreditCard, MessageSquare, Video } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import PostCaseModal from '../../components/ui/PostCaseModal';
import CaseBidsList from '../../components/ui/CaseBidsList';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
import CompletePaymentModal from '../../components/ui/CompletePaymentModal';
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
import useApi from '../../lib/useApi';
import useAuthStore from '../../store/useAuthStore';
import { asList } from '../../lib/api';

export default function MyCasesPage() {
  const { user, token } = useAuthStore();
  const { data: subData } = useApi(token ? '/subscriptions/mine' : null);
  const { data: casesData, loading, error, reload } = useApi('/cases/mine');

  const cases = asList(casesData, 'cases');

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'open', 'assigned'
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);

  // In-place payment and discussion states (kills the maze)
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [discussionCase, setDiscussionCase] = useState(null);
  const [discussionBid, setDiscussionBid] = useState(null);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

  const handleOpenDiscussion = (c, b) => {
    setDiscussionCase(c);
    setDiscussionBid(b || (c.bids || []).find((x) => x.status === 'accepted') || { id: c.bid_id, lawyer_name: c.booking_lawyer_name || 'Advocate' });
    setIsDiscussionOpen(true);
  };

  const handleOpenPayment = (c, b) => {
    const fee = c.booking_fee ?? b?.proposed_fee ?? 2000;
    const lName = c.booking_lawyer_name || b?.lawyer_name || 'Advocate';
    const lId = c.booking_lawyer_id || b?.lawyer_profile_id;
    setPaymentBooking({
      id: c.booking_id,
      fee: fee,
      lawyer_name: lName,
      lawyer_id: lId,
      status: c.booking_status || 'awaiting_payment',
    });
    setIsPaymentOpen(true);
  };

  const isPro = Boolean(
    user?.is_pro ||
    user?.plan?.startsWith('user_pro') ||
    (subData?.status === 'active' && subData?.plan_code?.startsWith('user_pro'))
  );

  const handlePostCaseClick = () => {
    if (isPro) {
      setIsPostModalOpen(true);
    } else {
      setIsPaywallOpen(true);
    }
  };

  const handleViewBids = (caseId) => {
    setSelectedCaseId(caseId);
    setIsBidsModalOpen(true);
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (activeFilter === 'open') return c.status === 'open';
      if (activeFilter === 'assigned') return c.status === 'assigned';
      return true;
    });
  }, [cases, activeFilter]);

  const openCasesCount = cases.filter((c) => c.status === 'open').length;
  const totalBidsCount = cases.reduce((acc, c) => acc + (c.bids?.length || c.bid_count || 0), 0);

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold text-zinc-50">Legal Case Board</h1>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-medium">
                Pro Network
              </span>
            </div>
            <p className="text-zinc-400 mt-1 text-sm">
              Post legal matters to the board and receive competitive fee proposals from Gold Verified advocates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              id="btn-post-case"
              onClick={handlePostCaseClick}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Post a New Case</span>
            </Button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Cases</p>
                <p className="text-2xl font-bold text-zinc-50">{cases.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Open for Bidding</p>
                <p className="text-2xl font-bold text-zinc-50">{openCasesCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Proposals Received</p>
                <p className="text-2xl font-bold text-zinc-50">{totalBidsCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'open'
                  ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Open ({openCasesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'assigned'
                  ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Assigned ({cases.length - openCasesCount})
            </button>
          </div>
        </div>

        {/* Case List Content */}
        {loading ? (
          <LoadingState label="Loading your cases..." />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : filteredCases.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={activeFilter === 'all' ? 'No cases posted yet' : `No ${activeFilter} cases found`}
            description="Post your legal situation to the Case Board to receive competitive fee pitches from Gold Verified advocates."
            action={
              <Button onClick={handlePostCaseClick} className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
                <Plus className="h-4 w-4" /> Post a Case
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => {
              const isOpen = caseItem.status === 'open';
              const isAssigned = caseItem.status === 'assigned';
              const bidCount = caseItem.bid_count ?? (caseItem.bids?.length || 0);
              const acceptedBid = (caseItem.bids || []).find((b) => b.status === 'accepted');
              const assignedLawyerName = acceptedBid?.lawyer_name;

              return (
                <Card
                  key={caseItem.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700/80 transition-all p-6 space-y-4"
                >
                  {/* Card Top: Badges & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-800 text-blue-400 border border-zinc-700">
                        {caseItem.category} Law
                      </span>

                      {isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Open for Bids</span>
                        </span>
                      ) : isAssigned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Assigned</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Posted {formatDate(caseItem.created_at)}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold text-zinc-50 hover:text-blue-400 transition-colors">
                      {caseItem.title}
                    </h3>
                    <p className="text-sm text-zinc-300 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {caseItem.description}
                    </p>
                  </div>

                  {/* Attachments if any */}
                  {caseItem.attachment_asset_ids?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 border border-zinc-800/80 rounded-lg px-3 py-2 w-fit">
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>{caseItem.attachment_asset_ids.length} attached document(s)</span>
                    </div>
                  )}

                  {/* Card Bottom: Bids summary & actions */}
                  <div className="pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Status info */}
                    <div>
                      {isAssigned ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          <span>Assigned to {assignedLawyerName || 'Advocate'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Gavel className="h-4 w-4 text-zinc-500" />
                          <span>
                            {bidCount === 0
                              ? 'No advocate proposals yet'
                              : `${bidCount} advocate proposal(s) available`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
                      {isAssigned && (
                        <>
                          {caseItem.booking_status === 'awaiting_payment' ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 font-semibold shadow-lg shadow-amber-600/20"
                                onClick={() => handleOpenPayment(caseItem, acceptedBid)}
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Pay Now ৳{caseItem.booking_fee ?? acceptedBid?.proposed_fee ?? 2000}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5 text-zinc-300 hover:text-white"
                                onClick={() => handleOpenDiscussion(caseItem, acceptedBid)}
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Discuss Case
                              </Button>
                            </>
                          ) : caseItem.booking_status === 'payment_submitted' ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Payment Under Review</span>
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5 text-zinc-300 hover:text-white"
                                onClick={() => handleOpenDiscussion(caseItem, acceptedBid)}
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Discuss Case
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 font-semibold shadow-sm"
                                onClick={() => handleOpenDiscussion(caseItem, acceptedBid)}
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Open Thread
                              </Button>

                              {caseItem.booking_meeting_link && (
                                <a
                                  href={caseItem.booking_meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                >
                                  <Video className="h-3.5 w-3.5" /> Join Meeting
                                </a>
                              )}
                            </>
                          )}
                        </>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleViewBids(caseItem.id)}
                        className={`gap-1.5 ${
                          isOpen && bidCount > 0
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        <span>View Bids ({bidCount})</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Case Modal */}
      <PostCaseModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSuccess={() => {
          reload();
        }}
      />

      {/* Case Bids List Modal */}
      <CaseBidsList
        isOpen={isBidsModalOpen}
        onClose={() => {
          setIsBidsModalOpen(false);
          setSelectedCaseId(null);
        }}
        caseId={selectedCaseId}
        onBidAccepted={() => {
          reload();
        }}
        onBidRejected={() => {
          reload();
        }}
      />

      {/* Pro Paywall Modal */}
      <ProPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        message="Posting cases to the Case Board is a Pro feature. Upgrade to post legal cases and receive competitive bids from Gold Verified advocates."
        onSuccess={() => {
          setIsPaywallOpen(false);
          setIsPostModalOpen(true);
        }}
      />

      {/* Complete Payment Modal */}
      <CompletePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentBooking(null);
        }}
        booking={paymentBooking}
        onPaymentSubmitted={() => {
          reload();
        }}
      />

      {/* Case Discussion Modal */}
      <CaseDiscussionModal
        isOpen={isDiscussionOpen}
        onClose={() => {
          setIsDiscussionOpen(false);
          setDiscussionCase(null);
          setDiscussionBid(null);
        }}
        caseItem={discussionCase}
        bid={discussionBid}
        currentUser={user}
        isLawyerView={false}
      />
    </div>
  );
}

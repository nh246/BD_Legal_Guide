import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  ShieldCheck,
  BadgeCheck,
  Clock,
  Share2,
  Calendar as CalendarIcon,
  CheckCircle2,
  GraduationCap,
  Languages,
  FileText,
  MessageSquare,
  Lock,
  Phone,
  Send,
  RefreshCw,
  Video,
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
import DirectMessageThread from '../../components/ui/DirectMessageThread';
import MeetingControls from '../../components/ui/MeetingControls';
import ReviewModal from '../../components/ui/ReviewModal';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function LawyerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const { data: lawyer, loading, error, reload } = useApi(id ? `/lawyers/${id}` : null);
  const { data: assetsData } = useApi(id ? `/users/${id}/assets` : null);

  const assets = asList(assetsData, 'assets');
  const avatarAsset = assets.find((a) => a.kind === 'avatar');
  const verificationDocs = assets.filter((a) => a.kind === 'verification');

  const [plan, setPlan] = useState('user_free');
  const [bookingStatus, setBookingStatus] = useState(null); // 'none' | 'confirmed' | 'completed' | ...
  const [activeBooking, setActiveBooking] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  useEffect(() => {
    api
      .get('/chat/usage')
      .then((r) => setPlan(r.data.plan || 'user_free'))
      .catch(() => setPlan('user_free'));
  }, []);

  const fetchReviews = () => {
    if (!id) return;
    setReviewsLoading(true);
    api
      .get(`/lawyers/${id}/reviews`)
      .then((r) => {
        setReviewsList(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch reviews', err);
      })
      .finally(() => {
        setReviewsLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const fetchMyBookings = () => {
    if (!token || !user || !id) {
      setBookingStatus('none');
      setActiveBooking(null);
      return;
    }
    api
      .get('/bookings/mine')
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data?.bookings || [];
        const matching = list.filter((b) => String(b.lawyer_id) === String(id));
        const active = matching.find((b) => b.meeting_started_at && !b.meeting_ended_at);
        const confirmed = matching.find((b) => b.status === 'confirmed');
        const best = active || confirmed || matching[0] || null;
        setActiveBooking(best);

        if (matching.some((b) => b.status === 'confirmed')) {
          setBookingStatus('confirmed');
        } else if (matching.some((b) => b.status === 'completed')) {
          setBookingStatus('completed');
        } else if (matching.length > 0) {
          setBookingStatus(matching[0].status || 'pending');
        } else {
          setBookingStatus('none');
        }
      })
      .catch(() => {
        setBookingStatus('none');
        setActiveBooking(null);
      });
  };

  useEffect(() => {
    fetchMyBookings();
  }, [token, user, id]);

  useEffect(() => {
    if (!activeBooking?.meeting_started_at || activeBooking?.meeting_ended_at) return;
    const interval = setInterval(fetchMyBookings, 5000);
    return () => clearInterval(interval);
  }, [activeBooking?.meeting_started_at, activeBooking?.meeting_ended_at]);

  const isPro = plan && plan !== 'user_free';
  const isConfirmed = bookingStatus === 'confirmed';
  const isCompleted = bookingStatus === 'completed';
  const isLocked = !isPro && !isConfirmed && !isCompleted;
  const isReadOnly = !isPro && isCompleted;

  const [activeTab, setActiveTab] = useState('about');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Direct messaging states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState(
    'You can message this lawyer once your booking is confirmed. Upgrade to Pro for direct access.'
  );
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const loadThread = async () => {
    if (!id || isLocked) return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const res = await api.get(`/messages/lawyer/${id}`);
      const list = res.data?.messages || res.data || [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.response?.status === 403) {
        const code = err.response.data?.error;
        if (code === 'booking_completed') {
          setBookingStatus('completed');
        } else if (code === 'no_booking') {
          setShowMessageModal(false);
          const errorMsg =
            err.response.data?.message ||
            'You can message this lawyer once your booking is confirmed. Upgrade to Pro for direct access.';
          setPaywallMessage(errorMsg);
          setShowPaywallModal(true);
          toast(errorMsg, 'info');
        } else {
          setMessagesError(getErrorMessage(err, 'Access restricted.'));
        }
      } else if (err.response?.status === 402) {
        setShowMessageModal(false);
        const errorMsg =
          err.response.data?.message ||
          'You can message this lawyer once your booking is confirmed. Upgrade to Pro for direct access.';
        setPaywallMessage(errorMsg);
        setShowPaywallModal(true);
        toast(errorMsg, 'error');
      } else {
        setMessagesError(getErrorMessage(err, 'Failed to load message thread.'));
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  // Periodic poll while thread modal is open
  useEffect(() => {
    if (!showMessageModal || !id || isLocked) return;
    const interval = setInterval(() => {
      api
        .get(`/messages/lawyer/${id}`)
        .then((res) => {
          const list = res.data?.messages || res.data || [];
          if (Array.isArray(list)) setMessages(list);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [showMessageModal, id, isLocked]);

  const handleOpenMessaging = () => {
    if (!token || !user) {
      navigate(`/login?redirect=/client/lawyers/${id}`);
      return;
    }

    if (isLocked) {
      const msg =
        'You can message this lawyer once your booking is confirmed. Upgrade to Pro for direct access.';
      toast(msg, 'info');
      setPaywallMessage(msg);
      setShowPaywallModal(true);
      return;
    }

    setShowMessageModal(true);
    loadThread();
  };

  const handleSendMessage = async ({ content, attachmentAssetIds }) => {
    try {
      const res = await api.post(`/messages/lawyer/${id}`, {
        content: content || '',
        attachment_asset_ids: attachmentAssetIds || [],
      });
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        loadThread();
      }
      toast('Message sent', 'success');
    } catch (err) {
      if (err.response?.status === 403) {
        const code = err.response.data?.error;
        if (code === 'booking_completed') {
          setBookingStatus('completed');
          toast('This consultation is completed. Thread is read-only.', 'error');
        } else if (code === 'no_booking') {
          setShowMessageModal(false);
          const errorMsg =
            err.response.data?.message ||
            'You can message this lawyer once your booking is confirmed. Upgrade to Pro for direct access.';
          setPaywallMessage(errorMsg);
          setShowPaywallModal(true);
          toast(errorMsg, 'error');
        } else {
          toast(getErrorMessage(err, 'Failed to send message'), 'error');
        }
      } else {
        toast(getErrorMessage(err, 'Failed to send message'), 'error');
      }
      throw err;
    }
  };

  const getInitials = (name = '') =>
    name
      .replace('Adv. ', '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'L';

  const maskBarId = (barId) => {
    if (!barId) return 'BC-****21';
    const parts = barId.split('-');
    if (parts.length === 3) return `${parts[0]}-****-${parts[2].slice(-2)}`;
    return 'BC-****21';
  };

  const getSlotStatus = (day, time) => {
    const availability = Array.isArray(lawyer?.availability) ? lawyer.availability : [];
    const slot = availability.find((a) => a.day === day && a.time === time);
    return slot ? slot.status : 'available';
  };

  const handleSlotClick = (day, time) => {
    const status = getSlotStatus(day, time);
    if (status === 'available') {
      if (selectedSlot?.day === day && selectedSlot?.time === time) {
        setSelectedSlot(null);
      } else {
        setSelectedSlot({ day, time });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-8">
        <LoadingState label="Loading lawyer profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-8">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-8 flex flex-col items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Lawyer not found"
          description="The lawyer profile you requested could not be located."
          action={
            <Link to="/client/lawyers" className="text-blue-500 hover:underline text-sm font-medium">
              Return to directory
            </Link>
          }
        />
      </div>
    );
  }

  const specialties = Array.isArray(lawyer.specialties)
    ? lawyer.specialties
    : lawyer.specialty
    ? [lawyer.specialty]
    : [];
  const locations = Array.isArray(lawyer.locations) ? lawyer.locations : [lawyer.location || 'Dhaka'];
  const languages = Array.isArray(lawyer.languages) ? lawyer.languages : ['Bangla', 'English'];
  const education = Array.isArray(lawyer.education) ? lawyer.education : ['LL.B., University of Dhaka'];
  const reviews = reviewsList;
  const rateBdt = lawyer.rateBdt || lawyer.rate || lawyer.hourly_rate || 2000;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative shrink-0 self-start">
                <div
                  className={`h-24 w-24 sm:h-32 sm:w-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-zinc-950 shadow-xl overflow-hidden ${
                    lawyer.tier === 'gold' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-600/10 text-blue-500'
                  }`}
                >
                  {avatarAsset ? (
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${avatarAsset.id}/file`}
                      alt={lawyer.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(lawyer.name)
                  )}
                </div>
                {/* Avatar Presence Dot */}
                <span
                  className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-zinc-900 ${
                    lawyer.presence_status === 'in_consultation'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-green-400'
                  }`}
                  title={
                    lawyer.presence_status === 'in_consultation'
                      ? 'In Consultation — Currently in a meeting. Replies may be delayed.'
                      : 'Available'
                  }
                />
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 flex items-center gap-2 mb-1.5">
                      {lawyer.name}
                      {lawyer.tier === 'gold' ? (
                        <ShieldCheck className="h-7 w-7 text-amber-500 shrink-0" title="Gold Verified" />
                      ) : (
                        <BadgeCheck className="h-7 w-7 text-blue-500 shrink-0" title="Verified" />
                      )}
                    </h1>

                    {/* Presence Status Indicator */}
                    <div className="flex items-center gap-2 mb-2">
                      {lawyer.presence_status === 'in_consultation' ? (
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold cursor-help"
                          title="Currently in a meeting. Replies may be delayed."
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                          </span>
                          <span>In Consultation</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-amber-300/80 font-normal">Replies may be delayed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-green-400 text-xs font-medium">
                          <span className="h-2 w-2 rounded-full bg-green-400"></span>
                          <span>Available</span>
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-medium text-zinc-400 mb-4 font-mono">
                      {maskBarId(lawyer.bar_id || lawyer.barId)}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-zinc-500" /> {locations.join(', ')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Languages className="h-4 w-4 text-zinc-500" /> {languages.join(', ')}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="h-4 w-4" /> Responds in ~2 hrs
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-xl">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const ratingNum =
                            lawyer.avg_rating !== null && lawyer.avg_rating !== undefined
                              ? Number(lawyer.avg_rating)
                              : 5.0;
                          const fillPct = Math.max(0, Math.min(1, ratingNum - (starVal - 1)));
                          return (
                            <div key={starVal} className="relative">
                              <Star className="h-4 w-4 text-zinc-700" />
                              {fillPct > 0 && (
                                <div
                                  className="absolute inset-0 overflow-hidden"
                                  style={{ width: `${fillPct * 100}%` }}
                                >
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span className="font-bold text-zinc-50 text-sm">
                        {lawyer.avg_rating !== null && lawyer.avg_rating !== undefined
                          ? Number(lawyer.avg_rating).toFixed(1)
                          : 'New'}
                      </span>
                      <span className="text-xs text-zinc-400">
                        ({reviewsList.length || lawyer.review_count || 0})
                      </span>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <span className="text-2xl font-bold text-zinc-50">৳{rateBdt.toLocaleString()}</span>
                      <span className="text-zinc-500 text-sm">/hr</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-zinc-800/50">
                  <button
                    onClick={() => setActiveTab('availability')}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Book Consultation
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenMessaging}
                    className={`flex items-center justify-center gap-2 font-medium px-5 py-2.5 rounded-lg transition-colors border shadow-sm cursor-pointer ${
                      isLocked
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border-zinc-700'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="h-4 w-4 text-amber-400" />
                        <span>Message Lawyer</span>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          PRO
                        </span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span>Message Lawyer</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: lawyer.name, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-800 font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Meeting Flow Banner (if client has confirmed/active booking) */}
          {activeBooking &&
            (activeBooking.status === 'confirmed' ||
              activeBooking.status === 'completion_requested' ||
              activeBooking.status === 'completed' ||
              activeBooking.meeting_started_at) && (
              <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/40 rounded-2xl p-5 mb-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                      <Video className="h-4 w-4" />
                      <span>Your Scheduled Consultation</span>
                    </div>
                    <p className="text-sm text-zinc-200 font-medium">
                      {activeBooking.schedule_date || activeBooking.date || 'Today'} • {activeBooking.start_time || '10:00 AM'}{activeBooking.end_time ? ` - ${activeBooking.end_time}` : ''}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {activeBooking.status === 'completed'
                        ? 'Consultation completed. Share your feedback below.'
                        : activeBooking.status === 'completion_requested'
                        ? 'Consultation completion requested and pending confirmation.'
                        : 'Click \u201cStart Meeting\u201d when you are ready to begin consultation.'}
                    </p>
                  </div>

                  <MeetingControls
                    booking={activeBooking}
                    isLawyer={false}
                    currentUserId={user?.id}
                    onBookingUpdate={(updated) => {
                      setActiveBooking(updated);
                      fetchMyBookings();
                      fetchReviews();
                    }}
                    onOpenReviewModal={(b) => {
                      setReviewModalBooking(b);
                      setIsReviewModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-none">
            {['about', 'reviews', 'availability'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap capitalize border-b-2 transition-colors ${
                  activeTab === tab ? 'border-blue-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-20 lg:mb-0">
            {activeTab === 'about' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-50 mb-3">Professional Summary</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {lawyer.bio || 'Advocate practicing at the Supreme Court of Bangladesh.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-50 mb-3">Practice Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((spec) => (
                      <span key={spec} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-zinc-50 font-semibold mb-4">
                      <GraduationCap className="h-5 w-5 text-zinc-500" /> Education
                    </div>
                    <ul className="space-y-2">
                      {education.map((edu, idx) => (
                        <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0"></span> {edu}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-zinc-50 font-semibold mb-4">
                      <FileText className="h-5 w-5 text-zinc-500" /> Credentials
                    </div>
                    <ul className="space-y-3">
                      <li className="text-sm text-zinc-400 flex items-start justify-between">
                        <span>Experience</span>
                        <span className="text-zinc-50 font-medium">{lawyer.experienceYrs || lawyer.experience_years || 5} Years</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-50 mb-3">Contact Details</h3>
                  {lawyer.phone ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Phone className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Direct Phone</div>
                          <a
                            href={`tel:${lawyer.phone}`}
                            className="text-zinc-100 font-mono font-medium hover:text-blue-400 transition-colors text-base"
                          >
                            {lawyer.phone}
                          </a>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Verified Contact
                      </span>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="h-10 w-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <Lock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Contact Protected</div>
                          <p className="text-sm text-zinc-300 font-medium">
                            Contact details revealed after booking confirmation
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/client/book/${lawyer.id}`}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20 text-sm shrink-0"
                      >
                        Book Consultation
                      </Link>
                    </div>
                  )}
                </div>

                {verificationDocs.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-zinc-50 font-semibold">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" /> Verification Documents
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Verified Bar Documents
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {verificationDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-sm font-medium text-zinc-200 truncate">{doc.filename}</p>
                              <p className="text-xs text-zinc-500 font-mono">
                                {doc.size_bytes ? `${(doc.size_bytes / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${doc.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all shrink-0"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section in About Tab */}
                <div className="pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                        <span>Client Reviews</span>
                        <span className="text-xs text-zinc-500 font-normal">
                          ({reviewsList.length})
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Feedback from verified clients who completed consultations.
                      </p>
                    </div>

                    {activeBooking && activeBooking.status === 'completed' && !activeBooking.has_reviewed && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalBooking(activeBooking);
                          setIsReviewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>Leave Review</span>
                      </button>
                    )}
                  </div>

                  {reviewsList.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-900/60 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
                      <Star className="h-7 w-7 text-zinc-700 mx-auto mb-2" />
                      <p className="font-medium text-zinc-400">No client reviews yet.</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Be the first to review this advocate after your consultation.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {reviewsList.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-4 space-y-2.5 hover:border-zinc-700/80 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {rev.reviewer_avatar_asset_id ? (
                                  <img
                                    src={`/api/assets/${rev.reviewer_avatar_asset_id}/file`}
                                    alt={rev.reviewer_name || 'Client'}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  (rev.reviewer_name || 'C')[0]?.toUpperCase() || 'C'
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-zinc-100">
                                  {rev.reviewer_name || 'Verified Client'}
                                </h4>
                                <span className="text-[11px] text-zinc-500 font-mono">
                                  {rev.created_at
                                    ? new Date(rev.created_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Recent'}
                                </span>
                              </div>
                            </div>

                            {/* 5 Stars */}
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-zinc-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="text-xs text-zinc-300 leading-relaxed pl-1">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50">
                      All Client Reviews ({reviewsList.length})
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Ratings and feedback left by clients following consultation completion.
                    </p>
                  </div>

                  {activeBooking && activeBooking.status === 'completed' && !activeBooking.has_reviewed && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewModalBooking(activeBooking);
                        setIsReviewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>Leave a Review</span>
                    </button>
                  )}
                </div>

                {reviewsList.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
                    <Star className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                    <p className="font-medium text-zinc-400">No client reviews yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">Reviews will appear here once consultations are completed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewsList.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                              {rev.reviewer_avatar_asset_id ? (
                                <img
                                  src={`/api/assets/${rev.reviewer_avatar_asset_id}/file`}
                                  alt={rev.reviewer_name || 'Client'}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                (rev.reviewer_name || 'C')[0]?.toUpperCase() || 'C'
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-zinc-100">
                                {rev.reviewer_name || 'Verified Client'}
                              </h4>
                              <span className="text-xs text-zinc-500 font-mono">
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Recent'}
                              </span>
                            </div>
                          </div>

                          {/* 5 Stars */}
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-sm text-zinc-300 leading-relaxed pt-0.5">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-zinc-50 mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-zinc-500" /> Select a Time Slot
                </h3>

                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <table className="w-full text-sm text-center min-w-[600px]">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-3 w-20 border-r border-zinc-800">Time</th>
                        {DAYS.map((day) => (
                          <th key={day} className="p-3 font-medium">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {TIMES.map((time) => (
                        <tr key={time}>
                          <td className="p-3 text-zinc-500 text-xs border-r border-zinc-800 bg-zinc-900 font-medium">{time}</td>
                          {DAYS.map((day) => {
                            const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                            return (
                              <td key={`${day}-${time}`} className="p-1">
                                <button
                                  onClick={() => handleSlotClick(day, time)}
                                  className={`w-full py-2.5 rounded transition-colors border text-xs font-medium ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Open'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Right Sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-20 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-50 mb-6">Booking Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Consultation Type</span>
                <span className="text-zinc-50 font-medium bg-zinc-800 px-2 py-1 rounded">Video Call</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Duration</span>
                <span className="text-zinc-50 font-medium">30 mins</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-zinc-800/50 pt-4">
                <span className="text-zinc-400">Consultation Fee</span>
                <span className="text-zinc-50 font-medium">৳{(rateBdt / 2).toLocaleString()}</span>
              </div>
            </div>

            {selectedSlot ? (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-blue-400 mb-0.5">Selected Time</div>
                  <div className="text-sm text-zinc-300">{selectedSlot.day}, {selectedSlot.time}</div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 border-dashed rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-zinc-500">Select an available time slot from the Availability tab to proceed.</p>
              </div>
            )}

            <button
              disabled={!selectedSlot}
              onClick={() => navigate(`/client/book/${lawyer.id}?slot=${selectedSlot.day}-${selectedSlot.time}`)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 shadow-lg shadow-blue-500/20"
            >
              Continue to Booking
            </button>

            <button
              type="button"
              onClick={handleOpenMessaging}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800/70 text-zinc-300 border border-zinc-800 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
            >
              {plan === 'user_free' ? (
                <>
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Direct Message</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    PRO
                  </span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span>Direct Message (Pro)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Direct Message Thread Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Message with ${lawyer.name}`}
        description={
          isReadOnly
            ? 'Completed consultation thread. This conversation history is now read-only.'
            : 'Direct consultation channel. Inquire directly with this verified lawyer.'
        }
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60 shrink-0">
            <span className="text-xs text-zinc-400">
              {isReadOnly ? 'Completed Consultation Record' : 'Direct Consultation Channel'}
            </span>
            <button
              type="button"
              onClick={loadThread}
              disabled={messagesLoading}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className={`h-3 w-3 ${messagesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Active Consultation Controls in Thread Modal */}
          {activeBooking && (
            <div className="mb-3 shrink-0">
              <MeetingControls
                booking={activeBooking}
                isLawyer={false}
                compact={true}
                currentUserId={user?.id}
                onBookingUpdate={(updated) => {
                  setActiveBooking(updated);
                  fetchMyBookings();
                  fetchReviews();
                }}
                onOpenReviewModal={(b) => {
                  setReviewModalBooking(b);
                  setIsReviewModalOpen(true);
                }}
              />
            </div>
          )}

          <div className="flex-1 min-h-0">
            <DirectMessageThread
              messages={messages}
              currentUserId={user?.id}
              recipientName={lawyer.name}
              onSendMessage={handleSendMessage}
              loading={messagesLoading}
              error={messagesError}
              onRetry={loadThread}
              isReadOnly={isReadOnly}
              placeholder={`Write a message to ${lawyer.name}...`}
            />
          </div>
        </div>
      </Modal>

      {/* Pro Paywall Modal */}
      <ProPaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        message={paywallMessage}
        onSuccess={async () => {
          try {
            const res = await api.get('/chat/usage');
            const updatedPlan = res.data?.plan || 'user_pro';
            setPlan(updatedPlan);
            if (updatedPlan !== 'user_free') {
              setShowMessageModal(true);
              loadThread();
            }
          } catch {
            setPlan('user_pro');
            setShowMessageModal(true);
            loadThread();
          }
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={reviewModalBooking || activeBooking}
        revieweeName={lawyer?.name}
        onReviewSubmitted={() => {
          fetchReviews();
          fetchMyBookings();
          reload();
        }}
      />
    </div>
  );
}

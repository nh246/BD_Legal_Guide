import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Calendar, ShieldCheck, Clock, ArrowRight, Camera, User, Pencil, CreditCard, CheckCircle2, Star, Briefcase, Plus, Gavel } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import SecurityCard from '../../components/ui/SecurityCard';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import CompletePaymentModal from '../../components/ui/CompletePaymentModal';
import ReviewModal from '../../components/ui/ReviewModal';
import PostCaseModal from '../../components/ui/PostCaseModal';
import CaseBidsList from '../../components/ui/CaseBidsList';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
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
import useApi from '../../lib/useApi';
import useAuthStore from '../../store/useAuthStore';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function ClientDashboard() {
  const { user, token, updateUser } = useAuthStore();
  const { data: bookingsData, loading, error, reload } = useApi('/bookings/mine');
  const { data: casesData, loading: casesLoading, error: casesError, reload: reloadCases } = useApi(token ? '/cases/mine' : null);
  const { data: subData } = useApi(token ? '/subscriptions/mine' : null);
  const { data: assetsData, reload: reloadAssets } = useApi(token ? '/profile/assets' : null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
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

  // Case Board state
  const [activeDashboardTab, setActiveDashboardTab] = useState('consultations');
  const [isPostCaseModalOpen, setIsPostCaseModalOpen] = useState(false);
  const [isCasePaywallOpen, setIsCasePaywallOpen] = useState(false);
  const [selectedCaseIdForBids, setSelectedCaseIdForBids] = useState(null);
  const [isCaseBidsModalOpen, setIsCaseBidsModalOpen] = useState(false);
  const [caseFilter, setCaseFilter] = useState('all');

  const bookings = asList(bookingsData, 'bookings');
  const cases = asList(casesData, 'cases');
  const assets = asList(assetsData, 'assets');
  const avatarAsset = assets.find((a) => a.kind === 'avatar');

  const formatDateEnGB = (dateVal) => {
    if (!dateVal) return '';
    try {
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
    } catch {
      return String(dateVal || '');
    }
  };

  const formatTimeRange = (b) => {
    if (!b) return '';
    if (b.start_time && b.end_time) {
      return `${b.start_time} - ${b.end_time}`;
    }
    if (b.start_time) return b.start_time;
    if (b.scheduled_time) return b.scheduled_time;
    if (b.time) return b.time;
    if (b.start) {
      const d = new Date(b.start);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    }
    return 'Time to be arranged';
  };

  const getBookingDateStr = (b) => {
    const val = b.schedule_date || b.date || b.start || b.created_at || '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.slice(0, 10);
    }
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    return '';
  };

  const getRelativeChip = (dateVal) => {
    if (!dateVal) return null;
    let target;
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
      target = new Date(y, m - 1, d);
    } else {
      target = new Date(dateVal);
    }
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let text = '';
    let colorClass = '';

    if (diffDays === 0) {
      text = 'today';
      colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (diffDays === 1) {
      text = 'tomorrow';
      colorClass = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    } else if (diffDays > 1) {
      text = `in ${diffDays} days`;
      colorClass = 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    } else if (diffDays === -1) {
      text = 'yesterday';
      colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    } else {
      text = `${Math.abs(diffDays)} days ago`;
      colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
        {text}
      </span>
    );
  };

  // Section "Upcoming": filter via isUpcoming helper, sorted ascending (soonest first)
  const upcomingBookings = bookings
    .filter(isUpcoming)
    .sort((a, b) => {
      const dateA = getBookingDateStr(a);
      const dateB = getBookingDateStr(b);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.start_time || a.time || '';
      const timeB = b.start_time || b.time || '';
      return timeA.localeCompare(timeB);
    });

  const nextBooking = upcomingBookings[0] || null;

  // Section "History": filter via isPast or isCancelled helpers, dimmed style
  const historyBookings = bookings
    .filter((b) => isPast(b) || isCancelled(b))
    .sort((a, b) => {
      const dateA = getBookingDateStr(a);
      const dateB = getBookingDateStr(b);
      return dateB.localeCompare(dateA);
    });

  const handleRequestCompletion = async (bookingId) => {
    if (!bookingId) return;
    setActionLoading(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/request-completion`);
      toast('Completion requested. Awaiting confirmation.', 'info');
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

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    setCancellingBooking(true);
    try {
      await api.patch(`/bookings/${bookingId}`, { status: 'cancelled' });
      toast('Booking cancelled successfully', 'info');
      setSelectedBooking(null);
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to cancel booking'), 'error');
    } finally {
      setCancellingBooking(false);
    }
  };

  const isPro = Boolean(
    user?.is_pro ||
    user?.plan?.startsWith('user_pro') ||
    (subData?.status === 'active' && subData?.plan_code?.startsWith('user_pro'))
  );

  const handlePostCaseClick = () => {
    if (isPro) {
      setIsPostCaseModalOpen(true);
    } else {
      setIsCasePaywallOpen(true);
    }
  };

  const handleOpenCaseBids = (caseId) => {
    setSelectedCaseIdForBids(caseId);
    setIsCaseBidsModalOpen(true);
  };

  const displayName = user?.full_name || user?.name || 'Client';
  const avatarLetter = (displayName || 'C')[0].toUpperCase();

  const handleOpenEditName = () => {
    setNameInput(user?.full_name || user?.name || '');
    setNameError(null);
    setIsEditNameOpen(true);
  };

  const handleSaveName = async (e) => {
    e?.preventDefault?.();
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      const msg = 'Name must be between 2 and 100 characters.';
      setNameError(msg);
      toast(msg, 'error');
      return;
    }

    setSavingName(true);
    setNameError(null);
    try {
      const res = await api.patch('/auth/me', { full_name: trimmed });
      updateUser(res.data);
      toast('Profile updated', 'success');
      setIsEditNameOpen(false);
    } catch (err) {
      const serverMsg = err.response?.data?.message || getErrorMessage(err, 'Failed to update name');
      setNameError(serverMsg);
      toast(serverMsg, 'error');
      // Keep modal open
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      toast('Invalid file type. Allowed: PNG, JPG, WEBP', 'error');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast('Avatar exceeds maximum limit of 1 MB', 'error');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setUploadingAvatar(true);
    toast('Uploading profile photo...', 'info');
    const formData = new FormData();
    formData.append('kind', 'avatar');
    formData.append('file', file);

    try {
      await api.post('/profile/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Profile photo updated successfully', 'success');
      reloadAssets();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update photo'), 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Welcome back, {displayName}</h1>
            <p className="text-zinc-400 mt-1">Manage your legal consultations and AI guidance sessions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="btn-banner-post-case"
              onClick={handlePostCaseClick}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            >
              <Briefcase className="h-4 w-4" /> Post a Case
            </Button>
            <Link to="/client/chat">
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" /> Start AI Chat
              </Button>
            </Link>
            <Link to="/client/lawyers">
              <Button variant="secondary" className="gap-2">
                <Users className="h-4 w-4" /> Find Lawyers
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar with hover overlay affordance */}
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative shrink-0 rounded-full cursor-pointer group"
                  title="Click to edit photo"
                >
                  {avatarAsset ? (
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${avatarAsset.id}/file`}
                      alt={displayName}
                      className="h-20 w-20 rounded-full object-cover border-2 border-zinc-700 shadow-md group-hover:border-zinc-500 transition-all"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-600/10 border-2 border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold shadow-md group-hover:border-blue-500/50 transition-all">
                      {avatarLetter}
                    </div>
                  )}

                  {/* Centered camera icon overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Camera className="h-6 w-6 text-white drop-shadow" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-zinc-50">{displayName}</h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isPro
                          ? 'bg-purple-600/15 text-purple-300 border-purple-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {isPro ? 'Pro Member' : 'Free Account'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{user?.email || 'citizen@legalbridge.ai'}</p>
                </div>
              </div>

              {/* Action Buttons: Edit Name + Edit Photo */}
              <div className="flex items-center gap-2.5">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  id="btn-edit-name"
                  onClick={handleOpenEditName}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" /> Edit Name
                </Button>
                <Button
                  id="btn-edit-photo"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  isLoading={uploadingAvatar}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" /> Edit Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Password Card */}
        <SecurityCard />

        {/* Quick Stat Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Next Consultation</p>
                </div>
                {nextBooking && (
                  nextBooking.status === 'awaiting_payment' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalBooking(nextBooking);
                        setIsPaymentModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors cursor-pointer animate-pulse"
                      title="Click to complete payment"
                    >
                      <CreditCard className="h-3 w-3" />
                      <span>Action Required: Pay</span>
                    </button>
                  ) : nextBooking.status === 'payment_submitted' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Clock className="h-3 w-3" />
                      <span>Payment Under Review</span>
                    </span>
                  ) : nextBooking.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Confirmed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/15 text-amber-300 border-amber-500/30">
                      Pending
                    </span>
                  )
                )}
              </div>

              {nextBooking ? (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-zinc-50 truncate">
                    {nextBooking.lawyer_name || nextBooking.lawyerName || 'Advocate'}
                  </p>
                  {nextBooking.schedule?.date || nextBooking.schedule_date || nextBooking.date || nextBooking.start ? (
                    <p className="text-xs text-zinc-300 font-mono">
                      {formatDateEnGB(nextBooking.schedule?.date || nextBooking.schedule_date || nextBooking.date || nextBooking.start)}
                    </p>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Schedule pending
                    </span>
                  )}
                  <p className="text-xs text-zinc-400 font-mono">
                    {formatSlot(nextBooking)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-sm text-zinc-400">No upcoming consultations</p>
                  <Link to="/client/lawyers">
                    <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5 gap-1.5 mt-1">
                      <Users className="h-3.5 w-3.5" /> Find Lawyers
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Membership Tier</p>
                <p className="text-2xl font-bold text-zinc-50">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Total Consultations</p>
                <p className="text-2xl font-bold text-zinc-50">{bookings.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tab Switcher: Consultations vs My Cases */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-6">
            <button
              type="button"
              id="tab-btn-consultations"
              onClick={() => setActiveDashboardTab('consultations')}
              className={`pb-3 pt-2 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeDashboardTab === 'consultations'
                  ? 'text-blue-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Consultations</span>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                {bookings.length}
              </span>
              {activeDashboardTab === 'consultations' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              id="tab-btn-cases"
              onClick={() => setActiveDashboardTab('cases')}
              className={`pb-3 pt-2 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeDashboardTab === 'cases'
                  ? 'text-blue-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>My Cases (Case Board)</span>
              {cases.length > 0 && (
                <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  {cases.length}
                </span>
              )}
              {activeDashboardTab === 'cases' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          </div>

          {activeDashboardTab === 'cases' && (
            <Button
              id="btn-tab-post-case"
              size="sm"
              onClick={handlePostCaseClick}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" /> Post a New Case
            </Button>
          )}
        </div>

        {activeDashboardTab === 'consultations' ? (
          /* Consultations List (Split into Upcoming and History) */
          <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Consultations</h2>
              <p className="text-sm text-zinc-400">Manage your active consultations and past session history.</p>
            </div>
            <Link to="/client/bookings" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingState label="Loading your consultations..." />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No consultations yet"
              description="Browse our verified Bangladesh Bar Council lawyers to book your first video consultation."
              action={
                <Link to="/client/lawyers">
                  <Button variant="secondary" className="gap-2">
                    <Users className="h-4 w-4" /> Browse Lawyer Directory
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-8">
              {/* Section 1: Upcoming */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-100">Upcoming</h3>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                    {upcomingBookings.length}
                  </span>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <p className="text-sm text-zinc-400">No upcoming consultations scheduled.</p>
                    <Link to="/client/lawyers" className="inline-block mt-3">
                      <Button size="sm" variant="secondary" className="gap-2">
                        <Users className="h-4 w-4" /> Find Lawyers
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((b) => (
                      <Card
                        key={b.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {(b.lawyer_name || b.lawyerName || 'A')[0].toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-zinc-50">{b.lawyer_name || b.lawyerName || 'Advocate'}</h4>
                              {getRelativeChip(b.schedule_date || b.date || b.start)}
                              {b.status === 'awaiting_payment' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentModalBooking(b);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors cursor-pointer animate-pulse"
                                  title="Click to complete payment"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  <span>Action Required: Pay</span>
                                </button>
                              ) : b.status === 'payment_submitted' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  <Clock className="h-3 w-3" />
                                  <span>Payment Under Review</span>
                                </span>
                              ) : b.status === 'confirmed' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Confirmed</span>
                                </span>
                              ) : b.status === 'completion_requested' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  <Clock className="h-3 w-3" />
                                  <span>Completion Requested</span>
                                </span>
                              ) : (
                                <Badge variant="warning">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 font-mono">
                              {b.schedule?.date || b.schedule_date || b.date || b.start ? (
                                <span>{formatDateEnGB(b.schedule?.date || b.schedule_date || b.date || b.start)}</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  Schedule pending
                                </span>
                              )}
                              <span>•</span>
                              <span>{formatSlot(b)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                          {isCaseBoardBooking(b) && (
                            <Link
                              to="/client/cases"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                              title="View Case on Case Board"
                            >
                              <Briefcase className="h-3 w-3" />
                              <span>Case Board</span>
                            </Link>
                          )}

                          {b.status === 'awaiting_payment' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 font-semibold shadow-lg shadow-amber-600/20"
                                onClick={() => {
                                  setPaymentModalBooking(b);
                                  setIsPaymentModalOpen(true);
                                }}
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Pay Now ৳{b.fee || 2000}
                              </Button>

                              {isCaseBoardBooking(b) && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="gap-1.5 text-zinc-300 hover:text-white"
                                  onClick={() => handleOpenCaseDiscussion(b)}
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Discuss Case
                                </Button>
                              )}
                            </>
                          )}

                          {chatAllowed(b) && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 font-semibold shadow-sm"
                              onClick={() => handleOpenThread(b)}
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Open Thread
                            </Button>
                          )}

                          {(b.meet_link || b.meeting_link) && chatAllowed(b) && (
                            <a
                              href={b.meet_link || b.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            >
                              <Video className="h-3.5 w-3.5" /> Join Meeting
                            </a>
                          )}

                          {b.status === 'completion_requested' && (
                            b.completion_requested_by === 'client' ? (
                              <span className="text-xs text-zinc-400 italic">Waiting for lawyer to confirm...</span>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-semibold shadow-sm"
                                onClick={() => handleConfirmCompletion(b.id)}
                                isLoading={actionLoading === b.id}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Completion
                              </Button>
                            )
                          )}
                          {b.status === 'confirmed' && b.meeting_ended_at && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 font-semibold shadow-sm"
                              onClick={() => handleRequestCompletion(b.id)}
                              isLoading={actionLoading === b.id}
                            >
                              Request Completion
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedBooking(b)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: History (dimmed style) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-400">History</h3>
                  <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full font-medium">
                    {historyBookings.length}
                  </span>
                </div>

                {historyBookings.length === 0 ? (
                  <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 text-center">
                    <p className="text-sm text-zinc-500">No past consultations in history.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyBookings.map((b) => (
                      <Card
                        key={b.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 bg-zinc-900/40 border-zinc-800/60 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-sm shrink-0">
                            {(b.lawyer_name || b.lawyerName || 'A')[0].toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-zinc-300">{b.lawyer_name || b.lawyerName || 'Advocate'}</h4>
                              <Badge variant={b.status === 'completed' ? 'default' : 'danger'}>
                                {b.status === 'completed' ? 'Completed' : 'Cancelled'}
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-2 font-mono">
                              {b.schedule?.date || b.schedule_date || b.date || b.start || b.created_at ? (
                                <span>{formatDateEnGB(b.schedule?.date || b.schedule_date || b.date || b.start || b.created_at)}</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  Schedule pending
                                </span>
                              )}
                              <span>•</span>
                              <span>{formatSlot(b)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center">
                          {b.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1.5 bg-zinc-800 text-zinc-300 hover:text-white"
                              onClick={() => handleOpenThread(b)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-zinc-400" /> Open Thread
                            </Button>
                          )}
                          {b.status === 'completed' && !b.has_reviewed && (
                            <Button
                              size="sm"
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 gap-1.5 font-semibold shadow-sm cursor-pointer"
                              onClick={() => {
                                setReviewModalBooking(b);
                                setIsReviewModalOpen(true);
                              }}
                            >
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              Leave Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                            onClick={() => setSelectedBooking(b)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        ) : (
          /* My Cases Tab Content */
          <div className="space-y-6">
            {/* Header inside My Cases tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-blue-400" />
                  <span>My Case Board Posts</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Verified advocates review open cases and submit competitive fee quotes with customized legal pitches.
                </p>
              </div>
              <Button
                id="btn-cases-post-new"
                size="sm"
                onClick={handlePostCaseClick}
                className="gap-2 bg-blue-600 hover:bg-blue-500 text-white self-start sm:self-auto shrink-0 shadow-md shadow-blue-600/20"
              >
                <Plus className="h-4 w-4" /> Post a New Case
              </Button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCaseFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  caseFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Cases ({cases.length})
              </button>
              <button
                type="button"
                onClick={() => setCaseFilter('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  caseFilter === 'open'
                    ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Open ({cases.filter((c) => c.status === 'open').length})
              </button>
              <button
                type="button"
                onClick={() => setCaseFilter('assigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  caseFilter === 'assigned'
                    ? 'bg-zinc-800 text-zinc-50 border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Assigned ({cases.filter((c) => c.status === 'assigned').length})
              </button>
            </div>

            {/* Cases List */}
            {casesLoading ? (
              <LoadingState label="Loading your cases..." />
            ) : casesError ? (
              <ErrorState error={casesError} onRetry={reloadCases} />
            ) : cases.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No cases posted yet"
                description="Post your legal situation to the Case Board to receive pitches and fee proposals from top advocates."
                action={
                  <Button onClick={handlePostCaseClick} className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
                    <Plus className="h-4 w-4" /> Post a Case
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {cases
                  .filter((c) => {
                    if (caseFilter === 'open') return c.status === 'open';
                    if (caseFilter === 'assigned') return c.status === 'assigned';
                    return true;
                  })
                  .map((caseItem) => {
                    const isOpen = caseItem.status === 'open';
                    const isAssigned = caseItem.status === 'assigned';
                    const bidCount = caseItem.bid_count ?? (caseItem.bids?.length || 0);
                    const acceptedBid = (caseItem.bids || []).find((b) => b.status === 'accepted');
                    const assignedLawyerName = acceptedBid?.lawyer_name;

                    return (
                      <Card
                        key={caseItem.id}
                        className="p-5 border-zinc-800 hover:border-zinc-700 transition-all bg-zinc-900 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-blue-400 border border-zinc-700">
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

                            <h4 className="text-lg font-bold text-zinc-50">
                              {caseItem.title}
                            </h4>
                          </div>

                          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1 shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{formatDateEnGB(caseItem.created_at)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed whitespace-pre-line">
                          {caseItem.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
                          <div>
                            {isAssigned ? (
                              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <span>Assigned to {assignedLawyerName || 'Advocate'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <Gavel className="h-3.5 w-3.5 text-zinc-500" />
                                <span>
                                  {bidCount === 0
                                    ? 'No proposals received yet'
                                    : `${bidCount} advocate proposal(s)`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            {isAssigned && (
                              <button
                                type="button"
                                onClick={() => setActiveDashboardTab('consultations')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>View Consultation</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <Button
                              size="sm"
                              id={`btn-view-bids-${caseItem.id}`}
                              onClick={() => handleOpenCaseBids(caseItem.id)}
                              className={`gap-1.5 ${
                                isOpen && bidCount > 0
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
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
        )}
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => !cancellingBooking && setSelectedBooking(null)}
        title="Consultation Details"
        description="Review full details of this consultation booking."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              {(selectedBooking?.status === 'pending' || selectedBooking?.status === 'awaiting_payment') && (
                <Button
                  id="btn-cancel-booking-modal"
                  variant="danger"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  isLoading={cancellingBooking}
                  disabled={cancellingBooking}
                >
                  Cancel Booking
                </Button>
              )}
              {selectedBooking?.status === 'completion_requested' && (
                selectedBooking.completion_requested_by === 'client' ? (
                  <span className="text-xs text-zinc-400 italic">Waiting for lawyer to confirm...</span>
                ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    onClick={() => {
                      const id = selectedBooking.id;
                      setSelectedBooking(null);
                      handleConfirmCompletion(id);
                    }}
                    isLoading={actionLoading === selectedBooking.id}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirm Completion
                  </Button>
                )
              )}
              {selectedBooking?.status === 'confirmed' && selectedBooking.meeting_ended_at && (
                <Button
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => {
                    const id = selectedBooking.id;
                    setSelectedBooking(null);
                    handleRequestCompletion(id);
                  }}
                  isLoading={actionLoading === selectedBooking.id}
                >
                  Request Completion
                </Button>
              )}
              {selectedBooking?.status === 'completed' && !selectedBooking.has_reviewed && (
                <Button
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 gap-1.5 font-semibold"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setReviewModalBooking(b);
                    setIsReviewModalOpen(true);
                  }}
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Leave Review
                </Button>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => setSelectedBooking(null)}
              disabled={cancellingBooking}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-5 text-sm">
            {/* Lawyer Info & Status */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-lg">
                  {(selectedBooking.lawyer_name || selectedBooking.lawyerName || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-50">
                    {selectedBooking.lawyer_name || selectedBooking.lawyerName || 'Advocate'}
                  </h3>
                  <p className="text-xs text-zinc-400">Bangladesh Bar Council Advocate</p>
                </div>
              </div>
              {selectedBooking.status === 'awaiting_payment' ? (
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setPaymentModalBooking(b);
                    setIsPaymentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors cursor-pointer animate-pulse"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Action Required: Pay
                </button>
              ) : selectedBooking.status === 'payment_submitted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Clock className="h-3.5 w-3.5" />
                  Payment Under Review
                </span>
              ) : selectedBooking.status === 'confirmed' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirmed
                </span>
              ) : selectedBooking.status === 'completion_requested' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Clock className="h-3.5 w-3.5" />
                  Completion Requested
                </span>
              ) : selectedBooking.status === 'completed' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Consultation Completed
                </span>
              ) : (
                <Badge
                  variant={
                    selectedBooking.status === 'cancelled'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {selectedBooking.status ? selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1) : 'Pending'}
                </Badge>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Consultation Date</span>
                <p className="font-semibold text-zinc-100 font-mono text-sm">
                  {selectedBooking.schedule?.date || selectedBooking.schedule_date || selectedBooking.date || selectedBooking.start ? (
                    formatDateEnGB(selectedBooking.schedule?.date || selectedBooking.schedule_date || selectedBooking.date || selectedBooking.start)
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Schedule pending
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Time Window</span>
                <p className="font-semibold text-zinc-100 font-mono text-sm">
                  {formatSlot(selectedBooking)}
                </p>
              </div>
            </div>

            {/* Video Meeting Link if confirmed */}
            {selectedBooking.meet_link && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Video Meeting Link</span>
                  <a
                    href={selectedBooking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Join Video Call
                  </a>
                </div>
                <p className="text-xs text-zinc-300 break-all font-mono">{selectedBooking.meet_link}</p>
              </div>
            )}

            {/* Case Brief if present */}
            {(selectedBooking.case_brief || selectedBooking.brief) && (
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Case Brief / Notes</span>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedBooking.case_brief || selectedBooking.brief}
                </p>
              </div>
            )}

            <div className="text-xs text-zinc-500 flex items-center justify-between pt-1">
              {selectedBooking.created_at && (
                <span>Booked: {formatDateEnGB(selectedBooking.created_at)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        isOpen={isEditNameOpen}
        onClose={() => !savingName && setIsEditNameOpen(false)}
        title="Edit Name"
        description="Update your full name as it appears on consultations and AI chat."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsEditNameOpen(false)}
              disabled={savingName}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveName}
              isLoading={savingName}
              disabled={savingName}
            >
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveName} className="space-y-4">
          <Input
            id="edit-full-name-input"
            label="Full Name"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="e.g. Rahim Ahmed Khan"
            error={nameError}
            autoFocus
            disabled={savingName}
          />
        </form>
      </Modal>

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

      {/* Post Case Modal */}
      <PostCaseModal
        isOpen={isPostCaseModalOpen}
        onClose={() => setIsPostCaseModalOpen(false)}
        onSuccess={() => {
          reloadCases();
          setActiveDashboardTab('cases');
        }}
      />

      {/* Case Bids List Modal */}
      <CaseBidsList
        isOpen={isCaseBidsModalOpen}
        onClose={() => {
          setIsCaseBidsModalOpen(false);
          setSelectedCaseIdForBids(null);
        }}
        caseId={selectedCaseIdForBids}
        onBidAccepted={() => {
          reloadCases();
          reload();
        }}
        onBidRejected={() => {
          reloadCases();
        }}
      />

      {/* Pro Paywall Modal for Case Posting */}
      <ProPaywallModal
        isOpen={isCasePaywallOpen}
        onClose={() => setIsCasePaywallOpen(false)}
        message="Posting cases to the Case Board is a Pro feature. Upgrade to post legal cases and receive competitive bids from Gold Verified advocates."
        onSuccess={() => {
          setIsCasePaywallOpen(false);
          setIsPostCaseModalOpen(true);
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


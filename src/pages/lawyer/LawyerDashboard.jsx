import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  X,
  Inbox,
  User,
  Plus,
  Trash2,
  CalendarCheck,
  CalendarX,
  ShieldCheck,
  MessageSquare,
  Send,
  RefreshCw,
  Info,
  Upload,
  Camera,
  Eye,
  FileText,
  Video,
  ExternalLink,
  Star,
  Briefcase,
  Gavel,
  Lock,
  Paperclip,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AddSlotModal from '../../components/ui/AddSlotModal';
import SubmitBidModal from '../../components/ui/SubmitBidModal';
import DirectMessageThread, { openAssetInNewTab } from '../../components/ui/DirectMessageThread';
import MeetingControls from '../../components/ui/MeetingControls';
import ReviewModal from '../../components/ui/ReviewModal';
import CaseDiscussionModal from '../../components/ui/CaseDiscussionModal';
import BookingThreadModal from '../../components/ui/BookingThreadModal';

import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

export default function LawyerDashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const { data: reqData, loading: reqLoading, error: reqError, reload: reloadReq } = useApi('/lawyer/requests');
  const { data: schedData, loading: schedLoading, error: schedError, reload: reloadSchedules } = useApi('/lawyer/schedules');
  const { data: inboxData, loading: inboxLoading, error: inboxError, reload: reloadInbox } = useApi('/messages/lawyer/inbox');
  const { data: assetsData, loading: assetsLoading, reload: reloadAssets } = useApi('/profile/assets');
  const { data: lawyerProfile, loading: profileLoading, reload: reloadLawyerProfile } = useApi(
    user?.role === 'lawyer' || user?.role === 'admin' ? '/lawyer/me' : null
  );

  const isGoldVerified = Boolean(
    (lawyerProfile?.verification_status === 'approved' && lawyerProfile?.verification_paid === true) ||
    user?.role === 'admin'
  );

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'case-board' || tabParam === 'cases') return 'cases';
    if (tabParam === 'my-bids' || tabParam === 'bids') return 'my-bids';
    if (['consultations', 'availability', 'inbox', 'meetings', 'profile'].includes(tabParam)) return tabParam;
    return 'consultations';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'case-board' || tabParam === 'cases') {
      setActiveTab('cases');
    } else if (tabParam === 'my-bids' || tabParam === 'bids') {
      setActiveTab('my-bids');
    }
  }, [searchParams]);

  // Lawyer Bids tracking states
  const {
    data: myBidsData,
    loading: myBidsLoading,
    error: myBidsError,
    reload: reloadMyBids,
  } = useApi(user?.role === 'lawyer' || user?.role === 'admin' ? '/lawyer/bids' : null);

  const myBids = asList(myBidsData, 'bids');
  const pendingBids = myBids.filter((b) => b.bid_status === 'pending');
  const wonBids = myBids.filter((b) => b.bid_status === 'accepted');
  const lostBids = myBids.filter((b) => b.bid_status === 'rejected');

  const [bidsConsultationBooking, setBidsConsultationBooking] = useState(null);
  const [isBidsConsultationOpen, setIsBidsConsultationOpen] = useState(false);

  const handleOpenBidDiscussion = (bidItem) => {
    setDiscussionCase({
      id: bidItem.case_id,
      title: bidItem.case_title,
      status: bidItem.case_status,
      category: bidItem.category || 'General',
      user_name: bidItem.client_name,
      my_bid: {
        id: bidItem.bid_id,
        lawyer_name: lawyerProfile?.name || user?.full_name || 'Lawyer',
        proposed_fee: bidItem.proposed_fee,
        pitch_message: bidItem.pitch,
        status: bidItem.bid_status,
      },
    });
  };

  const handleOpenWonConsultation = (bidItem) => {
    if (bidItem.booking_id) {
      setBidsConsultationBooking({
        id: bidItem.booking_id,
        case_id: bidItem.case_id,
        bid_id: bidItem.bid_id,
        bid_status: 'accepted',
        case_title: bidItem.case_title,
        client_name: bidItem.client_name,
        user_name: bidItem.client_name,
        status: 'confirmed',
      });
      setIsBidsConsultationOpen(true);
    } else {
      // Fallback directly to CaseDiscussionModal if no booking_id
      handleOpenBidDiscussion(bidItem);
    }
  };

  // Case Board states
  const {
    data: casesData,
    loading: casesLoading,
    error: casesError,
    reload: reloadCases,
  } = useApi(activeTab === 'cases' && isGoldVerified ? '/cases' : null);

  const [selectedCaseCategory, setSelectedCaseCategory] = useState('All');
  const [submittedCaseIds, setSubmittedCaseIds] = useState(new Set());
  const [bidModalCase, setBidModalCase] = useState(null);
  const [detailsModalCase, setDetailsModalCase] = useState(null);
  const [discussionCase, setDiscussionCase] = useState(null);
  const [downloadingAssetId, setDownloadingAssetId] = useState(null);

  const hasLawyerBidOnCase = (caseItem) => {
    if (!caseItem) return false;
    if (submittedCaseIds.has(caseItem.id)) return true;
    if (caseItem.my_bid) return true;
    if (!lawyerProfile?.id) return false;
    return Boolean(
      caseItem.bids?.some(
        (b) => String(b.lawyer_profile_id) === String(lawyerProfile.id)
      )
    );
  };

  const handleOpenAsset = async (assetId) => {
    if (!assetId) return;
    setDownloadingAssetId(assetId);
    try {
      await openAssetInNewTab(assetId);
    } finally {
      setDownloadingAssetId(null);
    }
  };

  const handleBidSubmitted = (caseId) => {
    setSubmittedCaseIds((prev) => new Set([...prev, caseId]));
    reloadCases();
    if (detailsModalCase?.id === caseId) {
      setDetailsModalCase((prev) =>
        prev
          ? {
              ...prev,
              bids: [
                ...(prev.bids || []),
                { lawyer_profile_id: lawyerProfile?.id, status: 'pending' },
              ],
            }
          : null
      );
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'property':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'criminal':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'family':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'corporate':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  // Profile Assets states
  const avatarInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null);

  // Direct messaging states
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [isSelectedClientReadOnly, setIsSelectedClientReadOnly] = useState(false);

  const [localRequests, setLocalRequests] = useState([]);
  const [fetchingReceiptId, setFetchingReceiptId] = useState(null);

  // Meeting Settings states
  const [meetingProvider, setMeetingProvider] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [savingMeetingSettings, setSavingMeetingSettings] = useState(false);
  const [loadingMeetingSettings, setLoadingMeetingSettings] = useState(false);

  useEffect(() => {
    setLoadingMeetingSettings(true);
    api
      .get('/lawyer/me/meeting-settings')
      .then((res) => {
        if (res.data) {
          setMeetingProvider(res.data.meeting_provider || 'Google Meet');
          setMeetingLink(res.data.meeting_link || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingMeetingSettings(false);
      });
  }, []);

  const handleSaveMeetingSettings = async (e) => {
    e?.preventDefault?.();
    setSavingMeetingSettings(true);
    try {
      await api.put('/lawyer/me/meeting-settings', {
        meeting_provider: meetingProvider,
        meeting_link: meetingLink,
      });
      toast('Meeting settings saved successfully!', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to save meeting settings'), 'error');
    } finally {
      setSavingMeetingSettings(false);
    }
  };

  useEffect(() => {
    if (reqData) {
      setLocalRequests(asList(reqData, 'requests'));
    }
  }, [reqData]);

  useEffect(() => {
    const hasActive = localRequests.some((r) => r.meeting_started_at && !r.meeting_ended_at);
    if (!hasActive) return;
    const interval = setInterval(() => {
      reloadReq();
    }, 5000);
    return () => clearInterval(interval);
  }, [localRequests, reloadReq]);

  useEffect(() => {
    if (!selectedCitizen) {
      setIsSelectedClientReadOnly(false);
      return;
    }
    const citizenRequests = localRequests.filter(
      (r) => String(r.user_id) === String(selectedCitizen.user_id)
    );
    const hasConfirmed = citizenRequests.some((r) => r.status === 'confirmed');
    const hasCompleted = citizenRequests.some((r) => r.status === 'completed');
    setIsSelectedClientReadOnly(!hasConfirmed && hasCompleted);
  }, [selectedCitizen, localRequests]);

  const requests = localRequests;
  const schedules = asList(schedData, 'schedules');
  const conversations = asList(inboxData, 'inbox');
  const assets = asList(assetsData, 'assets');

  const avatarAsset = assets.find((a) => a.kind === 'avatar');
  const verificationDocs = assets.filter((a) => a.kind === 'verification');

  const formatDateEnGB = (dateVal) => {
    if (!dateVal) return '';
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

  const todayIso = new Date().toISOString().split('T')[0];

  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'payment_submitted');
  const confirmedRequests = requests.filter((r) => r.status === 'confirmed');

  // Past slots hidden, sorted ascending
  const futureSlots = schedules
    .filter((s) => !s.date || s.date >= todayIso)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.start_time || '').localeCompare(b.start_time || ''));

  const availableSlots = futureSlots.filter((s) => !s.is_booked);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  useEffect(() => {
    if (selectedCitizen && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, selectedCitizen]);

  // Periodic polling when inbox tab is active
  useEffect(() => {
    if (activeTab !== 'inbox') return;
    const interval = setInterval(() => {
      reloadInbox();
      if (selectedCitizen) {
        api.get(`/messages/lawyer/thread/${selectedCitizen.user_id}`)
          .then((res) => {
            const list = res.data?.thread || res.data?.messages || res.data || [];
            if (Array.isArray(list)) setThreadMessages(list);
          })
          .catch(() => {});
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, selectedCitizen]);

  const handleSelectCitizen = async (citizen) => {
    setSelectedCitizen(citizen);
    // Optimistically clear unread count in local state
    citizen.unread_count = 0;
    setThreadLoading(true);
    setThreadError(null);

    // Check booking status for this client
    let reqs = localRequests;
    try {
      const freshRes = await api.get('/lawyer/requests');
      const freshList = asList(freshRes.data, 'requests');
      setLocalRequests(freshList);
      reqs = freshList;
    } catch {
      // fallback to current localRequests
    }
    const citizenRequests = reqs.filter(
      (r) => String(r.user_id) === String(citizen.user_id)
    );
    const hasConfirmed = citizenRequests.some((r) => r.status === 'confirmed');
    const hasCompleted = citizenRequests.some((r) => r.status === 'completed');
    setIsSelectedClientReadOnly(!hasConfirmed && hasCompleted);

    try {
      const res = await api.get(`/messages/lawyer/thread/${citizen.user_id}`);
      const list = res.data?.thread || res.data?.messages || res.data || [];
      setThreadMessages(Array.isArray(list) ? list : []);
      reloadInbox();
    } catch (err) {
      setThreadError(getErrorMessage(err, 'Failed to load conversation thread.'));
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendReply = async ({ content, attachmentAssetIds }) => {
    if (!selectedCitizen) return;

    try {
      const res = await api.post(`/messages/lawyer/reply/${selectedCitizen.user_id}`, {
        content: content || '',
        attachment_asset_ids: attachmentAssetIds || [],
      });
      toast('Reply sent successfully', 'success');
      if (res.data) {
        setThreadMessages((prev) => [...prev, res.data]);
      } else {
        const updated = await api.get(`/messages/lawyer/thread/${selectedCitizen.user_id}`);
        setThreadMessages(updated.data?.thread || updated.data || []);
      }
      reloadInbox();
    } catch (err) {
      if (err.response?.status === 403 && err.response.data?.error === 'booking_completed') {
        setIsSelectedClientReadOnly(true);
        toast('This consultation is completed. Thread is read-only.', 'error');
      } else if (err.response?.status === 403 && err.response.data?.error === 'no_active_booking') {
        toast('No active consultation with this client.', 'error');
      } else {
        toast(getErrorMessage(err, 'Failed to send reply'), 'error');
      }
      throw err;
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/lawyer/requests/${bookingId}`, { status });
      if (status === 'confirmed') {
        toast('Booking confirmed', 'success');
      } else {
        toast('Booking cancelled', 'info');
      }
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === bookingId ? { ...r, status } : r))
      );
      reloadReq();
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update booking status'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/confirm-payment`);
      toast('Payment confirmed! Consultation is now scheduled.', 'success');
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === bookingId ? { ...r, status: 'confirmed' } : r))
      );
      reloadReq();
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to confirm payment'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/reject-payment`);
      toast('Payment rejected. Client can resubmit.', 'info');
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === bookingId ? { ...r, status: 'awaiting_payment' } : r))
      );
      reloadReq();
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to reject payment'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewReceipt = async (screenshotAssetId) => {
    if (!screenshotAssetId) {
      toast('No screenshot attached', 'info');
      return;
    }
    setFetchingReceiptId(screenshotAssetId);
    try {
      const res = await api.get(`/assets/${screenshotAssetId}/file`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to load receipt screenshot'), 'error');
    } finally {
      setFetchingReceiptId(null);
    }
  };

  const handleDeleteSlot = async (scheduleId) => {
    try {
      await api.delete(`/lawyer/schedules/${scheduleId}`);
      toast('Schedule slot deleted', 'info');
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Could not delete slot'), 'error');
    }
  };

  const getInitials = (name) =>
    name
      ?.replace('Advocate ', '')
      ?.replace('Adv. ', '')
      ?.split(' ')
      ?.map((n) => n[0])
      ?.filter(Boolean)
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'L';

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    toast('Uploading avatar...', 'info');
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
      toast(getErrorMessage(err, 'Failed to upload avatar'), 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (verificationDocs.length >= 3) {
      toast('Maximum 3 verification documents allowed.', 'error');
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      toast('Invalid file type. Allowed: PDF, PNG, JPG', 'error');
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('Document exceeds maximum limit of 2 MB', 'error');
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    setUploadingDoc(true);
    toast('Uploading verification document...', 'info');
    const formData = new FormData();
    formData.append('kind', 'verification');
    formData.append('file', file);

    try {
      await api.post('/profile/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Verification document uploaded successfully', 'success');
      reloadAssets();
    } catch (err) {
      const msg = err.response?.data?.message || getErrorMessage(err, 'Failed to upload verification document');
      toast(msg, 'error');
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId) => {
    setDeletingAssetId(assetId);
    try {
      await api.delete(`/profile/assets/${assetId}`);
      toast('Document deleted', 'success');
      reloadAssets();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete document'), 'error');
    } finally {
      setDeletingAssetId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Consultation Completed</span>
          </span>
        );
      case 'completion_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Completion Requested</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Paid & Confirmed</span>
          </span>
        );
      case 'payment_submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>Proof Submitted - Verify Now</span>
          </span>
        );
      case 'awaiting_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Awaiting Client Payment</span>
          </span>
        );
      case 'cancelled':
      case 'declined':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 capitalize">
            {status || 'pending'}
          </span>
        );
    }
  };

  const loading = reqLoading && schedLoading;
  const error = reqError || schedError;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <LoadingState message="Loading lawyer dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <ErrorState
          error={error}
          onRetry={() => {
            reloadReq();
            reloadSchedules();
          }}
        />
      </div>
    );
  }

  const lawyerName = user?.full_name || 'Advocate';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Lawyer Dashboard</h1>
            <p className="text-zinc-400 mt-1">Welcome back, {lawyerName}. Manage consultations and client bookings.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setActiveTab('availability');
                setShowAddSlot(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
            <Button
              variant={activeTab === 'availability' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('availability')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" /> Availability
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Pending Requests</p>
                <p className="text-2xl font-bold text-zinc-50">{pendingRequests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Confirmed Sessions</p>
                <p className="text-2xl font-bold text-zinc-50">{confirmedRequests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab('availability')}
            className="cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Available Open Slots</p>
                <p className="text-2xl font-bold text-zinc-50">{availableSlots.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab('inbox')}
            className="cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-400">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400 font-medium">Citizen Messages</p>
                  {totalUnread > 0 && (
                    <span className="text-[11px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      {totalUnread} new
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-zinc-50">{conversations.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-6 border-b border-zinc-800">
          <button
            id="tab-consultations"
            onClick={() => setActiveTab('consultations')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'consultations'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Consultations</span>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            id="tab-my-bids"
            onClick={() => setActiveTab('my-bids')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'my-bids'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gavel className="h-4 w-4" />
            <span>My Bids</span>
            {pendingBids.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingBids.length}
              </span>
            )}
          </button>

          <button
            id="tab-case-board"
            onClick={() => setActiveTab('cases')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cases'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Case Board</span>
            {isGoldVerified ? (
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/30">
                <Sparkles className="h-3 w-3 text-amber-400" /> Gold
              </span>
            ) : (
              <span className="bg-zinc-800 text-zinc-400 text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-zinc-700/50">
                <Lock className="h-3 w-3 text-zinc-500" /> Upgrade
              </span>
            )}
          </button>

          <button
            id="tab-availability"
            onClick={() => setActiveTab('availability')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'availability'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Availability</span>
            {availableSlots.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {availableSlots.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
            {totalUnread > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                {totalUnread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'meetings'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Meeting Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
        </div>

        {/* Modal: Quick Add Schedule Slot */}
        <AddSlotModal
          isOpen={showAddSlot}
          onClose={() => setShowAddSlot(false)}
          onSuccess={reloadSchedules}
        />

        {/* Tab Content 1: Consultations */}
        {activeTab === 'consultations' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Section 1: Booking Requests List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-500" /> Consultation Booking Requests
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reloadReq}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Refresh Requests
                </Button>
              </div>

              {requests.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No consultation requests"
                  description="New booking requests from clients will appear here for your review."
                  actionLabel="Refresh Requests"
                  onAction={reloadReq}
                />
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4 font-medium">User Name</th>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Time</th>
                          <th className="px-6 py-4 font-medium">Payment Proof</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {requests.map((req) => {
                          const clientName = req.user_name || req.client_name || req.clientName || 'Client';
                          const dateDisplay = formatDateEnGB(req.schedule_date || req.date || req.created_at) || 'Pending';
                          const timeDisplay = req.start_time
                            ? `${req.start_time}${req.end_time ? ' - ' + req.end_time : ''}`
                            : req.time || '10:00 AM';

                          return (
                            <tr
                              key={req.id}
                              className={`transition-colors ${
                                req.is_pro
                                  ? 'border-l-4 border-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
                                  : 'hover:bg-zinc-800/30'
                              }`}
                            >
                              <td className="px-6 py-4 font-semibold text-zinc-50">
                                <div className="flex items-center gap-2">
                                  <User className={`h-4 w-4 ${req.is_pro ? 'text-amber-400' : 'text-zinc-400'}`} />
                                  <span>{clientName}</span>
                                  {req.is_pro && (
                                    <div className="inline-flex items-center gap-1.5 ml-1">
                                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                        PRO
                                      </span>
                                      <span
                                        className="relative group inline-flex items-center cursor-help"
                                        title="Pro users receive priority handling."
                                      >
                                        <Info className="h-3.5 w-3.5 text-amber-400/80 hover:text-amber-300 transition-colors" />
                                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block bg-zinc-900 text-zinc-200 text-[11px] px-2 py-1 rounded shadow-lg border border-zinc-700 whitespace-nowrap z-20">
                                          Pro users receive priority handling.
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{dateDisplay}</td>
                              <td className="px-6 py-4 text-zinc-300 text-xs font-mono">{timeDisplay}</td>
                              <td className="px-6 py-4">
                                {req.status === 'payment_submitted' || req.trx_id ? (
                                  <div className="space-y-1.5">
                                    {req.trx_id ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">TrxID:</span>
                                        <span className="font-mono text-xs text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                          {req.trx_id}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-zinc-500 italic">No TrxID</span>
                                    )}
                                    <div>
                                      {req.screenshot_asset_id ? (
                                        <button
                                          type="button"
                                          onClick={() => handleViewReceipt(req.screenshot_asset_id)}
                                          disabled={fetchingReceiptId === req.screenshot_asset_id}
                                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                          {fetchingReceiptId === req.screenshot_asset_id ? (
                                            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                                          ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                          )}
                                          <span>View Receipt</span>
                                        </button>
                                      ) : (
                                        <span className="text-xs text-zinc-500 italic">No screenshot provided</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-600">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                              <td className="px-6 py-4">
                                {req.status === 'payment_submitted' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmPayment(req.id)}
                                      disabled={actionLoading === req.id}
                                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                      {actionLoading === req.id ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                      <span>Confirm Payment</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectPayment(req.id)}
                                      disabled={actionLoading === req.id}
                                      className="inline-flex items-center gap-1.5 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      <span>Reject Payment</span>
                                    </button>
                                  </div>
                                ) : req.status === 'pending' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleBookingAction(req.id, 'confirmed')}
                                      disabled={actionLoading === req.id}
                                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Confirm
                                    </button>
                                    <button
                                      onClick={() => handleBookingAction(req.id, 'cancelled')}
                                      disabled={actionLoading === req.id}
                                      className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      <X className="h-3.5 w-3.5" /> Cancel
                                    </button>
                                  </div>
                                ) : req.status === 'confirmed' || req.status === 'completion_requested' || req.status === 'completed' || req.meeting_started_at ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <MeetingControls
                                      booking={req}
                                      isLawyer={true}
                                      compact={true}
                                      currentUserId={user?.id}
                                      onBookingUpdate={(updated) => {
                                        setLocalRequests((prev) =>
                                          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
                                        );
                                        reloadReq();
                                      }}
                                      onOpenReviewModal={(b) => {
                                        setReviewModalBooking(b);
                                        setIsReviewModalOpen(true);
                                      }}
                                    />
                                    {req.status === 'completed' && !req.has_reviewed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReviewModalBooking(req);
                                          setIsReviewModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
                                      >
                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        <span>Review Client</span>
                                      </button>
                                    )}
                                    {req.status !== 'completed' && (
                                      <button
                                        onClick={() => handleBookingAction(req.id, 'cancelled')}
                                        disabled={actionLoading === req.id}
                                        className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        Cancel Booking
                                      </button>
                                    )}
                                  </div>
                                ) : req.status === 'awaiting_payment' ? (
                                  <span className="text-xs text-amber-400/80 italic">Awaiting payment</span>
                                ) : (
                                  <span className="text-xs text-zinc-500 italic">No actions</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: My Bids */}
        {activeTab === 'my-bids' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
                  <Gavel className="h-6 w-6 text-blue-500" />
                  <span>My Bids & Proposals</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Track the status of your submitted bids, continue discussions with clients, and launch accepted consultations.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reloadMyBids}
                  disabled={myBidsLoading}
                  className="text-xs border-zinc-700 hover:bg-zinc-800 gap-1.5 h-8.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${myBidsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('cases')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 h-8.5 shadow-md shadow-blue-900/30 font-semibold"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Browse Case Board</span>
                </Button>
              </div>
            </div>

            {myBidsLoading && myBids.length === 0 ? (
              <LoadingState message="Loading your bids and proposals..." />
            ) : myBidsError && myBids.length === 0 ? (
              <ErrorState
                message={getErrorMessage(myBidsError, 'Failed to load bids')}
                onRetry={reloadMyBids}
              />
            ) : (
              <div className="space-y-10">
                {/* 1. Active / Pending Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <h3 className="text-lg font-bold text-zinc-100">Active / Pending</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {pendingBids.length}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">Under client review</span>
                  </div>

                  {pendingBids.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-zinc-400 text-sm">
                      <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-60" />
                      <p className="font-medium text-zinc-300">No active or pending bids</p>
                      <p className="text-xs text-zinc-500 mt-1">Submit proposals on open cases from the Case Board.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                      {pendingBids.map((bid) => (
                        <div
                          key={bid.bid_id}
                          className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700/80 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                                  bid.category
                                )}`}
                              >
                                {bid.category || 'General'}
                              </span>
                              <Badge variant="warning" className="text-[11px] px-2 py-0.5">
                                Pending
                              </Badge>
                            </div>

                            <h4
                              className="font-bold text-zinc-100 text-base leading-snug line-clamp-2"
                              title={bid.case_title}
                            >
                              {bid.case_title}
                            </h4>

                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-2.5">
                              <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              <span className="font-medium text-zinc-300">{bid.client_name || 'Client'}</span>
                            </div>

                            <div className="mt-3.5 py-2 px-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                              <span className="text-zinc-400 font-medium">Proposed Fee:</span>
                              <span className="font-bold text-emerald-400 text-sm">
                                {bid.proposed_fee ? `৳${bid.proposed_fee.toLocaleString()}` : 'To be discussed'}
                              </span>
                            </div>

                            {bid.pitch && (
                              <p className="text-xs text-zinc-400/90 italic mt-3 line-clamp-2 bg-zinc-950/40 p-2 rounded border border-zinc-800/40">
                                "{bid.pitch}"
                              </p>
                            )}
                          </div>

                          <div className="mt-5 pt-3 border-t border-zinc-800/60">
                            <Button
                              size="sm"
                              onClick={() => handleOpenBidDiscussion(bid)}
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 h-8.5 cursor-pointer shadow-md shadow-blue-900/20"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Discuss Case</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Won (Accepted) Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-lg font-bold text-zinc-100">Won (Accepted)</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {wonBids.length}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Assigned Cases</span>
                  </div>

                  {wonBids.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-zinc-400 text-sm">
                      <CheckCircle2 className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-60" />
                      <p className="font-medium text-zinc-300">No accepted bids yet</p>
                      <p className="text-xs text-zinc-500 mt-1">When clients accept your bids, they will appear here ready for consultation.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                      {wonBids.map((bid) => (
                        <div
                          key={bid.bid_id}
                          className="bg-zinc-900/60 border border-emerald-500/30 rounded-xl p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-emerald-950/20"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                                  bid.category
                                )}`}
                              >
                                {bid.category || 'General'}
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Assigned
                              </span>
                            </div>

                            <h4
                              className="font-bold text-zinc-100 text-base leading-snug line-clamp-2"
                              title={bid.case_title}
                            >
                              {bid.case_title}
                            </h4>

                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-2.5">
                              <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              <span className="font-medium text-zinc-300">{bid.client_name || 'Client'}</span>
                            </div>

                            <div className="mt-3 py-1 px-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>Status: Assigned to You</span>
                            </div>

                            <div className="mt-3 py-2 px-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                              <span className="text-zinc-400 font-medium">Agreed Fee:</span>
                              <span className="font-bold text-emerald-400 text-sm">
                                {bid.proposed_fee ? `৳${bid.proposed_fee.toLocaleString()}` : 'Standard Consultation'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-zinc-800/60">
                            <Button
                              size="sm"
                              onClick={() => handleOpenWonConsultation(bid)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 h-8.5 cursor-pointer shadow-md shadow-emerald-900/30"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Open Consultation</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Lost / Rejected Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                      <h3 className="text-lg font-bold text-zinc-400">Lost / Rejected</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                        {lostBids.length}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">Unselected bids</span>
                  </div>

                  {lostBids.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800/50 bg-zinc-900/10 p-6 text-center text-zinc-500 text-xs">
                      No rejected bids.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                      {lostBids.map((bid) => (
                        <div
                          key={bid.bid_id}
                          className="bg-zinc-900/35 border border-zinc-800/60 rounded-xl p-5 opacity-70 flex flex-col justify-between select-none"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-zinc-700/50 text-zinc-400 bg-zinc-800/40">
                                {bid.category || 'General'}
                              </span>
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                Rejected
                              </span>
                            </div>

                            <h4
                              className="font-semibold text-zinc-300 text-base leading-snug line-clamp-2"
                              title={bid.case_title}
                            >
                              {bid.case_title}
                            </h4>

                            <p className="text-xs text-zinc-400 mt-3 italic flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded border border-zinc-800/40">
                              <X className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              <span>Client selected another lawyer</span>
                            </p>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-zinc-800/40 text-right">
                            <span className="text-[11px] text-zinc-500">No actions available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Availability */}
        {activeTab === 'availability' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-emerald-500" /> Your Availability Schedules
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Configure your open dates and time windows for client consultations. Past slots are automatically hidden.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/lawyer/availability">
                    <Button
                      variant="secondary"
                      className="gap-2 text-xs h-8"
                    >
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Weekly Grid View
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setShowAddSlot(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Slot
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reloadSchedules}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {futureSlots.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming schedules configured"
                  description="Create available time slots so clients can book consultations with you."
                  actionLabel="Add Availability Slot"
                  onAction={() => setShowAddSlot(true)}
                />
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Time Window</th>
                          <th className="px-6 py-4 font-medium">Slot Status</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {futureSlots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4 text-zinc-100 font-mono text-xs">{formatDateEnGB(slot.date)}</td>
                            <td className="px-6 py-4 text-zinc-300 font-mono text-xs">
                              {slot.start_time} - {slot.end_time}
                            </td>
                            <td className="px-6 py-4">
                              {slot.is_booked ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Booked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Available for Booking
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {!slot.is_booked && (
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Direct Messages Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-500" /> Pro Citizen Inquiries
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Direct message channels initiated by verified Pro subscribers.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reloadInbox}
                className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh Inbox
              </Button>
            </div>

            {inboxLoading ? (
              <LoadingState message="Loading citizen conversations..." />
            ) : inboxError ? (
              <ErrorState error={inboxError} onRetry={reloadInbox} />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No direct messages yet"
                description="When Pro citizens start a direct inquiry with your profile, their messages will appear here."
                actionLabel="Refresh Inbox"
                onAction={reloadInbox}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
                {/* Conversation List (Left Column) */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 divide-y divide-zinc-800/70 overflow-hidden shadow-xl">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 flex justify-between items-center">
                      <span>Conversations ({conversations.length})</span>
                      {totalUnread > 0 && (
                        <span className="text-[11px] font-bold text-blue-400">
                          {totalUnread} Unread
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 max-h-[540px] overflow-y-auto pr-1">
                      {conversations.map((c) => {
                        const isSelected = selectedCitizen?.user_id === c.user_id;
                        const hasUnread = (c.unread_count || 0) > 0;
                        const initial = (c.name || c.full_name || 'C')[0].toUpperCase();

                        return (
                          <button
                            key={c.user_id}
                            onClick={() => handleSelectCitizen(c)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                                : hasUnread
                                ? 'bg-blue-950/30 border-blue-500/40 hover:bg-blue-900/30 ring-1 ring-blue-500/20 shadow-md'
                                : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700'
                            }`}
                          >
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 border ${
                                hasUnread
                                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                                  : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {initial}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h4
                                  className={`text-sm truncate flex items-center gap-1.5 ${
                                    hasUnread ? 'font-bold text-white' : 'font-semibold text-zinc-100'
                                  }`}
                                >
                                  {hasUnread && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                                  )}
                                  <span>{c.name || c.full_name || 'Citizen'}</span>
                                </h4>
                                <span
                                  className={`text-[10px] font-mono shrink-0 ${
                                    hasUnread ? 'text-blue-400 font-bold' : 'text-zinc-500'
                                  }`}
                                >
                                  {c.last_time
                                    ? new Date(c.last_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>

                              <p
                                className={`text-xs truncate mb-1.5 leading-relaxed ${
                                  hasUnread ? 'font-semibold text-zinc-200' : 'text-zinc-400'
                                }`}
                              >
                                {c.last_message || 'New conversation'}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Pro Client
                                </span>

                                {hasUnread && (
                                  <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-blue-500/30 animate-pulse">
                                    {c.unread_count} new
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Conversation Thread & Reply Box (Right Column) */}
                <div className="lg:col-span-7 flex flex-col">
                  {selectedCitizen ? (
                    <Card className="flex flex-col h-full bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                      {/* Thread Top Bar */}
                      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                            {(selectedCitizen.name || selectedCitizen.full_name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-zinc-50 flex items-center gap-2">
                              {selectedCitizen.name || selectedCitizen.full_name || 'Citizen'}
                              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                                CLIENT
                              </span>
                            </h3>
                            <p className="text-xs text-zinc-400">
                              {isSelectedClientReadOnly
                                ? 'Completed Consultation Record'
                                : 'Direct Consultation Thread'}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectCitizen(selectedCitizen)}
                          className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Active Meeting Controls in Inbox Thread */}
                      {(() => {
                        const citizenBooking =
                          localRequests.find(
                            (r) =>
                              String(r.user_id) === String(selectedCitizen?.user_id) &&
                              (r.status === 'confirmed' || r.status === 'completion_requested' || r.status === 'completed' || (r.meeting_started_at && !r.meeting_ended_at))
                          ) ||
                          localRequests.find(
                            (r) => String(r.user_id) === String(selectedCitizen?.user_id)
                          );

                        if (!citizenBooking || (!['confirmed', 'completion_requested', 'completed'].includes(citizenBooking.status) && !citizenBooking.meeting_started_at)) {
                          return null;
                        }

                        return (
                          <div className="px-6 py-3 bg-zinc-950/80 border-b border-zinc-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5" />
                                <span>Consultation Session</span>
                              </span>
                              <p className="text-xs text-zinc-300 font-medium">
                                {citizenBooking.schedule_date || citizenBooking.date || 'Today'} • {citizenBooking.start_time || '10:00 AM'}{citizenBooking.end_time ? ` - ${citizenBooking.end_time}` : ''}
                              </p>
                            </div>
                            <MeetingControls
                              booking={citizenBooking}
                              isLawyer={true}
                              compact={true}
                              currentUserId={user?.id}
                              onBookingUpdate={(updated) => {
                                setLocalRequests((prev) =>
                                  prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
                                );
                                reloadReq();
                              }}
                              onOpenReviewModal={(b) => {
                                setReviewModalBooking(b);
                                setIsReviewModalOpen(true);
                              }}
                            />
                          </div>
                        );
                      })()}

                      {/* Shared DirectMessageThread component */}
                      <div className="flex-1 min-h-[460px] max-h-[560px]">
                        <DirectMessageThread
                          messages={threadMessages}
                          currentUserId={user?.id}
                          recipientName={selectedCitizen.name || selectedCitizen.full_name || 'Citizen'}
                          onSendMessage={handleSendReply}
                          loading={threadLoading}
                          error={threadError}
                          onRetry={() => handleSelectCitizen(selectedCitizen)}
                          isReadOnly={isSelectedClientReadOnly}
                          isLawyerView={true}
                          placeholder={`Reply to ${selectedCitizen.name || selectedCitizen.full_name || 'Citizen'}...`}
                        />
                      </div>
                    </Card>
                  ) : (
                    <Card className="flex flex-col items-center justify-center h-full min-h-[450px] p-8 text-center bg-zinc-900/40 border-zinc-800">
                      <div className="h-16 w-16 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mb-4 border border-zinc-700/50">
                        <MessageSquare className="h-8 w-8 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                        Select a conversation
                      </h3>
                      <p className="text-sm text-zinc-400 max-w-sm">
                        Choose a citizen from the inbox on the left to read their direct consultation
                        inquiries and send instant replies.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Profile & Verification Assets */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
            {/* Avatar Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative shrink-0">
                    {avatarAsset ? (
                      <img
                        src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${avatarAsset.id}/file`}
                        alt={lawyerName}
                        className="h-28 w-28 rounded-full object-cover border-4 border-zinc-800 shadow-xl"
                      />
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-blue-600/10 border-4 border-zinc-800 text-blue-400 flex items-center justify-center text-3xl font-bold shadow-xl">
                        {getInitials(lawyerName)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-xl font-bold text-zinc-50">{lawyerName}</h3>
                    <p className="text-sm text-zinc-400">
                      Profile photo displayed to clients across directory search and consultations.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        isLoading={uploadingAvatar}
                        className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm"
                      >
                        <Camera className="h-4 w-4" /> Change Photo
                      </Button>
                      <span className="text-xs text-zinc-500">
                        Max 1 MB (PNG, JPG, WEBP)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Documents Card */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-zinc-50">Verification Documents</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        {verificationDocs.length}/3
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Upload your Bar Council certificate, NID, or practicing license.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => docInputRef.current?.click()}
                      disabled={uploadingDoc || verificationDocs.length >= 3}
                      isLoading={uploadingDoc}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm"
                    >
                      <Upload className="h-4 w-4" /> Upload Document
                    </Button>
                  </div>
                </div>

                {/* Hint callout */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                  <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Documents are public only after admin approval. Until verified, they are securely restricted to you and platform moderators.
                  </span>
                </div>

                {/* Documents List */}
                {verificationDocs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                    <p>No verification documents uploaded yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">Upload up to 3 documents (PDF, PNG, JPG, max 2 MB each).</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verificationDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{doc.filename}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5 font-mono">
                              <span>{formatBytes(doc.size_bytes)}</span>
                              <span>•</span>
                              <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <a
                            href={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${doc.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-zinc-400" /> View
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAsset(doc.id)}
                            isLoading={deletingAssetId === doc.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs gap-1 px-2.5 py-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Meeting Settings */}
        {activeTab === 'meetings' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" /> Consultation Meeting Settings
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Configure your default consultation meeting provider and meeting link or phone number.
                When a client booking is confirmed, this link is automatically attached to the consultation session.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSaveMeetingSettings} className="space-y-6">
                  {/* Provider Dropdown */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">
                      Meeting Provider
                    </label>
                    <select
                      id="meeting-provider-select"
                      value={meetingProvider}
                      onChange={(e) => setMeetingProvider(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-zinc-500">
                      Choose which platform you use for your video consultations or select Phone Call.
                    </p>
                  </div>

                  {/* Meeting Link or Phone Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">
                      Meeting Link or Phone Number
                    </label>
                    <div className="relative">
                      <input
                        id="meeting-link-input"
                        type="text"
                        required
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder={
                          meetingProvider === 'Phone Call'
                            ? '+88017XXXXXXXX'
                            : 'https://meet.google.com/abc-defg-hij'
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 font-mono placeholder:font-sans placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      Enter your permanent room link (e.g. Google Meet, Zoom personal room) or direct phone number.
                    </p>
                  </div>

                  {/* Live Client Preview Box */}
                  {meetingLink && (
                    <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Client Preview
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium shrink-0">
                            {meetingProvider}
                          </span>
                          <span className="text-xs font-mono text-zinc-300 truncate">
                            {meetingLink}
                          </span>
                        </div>
                        <a
                          href={
                            /^https?:\/\//i.test(meetingLink) || /^tel:/i.test(meetingLink)
                              ? meetingLink
                              : `https://${meetingLink}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium shrink-0"
                        >
                          <span>Test Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">
                      Changes apply immediately to newly confirmed bookings.
                    </span>
                    <Button
                      type="submit"
                      disabled={savingMeetingSettings}
                      isLoading={savingMeetingSettings}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 font-semibold shadow-md shadow-blue-500/20"
                    >
                      Save Meeting Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Case Board */}
        {activeTab === 'cases' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Header & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-500" /> Open Legal Case Board
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Browse open legal briefs submitted by verified Pro citizens and place competitive bids to represent them.
                </p>
              </div>

              {isGoldVerified && (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Gold Verified Access
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reloadCases}
                    className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
              )}
            </div>

            {/* Check if Locked (non-Gold) */}
            {!isGoldVerified ? (
              <div className="space-y-6">
                {/* Upgrade Callout Banner */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-300">
                      Upgrade to Gold Verified to access the Case Board and win new clients.
                    </p>
                    <p className="text-xs text-amber-200/80 mt-1">
                      Direct case bidding is an exclusive premium feature for Gold Verified advocates who have completed credential verification.
                    </p>
                  </div>
                </div>

                {/* Locked Feature Showcase Card */}
                <Card className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-amber-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <CardContent className="p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <Lock className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Sparkles className="h-3 w-3" /> Gold Verified Feature
                      </span>
                      <h3 className="text-2xl font-bold text-zinc-50">
                        Case Board Access is Locked
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Pro clients post verified litigation, property, and corporate disputes on our Case Board every day. Upgrade your advocate status to Gold Verified to view full case briefs, access evidence attachments, and submit competitive legal bids.
                      </p>
                    </div>

                    {/* Value Props */}
                    <div className="grid sm:grid-cols-3 gap-4 text-left pt-2">
                      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                        <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" /> Open Case Briefs
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Browse cases in Property, Criminal, Family, and Corporate sectors.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                        <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                          <Gavel className="h-4 w-4" /> Direct Bidding
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Propose your legal fee and strategic approach directly to clients.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                        <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" /> Escrow Bookings
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Accepted bids automatically convert to secure platform bookings.
                        </p>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link to="/pricing">
                        <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold px-6 py-2.5 shadow-lg shadow-amber-500/20 gap-2">
                          <Sparkles className="h-4 w-4 text-zinc-950" />
                          <span>Upgrade to Gold Verified (৳2,500/yr)</span>
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        onClick={() => setActiveTab('profile')}
                        className="text-zinc-300 hover:text-zinc-100 gap-2"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>View Verification Docs</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : casesLoading ? (
              <div className="py-12">
                <LoadingState message="Loading open cases from the Case Board..." />
              </div>
            ) : casesError ? (
              <ErrorState
                error={casesError}
                onRetry={reloadCases}
              />
            ) : (
              <div className="space-y-6">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {['All', 'Property', 'Criminal', 'Family', 'Corporate', 'Other'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCaseCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCaseCategory === cat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Cases Grid */}
                {(() => {
                  const casesList = asList(casesData, 'cases');
                  const filteredCases = casesList.filter((c) => {
                    if (selectedCaseCategory === 'All') return true;
                    return c.category?.toLowerCase() === selectedCaseCategory.toLowerCase();
                  });

                  if (filteredCases.length === 0) {
                    return (
                      <EmptyState
                        icon={Briefcase}
                        title="No open cases available"
                        description={
                          selectedCaseCategory === 'All'
                            ? 'There are currently no open cases waiting for bids. Please check back later.'
                            : `No open cases found in the "${selectedCaseCategory}" category.`
                        }
                        actionLabel="Refresh Board"
                        onAction={reloadCases}
                      />
                    );
                  }

                  return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCases.map((caseItem) => {
                        const hasBid = hasLawyerBidOnCase(caseItem);
                        const attachmentCount = caseItem.attachment_asset_ids?.length || 0;
                        const shortDescription = caseItem.description
                          ? caseItem.description.length > 100
                            ? `${caseItem.description.slice(0, 100)}...`
                            : caseItem.description
                          : 'No description provided.';

                        return (
                          <Card
                            key={caseItem.id}
                            onClick={() => setDetailsModalCase(caseItem)}
                            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between group"
                          >
                            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                {/* Top Category & Status */}
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                                      caseItem.category
                                    )}`}
                                  >
                                    {caseItem.category || 'General'}
                                  </span>
                                  {hasBid ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      <CheckCircle2 className="h-3 w-3" /> Bid Placed
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      Open
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <div>
                                  <h3 className="text-base font-bold text-zinc-50 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {caseItem.title}
                                  </h3>
                                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>{caseItem.user_name || 'Pro Client'}</span>
                                  </p>
                                </div>

                                {/* Short Preview */}
                                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                                  {shortDescription}
                                </p>
                              </div>

                              {/* Footer Meta & Action */}
                              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs text-zinc-400">
                                  {attachmentCount > 0 ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-blue-400 font-medium"
                                      title={`${attachmentCount} attachment(s)`}
                                    >
                                      <Paperclip className="h-3.5 w-3.5" />
                                      <span>{attachmentCount} files</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-zinc-500 text-[11px]">
                                      <Paperclip className="h-3 w-3" />
                                      <span>0 files</span>
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {hasBid ? (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDiscussionCase(caseItem);
                                      }}
                                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold gap-1.5 h-8 px-3 cursor-pointer"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>Discuss with Client</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBidModalCase(caseItem);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 shadow-sm h-8 px-3"
                                    >
                                      <Gavel className="h-3.5 w-3.5" />
                                      <span>Submit Bid</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Case Details Expansion */}
      {detailsModalCase && (
        <Modal
          isOpen={Boolean(detailsModalCase)}
          onClose={() => setDetailsModalCase(null)}
          title={detailsModalCase.title}
          description={`Client: ${detailsModalCase.user_name || 'Pro Client'} • Category: ${detailsModalCase.category}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Category & Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                    detailsModalCase.category
                  )}`}
                >
                  {detailsModalCase.category}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Posted on {detailsModalCase.created_at ? new Date(detailsModalCase.created_at).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <div>
                {hasLawyerBidOnCase(detailsModalCase) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Bid Submitted
                  </span>
                ) : (
                  <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30">
                    Open for Bids
                  </span>
                )}
              </div>
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Case Brief & Description
              </h4>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {detailsModalCase.description || 'No detailed brief provided.'}
              </div>
            </div>

            {/* Evidence Attachments */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Attached Evidence Files</span>
                <span className="font-mono text-zinc-500">
                  {detailsModalCase.attachment_asset_ids?.length || 0} file(s)
                </span>
              </h4>

              {(!detailsModalCase.attachment_asset_ids || detailsModalCase.attachment_asset_ids.length === 0) ? (
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800 text-xs text-zinc-500 text-center">
                  No evidence documents attached to this case.
                </div>
              ) : (
                <div className="space-y-2">
                  {detailsModalCase.attachment_asset_ids.map((assetId, index) => (
                    <div
                      key={assetId}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            Case Evidence Document #{index + 1}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            ID: {assetId}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenAsset(assetId)}
                        disabled={downloadingAssetId === assetId}
                        isLoading={downloadingAssetId === assetId}
                        className="text-xs gap-1.5 h-8 px-3 shrink-0"
                      >
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        <span>View File</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                onClick={() => setDetailsModalCase(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Close
              </Button>
              {hasLawyerBidOnCase(detailsModalCase) ? (
                <Button
                  onClick={() => {
                    const caseToDiscuss = detailsModalCase;
                    setDetailsModalCase(null);
                    setDiscussionCase(caseToDiscuss);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Discuss with Client</span>
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const caseToBid = detailsModalCase;
                    setDetailsModalCase(null);
                    setBidModalCase(caseToBid);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  <span>Submit Bid</span>
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Submit Bid */}
      {bidModalCase && (
        <SubmitBidModal
          isOpen={Boolean(bidModalCase)}
          onClose={() => setBidModalCase(null)}
          caseItem={bidModalCase}
          onBidSubmitted={handleBidSubmitted}
        />
      )}

      {/* Modal: Case Discussion */}
      {discussionCase && (
        <CaseDiscussionModal
          isOpen={Boolean(discussionCase)}
          onClose={() => setDiscussionCase(null)}
          caseItem={discussionCase}
          bid={discussionCase.my_bid}
          currentUser={user}
          isLawyerView={true}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewModalBooking(null);
        }}
        booking={reviewModalBooking}
        revieweeName={reviewModalBooking?.user_name || reviewModalBooking?.client_name || reviewModalBooking?.clientName || 'Client'}
        onReviewSubmitted={() => {
          reloadReq();
        }}
      />

      {/* Modal: Bids Consultation Thread */}
      {isBidsConsultationOpen && bidsConsultationBooking && (
        <BookingThreadModal
          isOpen={isBidsConsultationOpen}
          onClose={() => {
            setIsBidsConsultationOpen(false);
            setBidsConsultationBooking(null);
          }}
          booking={bidsConsultationBooking}
          currentUser={user}
          isLawyerView={true}
        />
      )}
    </div>
  );
}

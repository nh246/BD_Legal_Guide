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
  Loader2,
  Phone,
  MapPin,
  Award,
  CreditCard,
} from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SecurityCard from '../../components/ui/SecurityCard';
import AddSlotModal from '../../components/ui/AddSlotModal';
import AvailabilityGrid from '../../components/ui/AvailabilityGrid';
import SubmitBidModal from '../../components/ui/SubmitBidModal';
import DirectMessageThread, { openAssetInNewTab } from '../../components/ui/DirectMessageThread';
import { assetCache } from '../../utils/assets';
import MeetingControls from '../../components/ui/MeetingControls';
import ReviewModal from '../../components/ui/ReviewModal';
import CaseDiscussionModal from '../../components/ui/CaseDiscussionModal';
import BookingThreadModal from '../../components/ui/BookingThreadModal';

import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

function EvidenceFileItem({ assetId, index, onOpen, isOpening }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return;
    }

    const cached = assetCache.get(assetId);
    if (cached) {
      const sizeBytes = cached.size || 0;
      const sizeStr = sizeBytes < 1024 * 1024
        ? `${(sizeBytes / 1024).toFixed(1)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      setMeta({
        filename: cached.filename || `Evidence Document #${index + 1}`,
        sizeStr,
      });
      setLoading(false);
      return;
    }

    let active = true;
    api
      .get(`/assets/${assetId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        const mime = res.headers['content-type'] || res.data?.type || '';
        let filename = `Evidence Document #${index + 1}`;
        const disp = res.headers['content-disposition'] || '';
        const match = disp.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        } else if (mime.includes('pdf')) {
          filename = `Evidence_${index + 1}.pdf`;
        }
        const sizeBytes = res.data?.size || 0;
        const sizeStr = sizeBytes < 1024 * 1024
          ? `${(sizeBytes / 1024).toFixed(1)} KB`
          : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        const blobUrl = URL.createObjectURL(res.data);
        assetCache.set(assetId, { url: blobUrl, blob: res.data, mime, filename, size: sizeBytes });
        setMeta({ filename, sizeStr });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setMeta({
          filename: `Evidence Document #${index + 1}`,
          sizeStr: 'Document',
          error: true,
        });
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assetId, index]);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-200 truncate">
            {meta?.filename || `Evidence Document #${index + 1}`}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono truncate">
            {loading ? 'Loading file...' : (meta?.sizeStr || 'Document')}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onOpen(assetId)}
        disabled={isOpening}
        isLoading={isOpening}
        className="text-xs gap-1.5 h-8 px-3 shrink-0 cursor-pointer"
      >
        <Eye className="h-3.5 w-3.5 text-zinc-400" />
        <span>View File</span>
      </Button>
    </div>
  );
}

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

  const isUnverified = Boolean(
    user?.role === 'lawyer' && !profileLoading && lawyerProfile?.verification_status !== 'approved'
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
    } else if (tabParam === 'profile') {
      setActiveTab('profile');
    } else if (tabParam === 'availability') {
      setActiveTab('availability');
    } else if (tabParam === 'inbox') {
      setActiveTab('inbox');
    } else if (tabParam === 'meetings') {
      setActiveTab('meetings');
    } else if (tabParam === 'consultations') {
      setActiveTab('consultations');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!profileLoading && isUnverified && ['consultations', 'cases', 'availability', 'my-bids'].includes(activeTab)) {
      setActiveTab('profile');
    }
  }, [profileLoading, isUnverified, activeTab]);

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
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalDuration, setModalDuration] = useState(30);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  // Profile Assets states
  const avatarInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState(null);

  // Profile form & verification checklist states
  const [profileFullName, setProfileFullName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileBarCouncilId, setProfileBarCouncilId] = useState('');
  const [profileDistrict, setProfileDistrict] = useState('Dhaka');
  const [profileSpecialization, setProfileSpecialization] = useState('Civil Litigation');
  const [profileYearsExp, setProfileYearsExp] = useState(5);
  const [profileHourlyRate, setProfileHourlyRate] = useState(1500);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBkash, setProfileBkash] = useState('');
  const [profileBkashType, setProfileBkashType] = useState('Personal');
  const [profileNagad, setProfileNagad] = useState('');
  const [profileNagadType, setProfileNagadType] = useState('Personal');
  const [profilePaymentInstructions, setProfilePaymentInstructions] = useState('');
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const slotNidRef = useRef(null);
  const slotBarCouncilRef = useRef(null);
  const slotPracticingLicenseRef = useRef(null);
  const slotRefs = {
    nid: slotNidRef,
    bar_council_cert: slotBarCouncilRef,
    practicing_license: slotPracticingLicenseRef,
  };

  useEffect(() => {
    if (lawyerProfile) {
      setProfileFullName(lawyerProfile.name || lawyerProfile.full_name || user?.full_name || '');
      setProfileBio(lawyerProfile.bio || lawyerProfile.description || '');
      setProfileBarCouncilId(lawyerProfile.bar_council_id || lawyerProfile.bar_council_no || '');
      setProfileDistrict(lawyerProfile.district || 'Dhaka');
      setProfileSpecialization(lawyerProfile.specialization || 'Civil Litigation');
      setProfileYearsExp(typeof lawyerProfile.years_exp === 'number' ? lawyerProfile.years_exp : 5);
      setProfileHourlyRate(typeof lawyerProfile.hourly_rate === 'number' ? lawyerProfile.hourly_rate : 1500);
      setProfilePhone(lawyerProfile.phone || user?.phone || '');
      setProfilePaymentInstructions(lawyerProfile.payment_instructions || '');
      if (lawyerProfile.meeting_provider) {
        setMeetingProvider(lawyerProfile.meeting_provider);
      }
      if (lawyerProfile.meeting_link) {
        setMeetingLink(lawyerProfile.meeting_link);
      }
      if (Array.isArray(lawyerProfile.payment_methods)) {
        const bkash = lawyerProfile.payment_methods.find((p) => (p.method || '').toLowerCase() === 'bkash');
        if (bkash) {
          setProfileBkash(bkash.number || bkash.account_number || '');
          if (bkash.type) setProfileBkashType(bkash.type);
        }
        const nagad = lawyerProfile.payment_methods.find((p) => (p.method || '').toLowerCase() === 'nagad');
        if (nagad) {
          setProfileNagad(nagad.number || nagad.account_number || '');
          if (nagad.type) setProfileNagadType(nagad.type);
        }
      }
    }
  }, [lawyerProfile, user]);

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
      await Promise.all([reloadAssets(), reloadLawyerProfile()]);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete document'), 'error');
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleSlotUpload = async (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      toast('Invalid file type. Allowed: PDF, PNG, JPG', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('Document exceeds maximum size limit of 2 MB', 'error');
      e.target.value = '';
      return;
    }

    setUploadingSlot(slotKey);
    const slotNames = {
      nid: 'National ID (NID)',
      bar_council_cert: 'Bar Council Certificate',
      practicing_license: 'Practicing License',
    };
    toast(`Uploading ${slotNames[slotKey] || 'document'}...`, 'info');

    const formData = new FormData();
    formData.append('kind', 'verification');
    formData.append('slot', slotKey);
    formData.append('file', file);

    try {
      await api.post('/profile/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast(`${slotNames[slotKey] || 'Document'} uploaded successfully`, 'success');
      await Promise.all([reloadAssets(), reloadLawyerProfile()]);
    } catch (err) {
      const msg = err.response?.data?.message || getErrorMessage(err, 'Failed to upload document');
      toast(msg, 'error');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleSubmitVerification = async () => {
    const checklist = lawyerProfile?.verification_checklist || {};
    if (!checklist.nid || !checklist.bar_council_cert || !checklist.practicing_license) {
      toast('Please upload all 3 documents before submitting for review.', 'error');
      return;
    }

    setIsSubmittingVerification(true);
    try {
      await api.post('/lawyer/verification/submit');
      toast('Verification submitted! Platform administrators have been notified.', 'success');
      await reloadLawyerProfile();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to submit verification request'), 'error');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();
    setIsSavingProfile(true);
    try {
      const paymentMethodsList = [];
      if (profileBkash.trim()) {
        paymentMethodsList.push({
          method: 'bKash',
          number: profileBkash.trim(),
          type: profileBkashType,
        });
      }
      if (profileNagad.trim()) {
        paymentMethodsList.push({
          method: 'Nagad',
          number: profileNagad.trim(),
          type: profileNagadType,
        });
      }

      const payload = {
        name: profileFullName.trim() || undefined,
        full_name: profileFullName.trim() || undefined,
        bio: profileBio.trim() || undefined,
        description: profileBio.trim() || undefined,
        bar_council_id: profileBarCouncilId.trim() || undefined,
        district: profileDistrict.trim() || undefined,
        specialization: profileSpecialization.trim() || undefined,
        years_exp: Number(profileYearsExp) || 0,
        hourly_rate: Number(profileHourlyRate) || 0,
        phone: profilePhone.trim() || undefined,
        payment_methods: paymentMethodsList,
        payment_instructions: profilePaymentInstructions.trim() || undefined,
        meeting_provider: meetingProvider.trim() || undefined,
        meeting_link: meetingLink.trim() || undefined,
      };

      await api.put('/lawyer/me', payload);
      toast('Profile information updated successfully!', 'success');
      await reloadLawyerProfile();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update profile'), 'error');
    } finally {
      setIsSavingProfile(false);
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

  const isUnverifiedErr = (err) => {
    return (
      err?.response?.data?.error === 'unverified_lawyer' ||
      err?.response?.status === 403 ||
      isUnverified
    );
  };

  const loading = !isUnverified && reqLoading && schedLoading;
  const error = (!isUnverifiedErr(reqError) ? reqError : null) || (!isUnverifiedErr(schedError) ? schedError : null);

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
              disabled={isUnverified}
              onClick={() => {
                if (isUnverified) return;
                setActiveTab('availability');
                setShowAddSlot(true);
              }}
              className={isUnverified ? "opacity-50 cursor-not-allowed gap-2" : "bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm"}
            >
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
            <Button
              disabled={isUnverified}
              variant={activeTab === 'availability' ? 'primary' : 'secondary'}
              onClick={() => {
                if (isUnverified) return;
                setActiveTab('availability');
              }}
              className={isUnverified ? "opacity-50 cursor-not-allowed gap-2" : "gap-2"}
            >
              <Calendar className="h-4 w-4" /> Availability
            </Button>
          </div>
        </div>

        {/* Unverified Lawyer Warning Banner */}
        {isUnverified && (
          <div id="unverified-lawyer-banner" className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-amber-100 flex items-center gap-2">
                <span>Account Pending Verification</span>
                {lawyerProfile?.verification_status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Under Review by Admin
                  </span>
                )}
                {lawyerProfile?.verification_status === 'rejected' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                    Verification Rejected
                  </span>
                )}
              </div>
              <p className="mt-1 text-amber-200/90 text-xs sm:text-sm">
                Your account is pending verification. Complete your profile and submit documents to unlock Case Board, Availability, and Consultations.
              </p>
              {lawyerProfile?.verification_status === 'rejected' && lawyerProfile?.verification_note && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                  <span className="font-semibold">Rejection reason: </span>{lawyerProfile.verification_note}
                </div>
              )}
            </div>
          </div>
        )}

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
            onClick={() => !isUnverified && setActiveTab('availability')}
            className={isUnverified ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-zinc-700 transition-colors"}
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
            onClick={() => !isUnverified && setActiveTab('consultations')}
            disabled={isUnverified}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              isUnverified
                ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-500'
                : activeTab === 'consultations'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Consultations</span>
            {isUnverified ? (
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
            ) : pendingRequests.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            id="tab-my-bids"
            onClick={() => !isUnverified && setActiveTab('my-bids')}
            disabled={isUnverified}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              isUnverified
                ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-500'
                : activeTab === 'my-bids'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gavel className="h-4 w-4" />
            <span>My Bids</span>
            {isUnverified ? (
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
            ) : pendingBids.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingBids.length}
              </span>
            )}
          </button>

          <button
            id="tab-case-board"
            onClick={() => !isUnverified && setActiveTab('cases')}
            disabled={isUnverified}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              isUnverified
                ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-500'
                : activeTab === 'cases'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Case Board</span>
            {isUnverified ? (
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
            ) : isGoldVerified ? (
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
            onClick={() => !isUnverified && setActiveTab('availability')}
            disabled={isUnverified}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              isUnverified
                ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-500'
                : activeTab === 'availability'
                ? 'border-blue-500 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Availability</span>
            {isUnverified ? (
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
            ) : availableSlots.length > 0 && (
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
          initialDate={modalDate}
          initialStartTime={modalStartTime}
          initialDuration={modalDuration}
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
                          const clientName = req.user_name || req.client_name || req.clientName || 'Unavailable user';
                          const hasDate = Boolean(req.schedule?.date || req.schedule_date || req.date);
                          const dateDisplay = hasDate
                            ? formatDateEnGB(req.schedule?.date || req.schedule_date || req.date)
                            : null;
                          const startTime = req.schedule?.start_time || req.start_time;
                          const endTime = req.schedule?.end_time || req.end_time;
                          const timeDisplay = startTime
                            ? `${startTime}${endTime ? ' - ' + endTime : ''}`
                            : req.time || null;

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
                              <td className="px-6 py-4 text-zinc-300 font-mono text-xs">
                                {dateDisplay ? (
                                  <span>{dateDisplay}</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    Schedule pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-zinc-300 text-xs font-mono">
                                {timeDisplay || (
                                  <span className="text-zinc-500 italic">Schedule pending</span>
                                )}
                              </td>
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
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-emerald-500" /> Your Availability Schedules
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    24-hour schedule grid (30-minute intervals). Click an open slot to configure consultation hours, including night emergency slots.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/lawyer/availability">
                    <Button
                      variant="secondary"
                      className="gap-2 text-xs h-8"
                    >
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Standalone Grid View
                    </Button>
                  </Link>
                  <Button
                    id="btn-add-slot-header"
                    onClick={() => {
                      setModalDate('');
                      setModalStartTime('09:00');
                      setModalDuration(30);
                      setShowAddSlot(true);
                    }}
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

              {/* 24-Hour 48-Row Real Availability Grid */}
              <AvailabilityGrid
                schedules={schedules}
                onOpenAddModal={(date, startTime, duration) => {
                  setModalDate(date);
                  setModalStartTime(startTime);
                  setModalDuration(duration || 30);
                  setShowAddSlot(true);
                }}
                onDeleteSlot={handleDeleteSlot}
              />

              {/* Upcoming Configured Slots Table */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    Upcoming Configured Slots ({futureSlots.length})
                  </h3>
                </div>
                {futureSlots.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming schedules configured"
                    description="Create available time slots so clients can book consultations with you."
                    actionLabel="Add Availability Slot"
                    onAction={() => {
                      setModalDate('');
                      setModalStartTime('09:00');
                      setModalDuration(30);
                      setShowAddSlot(true);
                    }}
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
                        const citizenName = c.name || c.full_name || 'Unavailable user';
                        const initial = (citizenName || 'U')[0].toUpperCase();

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
                                  <span>{citizenName}</span>
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
                            {(selectedCitizen.name || selectedCitizen.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-zinc-50 flex items-center gap-2">
                              {selectedCitizen.name || selectedCitizen.full_name || 'Unavailable user'}
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

                        const sessionDate = citizenBooking.schedule?.date || citizenBooking.schedule_date || citizenBooking.date || 'Schedule pending';
                        const sessionTime = citizenBooking.schedule?.start_time || citizenBooking.start_time || 'Schedule pending';
                        const sessionEndTime = citizenBooking.schedule?.end_time || citizenBooking.end_time;

                        return (
                          <div className="px-6 py-3 bg-zinc-950/80 border-b border-zinc-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5" />
                                <span>Consultation Session</span>
                              </span>
                              <p className="text-xs text-zinc-300 font-medium">
                                {sessionDate} • {sessionTime}{sessionEndTime ? ` - ${sessionEndTime}` : ''}
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
                          recipientName={selectedCitizen.name || selectedCitizen.full_name || 'Unavailable user'}
                          onSendMessage={handleSendReply}
                          loading={threadLoading}
                          error={threadError}
                          onRetry={() => handleSelectCitizen(selectedCitizen)}
                          isReadOnly={isSelectedClientReadOnly}
                          isLawyerView={true}
                          placeholder={`Reply to ${selectedCitizen.name || selectedCitizen.full_name || 'Unavailable user'}...`}
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

        {/* Tab Content 3: Unified Profile, Credentials & Practice Settings */}
        {activeTab === 'profile' && (() => {
          const checklist = lawyerProfile?.verification_checklist || {};
          const allSlotsUploaded = Boolean(checklist.nid && checklist.bar_council_cert && checklist.practicing_license);

          const VERIFICATION_SLOTS = [
            {
              key: 'nid',
              title: 'National ID (NID)',
              description: 'Bangladesh National Identity Card (Smart card or standard NID, clear front & back scan).',
            },
            {
              key: 'bar_council_cert',
              title: 'Bar Council Certificate',
              description: 'Official Bangladesh Bar Council enrollment certificate or Sanad issuance.',
            },
            {
              key: 'practicing_license',
              title: 'Practicing License',
              description: 'Current High Court permit or District Bar Association membership practicing certificate.',
            },
          ];

          const getSlotAssetInfo = (slotKey) => {
            const assetId = checklist[slotKey];
            if (!assetId) return null;
            const match = assets.find((a) => String(a.id) === String(assetId));
            if (match) return match;
            return { id: assetId, filename: 'Uploaded Credential', size_bytes: null };
          };

          return (
            <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl pb-12">
              {/* Card 1: Avatar & Basic Identity */}
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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                        <h3 className="text-xl font-bold text-zinc-50">{lawyerName}</h3>
                        {lawyerProfile?.verification_status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="h-3.5 w-3.5" /> Approved Advocate
                          </span>
                        )}
                        {lawyerProfile?.verification_status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="h-3.5 w-3.5" /> Under Review by Admin
                          </span>
                        )}
                        {lawyerProfile?.verification_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                            <X className="h-3.5 w-3.5" /> Verification Rejected
                          </span>
                        )}
                        {(!lawyerProfile?.verification_status || lawyerProfile?.verification_status === 'none') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <AlertCircle className="h-3.5 w-3.5" /> Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">
                        Profile photo displayed to clients across directory search and consultations. Max 1 MB (PNG, JPG, WEBP).
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Credential Verification Checklist (TASK 2) */}
              <Card className="border border-zinc-800">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-zinc-50">Credential Verification Documents</h3>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        All advocates on Legal Bridge must submit the 3 required documents below for compliance verification before taking consultations.
                      </p>
                    </div>

                    <div className="shrink-0">
                      {lawyerProfile?.verification_status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      ) : lawyerProfile?.verification_status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="h-4 w-4" /> Under Review by Admin
                        </span>
                      ) : lawyerProfile?.verification_status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          <X className="h-4 w-4" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          3 Slots Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection Note Alert */}
                  {lawyerProfile?.verification_status === 'rejected' && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm space-y-1.5">
                      <div className="font-semibold text-red-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span>Administrator Feedback</span>
                      </div>
                      <p className="text-xs sm:text-sm text-red-200/90">
                        {lawyerProfile.verification_note ||
                          'Your verification submission was rejected. Please re-upload clear copies of your documents and resubmit.'}
                      </p>
                      <p className="text-xs text-red-400 mt-1">
                        Replace any unreadable or expired documents below, then click &quot;Resubmit for Verification&quot;.
                      </p>
                    </div>
                  )}

                  {/* Pending Notice */}
                  {lawyerProfile?.verification_status === 'pending' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>
                        Your credentials have been submitted and are currently under review by our administration team. You will receive a notification upon approval.
                      </span>
                    </div>
                  )}

                  {/* 3-Slot Verification Checklist */}
                  <div className="space-y-4">
                    {VERIFICATION_SLOTS.map((slot) => {
                      const slotAsset = getSlotAssetInfo(slot.key);
                      const isUploaded = Boolean(slotAsset);

                      return (
                        <div
                          key={slot.key}
                          id={`slot-${slot.key}`}
                          className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isUploaded
                              ? 'bg-zinc-950/80 border-emerald-500/30 hover:border-emerald-500/50'
                              : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {isUploaded ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-zinc-600 flex items-center justify-center text-[10px] text-zinc-500 font-bold" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-zinc-100">{slot.title}</h4>
                                {isUploaded && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Uploaded
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">{slot.description}</p>
                              {isUploaded && (
                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 font-mono">
                                  <span className="text-zinc-300 font-medium truncate max-w-xs">{slotAsset.filename}</span>
                                  {slotAsset.size_bytes ? (
                                    <>
                                      <span>•</span>
                                      <span>{formatBytes(slotAsset.size_bytes)}</span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Hidden File Input for this slot */}
                          <input
                            ref={slotRefs[slot.key]}
                            type="file"
                            accept=".pdf,image/png,image/jpeg"
                            onChange={(e) => handleSlotUpload(slot.key, e)}
                            className="hidden"
                          />

                          {/* Slot Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {isUploaded ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAsset(slotAsset.id)}
                                  disabled={downloadingAssetId === slotAsset.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {downloadingAssetId === slotAsset.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                  )}
                                  <span>View</span>
                                </button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => slotRefs[slot.key].current?.click()}
                                  disabled={uploadingSlot === slot.key}
                                  isLoading={uploadingSlot === slot.key}
                                  className="text-xs gap-1.5 px-3 py-1.5"
                                >
                                  <Upload className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>Replace</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAsset(slotAsset.id)}
                                  isLoading={deletingAssetId === slotAsset.id}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2 py-1.5"
                                  title="Remove document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => slotRefs[slot.key].current?.click()}
                                disabled={uploadingSlot === slot.key}
                                isLoading={uploadingSlot === slot.key}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 px-3.5 py-1.5 shadow-sm"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <span>Upload</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Row */}
                  <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-zinc-400">
                      {lawyerProfile?.verification_status === 'approved' ? (
                        <span className="text-emerald-400 font-medium">Your credentials have been verified and approved.</span>
                      ) : lawyerProfile?.verification_status === 'pending' ? (
                        <span className="text-amber-300 font-medium">Documents are undergoing administrative review.</span>
                      ) : allSlotsUploaded ? (
                        <span className="text-emerald-400 font-medium">All 3 documents uploaded! Ready to submit for review.</span>
                      ) : (
                        <span className="text-zinc-500">Please upload all 3 documents above to enable submission.</span>
                      )}
                    </div>

                    <div>
                      {lawyerProfile?.verification_status === 'approved' ? (
                        <Button disabled className="opacity-60 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 gap-2">
                          <ShieldCheck className="h-4 w-4" /> Credentials Verified
                        </Button>
                      ) : lawyerProfile?.verification_status === 'pending' ? (
                        <Button disabled className="opacity-60 bg-amber-600/30 text-amber-300 border border-amber-500/30 gap-2">
                          <Clock className="h-4 w-4" /> Under Review by Admin
                        </Button>
                      ) : lawyerProfile?.verification_status === 'rejected' ? (
                        <Button
                          id="btn-submit-verification"
                          onClick={handleSubmitVerification}
                          disabled={!allSlotsUploaded || isSubmittingVerification}
                          isLoading={isSubmittingVerification}
                          className="bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm gap-2"
                        >
                          <RefreshCw className="h-4 w-4" /> Resubmit for Verification
                        </Button>
                      ) : (
                        <Button
                          id="btn-submit-verification"
                          onClick={handleSubmitVerification}
                          disabled={!allSlotsUploaded || isSubmittingVerification}
                          isLoading={isSubmittingVerification}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Submit for Verification
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Professional Practice Details */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-zinc-50">Professional Practice Details</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Keep your professional information up to date so clients can find your profile in searches.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Full Name</label>
                      <input
                        type="text"
                        value={profileFullName}
                        onChange={(e) => setProfileFullName(e.target.value)}
                        placeholder="e.g. Adv. Md. Rafiqul Islam"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      />
                    </div>

                    {/* Bar Council ID */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Bar Council ID / Sanad No</label>
                      <input
                        type="text"
                        value={profileBarCouncilId}
                        onChange={(e) => setProfileBarCouncilId(e.target.value)}
                        placeholder="e.g. BC-12345/DHK"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                      />
                    </div>

                    {/* District */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">District / Division</label>
                      <select
                        value={profileDistrict}
                        onChange={(e) => setProfileDistrict(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
                      >
                        <option value="Dhaka">Dhaka</option>
                        <option value="Chittagong">Chittagong</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Rajshahi">Rajshahi</option>
                        <option value="Khulna">Khulna</option>
                        <option value="Barisal">Barisal</option>
                        <option value="Rangpur">Rangpur</option>
                        <option value="Mymensingh">Mymensingh</option>
                        <option value="Comilla">Comilla</option>
                        <option value="Gazipur">Gazipur</option>
                        <option value="Narayanganj">Narayanganj</option>
                        <option value="Bogra">Bogra</option>
                      </select>
                    </div>

                    {/* Specialization */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Primary Specialization</label>
                      <select
                        value={profileSpecialization}
                        onChange={(e) => setProfileSpecialization(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
                      >
                        <option value="Civil Litigation">Civil Litigation</option>
                        <option value="Criminal Law">Criminal Law</option>
                        <option value="Corporate & Commercial">Corporate & Commercial</option>
                        <option value="Family & Divorce">Family & Divorce</option>
                        <option value="Land & Property">Land & Property</option>
                        <option value="Constitutional / Writ">Constitutional / Writ</option>
                        <option value="Cyber & Digital Law">Cyber & Digital Law</option>
                        <option value="Banking & Finance">Banking & Finance</option>
                        <option value="Labor & Employment">Labor & Employment</option>
                        <option value="Taxation & Customs">Taxation & Customs</option>
                      </select>
                    </div>

                    {/* Years of Experience */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={profileYearsExp}
                        onChange={(e) => setProfileYearsExp(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                      />
                    </div>

                    {/* Hourly Fee */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Consultation Fee (BDT ৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={profileHourlyRate}
                        onChange={(e) => setProfileHourlyRate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-200">Contact Phone Number</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+88017XXXXXXXX"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                      />
                    </div>

                    {/* Bio / Description */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-200">Professional Bio & Practice Overview</label>
                      <textarea
                        rows={4}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        placeholder="Provide details on your practice areas, court admissions, notable representation, and background..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Consultation Payment Settings (bKash / Nagad) */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-zinc-50">Consultation Fee Payment Settings</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Configure your bKash and Nagad numbers. Clients will send consultation fees directly to these mobile banking accounts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* bKash */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-pink-400">bKash Account</span>
                        <select
                          value={profileBkashType}
                          onChange={(e) => setProfileBkashType(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-2 py-1 outline-none"
                        >
                          <option value="Personal">Personal</option>
                          <option value="Merchant">Merchant</option>
                          <option value="Agent">Agent</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={profileBkash}
                        onChange={(e) => setProfileBkash(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-50 font-mono focus:ring-2 focus:ring-pink-500/40 outline-none"
                      />
                    </div>

                    {/* Nagad */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-orange-400">Nagad Account</span>
                        <select
                          value={profileNagadType}
                          onChange={(e) => setProfileNagadType(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-2 py-1 outline-none"
                        >
                          <option value="Personal">Personal</option>
                          <option value="Merchant">Merchant</option>
                          <option value="Agent">Agent</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={profileNagad}
                        onChange={(e) => setProfileNagad(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-50 font-mono focus:ring-2 focus:ring-orange-500/40 outline-none"
                      />
                    </div>

                    {/* Payment Instructions */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-200">Client Payment Instructions</label>
                      <textarea
                        rows={2}
                        value={profilePaymentInstructions}
                        onChange={(e) => setProfilePaymentInstructions(e.target.value)}
                        placeholder="e.g. Please use your Booking ID as the reference in bKash/Nagad and upload the transaction screenshot."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5: Meeting Link Settings */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-zinc-50">Default Consultation Meeting Settings</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      When a client booking is confirmed, this meeting link is automatically attached to the consultation session.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Meeting Provider</label>
                      <select
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
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Meeting Link / Phone Number</label>
                      <input
                        type="text"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder={meetingProvider === 'Phone Call' ? '+88017XXXXXXXX' : 'https://meet.google.com/abc-defg-hij'}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 6: Gold Badge Status */}
              <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-zinc-50">Gold Verified Advocate</h3>
                          {isGoldVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                          {isGoldVerified
                            ? 'You hold an active Gold Verified Advocate status. Your profile features priority ranking in citizen searches, a verified badge, and full access to bid on the client Case Board.'
                            : 'Upgrade your profile to Gold Verified (৳2,500/yr) to unlock the Case Board, submit direct client bids, and receive priority placement in the lawyer directory.'}
                        </p>
                      </div>
                    </div>

                    {!isGoldVerified && (
                      <Link to="/pricing?role=lawyer" className="shrink-0 w-full sm:w-auto">
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-md shadow-amber-500/20 gap-1.5">
                          <Sparkles className="h-4 w-4" /> Upgrade to Gold (৳2,500/yr)
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Security & Password */}
              <SecurityCard />

              {/* Bottom Sticky/Floating Save Action Bar */}
              <div className="pt-2 flex justify-end">
                <Button
                  id="btn-save-profile"
                  onClick={handleSaveProfile}
                  isLoading={isSavingProfile}
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 shadow-lg shadow-blue-600/25 gap-2 text-sm"
                >
                  <Check className="h-4 w-4" /> Save Profile Changes
                </Button>
              </div>
            </div>
          );
        })()}

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
                    <EvidenceFileItem
                      key={assetId}
                      assetId={assetId}
                      index={index}
                      onOpen={handleOpenAsset}
                      isOpening={downloadingAssetId === assetId}
                    />
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

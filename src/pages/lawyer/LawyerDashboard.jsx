import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

export default function LawyerDashboard() {
  const { user } = useAuthStore();
  const { data: reqData, loading: reqLoading, error: reqError, reload: reloadReq } = useApi('/lawyer/requests');
  const { data: schedData, loading: schedLoading, error: schedError, reload: reloadSchedules } = useApi('/lawyer/schedules');
  const { data: inboxData, loading: inboxLoading, error: inboxError, reload: reloadInbox } = useApi('/messages/lawyer/inbox');
  const { data: assetsData, loading: assetsLoading, reload: reloadAssets } = useApi('/profile/assets');

  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' | 'availability' | 'inbox' | 'profile'
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00 AM');
  const [newEndTime, setNewEndTime] = useState('11:00 AM');
  const [addingSlot, setAddingSlot] = useState(false);

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
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const threadEndRef = useRef(null);

  const requests = asList(reqData, 'requests');
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

  const pendingRequests = requests.filter((r) => r.status === 'pending');
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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedCitizen || replySending) return;

    const contentToSend = replyText.trim();
    setReplySending(true);
    try {
      const res = await api.post(`/messages/lawyer/reply/${selectedCitizen.user_id}`, {
        content: contentToSend,
      });
      setReplyText('');
      toast('Reply sent successfully', 'success');
      if (res.data) {
        setThreadMessages((prev) => [...prev, res.data]);
      } else {
        const updated = await api.get(`/messages/lawyer/thread/${selectedCitizen.user_id}`);
        setThreadMessages(updated.data?.thread || updated.data || []);
      }
      reloadInbox();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to send reply'), 'error');
    } finally {
      setReplySending(false);
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
      reloadReq();
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update booking status'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newDate || !newStartTime || !newEndTime) {
      toast('Please fill in all date and time fields', 'error');
      return;
    }
    if (newDate < todayIso) {
      toast('Slots must be in the future or today.', 'error');
      return;
    }

    setAddingSlot(true);
    try {
      await api.post('/lawyer/schedules', {
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });
      toast('Availability slot added successfully', 'success');
      setShowAddSlot(false);
      setNewDate('');
      reloadSchedules();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to create schedule slot'), 'error');
    } finally {
      setAddingSlot(false);
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
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'cancelled':
      case 'declined':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
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
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
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
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
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
        {showAddSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="max-w-md w-full p-6 space-y-5 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-50 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" /> Add Available Consultation Slot
                </h3>
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="text-zinc-400 hover:text-zinc-50 p-1 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Date (min = today)</label>
                  <input
                    type="date"
                    required
                    min={todayIso}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Start Time</label>
                    <input
                      type="text"
                      required
                      placeholder="10:00 AM"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">End Time</label>
                    <input
                      type="text"
                      required
                      placeholder="11:00 AM"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={addingSlot}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Create Slot
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

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
                              <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                              <td className="px-6 py-4">
                                {req.status === 'pending' ? (
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
                                ) : req.status === 'confirmed' ? (
                                  <button
                                    onClick={() => handleBookingAction(req.id, 'cancelled')}
                                    disabled={actionLoading === req.id}
                                    className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Cancel Booking
                                  </button>
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
                      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                            {(selectedCitizen.name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-zinc-50 flex items-center gap-2">
                              {selectedCitizen.name || 'Citizen'}
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                PRO
                              </span>
                            </h3>
                            <p className="text-xs text-zinc-400">Direct Consultation Thread</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectCitizen(selectedCitizen)}
                          className="text-xs text-zinc-400 hover:text-zinc-200"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Messages scroll area */}
                      <div className="flex-1 min-h-[380px] max-h-[460px] overflow-y-auto p-5 space-y-3 bg-zinc-950/70">
                        {threadLoading ? (
                          <div className="h-full flex items-center justify-center">
                            <LoadingState message="Loading thread messages..." />
                          </div>
                        ) : threadError ? (
                          <div className="h-full flex items-center justify-center">
                            <ErrorState
                              error={threadError}
                              onRetry={() => handleSelectCitizen(selectedCitizen)}
                            />
                          </div>
                        ) : threadMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                            <MessageSquare className="h-8 w-8 text-zinc-600 mb-2" />
                            <p className="text-sm font-semibold text-zinc-300">No messages in thread</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Send a reply below to reach out to this citizen.
                            </p>
                          </div>
                        ) : (
                          threadMessages.map((msg) => {
                            const isLawyer =
                              msg.sender_user_id === user?.id || msg.sender_role === 'lawyer';

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isLawyer ? 'items-end' : 'items-start'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                  <span className="text-[11px] font-medium text-zinc-400">
                                    {isLawyer ? 'You (Advocate)' : selectedCitizen.name || 'Citizen'}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                    isLawyer
                                      ? 'bg-blue-600 text-white rounded-br-none'
                                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={threadEndRef} />
                      </div>

                      {/* Reply Box at Bottom */}
                      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                        <form onSubmit={handleSendReply} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${selectedCitizen.name || 'Citizen'}...`}
                            disabled={replySending}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || replySending}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/20"
                          >
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">Send Reply</span>
                          </button>
                        </form>
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
      </div>
    </div>
  );
}

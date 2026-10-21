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
  const { data: inboxData, loading: inboxLoading, error: inboxError, reload: reloadInbox } = useApi('/lawyer/messages');

  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' | 'inbox'
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00 AM');
  const [newEndTime, setNewEndTime] = useState('11:00 AM');
  const [addingSlot, setAddingSlot] = useState(false);

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

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const confirmedRequests = requests.filter((r) => r.status === 'confirmed');
  const availableSlots = schedules.filter((s) => !s.is_booked);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  useEffect(() => {
    if (selectedCitizen && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, selectedCitizen]);

  const handleSelectCitizen = async (citizen) => {
    setSelectedCitizen(citizen);
    setThreadLoading(true);
    setThreadError(null);
    try {
      const res = await api.get(`/lawyer/messages/${citizen.user_id}`);
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
      const res = await api.post(`/lawyer/messages/${selectedCitizen.user_id}`, {
        content: contentToSend,
      });
      setReplyText('');
      toast('Reply sent successfully', 'success');
      if (res.data) {
        setThreadMessages((prev) => [...prev, res.data]);
      } else {
        const updated = await api.get(`/lawyer/messages/${selectedCitizen.user_id}`);
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
              onClick={() => setShowAddSlot(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </Button>
            <Link to="/lawyer/availability">
              <Button variant="secondary" className="gap-2">
                <Calendar className="h-4 w-4" /> Calendar
              </Button>
            </Link>
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

          <Card>
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
            <CalendarCheck className="h-4 w-4" />
            <span>Consultations & Schedules</span>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingRequests.length}
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
            <span>Direct Messages Inbox</span>
            {totalUnread > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {totalUnread}
              </span>
            )}
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
                  <label className="text-xs font-medium text-zinc-300">Date (e.g. 2026-11-01)</label>
                  <input
                    type="date"
                    required
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

        {/* Tab Content 1: Consultations & Schedules */}
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
                          const dateDisplay = req.date || (req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Pending');
                          const timeDisplay = req.start_time
                            ? `${req.start_time}${req.end_time ? ' - ' + req.end_time : ''}`
                            : req.time || '10:00 AM';

                          return (
                            <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4 font-semibold text-zinc-50 flex items-center gap-2">
                                <User className="h-4 w-4 text-zinc-400" />
                                <span>{clientName}</span>
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

            {/* Section 2: Lawyer's Own Schedule Slots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-emerald-500" /> Your Availability Schedules
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reloadSchedules}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Refresh Schedules
                </Button>
              </div>

              {schedules.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No schedules configured"
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
                        {schedules.map((slot) => (
                          <tr key={slot.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4 text-zinc-100 font-mono text-xs">{slot.date}</td>
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
                        const initial = (c.name || 'C')[0].toUpperCase();

                        return (
                          <button
                            key={c.user_id}
                            onClick={() => handleSelectCitizen(c)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                                : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700'
                            }`}
                          >
                            <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/30 mt-0.5">
                              {initial}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h4 className="text-sm font-semibold text-zinc-100 truncate">
                                  {c.name || 'Citizen'}
                                </h4>
                                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                  {c.last_time ? new Date(c.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-400 truncate mb-1.5 leading-relaxed">
                                {c.last_message || 'New conversation'}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Pro Client
                                </span>

                                {c.unread_count > 0 && (
                                  <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
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
      </div>
    </div>
  );
}

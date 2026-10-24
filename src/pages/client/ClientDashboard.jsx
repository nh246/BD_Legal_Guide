import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Calendar, ShieldCheck, Clock, ArrowRight, Camera, User, Pencil } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import useApi from '../../lib/useApi';
import useAuthStore from '../../store/useAuthStore';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function ClientDashboard() {
  const { user, token, updateUser } = useAuthStore();
  const { data: bookingsData, loading, error, reload } = useApi('/bookings/mine');
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

  const bookings = asList(bookingsData, 'bookings');
  const assets = asList(assetsData, 'assets');
  const avatarAsset = assets.find((a) => a.kind === 'avatar');

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

  // Section "Upcoming": pending + confirmed, sorted ascending (soonest first)
  const upcomingBookings = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => {
      const dateA = getBookingDateStr(a);
      const dateB = getBookingDateStr(b);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.start_time || a.time || '';
      const timeB = b.start_time || b.time || '';
      return timeA.localeCompare(timeB);
    });

  const nextBooking = upcomingBookings[0] || null;

  // Section "History": cancelled + completed rows, dimmed style
  const historyBookings = bookings
    .filter((b) => b.status === 'cancelled' || b.status === 'completed' || b.status === 'declined')
    .sort((a, b) => {
      const dateA = getBookingDateStr(a);
      const dateB = getBookingDateStr(b);
      return dateB.localeCompare(dateA);
    });

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

  const isPro = (subData?.status === 'active' && subData?.plan_code === 'user_pro') ||
                user?.plan === 'user_pro' || user?.is_pro === true;

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
          <div className="flex gap-3">
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
                  <p className="text-sm text-zinc-400 mt-1">{user?.email || 'citizen@bdlegal.ai'}</p>
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
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      nextBooking.status === 'confirmed'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {nextBooking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                )}
              </div>

              {nextBooking ? (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-zinc-50 truncate">
                    {nextBooking.lawyer_name || nextBooking.lawyerName || 'Advocate'}
                  </p>
                  <p className="text-xs text-zinc-300 font-mono">
                    {formatDateEnGB(nextBooking.schedule_date || nextBooking.date || nextBooking.start)}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono">
                    {formatTimeRange(nextBooking)}
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

        {/* Consultations List (Split into Upcoming and History) */}
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
                              <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                                {b.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 font-mono">
                              <span>{formatDateEnGB(b.schedule_date || b.date || b.start)}</span>
                              <span>•</span>
                              <span>{formatTimeRange(b)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center">
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
                              <span>{formatDateEnGB(b.schedule_date || b.date || b.start || b.created_at)}</span>
                              <span>•</span>
                              <span>{formatTimeRange(b)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center">
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
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => !cancellingBooking && setSelectedBooking(null)}
        title="Consultation Details"
        description="Review full details of this consultation booking."
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {selectedBooking?.status === 'pending' && (
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
              <Badge
                variant={
                  selectedBooking.status === 'confirmed'
                    ? 'success'
                    : selectedBooking.status === 'completed'
                    ? 'default'
                    : selectedBooking.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedBooking.status ? selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1) : 'Pending'}
              </Badge>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Consultation Date</span>
                <p className="font-semibold text-zinc-100 font-mono text-sm">
                  {formatDateEnGB(selectedBooking.schedule_date || selectedBooking.date || selectedBooking.start)}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Time Window</span>
                <p className="font-semibold text-zinc-100 font-mono text-sm">
                  {formatTimeRange(selectedBooking)}
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
              <span>Booking ID: <span className="font-mono text-zinc-400">#{selectedBooking.id}</span></span>
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
    </div>
  );
}


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
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
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

  useEffect(() => {
    api
      .get('/chat/usage')
      .then((r) => setPlan(r.data.plan || 'user_free'))
      .catch(() => setPlan('user_free'));
  }, []);

  const [activeTab, setActiveTab] = useState('about');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Direct messaging states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState(
    'Direct messaging with verified lawyers is a Pro feature.'
  );
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadThread = async () => {
    if (!id || plan === 'user_free') return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const res = await api.get(`/messages/lawyer/${id}`);
      const list = res.data?.messages || res.data || [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.response?.status === 402) {
        setShowMessageModal(false);
        const errorMsg =
          err.response.data?.message || 'Direct messaging with verified lawyers is a Pro feature.';
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

  useEffect(() => {
    if (showMessageModal && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showMessageModal]);

  // Periodic poll while thread modal is open
  useEffect(() => {
    if (!showMessageModal || !id || plan === 'user_free') return;
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
  }, [showMessageModal, id, plan]);

  const handleOpenMessaging = () => {
    if (!token || !user) {
      navigate(`/login?redirect=/client/lawyers/${id}`);
      return;
    }

    if (plan === 'user_free') {
      const msg = 'Direct messaging with verified lawyers is a Pro feature.';
      setShowMessageModal(false);
      setPaywallMessage(msg);
      setShowPaywallModal(true);
      toast(msg, 'error');
      return;
    }

    setShowMessageModal(true);
    loadThread();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    if (plan === 'user_free') {
      setShowMessageModal(false);
      const msg = 'Direct messaging with verified lawyers is a Pro feature.';
      setPaywallMessage(msg);
      setShowPaywallModal(true);
      toast(msg, 'error');
      return;
    }

    const contentToSend = newMessage.trim();
    setIsSending(true);
    try {
      const res = await api.post(`/messages/lawyer/${id}`, { content: contentToSend });
      setNewMessage('');
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        loadThread();
      }
      toast('Message sent', 'success');
    } catch (err) {
      if (err.response?.status === 402) {
        setShowMessageModal(false);
        const serverMsg =
          err.response.data?.message || 'Direct messaging with verified lawyers is a Pro feature.';
        setPaywallMessage(serverMsg);
        setShowPaywallModal(true);
        toast(serverMsg, 'error');
      } else {
        toast(getErrorMessage(err, 'Failed to send message'), 'error');
      }
    } finally {
      setIsSending(false);
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
  const reviews = Array.isArray(lawyer.reviews) ? lawyer.reviews : [];
  const rateBdt = lawyer.rateBdt || lawyer.rate || 2000;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div
                className={`shrink-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-zinc-950 shadow-xl overflow-hidden ${
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
                    <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-zinc-50">{lawyer.rating || '5.0'}</span>
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
                    className={`flex items-center justify-center gap-2 font-medium px-5 py-2.5 rounded-lg transition-colors border shadow-sm ${
                      plan === 'user_free'
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border-zinc-700'
                    }`}
                  >
                    {plan === 'user_free' ? (
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
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {reviews.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-12">No client reviews yet.</p>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={review.id || idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-zinc-50">{review.author || 'Client'}</div>
                        <div className="text-xs text-zinc-500">{review.date || 'Recent'}</div>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{review.text}</p>
                    </div>
                  ))
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

      {/* Direct Message Thread Modal (Pro) */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Message with ${lawyer.name}`}
        description="Direct consultation channel for Pro citizens. Inquire directly with this verified lawyer."
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60">
            <span className="text-xs text-zinc-400">Direct Consultation Channel</span>
            <button
              type="button"
              onClick={loadThread}
              disabled={messagesLoading}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className={`h-3 w-3 ${messagesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Thread messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            {messagesLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingState message="Loading conversation history..." />
              </div>
            ) : messagesError ? (
              <div className="h-full flex items-center justify-center">
                <ErrorState error={messagesError} onRetry={loadThread} />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="font-semibold text-zinc-200 text-sm">No messages yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Send a message below to start your direct consultation channel with {lawyer.name}.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {isMe ? 'You' : lawyer.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {isMe && (
                      <span className="text-[10px] text-zinc-500 mt-0.5 px-1">
                        {msg.is_read ? 'Read' : 'Delivered'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Box */}
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Write a message to ${lawyer.name}...`}
              disabled={isSending}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/20"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
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
    </div>
  );
}

import React, { useState } from 'react';
import { ShieldCheck, Calendar, CheckCircle2, Star, Wallet, Check, X, Link as LinkIcon, Video, FileText, Sparkles } from 'lucide-react';

export default function LawyerDashboard() {
  const [toastMsg, setToastMsg] = useState(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  // Mock State
  const [pendingRequests, setPendingRequests] = useState([
    { id: '1', clientName: 'Kazi Mahmud', datetime: 'Sep 22, 2026, 10:00 AM', caseBrief: 'My landlord is trying to evict me without providing the mandatory legal notice period as per the contract.' },
    { id: '2', clientName: 'Sadia A.', datetime: 'Sep 23, 2026, 14:30 PM', caseBrief: 'Need consultation regarding a breach of contract by our primary supplier and potential damages claim.' }
  ]);

  const [upcomingMeetings, setUpcomingMeetings] = useState([
    { id: '3', clientName: 'Tamim Hossain', datetime: 'Sep 24, 2026, 09:00 AM', meetLink: 'https://meet.google.com/abc-xyz-123' },
    { id: '4', clientName: 'Rashedul Islam', datetime: 'Sep 25, 2026, 11:00 AM', meetLink: 'https://meet.google.com/def-uvw-456' }
  ]);

  const [deletingId, setDeletingId] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Link copied");
  };

  const handleDecline = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setDeletingId(null);
    }, 500); // Wait for transition
  };

  const handleAcceptClick = (id) => {
    setSelectedReqId(id);
    setMeetLinkInput('');
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = () => {
    if (!meetLinkInput.trim()) return;
    setIsAccepting(true);
    
    setTimeout(() => {
      const req = pendingRequests.find(r => r.id === selectedReqId);
      
      setPendingRequests(prev => prev.filter(r => r.id !== selectedReqId));
      setUpcomingMeetings(prev => [{
        id: req.id,
        clientName: req.clientName,
        datetime: req.datetime,
        meetLink: meetLinkInput
      }, ...prev]);

      setIsAccepting(false);
      setAcceptModalOpen(false);
      showToast("Booking confirmed");
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm font-medium text-amber-400">
            Verification pending — you can receive requests but bookings activate after admin approval.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">{upcomingMeetings.length}</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">14</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Avg Rating</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">4.8</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Wallet className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Earnings</span>
            </div>
            <div className="text-2xl font-bold text-zinc-50">৳21,500</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Booking Requests */}
            <section>
              <h2 className="text-xl font-bold text-zinc-50 mb-4">Booking Requests</h2>
              {pendingRequests.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-8 text-center text-zinc-500 text-sm">
                  No pending requests right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(req => (
                    <div 
                      key={req.id} 
                      className={`bg-zinc-900 border rounded-xl p-5 transition-all duration-300 ${
                        deletingId === req.id ? 'border-red-500/50 bg-red-500/10 opacity-50 scale-[0.98]' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-zinc-50 mb-1">{req.clientName}</h3>
                          <div className="text-xs font-medium text-blue-400 mb-3">{req.datetime}</div>
                          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">"{req.caseBrief}"</p>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button 
                            onClick={() => handleAcceptClick(req.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Check className="h-4 w-4" /> Accept
                          </button>
                          <button 
                            onClick={() => handleDecline(req.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <X className="h-4 w-4" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Schedule */}
            <section>
              <h2 className="text-xl font-bold text-zinc-50 mb-4">Upcoming Schedule</h2>
              {upcomingMeetings.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-8 text-center text-zinc-500 text-sm">
                  No upcoming meetings.
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map(meeting => (
                    <div key={meeting.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-zinc-50 mb-1">{meeting.clientName}</h3>
                        <div className="text-xs font-medium text-zinc-400">{meeting.datetime}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Confirmed
                        </span>
                        <div className="h-6 w-px bg-zinc-800 hidden md:block"></div>
                        <button 
                          onClick={() => handleCopy(meeting.meetLink)}
                          className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg"
                        >
                          <LinkIcon className="h-3.5 w-3.5" /> Copy Meet link
                        </button>
                        <button 
                          onClick={() => window.open(meeting.meetLink, '_blank')}
                          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" /> Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-zinc-50 mb-4">AI Case Briefs</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-zinc-50">Kazi Mahmud</span>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400">
                    New
                  </span>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500/10 p-1.5 rounded-bl-lg">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Client faces potential illegal eviction. The landlord has not provided a formal written notice, violating standard tenancy procedures.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detected Acts</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded">Premises Rent Control Act 1991</span>
                    <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded">Transfer of Property Act 1882 §106</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Suggested Questions</div>
                  <ul className="space-y-2">
                    <li className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0"></span>
                      Do you have a written tenancy agreement?
                    </li>
                    <li className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0"></span>
                      Have you paid your rent up to the current month?
                    </li>
                    <li className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0"></span>
                      Has any verbal or written notice been given to you?
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/50 text-right">
                  <span className="text-[10px] text-zinc-500 font-mono">Generated 10 minutes ago by BD Legal AI</span>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAccepting && setAcceptModalOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-50 mb-2">Accept Booking</h3>
            <p className="text-sm text-zinc-400 mb-6">Please provide a meeting link for the client to join.</p>
            
            <input 
              type="url"
              placeholder="https://meet.google.com/..."
              value={meetLinkInput}
              onChange={(e) => setMeetLinkInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                disabled={isAccepting}
                onClick={() => setAcceptModalOpen(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isAccepting || !meetLinkInput.trim()}
                onClick={handleConfirmAccept}
                className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isAccepting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 text-zinc-50 px-4 py-2.5 rounded-lg shadow-xl border border-zinc-700 animate-in slide-in-from-bottom-5 fade-in font-medium text-sm">
          {toastMsg}
        </div>
      )}

    </div>
  );
}

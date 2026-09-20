import React, { useState, useMemo } from 'react';
import { Video, FileText, X, CheckCircle2, SearchX, Calendar } from 'lucide-react';
import useBookingStore from '../../store/useBookingStore';

export default function MyBookingsPage() {
  const { bookings, cancelBooking } = useBookingStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBrief, setSelectedBrief] = useState(null); // stores the booking object for modal

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeTab === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
      if (activeTab === 'past') return b.status === 'completed';
      if (activeTab === 'cancelled') return b.status === 'cancelled';
      return false;
    });
  }, [bookings, activeTab]);

  const getInitials = (name) => name.replace('Adv. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ', ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Confirmation</span>;
      case 'confirmed':
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Confirmed</span>;
      case 'completed':
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8 relative">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">My Consultations</h1>
          <p className="text-zinc-500 font-medium">Manage your video consultation bookings.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-none">
          {['upcoming', 'past', 'cancelled'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium whitespace-nowrap capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab} Consultations
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredBookings.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-zinc-950 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'upcoming' ? <Calendar className="h-8 w-8 text-zinc-500" /> : <SearchX className="h-8 w-8 text-zinc-500" />}
            </div>
            <h3 className="text-xl font-semibold text-zinc-50 mb-2">No {activeTab} bookings</h3>
            <p className="text-zinc-400 max-w-sm">
              {activeTab === 'upcoming' && 'You have no upcoming consultations scheduled. Book a lawyer from the directory.'}
              {activeTab === 'past' && 'You have not completed any consultations yet.'}
              {activeTab === 'cancelled' && 'You have no cancelled consultations.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-zinc-700">
                
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-lg border border-blue-500/20">
                    {getInitials(booking.lawyerName)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-50 mb-1">{booking.lawyerName}</h3>
                    <div className="text-sm text-zinc-400 mb-2">{formatDate(booking.start)}</div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status)}
                      <span className="text-xs font-mono text-zinc-500">ID: {booking.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <button 
                    onClick={() => setSelectedBrief(booking)}
                    className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileText className="h-4 w-4 text-zinc-500" /> View brief
                  </button>
                  
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button 
                      onClick={() => cancelBooking(booking.id)}
                      className="flex items-center gap-2 bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  )}

                  {activeTab === 'upcoming' && (
                    <div className="relative group">
                      <button 
                        disabled={booking.status !== 'confirmed'}
                        onClick={() => window.open(booking.meetLink, '_blank')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors
                          ${booking.status === 'confirmed' 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                          }
                        `}
                      >
                        <Video className="h-4 w-4" /> Join Call
                      </button>
                      
                      {booking.status === 'pending' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-50 text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
                          Available after lawyer confirms
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Brief Modal */}
      {selectedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBrief(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-50">Case Brief</h2>
                <p className="text-sm text-zinc-400 mt-1">Submitted for {selectedBrief.lawyerName}</p>
              </div>
              <button onClick={() => setSelectedBrief(null)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-6">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedBrief.caseBrief}</p>
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-400">
                You securely shared this brief when booking. It helps the lawyer prepare for your consultation.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

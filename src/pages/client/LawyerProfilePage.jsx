import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, BadgeCheck, Clock, Share2, Calendar as CalendarIcon, CheckCircle2, GraduationCap, Languages, FileText } from 'lucide-react';
import { mockLawyers } from '../../data/mockLawyers';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function LawyerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lawyer = mockLawyers.find(l => l.id === id);

  const [activeTab, setActiveTab] = useState('about');
  const [selectedSlot, setSelectedSlot] = useState(null); // { day, time }

  if (!lawyer) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-zinc-50 mb-4">Lawyer not found</h2>
        <Link to="/lawyers" className="text-blue-500 hover:underline">Return to directory</Link>
      </div>
    );
  }

  const getInitials = (name) => name.replace('Adv. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  const maskBarId = (barId) => {
    const parts = barId.split('-');
    if (parts.length === 3) return `${parts[0]}-****-${parts[2].slice(-2)}`;
    return 'BC-****21';
  };

  const getSlotStatus = (day, time) => {
    const slot = lawyer.availability.find(a => a.day === day && a.time === time);
    return slot ? slot.status : 'unavailable';
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          
          {/* Header Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              
              {/* Avatar */}
              <div className={`shrink-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-zinc-950 shadow-xl ${
                lawyer.tier === 'gold' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-600/10 text-blue-500'
              }`}>
                {getInitials(lawyer.name)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 flex items-center gap-2 mb-1.5">
                      {lawyer.name}
                      {lawyer.tier === 'gold' 
                        ? <ShieldCheck className="h-7 w-7 text-amber-500 shrink-0" title="Gold Verified" />
                        : <BadgeCheck className="h-7 w-7 text-blue-500 shrink-0" title="Verified" />
                      }
                    </h1>
                    <div className="text-sm font-medium text-zinc-400 mb-4 font-mono">
                      {maskBarId(lawyer.barId)}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-zinc-500" /> {lawyer.locations.join(', ')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Languages className="h-4 w-4 text-zinc-500" /> {lawyer.languages.join(', ')}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="h-4 w-4" /> Responds in ~2 hrs
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> 
                      <span className="font-bold text-zinc-50">{lawyer.rating}</span>
                      <span className="text-zinc-500 text-sm">({lawyer.reviewCount})</span>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <span className="text-2xl font-bold text-zinc-50">৳{lawyer.rateBdt.toLocaleString()}</span>
                      <span className="text-zinc-500 text-sm">/hr</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-zinc-800/50">
                  <button 
                    onClick={() => setActiveTab('availability')}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Book Consultation
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 font-medium px-4 py-2.5 rounded-lg transition-colors">
                    <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-zinc-800 mb-8 overflow-x-auto scrollbar-none">
            {['about', 'reviews', 'availability'].map(tab => (
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
                  <p className="text-zinc-400 leading-relaxed">{lawyer.bio}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-50 mb-3">Practice Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specialties.map(spec => (
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
                      {lawyer.education.map((edu, idx) => (
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
                        <span>Enrollment Year</span>
                        <span className="text-zinc-50 font-medium">{new Date().getFullYear() - lawyer.experienceYrs}</span>
                      </li>
                      <li className="text-sm text-zinc-400 flex items-start justify-between">
                        <span>Experience</span>
                        <span className="text-zinc-50 font-medium">{lawyer.experienceYrs} Years</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
                {/* Summary */}
                <div className="lg:w-1/3 shrink-0">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-zinc-50 mb-2">{lawyer.rating}</div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-5 w-5 ${i <= Math.round(lawyer.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}`} />
                      ))}
                    </div>
                    <div className="text-sm text-zinc-500 mb-6">Based on {lawyer.reviewCount} reviews</div>
                    
                    <div className="space-y-2">
                      {[5,4,3,2,1].map(stars => (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="text-zinc-400 w-2 shrink-0">{stars}</span>
                          <Star className="h-3 w-3 text-zinc-600 shrink-0" />
                          <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                              className="h-full bg-amber-400 rounded-full" 
                              style={{ width: stars === 5 ? '85%' : stars === 4 ? '10%' : '2%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 space-y-4">
                  {lawyer.reviews.map(review => (
                    <div key={review.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-zinc-50">{review.author}</div>
                        <div className="text-xs text-zinc-500">{review.date}</div>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
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
                        {DAYS.map(day => (
                          <th key={day} className="p-3 font-medium">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {TIMES.map(time => (
                        <tr key={time}>
                          <td className="p-3 text-zinc-500 text-xs border-r border-zinc-800 bg-zinc-900 font-medium">
                            {time}
                          </td>
                          {DAYS.map(day => {
                            const status = getSlotStatus(day, time);
                            const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                            
                            return (
                              <td key={`${day}-${time}`} className="p-1">
                                <button
                                  disabled={status !== 'available'}
                                  onClick={() => handleSlotClick(day, time)}
                                  className={`w-full py-2.5 rounded transition-colors border text-xs font-medium ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                      : status === 'available'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                        : status === 'booked'
                                          ? 'bg-zinc-800/50 text-zinc-600 border-transparent cursor-not-allowed line-through decoration-zinc-600'
                                          : 'bg-zinc-900 text-zinc-700 border-transparent cursor-not-allowed'
                                  }`}
                                >
                                  {status === 'available' ? (isSelected ? 'Selected' : 'Open') : status === 'booked' ? 'Booked' : '—'}
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

        {/* Sticky Right Sidebar (Booking Summary) */}
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
                <span className="text-zinc-50 font-medium">৳{(lawyer.rateBdt / 2).toLocaleString()}</span>
              </div>
            </div>

            {selectedSlot ? (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in slide-in-from-bottom-2">
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

            <div className="border-t border-zinc-800 pt-4 mb-6 flex justify-between items-center">
              <span className="font-semibold text-zinc-50">Total</span>
              <span className="text-xl font-bold text-zinc-50">৳{(lawyer.rateBdt / 2).toLocaleString()}</span>
            </div>

            <button 
              disabled={!selectedSlot}
              onClick={() => navigate(`/consultation/book/${lawyer.id}?slot=${selectedSlot.day}-${selectedSlot.time}`)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 shadow-lg shadow-blue-500/20"
            >
              Continue to Booking
            </button>
            <p className="text-xs text-zinc-500 text-center mt-3">You won't be charged yet.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

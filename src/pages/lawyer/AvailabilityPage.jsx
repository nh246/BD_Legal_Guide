import React, { useState } from 'react';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function AvailabilityPage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  
  // Basic mock state holding "available" cells
  const [availability, setAvailability] = useState({
    'Monday-10:00 AM': true,
    'Monday-11:00 AM': true,
    'Wednesday-02:00 PM': true,
    'Wednesday-03:00 PM': true,
    'Friday-09:00 AM': true
  });

  const toggleSlot = (day, time) => {
    const key = `${day}-${time}`;
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Availability Setup</h1>
            <p className="text-zinc-400 mt-1">Click cells to toggle your weekly availability for consultations.</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Save className="h-4 w-4" /> Save Schedule
          </Button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto shadow-xl">
          <table className="w-full text-sm text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4 w-32 border-r border-zinc-800 text-center"><CalendarIcon className="h-4 w-4 mx-auto" /></th>
                {days.map(day => (
                  <th key={day} className="p-4 text-center border-r border-zinc-800 last:border-r-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {times.map(time => (
                <tr key={time} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-medium text-zinc-300 border-r border-zinc-800 text-center bg-zinc-900/50">
                    {time}
                  </td>
                  {days.map(day => {
                    const isAvailable = availability[`${day}-${time}`];
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className="p-2 border-r border-zinc-800 last:border-r-0"
                      >
                        <button
                          onClick={() => toggleSlot(day, time)}
                          className={`w-full h-12 rounded-lg transition-all border ${
                            isAvailable 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {isAvailable ? 'Available' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center gap-6 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/30"></div>
            <span>Available for booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-zinc-950 border border-zinc-800"></div>
            <span>Unavailable</span>
          </div>
        </div>

      </div>
    </div>
  );
}

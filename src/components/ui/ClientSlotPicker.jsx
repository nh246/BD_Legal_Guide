import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarX,
  CalendarDays,
  LayoutGrid,
  ListFilter,
  Check,
} from 'lucide-react';

const formatIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateEnGB = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length !== 3) return String(dateStr);
  const [y, m, d] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${d} ${monthName} ${y}`;
};

export default function ClientSlotPicker({
  schedules = [],
  selectedSlot = null,
  onSelectSlot,
  loading = false,
  lawyerName = 'Advocate',
}) {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'grid'

  // Generate upcoming days (next 7 days minimum, plus any future dates that have open slots)
  const upcomingDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateSet = new Set();
    const list = [];

    // Base next 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = formatIsoDate(d);
      dateSet.add(iso);
      list.push({
        dateStr: iso,
        dateObj: d,
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullWeekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: i === 0,
      });
    }

    // Include any additional future dates from openSlots
    (openSlots || []).forEach((s) => {
      if (!s.date) return;
      const iso = typeof s.date === 'string' ? s.date.slice(0, 10) : '';
      if (!iso || dateSet.has(iso)) return;
      const d = new Date(iso + 'T00:00:00');
      if (d >= today) {
        dateSet.add(iso);
        list.push({
          dateStr: iso,
          dateObj: d,
          weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
          fullWeekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: iso === formatIsoDate(today),
        });
      }
    });

    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return list;
  }, [openSlots]);

  // Filter only unbooked open slots
  const openSlots = useMemo(() => {
    return (schedules || []).filter((s) => !s.is_booked);
  }, [schedules]);

  // Group open slots by normalized date (YYYY-MM-DD)
  const slotsByDate = useMemo(() => {
    const map = {};
    openSlots.forEach((slot) => {
      if (!slot.date) return;
      const dStr = typeof slot.date === 'string' ? slot.date.slice(0, 10) : '';
      if (!dStr) return;
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(slot);
    });

    // Sort slots within each date chronologically
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [openSlots]);

  // Find the first date that has available slots, otherwise default to today
  const initialDateStr = useMemo(() => {
    for (const d of upcomingDays) {
      if (slotsByDate[d.dateStr]?.length > 0) {
        return d.dateStr;
      }
    }
    return upcomingDays[0]?.dateStr || '';
  }, [upcomingDays, slotsByDate]);

  const [activeDateStr, setActiveDateStr] = useState(initialDateStr);

  useEffect(() => {
    if (selectedSlot?.date) {
      const d = typeof selectedSlot.date === 'string' ? selectedSlot.date.slice(0, 10) : '';
      if (d) setActiveDateStr(d);
    } else if (initialDateStr) {
      setActiveDateStr((prev) => prev || initialDateStr);
    }
  }, [selectedSlot, initialDateStr]);

  const handleSlotClicked = (slot) => {
    const isCurrentlySelected =
      selectedSlot &&
      (selectedSlot.schedule_id === slot.id ||
        selectedSlot.id === slot.id ||
        (selectedSlot.date === slot.date && selectedSlot.start_time === slot.start_time));

    if (isCurrentlySelected) {
      onSelectSlot?.(null);
    } else {
      const dateObj = new Date(slot.date + 'T00:00:00');
      const weekday = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
        : 'Day';

      onSelectSlot?.({
        schedule_id: slot.id,
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time || '',
        day: weekday,
        time: `${slot.start_time}${slot.end_time ? ' - ' + slot.end_time : ''}`,
        full_label: `${weekday}, ${formatDateEnGB(slot.date)} (${slot.start_time}${
          slot.end_time ? ' - ' + slot.end_time : ''
        })`,
      });
    }
  };

  const activeDayInfo = upcomingDays.find((d) => d.dateStr === activeDateStr) || {
    dateStr: activeDateStr,
    fullWeekday: 'Selected Date',
    displayDate: formatDateEnGB(activeDateStr),
  };

  const activeDateSlots = slotsByDate[activeDateStr] || [];

  if (loading) {
    return (
      <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3 animate-pulse">
        <Clock className="h-6 w-6 text-blue-500 mx-auto animate-spin" />
        <p className="text-sm text-zinc-400">Loading {lawyerName}'s live availability schedule...</p>
      </div>
    );
  }

  if (openSlots.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-950/80 border border-dashed border-zinc-800 rounded-xl space-y-3">
        <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
          <CalendarX className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-zinc-200">No Open Consultation Slots</h4>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          {lawyerName} has not opened any consultation slots for the upcoming 7 days. You can check back soon or send them a message.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header: Count & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <CalendarDays className="h-4 w-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-emerald-400 font-semibold">{openSlots.length}</strong> available slot{openSlots.length !== 1 ? 's' : ''} across upcoming {upcomingDays.length} days
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>By Date</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Weekly Grid</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: By Date (Responsive Carousel / Tab Selector) */}
      {viewMode === 'day' && (
        <div className="space-y-5">
          {/* Horizontal Date Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {upcomingDays.map((day) => {
              const daySlots = slotsByDate[day.dateStr] || [];
              const hasSlots = daySlots.length > 0;
              const isActive = activeDateStr === day.dateStr;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setActiveDateStr(day.dateStr)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[72px] ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                      : hasSlots
                      ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                      : 'bg-zinc-950/60 border-zinc-800/50 text-zinc-600 opacity-60 hover:opacity-100 hover:border-zinc-800'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span>{day.weekday}</span>
                    {day.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Today" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-zinc-100 my-0.5">{day.displayDate}</div>
                  <div>
                    {hasSlots ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-medium">None</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time Slots for Selected Date */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span>
                  {activeDayInfo.fullWeekday}, {formatDateEnGB(activeDateStr)}
                </span>
                {activeDayInfo.isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    TODAY
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400">
                {activeDateSlots.length} slot{activeDateSlots.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {activeDateSlots.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No consultation slots published for this date. Please select another date above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {activeDateSlots.map((slot) => {
                  const isSelected =
                    selectedSlot &&
                    (selectedSlot.schedule_id === slot.id ||
                      selectedSlot.id === slot.id ||
                      (selectedSlot.date === slot.date && selectedSlot.start_time === slot.start_time));

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotClicked(slot)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">
                            {slot.start_time}
                            {slot.end_time ? ` - ${slot.end_time}` : ''}
                          </div>
                          <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-zinc-400'}`}>
                            30-min video call
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="h-5 w-5 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Available
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Weekly Schedule Grid (Columns per day) */}
      {viewMode === 'grid' && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {upcomingDays.map((day) => {
              const daySlots = slotsByDate[day.dateStr] || [];

              return (
                <div key={day.dateStr} className="space-y-2">
                  <div
                    className={`p-2 rounded-lg text-center border text-xs ${
                      day.isToday
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                        : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div className="font-bold uppercase tracking-wider text-[11px]">{day.weekday}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{day.displayDate}</div>
                  </div>

                  <div className="space-y-1.5 min-h-[140px] p-1 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
                    {daySlots.length === 0 ? (
                      <div className="h-full py-8 text-center text-zinc-600 text-[11px] italic">
                        No slots
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const isSelected =
                          selectedSlot &&
                          (selectedSlot.schedule_id === slot.id ||
                            selectedSlot.id === slot.id ||
                            (selectedSlot.date === slot.date && selectedSlot.start_time === slot.start_time));

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSlotClicked(slot)}
                            className={`w-full p-2 rounded-lg border text-xs text-center font-medium transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30 font-bold'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="truncate font-mono">{slot.start_time}</div>
                            <div className="text-[10px] opacity-80 truncate">{slot.end_time || '30m'}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Slot Banner */}
      {selectedSlot && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
            <span>
              Selected Consultation Slot:{' '}
              <strong className="text-white font-semibold">
                {selectedSlot.full_label ||
                  `${selectedSlot.day || selectedSlot.date}, ${selectedSlot.time || selectedSlot.start_time}`}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSlot?.(null)}
            className="text-xs text-blue-300 hover:text-white underline font-medium shrink-0"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}

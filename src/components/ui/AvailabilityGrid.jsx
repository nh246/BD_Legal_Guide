import React, { useMemo, useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Info,
} from 'lucide-react';
import Button from './Button';
import { toast } from '../../store/useToastStore';

export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const s = String(timeStr).trim();
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = parseInt(m12[2], 10);
    const ampm = m12[3].toUpperCase();
    if (ampm === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return h * 60 + m;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const m = parseInt(m24[2], 10);
    return h * 60 + m;
  }
  return null;
}

export function minutesToTime24(totalMinutes) {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const GRID_48_ROWS = Array.from({ length: 48 }, (_, i) => {
  const startMinutes = i * 30;
  const endMinutes = startMinutes + 30;
  const time24 = minutesToTime24(startMinutes);
  const h = Math.floor(startMinutes / 60);
  const isNight = h < 6; // 00:00 to 05:30 (night emergency slots)
  return {
    index: i,
    time24,
    startMinutes,
    endMinutes,
    isNight,
  };
});

const formatIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AvailabilityGrid({
  schedules = [],
  onOpenAddModal,
  onDeleteSlot,
  deletingId,
}) {
  // Compute upcoming 7 days starting today
  const next7Days = useMemo(() => {
    const today = new Date();
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = formatIsoDate(d);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({
        dateStr,
        weekday,
        displayDate,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Map schedules by date with startM and endM
  const slotsByDate = useMemo(() => {
    const map = {};
    (schedules || []).forEach((slot) => {
      if (!slot.date) return;
      const dStr = typeof slot.date === 'string' ? slot.date.slice(0, 10) : '';
      if (!dStr) return;
      if (!map[dStr]) map[dStr] = [];

      const startM = timeToMinutes(slot.start_time);
      let endM = timeToMinutes(slot.end_time);
      if (startM !== null) {
        if (endM === null || (endM === 0 && startM > 0)) {
          endM = 1440;
        } else if (endM <= startM) {
          endM = startM + 30;
        }
        map[dStr].push({
          ...slot,
          startM,
          endM,
        });
      }
    });
    return map;
  }, [schedules]);

  // TASK 3: Smart prefill on click
  const handleCellClick = (dayDateStr, row) => {
    const daySlots = slotsByDate[dayDateStr] || [];

    // Interval 1: [row.startMinutes, row.startMinutes + 30)
    const isSlot1Occupied = daySlots.some(
      (s) => Math.max(s.startM, row.startMinutes) < Math.min(s.endM, row.startMinutes + 30)
    );

    // Interval 2: [row.startMinutes + 30, row.startMinutes + 60)
    const isSlot2Occupied = daySlots.some(
      (s) => Math.max(s.startM, row.startMinutes + 30) < Math.min(s.endM, row.startMinutes + 60)
    );

    if (!isSlot1Occupied) {
      // If interval 1 is free -> prefill start=current row, end=row+30
      onOpenAddModal?.(dayDateStr, row.time24, 30);
    } else if (!isSlot2Occupied) {
      // If interval 1 is occupied but interval 2 is free -> prefill start=next 30-min
      const nextMinutes = row.startMinutes + 30;
      if (nextMinutes < 1440) {
        const nextTime24 = minutesToTime24(nextMinutes);
        onOpenAddModal?.(dayDateStr, nextTime24, 30);
      } else {
        toast('This time slot is unavailable', 'error');
      }
    } else {
      // If both are occupied -> show "This time slot is unavailable" toast
      toast('This time slot is unavailable', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
              ✓
            </span>
            <span className="text-zinc-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-[10px] text-amber-400 font-bold">
              ●
            </span>
            <span className="text-zinc-300">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center text-[10px] text-red-400 font-bold">
              ✕
            </span>
            <span className="text-zinc-300">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Moon className="h-2.5 w-2.5 text-zinc-500" />
            </span>
            <span className="text-zinc-400">Night / Emergency (00:00–06:00 Dimmed)</span>
          </div>
        </div>
        <div className="text-zinc-500 text-[11px] flex items-center gap-1.5 font-mono">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span>48 Rows (30-min Intervals • 24 Hours)</span>
        </div>
      </div>

      {/* 48-Row Scrollable Grid */}
      <div
        id="availability-grid-container"
        className="max-h-[600px] overflow-y-auto overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl relative scrollbar-thin scrollbar-thumb-zinc-700"
      >
        <table className="w-full text-sm text-left border-collapse min-w-[800px]">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 shadow-sm text-zinc-400">
            <tr>
              <th className="p-3 w-28 border-r border-zinc-800 text-center font-semibold text-xs tracking-wider bg-zinc-900 sticky left-0 z-40">
                <div className="flex items-center justify-center gap-1 text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Time</span>
                </div>
              </th>
              {next7Days.map((day) => (
                <th
                  key={day.dateStr}
                  className={`p-2.5 text-center border-r border-zinc-800 last:border-r-0 ${
                    day.isToday ? 'bg-blue-950/30' : 'bg-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-zinc-200 text-xs">{day.weekday}</div>
                  <div className="text-[11px] font-mono text-zinc-400 font-normal mt-0.5 flex items-center justify-center gap-1">
                    <span>{day.displayDate}</span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                        TODAY
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* 48 Rows Body */}
          <tbody className="divide-y divide-zinc-800/60">
            {GRID_48_ROWS.map((row) => {
              const rowClass = row.isNight
                ? 'bg-zinc-950/95 hover:bg-zinc-900/40 text-zinc-500' // Night slots (00:00-06:00 dimmed)
                : 'bg-zinc-900/30 hover:bg-zinc-800/40 text-zinc-300'; // Day slots (06:00-24:00 normal)

              return (
                <tr
                  key={row.time24}
                  id={`grid-row-${row.time24.replace(':', '-')}`}
                  className={`transition-colors ${rowClass}`}
                >
                  {/* Time Label (Sticky Left) */}
                  <td
                    className={`p-2 font-mono text-xs font-medium border-r border-zinc-800 text-center sticky left-0 z-20 select-none ${
                      row.isNight
                        ? 'bg-zinc-950 text-zinc-500'
                        : 'bg-zinc-900/90 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {row.isNight && <Moon className="h-2.5 w-2.5 text-zinc-600 shrink-0" />}
                      <span>{row.time24}</span>
                    </div>
                  </td>

                  {/* 7 Days Cells for this 30-min slot */}
                  {next7Days.map((day) => {
                    const daySlots = slotsByDate[day.dateStr] || [];

                    // Find slot covering this exact 30-minute interval
                    const occupyingSlot = daySlots.find(
                      (s) =>
                        Math.max(s.startM, row.startMinutes) <
                        Math.min(s.endM, row.endMinutes)
                    );

                    const isOccupied = Boolean(occupyingSlot);
                    const isBooked = Boolean(occupyingSlot?.is_booked);
                    const isBlocked = Boolean(occupyingSlot?.status === 'blocked');

                    // Check if this interval is start, middle, or end of a multi-slot
                    const isStart = occupyingSlot && occupyingSlot.startM === row.startMinutes;
                    const isEnd = occupyingSlot && occupyingSlot.endM <= row.endMinutes;
                    const isMultiInterval =
                      occupyingSlot && occupyingSlot.endM - occupyingSlot.startM > 30;

                    let connectorClasses = '';
                    if (isOccupied) {
                      if (isMultiInterval) {
                        if (isStart) {
                          connectorClasses = 'rounded-t-lg rounded-b-none border-b-0 shadow-sm';
                        } else if (isEnd) {
                          connectorClasses = 'rounded-b-lg rounded-t-none border-t-0 shadow-sm';
                        } else {
                          connectorClasses = 'rounded-none border-y-0';
                        }
                      } else {
                        connectorClasses = 'rounded-lg';
                      }
                    }

                    // Color coding: green=available, amber=booked, red=blocked
                    let colorClasses = '';
                    if (isBlocked) {
                      colorClasses =
                        'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300';
                    } else if (isBooked) {
                      colorClasses =
                        'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300';
                    } else if (isOccupied) {
                      colorClasses =
                        'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300';
                    }

                    return (
                      <td
                        key={`${day.dateStr}-${row.time24}`}
                        id={`cell-${day.dateStr}-${row.time24.replace(':', '-')}`}
                        className={`p-1 border-r border-zinc-800/80 last:border-r-0 align-middle ${
                          day.isToday && !isOccupied ? 'bg-blue-950/10' : ''
                        }`}
                      >
                        {isOccupied ? (
                          <div
                            id={`slot-${day.dateStr}-${row.time24.replace(':', '-')}`}
                            onClick={() => handleCellClick(day.dateStr, row)}
                            className={`w-full min-h-[38px] px-2 py-1 border transition-all cursor-pointer flex items-center justify-between gap-1 group select-none ${connectorClasses} ${colorClasses}`}
                            title={`${occupyingSlot.start_time} - ${occupyingSlot.end_time} (${
                              isBooked ? 'Booked' : isBlocked ? 'Blocked' : 'Available'
                            }) • Click to add adjacent slot`}
                          >
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                              {isStart ? (
                                <>
                                  <div className="flex items-center gap-1 text-[11px] font-bold truncate">
                                    <span className="font-mono">
                                      {occupyingSlot.start_time} - {occupyingSlot.end_time}
                                    </span>
                                  </div>
                                  <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                                    {isBooked ? 'Booked' : isBlocked ? 'Blocked' : 'Available'}
                                  </span>
                                </>
                              ) : (
                                <div className="text-[10px] font-mono opacity-70 flex items-center gap-1">
                                  <span>↳</span>
                                  <span className="truncate">{occupyingSlot.start_time} cont.</span>
                                </div>
                              )}
                            </div>

                            {/* Delete button (only for unbooked slots on start row) */}
                            {isStart && !isBooked && onDeleteSlot && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSlot(occupyingSlot.id);
                                }}
                                disabled={deletingId === occupyingSlot.id}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-300 p-1 rounded transition-all hover:bg-red-500/20 shrink-0"
                                title="Delete slot"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Empty cell (Click to Add / Smart Prefill) */
                          <button
                            type="button"
                            id={`btn-add-${day.dateStr}-${row.time24.replace(':', '-')}`}
                            onClick={() => handleCellClick(day.dateStr, row)}
                            className={`w-full min-h-[38px] rounded-lg border border-dashed transition-all flex items-center justify-center text-xs group cursor-pointer ${
                              row.isNight
                                ? 'bg-zinc-950/80 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-600'
                                : 'bg-zinc-950/40 border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-500'
                            }`}
                            title={`Click to add consultation slot on ${day.displayDate} at ${row.time24}`}
                          >
                            <span className="group-hover:hidden text-[10px] select-none text-zinc-700">
                              +
                            </span>
                            <span className="hidden group-hover:inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                              <Plus className="h-3 w-3" />
                              <span>{row.time24}</span>
                            </span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

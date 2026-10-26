import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  X,
  CalendarCheck,
  Info,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/PageStates';
import AddSlotModal from '../../components/ui/AddSlotModal';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GRID_HOURS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
];

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

const getHourBucket = (timeStr) => {
  if (!timeStr) return '';
  const m = timeStr.trim().match(/^(\d{2}):\d{2}\s*(AM|PM)$/i);
  if (!m) return timeStr;
  return `${m[1]}:00 ${m[2].toUpperCase()}`;
};

export default function AvailabilityPage() {
  const { data: schedulesData, loading, error, reload } = useApi('/lawyer/schedules');
  const schedules = useMemo(() => asList(schedulesData), [schedulesData]);

  // Modal states for adding slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('10:00 AM');

  // Tooltip / Details popover for occupied cell
  const [activeCellTooltip, setActiveCellTooltip] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Compute next 7 days window: today through today + 6 days
  const next7DaysInfo = useMemo(() => {
    const today = new Date();
    const map = {};
    const validDates = new Set();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = formatIsoDate(d);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      map[weekday] = {
        dateStr,
        displayDate,
        dateObj: d,
        isToday: i === 0,
      };
      validDates.add(dateStr);
    }

    return { map, validDates };
  }, []);

  const todayIso = useMemo(() => formatIsoDate(new Date()), []);

  // Filter future unbooked slots within next 7 days and group by (weekday, hourBucket)
  const slotsByCell = useMemo(() => {
    const grouped = {};

    schedules.forEach((slot) => {
      // Must be unbooked and within next 7 days
      if (slot.is_booked) return;
      if (!next7DaysInfo.validDates.has(slot.date)) return;

      const dateObj = new Date(slot.date + 'T00:00:00');
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const hourBucket = getHourBucket(slot.start_time);
      const key = `${weekday}-${hourBucket}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(slot);
    });

    return grouped;
  }, [schedules, next7DaysInfo]);

  // All future slots for the table view below the grid
  const futureSlots = useMemo(() => {
    return schedules
      .filter((s) => !s.date || s.date >= todayIso)
      .sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
  }, [schedules, todayIso]);

  const handleEmptyCellClick = (day, hour) => {
    const dayInfo = next7DaysInfo.map[day];
    setModalDate(dayInfo ? dayInfo.dateStr : todayIso);
    setModalStartTime(hour);
    setIsAddModalOpen(true);
  };

  const handleOccupiedCellClick = (day, hour, cellSlots) => {
    const dayInfo = next7DaysInfo.map[day];
    setActiveCellTooltip({
      day,
      hour,
      slots: cellSlots,
      dateStr: dayInfo?.dateStr || '',
      displayDate: dayInfo?.displayDate || '',
    });
  };

  const handleDeleteSlot = async (slotId) => {
    setDeletingId(slotId);
    try {
      await api.delete(`/lawyer/schedules/${slotId}`);
      toast('Schedule slot deleted', 'info');
      // If active cell tooltip has this slot, remove it from list
      if (activeCellTooltip) {
        const remaining = activeCellTooltip.slots.filter((s) => s.id !== slotId);
        if (remaining.length === 0) {
          setActiveCellTooltip(null);
        } else {
          setActiveCellTooltip({ ...activeCellTooltip, slots: remaining });
        }
      }
      reload();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete slot'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <LoadingState message="Loading availability schedules..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/lawyer"
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-2.5">
              <CalendarCheck className="h-7 w-7 text-emerald-500" /> Availability Setup
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Real 7-day schedule grid synced with your active consultation slots. Click an empty cell to add a slot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={reload}
              className="gap-2 text-xs h-9"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              onClick={() => {
                setModalDate(todayIso);
                setModalStartTime('10:00 AM');
                setIsAddModalOpen(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Slot
            </Button>
          </div>
        </div>

        {/* Legend Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                ✓
              </div>
              <span className="text-zinc-300 font-medium">Available (Click to view times)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-950 border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-[10px]">
                +
              </div>
              <span className="text-zinc-400">Empty (Click to create slot)</span>
            </div>
          </div>
          <div className="text-zinc-400 text-[11px] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            <span>Grid reflects real unbooked slots for the next 7 days</span>
          </div>
        </div>

        {/* Weekly Real Schedule Grid */}
        <Card className="overflow-hidden shadow-2xl border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[840px]">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="p-3.5 w-28 border-r border-zinc-800 text-center font-semibold text-xs uppercase tracking-wider bg-zinc-900/90">
                    <Clock className="h-4 w-4 mx-auto text-blue-400" />
                  </th>
                  {DAYS_OF_WEEK.map((day) => {
                    const dayInfo = next7DaysInfo.map[day];
                    return (
                      <th
                        key={day}
                        className={`p-3 text-center border-r border-zinc-800 last:border-r-0 ${
                          dayInfo?.isToday ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="font-semibold text-zinc-200 text-xs">{day}</div>
                        <div className="text-[11px] font-mono text-zinc-400 font-normal mt-0.5">
                          {dayInfo ? dayInfo.displayDate : ''}
                          {dayInfo?.isToday && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/80">
                {GRID_HOURS.map((hour) => (
                  <tr key={hour} className="hover:bg-zinc-800/20 transition-colors">
                    {/* Hour Row Label */}
                    <td className="p-3 font-mono text-xs font-semibold text-zinc-400 border-r border-zinc-800 text-center bg-zinc-900/40">
                      {hour}
                    </td>

                    {/* Day Cells */}
                    {DAYS_OF_WEEK.map((day) => {
                      const key = `${day}-${hour}`;
                      const cellSlots = slotsByCell[key] || [];
                      const isOccupied = cellSlots.length > 0;
                      const dayInfo = next7DaysInfo.map[day];

                      // Build tooltip text for hover
                      const hoverTooltipText = isOccupied
                        ? `${cellSlots.length} slot(s) on ${day} (${dayInfo?.displayDate}):\n` +
                          cellSlots.map((s) => `• ${s.start_time} - ${s.end_time}`).join('\n')
                        : `Click to add a slot for ${day} at ${hour}`;

                      return (
                        <td
                          key={key}
                          className="p-1.5 border-r border-zinc-800 last:border-r-0 align-middle"
                        >
                          {isOccupied ? (
                            <button
                              type="button"
                              onClick={() => handleOccupiedCellClick(day, hour, cellSlots)}
                              title={hoverTooltipText}
                              className="w-full h-11 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 transition-all flex flex-col items-center justify-center gap-0.5 group shadow-sm active:scale-95"
                            >
                              <span className="text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {cellSlots.length > 1 ? `Available (${cellSlots.length})` : 'Available'}
                              </span>
                              <span className="text-[10px] text-emerald-400/80 font-mono truncate max-w-full">
                                {cellSlots[0].start_time}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEmptyCellClick(day, hour)}
                              title={hoverTooltipText}
                              className="w-full h-11 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/60 border border-dashed border-zinc-800/80 hover:border-zinc-700 text-zinc-600 hover:text-zinc-300 transition-all flex items-center justify-center text-xs group active:scale-95"
                            >
                              <span className="group-hover:hidden">—</span>
                              <span className="hidden group-hover:inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                                <Plus className="h-3 w-3" /> Add
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Cell Slot Details (when clicking occupied cell) */}
        {activeCellTooltip && (
          <Modal
            isOpen={Boolean(activeCellTooltip)}
            onClose={() => setActiveCellTooltip(null)}
            title={`${activeCellTooltip.day} — ${activeCellTooltip.displayDate}`}
            description={`Consultation slots in the ${activeCellTooltip.hour} window`}
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Active Consultation Slots ({activeCellTooltip.slots.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeCellTooltip.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-zinc-100 font-mono">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Available for Booking
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingId === slot.id}
                        isLoading={deletingId === slot.id}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5 text-xs"
                        title="Delete slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const targetDay = activeCellTooltip.day;
                    const targetHour = activeCellTooltip.hour;
                    setActiveCellTooltip(null);
                    handleEmptyCellClick(targetDay, targetHour);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Another Slot
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveCellTooltip(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Section: Real Schedules Table Below Grid */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" /> Upcoming Consultation Slots
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Real schedule slots available for citizen bookings. Unbooked slots in the next 7 days reflect on the weekly grid above.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              Total Upcoming: <span className="text-zinc-100 font-semibold">{futureSlots.length}</span>
            </div>
          </div>

          {futureSlots.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming schedules configured"
              description="Click any cell in the grid above or the Add Slot button to create open consultation hours."
              actionLabel="Add Availability Slot"
              onAction={() => {
                setModalDate(todayIso);
                setModalStartTime('10:00 AM');
                setIsAddModalOpen(true);
              }}
            />
          ) : (
            <Card className="overflow-hidden border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800 text-xs">
                    <tr>
                      <th className="px-6 py-3.5 font-medium">Date</th>
                      <th className="px-6 py-3.5 font-medium">Day</th>
                      <th className="px-6 py-3.5 font-medium">Time Window</th>
                      <th className="px-6 py-3.5 font-medium">Slot Status</th>
                      <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {futureSlots.map((slot) => {
                      const slotDateObj = new Date(slot.date + 'T00:00:00');
                      const weekdayName = isNaN(slotDateObj.getTime())
                        ? ''
                        : slotDateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      const isInNext7Days = next7DaysInfo.validDates.has(slot.date);

                      return (
                        <tr key={slot.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-3.5 text-zinc-100 font-mono text-xs font-medium">
                            {formatDateEnGB(slot.date)}
                          </td>
                          <td className="px-6 py-3.5 text-zinc-300 text-xs">
                            <span className="font-medium">{weekdayName}</span>
                            {isInNext7Days && !slot.is_booked && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                In Weekly Grid
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-zinc-300 font-mono text-xs">
                            {slot.start_time} - {slot.end_time}
                          </td>
                          <td className="px-6 py-3.5">
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
                          <td className="px-6 py-3.5 text-right">
                            {!slot.is_booked && (
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingId === slot.id}
                                className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                title="Delete Slot"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

      {/* Bulletproof Add Slot Modal */}
      <AddSlotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => reload()}
        initialDate={modalDate}
        initialStartTime={modalStartTime}
        initialDuration={30}
      />
    </div>
  );
}

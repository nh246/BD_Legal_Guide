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
import AvailabilityGrid from '../../components/ui/AvailabilityGrid';
import useApi from '../../lib/useApi';
import api, { asList, getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

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

export default function AvailabilityPage() {
  const { data: schedulesData, loading, error, reload } = useApi('/lawyer/schedules');
  const schedules = useMemo(() => asList(schedulesData), [schedulesData]);

  // Modal states for adding slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalDuration, setModalDuration] = useState(30);

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

  // All future slots for the table view below the grid
  const futureSlots = useMemo(() => {
    return schedules
      .filter((s) => !s.date || s.date >= todayIso)
      .sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
  }, [schedules, todayIso]);

  const handleDeleteSlot = async (slotId) => {
    setDeletingId(slotId);
    try {
      await api.delete(`/lawyer/schedules/${slotId}`);
      toast('Schedule slot deleted', 'info');
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

        {/* 24-Hour 48-Row Availability Grid */}
        <AvailabilityGrid
          schedules={schedules}
          onOpenAddModal={(date, startTime, duration) => {
            setModalDate(date);
            setModalStartTime(startTime);
            setModalDuration(duration || 30);
            setIsAddModalOpen(true);
          }}
          onDeleteSlot={handleDeleteSlot}
          deletingId={deletingId}
        />

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
        initialDuration={modalDuration}
      />
    </div>
  );
}

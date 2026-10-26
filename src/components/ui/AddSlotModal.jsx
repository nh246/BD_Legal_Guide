import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export const START_TIME_OPTIONS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
];

export const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes (1 hr)' },
  { value: 90, label: '90 minutes (1.5 hrs)' },
];

export const getTodayIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMaxDateIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function computeEndTime(startTimeStr, durationMinutes) {
  if (!startTimeStr) return '';
  const match = startTimeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }

  const totalMinutes = hours * 60 + minutes + parseInt(durationMinutes, 10);
  const endTotalMinutes = totalMinutes % (24 * 60);
  const endHours24 = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  let endHours12 = endHours24 % 12;
  if (endHours12 === 0) endHours12 = 12;
  const endMeridiem = endHours24 >= 12 ? 'PM' : 'AM';

  const hhStr = String(endHours12).padStart(2, '0');
  const mmStr = String(endMinutes).padStart(2, '0');
  return `${hhStr}:${mmStr} ${endMeridiem}`;
}

export default function AddSlotModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate = '',
  initialStartTime = '10:00 AM',
  initialDuration = 30,
}) {
  const todayIso = useMemo(() => getTodayIso(), []);
  const maxDateIso = useMemo(() => getMaxDateIso(), []);

  const [date, setDate] = useState(initialDate || todayIso);
  const [startTime, setStartTime] = useState(initialStartTime || '10:00 AM');
  const [duration, setDuration] = useState(initialDuration || 30);
  const [dateError, setDateError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || todayIso);
      setStartTime(
        START_TIME_OPTIONS.includes(initialStartTime) ? initialStartTime : '10:00 AM'
      );
      setDuration(initialDuration || 30);
      setDateError('');
      setGeneralError('');
    }
  }, [isOpen, initialDate, initialStartTime, initialDuration, todayIso]);

  const computedEndTime = useMemo(() => {
    return computeEndTime(startTime, duration);
  }, [startTime, duration]);

  const validateDateInput = (val) => {
    if (!val || typeof val !== 'string') {
      return 'Enter a valid date between today and one year ahead.';
    }
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return 'Enter a valid date between today and one year ahead.';
    }
    const parsed = new Date(val + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      return 'Enter a valid date between today and one year ahead.';
    }
    if (val < todayIso || val > maxDateIso) {
      return 'Enter a valid date between today and one year ahead.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDateError('');
    setGeneralError('');

    // 1. Strict frontend date validation
    const dateValidationError = validateDateInput(date);
    if (dateValidationError) {
      setDateError(dateValidationError);
      return;
    }

    if (!startTime || !computedEndTime) {
      setGeneralError('Please select a valid start time.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/lawyer/schedules', {
        date,
        start_time: startTime,
        end_time: computedEndTime,
      });

      toast('Availability slot added successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.error === 'overlap') {
        const msg = respData.message || 'You already have a slot that overlaps this time.';
        setGeneralError(msg);
        toast(msg, 'error');
      } else if (respData?.error === 'invalid_date') {
        const msg = respData.message || 'Enter a valid date between today and one year ahead.';
        setDateError(msg);
        toast(msg, 'error');
      } else if (respData?.error === 'invalid_time') {
        const msg = respData.message || 'Invalid time window.';
        setGeneralError(msg);
        toast(msg, 'error');
      } else {
        const msg = getErrorMessage(err, 'Failed to create schedule slot');
        setGeneralError(msg);
        toast(msg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Available Consultation Slot"
      description="Configure open time slots for clients to book consultations with you."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> Date
            </span>
            <span className="text-[11px] text-zinc-500">Min: Today • Max: 1 Year</span>
          </label>
          <input
            type="date"
            required
            min={todayIso}
            max={maxDateIso}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (dateError) setDateError('');
              if (generalError) setGeneralError('');
            }}
            className={`w-full bg-zinc-950 border rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-colors ${
              dateError ? 'border-red-500/80 bg-red-950/10' : 'border-zinc-800 focus:border-blue-500'
            }`}
          />
          {dateError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1 font-medium animate-in fade-in duration-150">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{dateError}</span>
            </p>
          )}
        </div>

        {/* Start Time Select & Duration Select */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" /> Start Time
            </label>
            <select
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (generalError) setGeneralError('');
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none cursor-pointer"
            >
              {START_TIME_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-zinc-900 text-zinc-100 py-1">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Duration</label>
            <select
              value={duration}
              onChange={(e) => {
                setDuration(Number(e.target.value));
                if (generalError) setGeneralError('');
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none cursor-pointer"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value} className="bg-zinc-900 text-zinc-100 py-1">
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-computed End Time (Read-only text display) */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Calculated End Time</span>
          </div>
          <span className="text-sm font-bold text-zinc-100 font-mono tracking-tight bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
            Ends at {computedEndTime}
          </span>
        </div>

        {/* General Error Banner (e.g. Overlap) */}
        {generalError && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
          >
            Add Slot
          </Button>
        </div>
      </form>
    </Modal>
  );
}

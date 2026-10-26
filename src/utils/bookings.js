/**
 * Shared booking helpers for BD Legal Guide AI.
 * Used across ClientDashboard, MyBookingsPage, MyCasesPage, and Lawyer surfaces.
 */

/**
 * Normalizes a booking or schedule date into a 'YYYY-MM-DD' string.
 */
export function getBookingDateStr(b) {
  if (!b) return '';
  const raw = b.schedule_date || b.date || b.start || b.scheduled_time || b.schedule?.date || b.scheduleDate || b.created_at;
  if (!raw) return '';
  if (typeof raw === 'string') {
    if (raw.includes('T')) return raw.split('T')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10).trim();
    return raw.trim();
  }
  if (raw instanceof Date) {
    const year = raw.getFullYear();
    const month = String(raw.getMonth() + 1).padStart(2, '0');
    const day = String(raw.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(raw).trim();
}

/**
 * Returns today's local date as 'YYYY-MM-DD'.
 */
export function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 1) isUpcoming(b):
 * Status in [pending, awaiting_payment, payment_submitted, confirmed] AND booking date >= today.
 */
export function isUpcoming(b) {
  if (!b) return false;
  const upcomingStatuses = ['pending', 'awaiting_payment', 'payment_submitted', 'confirmed'];
  if (!upcomingStatuses.includes(b.status)) return false;

  const dateStr = getBookingDateStr(b);
  if (!dateStr) return true; // fallback if date missing

  const todayStr = getTodayDateStr();
  return dateStr >= todayStr;
}

/**
 * 2) isPast(b):
 * Status == completed OR (confirmed AND date < today).
 */
export function isPast(b) {
  if (!b) return false;
  if (b.status === 'completed') return true;

  const dateStr = getBookingDateStr(b);
  const todayStr = getTodayDateStr();

  // Any confirmed or completion_requested booking in the past moves to History
  if (['confirmed', 'completion_requested'].includes(b.status)) {
    return Boolean(dateStr && dateStr < todayStr);
  }

  return false;
}

/**
 * 3) isCancelled(b):
 * Status in [cancelled, expired, refund_due].
 */
export function isCancelled(b) {
  if (!b) return false;
  return ['cancelled', 'expired', 'refund_due'].includes(b.status);
}

/**
 * Helper to parse time string ("09:00", "09:00 AM", "9:00 PM") to total minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  let clean = String(timeStr).replace(/\(.*?\)/g, '').trim();
  if (clean.includes('T')) {
    clean = clean.split('T')[1];
  } else if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    clean = clean.slice(10).trim();
  }
  const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Format total minutes from midnight to "hh:mm AM/PM".
 */
function formatMinutesToTime(totalMinutes) {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  let hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * 4) formatSlot(b):
 * "09:00 AM - 09:30 AM (30m)";
 * If stored end_time equals start_time, or is invalid, computes end = start + 30 minutes.
 */
export function formatSlot(b) {
  if (!b) return '10:00 AM - 10:30 AM (30m)';

  const rawStart = b.start_time || b.startTime || b.time || b.scheduled_time || b.schedule?.start_time || '';
  let rawEnd = b.end_time || b.endTime || b.schedule?.end_time || '';

  // Clean raw inputs
  const cleanStart = String(rawStart).replace(/\(.*?\)/g, '').trim();
  let cleanEnd = String(rawEnd).replace(/\(.*?\)/g, '').trim();

  let startMins = parseTimeToMinutes(cleanStart);
  if (startMins === null) {
    startMins = 10 * 60; // 10:00 AM default
  }

  let endMins = parseTimeToMinutes(cleanEnd);

  // If end_time equals start_time or is invalid or end <= start, default to start + 30m
  if (endMins === null || endMins <= startMins || cleanEnd === cleanStart) {
    endMins = startMins + 30;
  }

  const duration = endMins - startMins;
  const formattedStart = formatMinutesToTime(startMins);
  const formattedEnd = formatMinutesToTime(endMins);

  return `${formattedStart} - ${formattedEnd} (${duration}m)`;
}

/**
 * 5) chatAllowed(b):
 * True only when status in [confirmed, completion_requested].
 * False for pending, awaiting_payment, payment_submitted.
 */
export function chatAllowed(b) {
  if (!b) return false;
  return ['confirmed', 'completion_requested'].includes(b.status);
}

/**
 * Checks if the booking is linked to a Case Board post.
 */
export function isCaseBoardBooking(b) {
  if (!b) return false;
  return Boolean(
    b.case_id ||
    b.bid_id ||
    b.case_title ||
    b.case_brief?.toLowerCase().includes('case acceptance') ||
    b.case_brief?.toLowerCase().includes('lawyer pitch')
  );
}

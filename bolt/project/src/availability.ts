import type { AvailabilityOutcome, Booking, CheckRequest, Room } from './types';

const MAX_DURATION = 120; // minutes
const MINUTES_PER_DAY = 1440;

function overlapsExisting(start: number, end: number, bookings: Booking[]): Booking | null {
  // Touching endpoints are allowed: [a,b) and [b,c) do not overlap.
  for (const b of bookings) {
    if (start < b.end && b.start < end) {
      return b;
    }
  }
  return null;
}

export function checkAvailability(
  rooms: Room[],
  req: CheckRequest
): AvailabilityOutcome {
  const room = rooms.find((r) => r.id === req.roomId);

  if (!room) {
    return { status: 'unavailable', reason: 'Please select a room.', reasonCode: 'unknown_room' };
  }

  // AC1: 0 ≤ start < end ≤ 1440, and start strictly after current time
  if (![req.now, req.start, req.end].every(Number.isInteger)) {
    return { status: 'unavailable', reason: 'Times must be whole minutes.', reasonCode: 'invalid_input' };
  }
  if (req.now < 0 || req.now > MINUTES_PER_DAY || req.start < 0 || req.end > MINUTES_PER_DAY) {
    return {
      status: 'unavailable',
      reason: 'Times must be between 00:00 and 24:00.',
      reasonCode: 'invalid_input',
    };
  }
  if (req.start >= req.end) {
    return {
      status: 'unavailable',
      reason: 'Start time must be earlier than end time.',
      reasonCode: 'invalid_input',
    };
  }
  if (req.start <= req.now) {
    return {
      status: 'unavailable',
      reason: 'Start time must be strictly after the current time.',
      reasonCode: 'past_start',
    };
  }

  // AC2: Reject intervals longer than 120 minutes
  if (req.end - req.start > MAX_DURATION) {
    return {
      status: 'unavailable',
      reason: 'Bookings cannot be longer than 120 minutes.',
      reasonCode: 'duration_limit',
    };
  }

  // AC3: Reject when room is blocked
  if (room.blocked) {
    return {
      status: 'unavailable',
      reason: `${room.name} is currently blocked and unavailable for booking.`,
      reasonCode: 'blocked',
    };
  }

  // AC4: Reject overlapping existing bookings (touching allowed)
  const conflict = overlapsExisting(req.start, req.end, room.bookings);
  if (conflict) {
    return {
      status: 'unavailable',
      reason: `Overlaps existing booking "${conflict.label}" (${fmtTime(conflict.start)}–${fmtTime(conflict.end)}).`,
      reasonCode: 'overlap',
    };
  }

  // AC5: Available
  return {
    status: 'available',
    reason: `${room.name} is available from ${fmtTime(req.start)} to ${fmtTime(req.end)}.`,
    reasonCode: 'available',
  };
}

export function fmtTime(min: number): string {
  if (min === MINUTES_PER_DAY) return '24:00';
  const m = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function timeToMinutes(value: string): number {
  if (!/^(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/.test(value)) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const m = Math.max(0, Math.min(MINUTES_PER_DAY, min));
  return fmtTime(m);
}

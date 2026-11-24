import { timeToMinutes } from './availability';

export interface TimeInput {
  nowTime: string;
  startTime: string;
  endTime: string;
  endOfDay: boolean;
}

export type TimeInputResult =
  | { ok: true; times: { now: number; start: number; end: number } }
  | { ok: false; reason: string };

/** Parse form values without React state or booking-policy decisions. */
export function parseTimeInput(input: TimeInput): TimeInputResult {
  const { nowTime, startTime, endTime, endOfDay } = input;
  const missing: string[] = [];
  if (!nowTime) missing.push('Please enter the current time.');
  if (!startTime) missing.push('Please enter a start time.');
  if (!endOfDay && !endTime) missing.push('Please enter an end time.');
  if (missing.length > 0) {
    return { ok: false, reason: missing.join(' ') };
  }

  const now = timeToMinutes(nowTime);
  const start = timeToMinutes(startTime);
  const end = endOfDay ? 1440 : timeToMinutes(endTime);
  if (Number.isNaN(now) || Number.isNaN(start) || (!endOfDay && Number.isNaN(end))) {
    return { ok: false, reason: 'Please enter valid times in HH:MM format.' };
  }

  return { ok: true, times: { now, start, end } };
}

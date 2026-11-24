import { describe, it, expect } from 'vitest';
import { parseTimeInput, type TimeInput } from './timeInput';
import { checkAvailability } from './availability';
import { ROOMS } from './data';

const valid: TimeInput = {
  nowTime: '09:00', startTime: '11:00', endTime: '12:00', endOfDay: false,
};

describe('time input boundary', () => {
  it('converts filled form fields into minute values', () => {
    expect(parseTimeInput(valid)).toEqual({
      ok: true, times: { now: 540, start: 660, end: 720 },
    });
  });

  it.each([
    ['nowTime', 'Please enter the current time.'],
    ['startTime', 'Please enter a start time.'],
    ['endTime', 'Please enter an end time.'],
  ] as const)('reports a missing %s rather than treating it as midnight', (field, reason) => {
    expect(parseTimeInput({ ...valid, [field]: '' })).toEqual({ ok: false, reason });
  });

  it('combines missing-field messages in the original order', () => {
    expect(parseTimeInput({ nowTime: '', startTime: '', endTime: '', endOfDay: false })).toEqual({
      ok: false,
      reason: 'Please enter the current time. Please enter a start time. Please enter an end time.',
    });
  });

  it('keeps missing-field feedback ahead of malformed-time feedback', () => {
    expect(parseTimeInput({ ...valid, nowTime: 'invalid', endTime: '' })).toEqual({
      ok: false, reason: 'Please enter an end time.',
    });
  });

  it.each(['nowTime', 'startTime', 'endTime'] as const)('rejects an unparseable %s', (field) => {
    expect(parseTimeInput({ ...valid, [field]: 'invalid' })).toEqual({
      ok: false, reason: 'Please enter valid times in HH:MM format.',
    });
  });

  it.each([
    ['nowTime', '09:'],
    ['startTime', '10:60'],
    ['endTime', '12:00:00'],
    ['startTime', '9:00'],
    ['endTime', '24:01'],
    ['endTime', '25:00'],
    ['nowTime', ' 9:00'],
    ['startTime', '09:30\n'],
  ] as const)('rejects a malformed %s value %j', (field, value) => {
    expect(parseTimeInput({ ...valid, [field]: value })).toEqual({
      ok: false, reason: 'Please enter valid times in HH:MM format.',
    });
  });

  it('retains explicit 24:00 as a valid end time', () => {
    expect(parseTimeInput({ ...valid, startTime: '23:30', endTime: '24:00' })).toEqual({
      ok: true, times: { now: 540, start: 1410, end: 1440 },
    });
  });

  it.each(['', 'invalid'])('uses 1440 for end-of-day, ignoring disabled end value %j', (endTime) => {
    expect(parseTimeInput({ ...valid, startTime: '23:00', endTime, endOfDay: true })).toEqual({
      ok: true, times: { now: 540, start: 1380, end: 1440 },
    });
  });

  it('still requires a start when end-of-day is selected', () => {
    expect(parseTimeInput({ ...valid, startTime: '', endTime: '', endOfDay: true })).toEqual({
      ok: false, reason: 'Please enter a start time.',
    });
  });

  it('recognizes explicit midnight as a value, not a missing field', () => {
    expect(parseTimeInput({ ...valid, nowTime: '00:00', startTime: '00:01', endTime: '00:02' })).toEqual({
      ok: true, times: { now: 0, start: 1, end: 2 },
    });
  });

  it('reads a frozen input without changing it', () => {
    const input = Object.freeze({ ...valid });
    expect(parseTimeInput(input).ok).toBe(true);
    expect(input).toEqual(valid);
  });
});

describe('form input to booking rules integration', () => {
  it.each([
    ['11:00', '12:00', 'A101', 'available'],
    ['08:30', '09:30', 'A101', 'unavailable'],
    ['12:30', '12:00', 'A101', 'unavailable'],
    ['12:00', '14:01', 'A101', 'unavailable'],
    ['11:00', '12:00', 'B202', 'unavailable'],
    ['10:30', '11:30', 'A101', 'unavailable'],
    ['09:30', '10:00', 'A101', 'available'],
    ['12:00', '14:00', 'A101', 'available'],
  ] as const)('%s-%s in %s remains %s', (startTime, endTime, roomId, status) => {
    const snapshot = structuredClone(ROOMS);
    const parsed = parseTimeInput({ ...valid, startTime, endTime });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(checkAvailability(ROOMS, { roomId, ...parsed.times }).status).toBe(status);
    expect(ROOMS).toEqual(snapshot);
  });
});

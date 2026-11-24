import { describe, it, expect } from 'vitest';
import { checkAvailability } from './availability';
import type { Room } from './types';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'A101',
    name: 'Room A101',
    building: 'Engineering Block',
    capacity: 30,
    blocked: false,
    bookings: [{ start: 600, end: 660, label: 'Calculus 201' }],
    ...overrides,
  };
}

const NOW = 540;

function req(start: number, end: number, roomId = 'A101') {
  return { roomId, now: NOW, start, end };
}

describe('checkAvailability', () => {
  // T01 — AC4: touching at the end boundary is allowed
  it('T01: start 660, end 720 — available (touches existing booking end)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(660, 720));
    expect(result.status).toBe('available');
    expect(result.reason).toBeTypeOf('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  // T02 — AC1: starting exactly now is forbidden
  it('T02: start 540, end 570 — unavailable (start equals now)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(540, 570));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Start time must be strictly after the current time.');
  });

  // T03 — AC1: zero duration is invalid
  it('T03: start 720, end 720 — unavailable (zero duration)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(720, 720));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Start time must be earlier than end time.');
  });

  // T04 — AC1: end before start
  it('T04: start 750, end 720 — unavailable (end before start)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(750, 720));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Start time must be earlier than end time.');
  });

  // T05 — AC1: end exceeds day boundary
  it('T05: start 1380, end 1441 — unavailable (end exceeds 1440)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(1380, 1441));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Times must be between 00:00 and 24:00.');
  });

  // T06 — AC2: exactly 120 minutes is allowed
  it('T06: start 720, end 840 — available (exactly 120 minutes)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(720, 840));
    expect(result.status).toBe('available');
    expect(result.reason).toBeTypeOf('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  // T07 — AC2: 121 minutes exceeds the limit
  it('T07: start 720, end 841 — unavailable (exceeds 120 minutes)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(720, 841));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Bookings cannot be longer than 120 minutes.');
  });

  // T08 — AC4: ends exactly when the existing booking starts
  it('T08: start 570, end 600 — available (touches existing booking start)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(570, 600));
    expect(result.status).toBe('available');
    expect(result.reason).toBeTypeOf('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  // T09 — AC4: partially overlaps the existing booking
  it('T09: start 630, end 690 — unavailable (partial overlap)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(630, 690));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  // T10 — AC4: contains the whole existing booking
  it('T10: start 570, end 690 — unavailable (contains existing booking)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(570, 690));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  // T11 — AC4: lies inside the existing booking
  it('T11: start 615, end 645 — unavailable (inside existing booking)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(615, 645));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  // T12 — AC4: matches the existing booking exactly
  it('T12: start 600, end 660 — unavailable (exact match of existing booking)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(600, 660));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  // T13 — AC3: a blocked room cannot be booked
  it('T13: start 660, end 720, blocked — unavailable (room is blocked)', () => {
    const room = makeRoom({ blocked: true });
    const result = checkAvailability([room], req(660, 720));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Room A101 is currently blocked and unavailable for booking.');
  });

  // T14 — AC4: no bookings to overlap
  it('T14: start 630, end 690, no bookings — available', () => {
    const room = makeRoom({ bookings: [] });
    const result = checkAvailability([room], req(630, 690));
    expect(result.status).toBe('available');
    expect(result.reason).toBeTypeOf('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  // T15 — AC5: checking availability must not mutate input data
  it('T15: rooms array unchanged after an available check and an overlap rejection', () => {
    const rooms = [makeRoom()];
    const snapshot = JSON.parse(JSON.stringify(rooms)) as Room[];

    const availableResult = checkAvailability(rooms, req(660, 720));
    expect(availableResult.status).toBe('available');
    expect(availableResult.reason).toBeTypeOf('string');
    expect(availableResult.reason.length).toBeGreaterThan(0);
    expect(rooms).toEqual(snapshot);

    const overlapResult = checkAvailability(rooms, req(630, 690));
    expect(overlapResult.status).toBe('unavailable');
    expect(overlapResult.reason).toBeTypeOf('string');
    expect(overlapResult.reason.length).toBeGreaterThan(0);
    expect(rooms).toEqual(snapshot);
  });

  // T16 — AC1: ending exactly at 24:00 is allowed
  it('T16: start 1380, end 1440 — available (ends at 24:00)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(1380, 1440));
    expect(result.status).toBe('available');
    expect(result.reason).toBe('Room A101 is available from 23:00 to 24:00.');
  });

  // T17 — AC1: starting one minute after now satisfies the strict boundary
  it('T17: start 541, end 542 — available (one minute after now)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(541, 542));
    expect(result.status).toBe('available');
    expect(result.reason).toBeTypeOf('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  // T18 — AC1: request begins before now; other boundaries valid, no overlap
  it('T18: start 510, end 570 — unavailable (starts before now)', () => {
    const room = makeRoom();
    const result = checkAvailability([room], req(510, 570));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Start time must be strictly after the current time.');
  });

  // T19 — AC4: overlaps the second booking, not the first
  it('T19: start 810, end 850, two bookings — unavailable (overlaps Faculty Meeting)', () => {
    const room = makeRoom({
      bookings: [
        { start: 600, end: 660, label: 'Calculus 201' },
        { start: 780, end: 840, label: 'Faculty Meeting' },
      ],
    });
    const result = checkAvailability([room], req(810, 850));
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Faculty Meeting" (13:00–14:00).');
  });

  it('T20: start 659, end 720 — unavailable (one-minute overlap at booking end)', () => {
    const rooms = [makeRoom()];
    const snapshot = JSON.parse(JSON.stringify(rooms)) as Room[];
    const result = checkAvailability(rooms, req(659, 720));
    expect(rooms).toEqual(snapshot);
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  it('T21: start 570, end 601 — unavailable (one-minute overlap at booking start)', () => {
    const rooms = [makeRoom()];
    const snapshot = JSON.parse(JSON.stringify(rooms)) as Room[];
    const result = checkAvailability(rooms, req(570, 601));
    expect(rooms).toEqual(snapshot);
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  it('T22: repeated available checks preserve data and return the same outcome', () => {
    const rooms = [makeRoom()];
    const snapshot = JSON.parse(JSON.stringify(rooms)) as Room[];
    for (let i = 0; i < 3; i++) {
      const result = checkAvailability(rooms, req(720, 780));
      expect(rooms).toEqual(snapshot);
      expect(result.status).toBe('available');
      expect(result.reason).toBe('Room A101 is available from 12:00 to 13:00.');
    }
  });

  it('T23: an overlap rejection independently preserves the complete input', () => {
    const rooms = [makeRoom()];
    const snapshot = JSON.parse(JSON.stringify(rooms)) as Room[];
    const result = checkAvailability(rooms, req(630, 690));
    expect(rooms).toEqual(snapshot);
    expect(result.status).toBe('unavailable');
    expect(result.reason).toBe('Overlaps existing booking "Calculus 201" (10:00–11:00).');
  });

  it.each([
    ['start', Number.NaN],
    ['end', Number.NaN],
    ['now', Number.NaN],
    ['now', Number.NEGATIVE_INFINITY],
    ['start', 720.5],
  ] as const)('rejects a non-integer %s value %s', (field, value) => {
    expect(checkAvailability([makeRoom()], { ...req(720, 780), [field]: value })).toEqual({
      status: 'unavailable', reason: 'Times must be whole minutes.', reasonCode: 'invalid_input',
    });
  });

  it.each([-1, 1441])('rejects current time outside the day: %d', (now) => {
    expect(checkAvailability([makeRoom()], { ...req(720, 780), now })).toEqual({
      status: 'unavailable', reason: 'Times must be between 00:00 and 24:00.', reasonCode: 'invalid_input',
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAvailability, fmtTime } from './availability';
import { ROOMS } from './data';
import { requestExplanation, SYSTEM_INSTRUCTION, type ExplanationInput } from './explanation';
import { makeMockAdapter } from './mockExplanation';

const overlap: ExplanationInput = {
  roomLabel: 'Room A101',
  start: '10:30',
  end: '11:30',
  isAvailable: false,
  reasonCode: 'overlap',
};

const fallback = {
  source: 'fallback',
  explanation: 'An existing booking overlaps the requested time in Room A101.',
};

afterEach(() => vi.useRealTimers());

describe('explanation contract', () => {
  it.each([
    ['A101', 660, 690, 'available', 'Room A101 is free from 11:00 to 11:30.'],
    ['A101', 630, 690, 'overlap', fallback.explanation],
    ['B202', 660, 690, 'blocked', 'Room B202 is blocked for booking.'],
    ['A101', 510, 570, 'past_start', 'The requested start must be after the current time.'],
    ['C303', 720, 841, 'duration_limit', 'The requested slot exceeds the 120-minute limit.'],
    ['A101', 1410, 1440, 'available', 'Room A101 is free from 23:30 to 24:00.'],
  ] as const)('explains %s at %d–%d with reason %s', async (roomId, start, end, reasonCode, explanation) => {
    vi.useFakeTimers();
    const room = ROOMS.find((fixture) => fixture.id === roomId)!;
    const original = structuredClone(ROOMS);
    const request = { roomId, now: 540, start, end };
    const decision = checkAvailability(ROOMS, request);
    expect(decision.reasonCode).toBe(reasonCode);

    const response = requestExplanation({
      roomLabel: room.name,
      start: fmtTime(start),
      end: fmtTime(end),
      isAvailable: decision.status === 'available',
      reasonCode: decision.reasonCode,
    }, makeMockAdapter(), new AbortController().signal);

    await vi.advanceTimersByTimeAsync(180);
    expect(await response).toEqual({ explanation, source: 'mock' });
    expect(checkAvailability(ROOMS, request)).toEqual(decision);
    expect(ROOMS).toEqual(original);
  });

  it.each([
    ['empty room label', { roomLabel: '' }],
    ['long room label', { roomLabel: 'A'.repeat(65) }],
    ['empty start', { start: '' }],
    ['malformed start', { start: '09:60' }],
    ['long start', { start: '1'.repeat(500) }],
    ['reversed time interval', { start: '12:00' }],
    ['unknown reason', { reasonCode: 'unknown' }],
    ['availability mismatch', { isAvailable: true }],
  ])('rejects %s before calling the adapter', async (_label, fields) => {
    const adapter = vi.fn();
    expect(await requestExplanation(
      { ...overlap, ...fields }, adapter, new AbortController().signal
    )).toBeNull();
    expect(adapter).not.toHaveBeenCalled();
  });

  it('passes only the five contract fields and a separate system instruction', async () => {
    const adapter = vi.fn().mockResolvedValue({ explanation: fallback.explanation });
    const signal = new AbortController().signal;
    await requestExplanation({ ...overlap, optionalNote: 'unrelated input' }, adapter, signal);
    expect(adapter).toHaveBeenCalledOnce();
    expect(adapter).toHaveBeenCalledWith(overlap, SYSTEM_INSTRUCTION, expect.any(AbortSignal));
  });

  it.each([
    ['missing string', {}],
    ['extra fields', { explanation: fallback.explanation, isAvailable: true }],
    ['empty string', { explanation: '' }],
    ['long string', { explanation: 'x'.repeat(241) }],
    ['three sentences', { explanation: 'One. Two. Three.' }],
    ['unsupported claim', { explanation: 'Room A101 is available. Your reservation is confirmed.' }],
  ])('falls back on %s in the response', async (_label, output) => {
    const adapter = vi.fn().mockResolvedValue(output);
    expect(await requestExplanation(overlap, adapter, new AbortController().signal)).toEqual(fallback);
  });

  it.each(['error', 'unavailable'])('preserves the decision when a provider is %s', async (mode) => {
    vi.useFakeTimers();
    const response = requestExplanation(overlap, makeMockAdapter(mode), new AbortController().signal);
    await vi.advanceTimersByTimeAsync(180);
    expect(await response).toEqual(fallback);
  });

  it('returns the fallback at the deadline and aborts the timed-out adapter', async () => {
    vi.useFakeTimers();
    const abort = vi.fn();
    const adapter = vi.fn(
      (_input: ExplanationInput, _instruction: string, signal: AbortSignal) => {
        signal.addEventListener('abort', abort, { once: true });
        return makeMockAdapter('timeout')(overlap, SYSTEM_INSTRUCTION, signal);
      }
    );

    const response = requestExplanation(overlap, adapter, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(800);
    expect(await response).toEqual(fallback);
    expect(abort).toHaveBeenCalledOnce();
  });

  it('discarded requests cannot produce an explanation for a changed selection', async () => {
    const controller = new AbortController();
    const response = requestExplanation(overlap, makeMockAdapter(), controller.signal);
    controller.abort();
    expect(await response).toBeNull();
  });

  it('discarding a request settles promptly even when an adapter ignores cancellation', async () => {
    const controller = new AbortController();
    const adapter = vi.fn(() => new Promise(() => {}));
    const response = requestExplanation(overlap, adapter, controller.signal);
    controller.abort();
    expect(await response).toBeNull();
  });
});

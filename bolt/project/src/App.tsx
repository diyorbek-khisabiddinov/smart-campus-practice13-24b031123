import { useMemo, useRef, useState } from 'react';
import { Clock, DoorClosed, CheckCircle2, XCircle, CalendarClock, Users, AlertTriangle } from 'lucide-react';
import { ROOMS, DEFAULT_NOW } from './data';
import { checkAvailability, fmtTime, minutesToTime, timeToMinutes } from './availability';
import { parseTimeInput } from './timeInput';
import type { AvailabilityOutcome } from './types';
import type { ExplanationInput } from './explanation';
import { ExplanationPanel } from './ExplanationPanel';

function App() {
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const [nowTime, setNowTime] = useState(minutesToTime(DEFAULT_NOW));
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('11:30');
  const [endOfDay, setEndOfDay] = useState(false);
  const [result, setResult] = useState<{
    decision: AvailabilityOutcome;
    explanation?: ExplanationInput;
    id?: number;
  } | null>(null);
  const checkId = useRef(0);

  const room = useMemo(() => ROOMS.find((r) => r.id === roomId)!, [roomId]);

  function handleCheck() {
    const parsed = parseTimeInput({ nowTime, startTime, endTime, endOfDay });
    if (!parsed.ok) {
      setResult({
        decision: { status: 'unavailable', reason: parsed.reason, reasonCode: 'invalid_input' },
      });
      return;
    }
    const decision = checkAvailability(ROOMS, { roomId, ...parsed.times });
    const { reasonCode } = decision;
    if (reasonCode === 'invalid_input' || reasonCode === 'unknown_room') {
      setResult({ decision });
      return;
    }

    setResult({
      decision,
      id: ++checkId.current,
      explanation: {
        roomLabel: room.name,
        start: fmtTime(parsed.times.start),
        end: fmtTime(parsed.times.end),
        isAvailable: decision.status === 'available',
        reasonCode,
      },
    });
  }

  function handleReset() {
    setRoomId(ROOMS[0].id);
    setNowTime(minutesToTime(DEFAULT_NOW));
    setStartTime('10:30');
    setEndTime('11:30');
    setEndOfDay(false);
    setResult(null);
  }

  const available = result?.decision.status === 'available';

  function to24hLabel(value: string): string {
    const mins = timeToMinutes(value);
    return Number.isNaN(mins) ? '—' : fmtTime(mins);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-700 to-teal-600 text-white shadow-lg">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
              <CalendarClock className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Smart Campus Room Availability</h1>
              <p className="text-sm text-sky-100/90">Check whether a room is free for your chosen time slot.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: form */}
          <section className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Clock className="h-5 w-5 text-sky-600" />
              Check a time slot
            </h2>

            <div className="mt-5 grid gap-5">
              {/* Room */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-slate-700">
                  Room
                </label>
                <select
                  id="room"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setResult(null);
                  }}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  {ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.building} {r.blocked ? '(blocked)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current time */}
              <div>
                <label htmlFor="now" className="block text-sm font-medium text-slate-700">
                  Current time <span className="font-normal text-slate-400">(editable for testing)</span>
                </label>
                <input
                  id="now"
                  type="time"
                  value={nowTime}
                  onChange={(e) => {
                    setNowTime(e.target.value);
                    setResult(null);
                  }}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
                <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                  24-hour time: {to24hLabel(nowTime)}
                </p>
              </div>

              {/* Start / End */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start" className="block text-sm font-medium text-slate-700">
                    Start time
                  </label>
                  <input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setResult(null);
                    }}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                  <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                    24-hour time: {to24hLabel(startTime)}
                  </p>
                </div>
                <div>
                  <label htmlFor="end" className="block text-sm font-medium text-slate-700">
                    End time
                  </label>
                  <input
                    id="end"
                    type="time"
                    value={endTime}
                    disabled={endOfDay}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setResult(null);
                    }}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                    24-hour time: {endOfDay ? '24:00' : to24hLabel(endTime)}
                  </p>
                  <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={endOfDay}
                      onChange={(e) => {
                        setEndOfDay(e.target.checked);
                        setResult(null);
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                    />
                    End at 24:00 (end of day)
                  </label>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                12:00 AM = midnight (00:00); 12:00 PM = noon (12:00).
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCheck}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Check availability
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30 active:scale-[0.98]"
                >
                  Reset
                </button>
              </div>

              {/* Result */}
              {result && (
                <div
                  role="status"
                  aria-label="Availability decision"
                  className={`mt-2 flex items-start gap-3 rounded-xl border p-4 transition ${
                    available
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-rose-200 bg-rose-50'
                  }`}
                >
                  {available ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        available ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {available ? 'Available' : 'Unavailable'}
                    </p>
                    <p
                      className={`mt-0.5 text-sm ${
                        available ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {result.decision.reason}
                    </p>
                  </div>
                </div>
              )}
              {result?.explanation && <ExplanationPanel key={result.id} input={result.explanation} />}
            </div>
          </section>

          {/* Right: room info + bookings */}
          <aside className="lg:col-span-2 flex flex-col gap-6">
            {/* Room card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <DoorClosed className="h-5 w-5 text-sky-600" />
                  Room details
                </h2>
                {room.blocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Open
                  </span>
                )}
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Building</dt>
                  <dd className="font-medium text-slate-800">{room.building}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Capacity</dt>
                  <dd className="flex items-center gap-1 font-medium text-slate-800">
                    <Users className="h-4 w-4 text-slate-400" />
                    {room.capacity}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Existing bookings */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarClock className="h-5 w-5 text-sky-600" />
                Existing bookings
              </h2>

              {room.blocked ? (
                <p className="mt-3 text-sm text-slate-500">
                  This room is blocked, so there are no active bookings.
                </p>
              ) : room.bookings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No existing bookings for this room.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {room.bookings.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-100"
                    >
                      <span className="font-medium text-slate-700">{b.label}</span>
                      <span className="tabular-nums text-slate-500">
                        {fmtTime(b.start)}–{fmtTime(b.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>

        {/* Rules summary */}
        <div className="mt-6 rounded-2xl bg-slate-100/70 p-5 text-sm text-slate-600 ring-1 ring-slate-200 sm:p-6">
          <p className="font-semibold text-slate-700">How availability is decided</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <li>• Start must be after the current time and before end (max 24:00).</li>
            <li>• A booking can be at most 120 minutes long.</li>
            <li>• Blocked rooms are always unavailable.</li>
            <li>• Touching an existing booking at its endpoint is allowed.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;

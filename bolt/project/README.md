# Smart Campus Room Availability Checker

**Student:** Diyorbek Khissabiddinov · **ID:** 24B031123

This React and TypeScript demo checks one selected room at a time using the
three inherited fictional room fixtures. It uses an editable demo clock and
keeps booking data in memory. There is no login, database, or runtime service
configuration. Checks return availability and leave the fictional bookings
as supplied.

## Explain availability

Press **Check availability**, then **Explain availability**. The status and
reason come from the booking rules. A separate **Mock AI** panel explains the
checked result. Changing the form or checking again discards the previous
explanation. Malformed or incomplete input is handled by the existing form
validation.

The browser-only mock uses no model service or key. It takes the selected room
label, start and end in HH:MM, the availability flag and the rule's reason code.
It returns `{ explanation: string }` through the same adapter boundary that a
server-side provider would use. The adapter is called only on demand. The
request checks the input, allows only the sentence matching the reason and
times and has an 800 ms deadline. The same rule-backed sentence is available
with a **Rules fallback** label if the mock fails.

Try the following query strings on the demo URL, then check and explain a slot.

| Query | Simulated behavior |
| --- | --- |
| `?explain=error` | Provider returns an error |
| `?explain=timeout` | Provider exceeds the deadline |
| `?explain=unavailable` | Provider is unavailable or unconfigured |

## Setup and verification

Use Node.js 22 or newer. The Practice 10 checks were run with Node.js 24.22.1
and npm 11.9.0. Run these commands at the repository root:

```sh
npm ci
npm run verify
```

`npm run verify` runs ESLint, TypeScript, Vitest, and the Vite production
build in that order. It exits at the first failure. Run `npm run lint`,
`npm run typecheck`, `npm test`, or `npm run build` to inspect an individual
check. The production output is in `dist/`.

To open a development preview or the built app on this machine:

```sh
npm run dev -- --host 127.0.0.1
npm run preview -- --host 127.0.0.1
```

Run `npm run build` before using `preview`. Open the URL printed by Vite.
With the default 09:00 demo clock, try Room A101 at 11:00–11:30 for Available,
Room A101 at 10:30–11:30 for an overlap, and Room B202 for a blocked room.
Check the form and feedback at desktop width and 360px. The end-of-day
checkbox sets the end to 24:00.

## Source map

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Room selection, time form and result display |
| `src/timeInput.ts` | Form validation and conversion to minute values |
| `src/availability.ts` | Time helpers and AC1–AC5 booking checks |
| `src/ExplanationPanel.tsx` | Optional action, loading state and explanation display |
| `src/explanation.ts` | Contract, constrained response validation, timeout and fallback |
| `src/mockExplanation.ts` | Local mock and simulated provider failures |
| `src/data.ts` | Fictional rooms, bookings and the default demo clock |
| `src/*.test.ts` | Booking and time-input regression tests |
| `AGENTS.md` | Edit boundaries, verification and review requirements |

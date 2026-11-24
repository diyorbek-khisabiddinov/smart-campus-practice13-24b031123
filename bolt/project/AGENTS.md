# Smart Campus: repository instructions

## Purpose and structure
Continue the supplied repaired Smart Campus room availability checker. It uses
fictional in-memory fixtures and a fixed, editable demo current time. The optional
explanation describes the booking decision. `src/App.tsx` owns the React interface;
`src/availability.ts` owns booking rules and time helpers; `src/data.ts` owns
fixtures; `src/types.ts` defines the shared contract. Vitest tests are in `src`.

## Accepted behavior (AC1-AC6)
- AC1: require 0 <= start < end <= 1440; start must be strictly after now.
- AC2: allow exactly 120 minutes; reject longer requests.
- AC3: reject a blocked room.
- AC4: reject every actual overlap; allow touching endpoints.
- AC5: never mutate room or booking fixtures; show Available or Unavailable.
- AC6: preserve clear validation messages and responsive desktop/mobile feedback.
- Preserve validation order for valid inputs, missing-input messages, strict
  HH:MM input and 24:00 support.

## Engineering boundaries
Prefer pure functions, small module boundaries and the smallest justified
change. Use at most two justified patterns. There is one booking policy and
one consistent booking shape. The Practice 12 explanation adapter is a separate
contract and receives the already computed decision. Do not add Strategy,
Singleton, Factory or class hierarchies for the booking rules.
Do not redesign the UI, edit fixtures, change booking rules, or weaken/delete
existing tests. Do not add login, backend, database, external APIs, saved
booking creation or unrelated features. Keep package dependencies unchanged.
The supplied repaired source has three room fixtures; preserve these inherited
fixtures and document the difference from the lesson's single-room example.

For Practice 12, the explanation UI, reason codes, mock adapter and focused tests
are in scope. Keep the booking rules, fixtures and dependency lockfile intact.

## Commands (run from this directory)
Use the committed lockfile and the setup in `README.md`. After installing
dependencies, verification works without external services.

```sh
npm ci
npm run verify
npm run dev -- --host 127.0.0.1
```

## Verification and reporting
Run `npm run verify` before proposing acceptance. Add focused regression tests
for a confirmed issue and check the built UI at desktop and 360px width. Report
the diff, exact commands, exit codes, test counts, build output and any checks
skipped. Give the reviewer these repository instructions before the review.

## Background agents and approval
Use a separate branch or worktree and a localhost-only preview. For Practice 10,
the allowed edit scope is `src/availability.ts`, its focused regression tests,
`src/timeInput.test.ts`, `package.json` scripts, `README.md`, and `AGENTS.md`.
Ask before expanding scope. Do not access credentials, real student data,
external services or shared resources. Do not send messages, merge, or deploy.
A human must review the diff and verification evidence before accepting the
changes and must handle any approved publication separately.

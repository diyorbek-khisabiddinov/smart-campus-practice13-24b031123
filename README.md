# Smart Campus Room Availability Checker

**Student:** Diyorbek Khissabiddinov · **ID:** 24B031123

Software Engineering · Practice #13 · 24 November 2026

This practice compares the React/TypeScript checker built in Bolt with a low-code implementation in Appsmith. A student checks whether a fictional campus room is free for a requested interval. The demo clock is set to 09:00. Room A101 has one scheduled class, Calculus 201, from 10:00 to 11:00.

[Open the Bolt demo](https://smart-campus-room-av-50i2.bolt.host) · [Open the Appsmith demo](https://smart-campus-lab.appsmith.com/app/my-first-application/page1-6b0558e0998af5f9e41dffe7)

## Project files

| Path | Contents |
| --- | --- |
| [SmartCampus_Practice13_Report.pdf](SmartCampus_Practice13_Report.pdf) | Updated practice report with the submitted student details |
| [bolt/project](bolt/project) | React/TypeScript source restored from the preceding practice, with its original tests, configuration and dependency lockfile |
| [bolt/Demo.html](bolt/Demo.html) | Self-contained copy of the exported Bolt demo. Open the downloaded file in a browser. |
| [bolt/export](bolt/export) | Original project export and Python restoration script |
| [appsmith/SmartCampus_Appsmith.json](appsmith/SmartCampus_Appsmith.json) | Appsmith application export, including widgets, button logic and result binding |
| [screenshots/bolt](screenshots/bolt) and [screenshots/appsmith](screenshots/appsmith) | Observed UI results, named by test case |

## Run the implementations

In `bolt/project`, run `npm ci` and then `npm run dev`. The source project's verification command is `npm run verify`. To restore the full original export separately, open `bolt/export` and run `python Restore_Export.txt SmartCampus_Practice12_Export.json restored` with a new destination folder.

In Appsmith, import `appsmith/SmartCampus_Appsmith.json` as an application. Enter the start time using two digits for the hour and minute, enter the duration in minutes, set **Room blocked** and click **Check availability**. The Bolt form accepts an end time and uses room B202 for the blocked case. In Appsmith the switch simulates the blocked state for A101.

## Acceptance checks

| ID | Input or action | Expected | Bolt result | Appsmith result |
| --- | --- | --- | --- | --- |
| T1 | 12:00–12:30, open | Available | Available | Available |
| T2 | 10:30–11:30, open | Overlap | Overlaps Calculus 201 | Overlaps Calculus 201 |
| T3 | 11:00–11:30, blocked | Unavailable | B202 is blocked | A101 is blocked |
| T4 | 12:00, zero minutes | Reject duration | Start must precede end | Duration must be 1–120 minutes |
| T5 | 12:00, 121 minutes | Reject duration | Exceeds 120 minutes | Duration must be 1–120 minutes |
| T6 | 08:30–09:00, open | Reject past start | Start must be after 09:00 | Start must be after 09:00 |
| T7 | 11:00–11:30, open | Available at the previous booking's end | Available | Available |
| T8 | Repeat T2 and T7 | Existing class remains and the free interval stays free | Same two results, booking data unchanged | Same two results, only the displayed check result updated |

The eight cases were run locally against the restored Bolt availability function and the published Appsmith button code from its export. The screenshots show the manual checks. The Bolt overlap, blocked-room and adjacent-interval screenshots come from the preceding practice. The two Appsmith T8 screenshots show the repeated overlap and free results.

# Product requirements

What MIGO is for, who uses it, and what it must achieve. Requirements are user-story issues on the [project board](https://github.com/orgs/sleeping-angels/projects/1); the technical design is in [trd.md](trd.md).

## Overview

MIGO (Miagao Incident Gateway for Operations) is a municipal-level DRRM information system. It covers the incident intake and resident communication layer that MDRRMO Miagao currently lacks. It runs alongside the office's spreadsheets, paper forms and radio. It does not replace them.

## Problem

MDRRMO's biggest gap is communication with Miagao's barangays. Reports and advisories travel through inconsistent channels, and every report is reconciled into logbooks and spreadsheets by hand.

For residents:

- Reports arrive by call, Messenger or word of mouth, each in a different format, so they are slow to turn into something actionable.
- Residents get no confirmation that a report arrived and no way to see what happens next.
- Advisories go out as Facebook posts, flyers and posters, so residents have to go looking for them.
- Some residents don't have MDRRMO's number and relay emergencies through relatives or neighbors.
- Around 47–48 of the 119 barangays are upland, with signal dead spots. Residents there often relay reports through someone who has a signal.
- Residents write in Hiligaynon, Kinaray-a, Tagalog or English.

For responders:

- Reports come in by call, Messenger, SMS and radio, with no single view of them.
- Every report is validated by a callback and an ocular inspection. Any auto-parsed data has to be checked before anyone acts on it.
- Advisories can't be targeted. A gale warning meant for 22 coastal barangays goes to everyone or no one.
- Partner agencies (BFP, PNP, MHO, MSWDO and others) are notified one at a time by phone, and there's no shared record of who was told what or when.
- Reports go into a logbook, then get re-typed into Excel or Google Sheets.
- Situational reports during alerts, and weekly accomplishment reports, are compiled by hand from calls, chats and logbooks.

## Goals

The team proposed these targets. Confirm them with MDRRMO at the next validation interview.

| Goal                                | Success metric                                                                                          | How it's measured                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| No report is lost                   | 100% of received messages reach the feed, either as a parsed report or as a raw-message fallback        | End-to-end tests on both channels, including a simulated classifier outage |
| Residents know their report landed  | A confirmation with a tracking link arrives within 10 s of submission                                   | Automated test timing                                                      |
| Responders see reports live         | A new report appears on the dashboard within 5 s                                                        | Timestamps in the test logs                                                |
| Intake is faster than callback-only | Median time from first message to a complete report is under 3 min                                      | Timed usability test with 5 or more participants                           |
| Parsing works in all four languages | At least 85% incident-type accuracy per language                                                        | Labeled test set                                                           |
| Advisories can be targeted          | A responder can send an advisory to selected barangays, and the delivery count is shown                 | Acceptance test for FR21                                                   |
| Less re-encoding (Stretch)          | The incident spreadsheet fills without anyone re-typing, and a SitRep draft is generated in under 1 min | Demo to MDRRMO                                                             |

## Target users

**Resident.** Anyone in Miagao, including proxies and witnesses reporting for someone else. Often on a basic phone, in a low-signal area, writing in one of the four languages. Wants to report fast and know what happens next.

**Barangay official.** A resident with a role. Officials are the main reporters during disasters, and the interviewee suggested asking them to report through the bot. They use the same resident flows.

**Responder.** MDRRMO field or office staff who validate reports, log referrals, send broadcasts and export records.

**Admin.** Manages accounts, roles, knowledge-base content and settings. Closest to the office's current IT technician role.

## Scope

Requirements are Committed unless their issue has the `stretch` label. Committed work is due by code freeze; Stretch is pulled in when capacity allows, and what's left moves to the CMSC129 roadmap.

Out of scope:

- Fully replacing spreadsheets, paper forms or radio coordination
- Automated dispatch or assignment of people or vehicles
- Channels other than Messenger and web, including SMS blast
- Direct integration with national systems such as the NDRRMC text blast
- Collecting victim names
- Digitizing the patient-care form

## Design philosophy

This is a life-critical system, so:

- **Redundancy.** Two reporting channels feed one pipeline, and every bot message carries the hotline as a fallback.
- **Coexist, don't replace.** MIGO syncs to the existing spreadsheets, prefills forms, and fits into tools staff already use.
- **Humans stay in control.** If parsing fails, the raw message still reaches a responder. If MIGO goes down, staff fall back to spreadsheets, paper and calls, as they do now.

## Constraints

- **Messenger.** Messenger needs a Facebook Page and Meta App Review. MDRRMO currently runs a Facebook account, not a Page, so the team runs its own MIGO Page.
- **Messaging window.** Outbound messages to a resident are limited outside Meta's messaging window. This directly limits broadcasts.
- **Office conditions.** Power interruptions are frequent and the office PCs are old.
- **Budget and timeline.** No hosting budget has been confirmed.

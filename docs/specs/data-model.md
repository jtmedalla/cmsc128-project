# Data model

What MIGO stores, how the entities relate, and the rules the schema keeps. Columns live in the Drizzle schema (`apps/api/src/database/schema/`), documented with JSDoc; conventions and tooling are in [database.md](../database.md).

## Entities

```mermaid
erDiagram
    USER["User (responder or admin)"]
    INVITE["Invite"]
    BARANGAY["Barangay"]
    RESIDENT["Resident"]
    RESIDENT_CHANNEL["ResidentChannel"]
    REPORT["Report"]
    INCIDENT_TYPE["IncidentType"]
    VICTIM["Victim"]
    MESSAGE["Message"]
    REPORT_EDIT["ReportEdit"]
    BROADCAST["Broadcast"]
    BROADCAST_OPTION["BroadcastOption"]
    BROADCAST_DELIVERY["BroadcastDelivery"]
    BROADCAST_RESPONSE["BroadcastResponse"]
    AGENCY["Agency"]
    AGENCY_REFERRAL["AgencyReferral"]
    KNOWLEDGE_ENTRY["KnowledgeEntry"]

    USER ||--o{ INVITE : "sends"
    USER |o--o| INVITE : "accepts"

    BARANGAY |o--o{ RESIDENT : "is home of"
    BARANGAY |o--o{ REPORT : "locates"
    RESIDENT ||--o{ RESIDENT_CHANNEL : "reaches MIGO via"
    RESIDENT |o--o{ REPORT : "submits"
    RESIDENT ||--o{ MESSAGE : "exchanges"
    INCIDENT_TYPE |o--o{ REPORT : "classifies"
    REPORT ||--o{ VICTIM : "involves"
    REPORT |o--o{ REPORT : "duplicates"
    REPORT |o--o{ MESSAGE : "is discussed in"
    USER |o--o{ REPORT : "creates, reviews"
    USER |o--o{ MESSAGE : "sends"

    REPORT ||--o{ REPORT_EDIT : "is corrected by"
    USER ||--o{ REPORT_EDIT : "makes"

    USER ||--o{ BROADCAST : "creates"
    BROADCAST ||--o{ BROADCAST_OPTION : "offers"
    BROADCAST ||--o{ BROADCAST_DELIVERY : "is sent as"
    BROADCAST ||--o{ BROADCAST_RESPONSE : "receives"
    RESIDENT ||--o{ BROADCAST_DELIVERY : "receives"
    RESIDENT ||--o{ BROADCAST_RESPONSE : "gives"
    BROADCAST_OPTION ||--o{ BROADCAST_RESPONSE : "is selected in"
    BROADCAST_RESPONSE |o--o| REPORT : "is escalated into"

    REPORT ||--o{ AGENCY_REFERRAL : "is referred via"
    AGENCY ||--o{ AGENCY_REFERRAL : "receives"
    USER ||--o{ AGENCY_REFERRAL : "makes"

    USER ||--o{ KNOWLEDGE_ENTRY : "maintains"
```

| Entity            | Is                                                                  |
| ----------------- | ------------------------------------------------------------------- |
| User              | A dashboard account (Better Auth), with role `admin` or `responder` |
| Invite            | An emailed invitation to create an account                          |
| Barangay          | One of Miagao's 119 barangays, with its boundary and hazard flags   |
| Resident          | A person who has messaged MIGO, with an optional profile            |
| ResidentChannel   | A resident's identity on one platform (Messenger PSID, web session) |
| Report            | An incident report                                                  |
| IncidentType      | A kind of incident a report can have                                |
| Victim            | A person hurt in a report, without a name                           |
| Message           | One inbound or outbound chat message                                |
| ReportEdit        | One correction or status change to a report                         |
| Broadcast         | An advisory or survey sent to many residents                        |
| BroadcastOption   | An answer a survey offers                                           |
| BroadcastDelivery | One send of a broadcast to one resident on one channel              |
| BroadcastResponse | A resident's survey answer                                          |
| Agency            | A partner agency for referrals and hotlines                         |
| AgencyReferral    | A report handed to an agency                                        |
| KnowledgeEntry    | MDRRMO's maintained content for chatbot answers                     |

The schema includes the Stretch entities (surveys, referrals, invites, knowledge base, duplicates, responder-created reports) so later features need few migrations.

## Lifecycles

### Report

```mermaid
stateDiagram-v2
    [*] --> pending: First message or form
    pending --> validated: Responder confirms it
    validated --> dispatched: Help is sent
    dispatched --> resolved: Incident handled
    resolved --> closed: Records complete
    pending --> invalid: False alarm or duplicate
    validated --> invalid: False alarm or duplicate
```

Every change is a `ReportEdit` row. A report is never deleted; `invalid` retires it.

### Broadcast delivery

```mermaid
stateDiagram-v2
    [*] --> queued: Broadcast sent
    queued --> sent: Delivered inside the window
    queued --> failed: Platform error
    queued --> outside_window: Window closed
```

### Invite

```mermaid
stateDiagram-v2
    [*] --> pending: Admin sends
    pending --> accepted: Invitee registers
    pending --> revoked: Admin revokes
    pending --> expired: Past expires_at
    expired --> revoked: Admin revokes
```

An email can have one pending invite at a time, and an expired invite still counts until it is revoked.

## Rules

| Rule                                                                                                                                                                                                                                                                    | Why                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Records are permanent.** No `DELETE`; foreign keys restrict. Rows retire through status, `is_active` or `revoked_at`, and every report correction is a `ReportEdit` row. Reference data nothing references, such as a mistaken or test incident type, may be deleted. | Reports are official records kept for at least a year (NFR4), and corrections must be auditable (FR25). An unreferenced row is part of no record, so deleting it loses nothing. |
| **Victims have no name.** Only sex, age and medical condition.                                                                                                                                                                                                          | Privacy (FR9, NFR3).                                                                                                                                                            |
| **Victim age is a range** (`age_min`, `age_max`). An exact age has both equal; "60+" has no maximum.                                                                                                                                                                    | Reporters guess ("in his 60s", "a senior").                                                                                                                                     |
| **A report's resident is its sender.** `is_proxy` marks a report about someone else. A responder-created report from an unknown caller has no resident.                                                                                                                 | Proxies and witnesses report for others (FR8), and phone or radio reports have no chat sender (FR38).                                                                           |
| **Report fields stay null until known.** A report exists from the first message; `anyone_hurt` is null until asked, and `yes` with no victims means no details yet.                                                                                                     | No report is lost when a resident stops answering (FR40).                                                                                                                       |
| **Messages are the fallback record.** Saved before processing, unique per `(channel, external_id)`.                                                                                                                                                                     | A failed parse still leaves the raw text for a responder, and platform retries don't duplicate it.                                                                              |
| **Residents are reached per channel.** One `ResidentChannel` per platform identity, with the time of the resident's last message.                                                                                                                                       | One person can use Messenger and web chat, and Meta's messaging window is checked per identity.                                                                                 |
| **Broadcast targets aren't foreign keys.** `target_barangay_ids` is an array (empty means the whole municipality), plus an optional hazard matched against `Barangay.hazards`.                                                                                          | A target is a filter at send time; the deliveries record who was actually reached.                                                                                              |
| **Delivery counts come from deliveries.** One row per broadcast, resident and channel.                                                                                                                                                                                  | Only residents who have messaged the Page can be reached, so the target's size overstates reach.                                                                                |
| **Tracking tokens are random 128-bit strings.**                                                                                                                                                                                                                         | They're the only key to the public status page, so they must not be guessable.                                                                                                  |
| **Reference data is managed in the dashboard.** Incident types, agencies, barangay flags and knowledge entries are seeded by migration and edited by admins.                                                                                                            | They change without a code change (FR45–FR47).                                                                                                                                  |
| **Responders are Better Auth users.** No separate responder table; responder foreign keys are `text`.                                                                                                                                                                   | One account table for auth and roles.                                                                                                                                           |
| **Locations are PostGIS geometry in SRID 4326.** Points for reports and residents, multipolygons for barangays, with a centroid fallback.                                                                                                                               | Pins, containment checks and map queries.                                                                                                                                       |
| **Enums are defined once** in `@repo/shared` and only gain values.                                                                                                                                                                                                      | Validation and the database agree, and older releases keep working.                                                                                                             |

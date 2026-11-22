# User flows

What residents and responders do in MIGO, step by step. Routes are in [sitemap.md](sitemap.md).

Flows that pass between people are swimlane diagrams: one lane per actor, with MIGO (the bot and the API) as its own lane, so each handoff is visible. Flows with one actor are plain flowcharts. Rounded boxes start and end a flow, diamonds are decisions, and dashed boxes are Stretch.

## Use cases

```mermaid
flowchart LR
    R(["👤 Resident"])
    RS(["👤 Responder"])
    A(["👤 Admin"])

    subgraph Resident["Messenger and resident site"]
        U1(["Report an incident"])
        U2(["Report for someone else"]):::stretch
        U3(["Check report status"])
        U4(["Receive advisories"])
        U5(["Answer a survey"]):::stretch
        U6(["Ask a general question"]):::stretch
        U7(["Set up profile"])
    end

    subgraph Dashboard["Responder dashboard"]
        D1(["Monitor the live feed"])
        D2(["Validate and correct a report"])
        D3(["Send a broadcast"])
        D4(["Message a resident"]):::stretch
        D5(["Generate reports and sync records"]):::stretch
        D6(["Manage accounts"]):::stretch
        D7(["Manage incident types, agencies, barangays"])
    end

    R --- U1 & U2 & U3 & U4 & U5 & U6 & U7
    RS --- D1 & D2 & D3 & D4 & D5
    A --- D1 & D2 & D3 & D6 & D7

    classDef stretch stroke-dasharray: 5 5
```

An admin can do everything a responder can. Barangay officials use the resident flows.

## Resident flows

### Start a conversation

```mermaid
flowchart TD
    subgraph RES["Resident"]
        A(["Send a message"])
        T["Tap a button"]
    end
    subgraph MIGO["MIGO"]
        B{"In the middle<br/>of a report?"}
        C{"What is it?"}
        BTN["Show buttons: Report an incident,<br/>Check status, Edit profile"]
        ANS(["Treat it as the answer<br/>to the current question"])
        R(["Report an incident"])
        S(["Check status"]):::stretch
        P(["Edit profile"])
    end
    A --> B
    B -->|Yes| ANS
    B -->|No| C
    C -->|"Incident, or AI down"| R
    C -->|Status question| S
    C -->|Profile change| P
    C -->|Unclear| BTN --> T
    T --> R & S & P

    classDef stretch stroke-dasharray: 5 5
```

- The same three buttons are always in Messenger's persistent menu.
- A message the AI can't classify because it's down starts a report, so an emergency never waits on a tap. Responders mark the non-incidents invalid.
- Tapping Report an incident after an unclear message makes that message the report's first message, so the resident doesn't repeat it.
- The bot replies in the resident's language preference (Hiligaynon, Kinaray-a, Tagalog or English), Tagalog by default. Changing it through Edit profile is Stretch.
- "Stop" opts the resident out of broadcasts. The bot still answers reports, since MIGO is an emergency line.

### Report an incident

```mermaid
flowchart TD
    subgraph RES["Resident"]
        A(["Describe the situation<br/>on Messenger"])
        W(["No Messenger:<br/>fill in the /report form"])
        X["Answer"]
        V{"Review card"}
        Z(["Get the status link<br/>and hotline"])
    end
    subgraph MIGO["MIGO"]
        B["Open a pending report, reply<br/>'Got it' with the hotline"]
        F["Fill what's known: the message (AI),<br/>a shared pin, the profile"]
        N{"Anything<br/>missing?"}
        Q["Ask the next missing question"]
        E["Ask the picked field again"]
        K(["Mark invalid, keep the record"])
        FC["Create the report"]
    end
    subgraph RSP["Responder"]
        G(["See the report<br/>in the live feed"])
    end
    A --> B --> F --> N
    N -->|Yes| Q --> X --> F
    N -->|No| V
    V -->|Edit| E --> X
    V -->|Confirm| Z
    V -->|Cancel| K
    B --> G
    W --> FC --> Z
    FC --> G
```

There is one way to report. The AI only decides how many questions get skipped: if it read everything, the resident goes straight to the review card; if it read part, the bot asks the rest; if it failed or is down, the bot asks every question. All three look like the same conversation.

#### Questions

Only the missing ones are asked, in this order:

```mermaid
flowchart TD
    Q1["1. What happened?<br/>buttons: incident types"] --> Q2
    Q2["2. Where? Share a pin,<br/>or type a place or barangay"] --> Q3
    Q3["3. How serious?<br/>buttons: Low, Moderate, High, Critical"] --> Q4
    Q4{"4. Is anyone hurt?"} -->|Yes| Q4a["Sex, age and condition<br/>per person, no names"]
    Q4 -->|"No, or don't know"| Q5
    Q4a --> Q5["5. Contact number"]
```

- There's no description question: the first message is the description.
- Every question has buttons, and residents can type instead. A typed answer is matched to an option ("nasusunog" → Fire); without a match, the buttons are shown again.
- A typed place the map can't find counts as no pin. The bot asks once for a pin, then accepts whatever the resident gives.
- The contact number is skipped when the profile has one.
- A message that doesn't answer the current question ("may naipit pa") is kept on the report as an extra detail and read for any fields it fills. Then the question is asked again.

#### Review card

```mermaid
flowchart TD
    REV["Summary: type, location, severity,<br/>anyone hurt, contact"] --> D{"Resident taps"}
    D -->|Confirm| OK(["Confirmation with status link<br/>and hotline"])
    D -->|Edit| E["Pick a field, answer again"] --> REV
    D -->|Cancel| C{"Cancel this report?"}
    C -->|Yes| X(["Marked invalid and kept"])
    C -->|No| REV
```

- A report that's never confirmed still stands in the feed.
- Residents can cancel only while the report is pending. Once a responder validates it, cancelling goes through the hotline.
- A cancelled report shows in the feed as cancelled by the resident.
- A message after cancelling starts a new report.

#### Rules

- **Nothing blocks reporting.** There's no sign-up first; a name and contact number given in a report are saved to the profile.
- **Never ask what's known.** A pin or detail sent at any point fills its field and removes that question.
- **The AI is optional.** Every place it classifies or extracts something falls back to buttons or a question, so a failure only means more taps.
- **An unsure AI asks.** It shows buttons instead of guessing, with Report an incident first.
- **The hotline comes first.** The first reply already carries it, so a life-threatening report doesn't wait on the questions.

### Report on behalf of someone else (Stretch)

```mermaid
flowchart TD
    subgraph RES["Resident"]
        A(["Start a report"])
        C["Say who it's about"]
    end
    subgraph MIGO["MIGO"]
        B{"About someone else?"}
        D(["File under the sender"])
        E(["File under the affected person,<br/>marked as proxy"])
    end
    A --> B
    B -->|No| D
    B -->|Yes| C --> E
```

### Check status of a report

```mermaid
flowchart TD
    subgraph RSP["Responder"]
        U(["Update the report's status"])
    end
    subgraph RES["Resident"]
        A(["Ask the bot"]):::stretch
        B(["Open the status link<br/>(token, no login)"])
        Z(["See the current stage"])
    end
    subgraph MIGO["MIGO"]
        L["Look up the report"]
        S["pending → validated →<br/>dispatched → resolved"]
    end
    U --> S
    A --> L
    B --> L
    L --> S --> Z

    classDef stretch stroke-dasharray: 5 5
```

### Receive and respond to a broadcast

The resident's side of [Compose and send a broadcast](#compose-and-send-a-broadcast).

### Ask a general question (Stretch)

```mermaid
flowchart TD
    subgraph RES["Resident"]
        A(["Ask about office info,<br/>hotlines or weather"])
        Y(["Get an answer, with source<br/>and timestamp for forecasts"])
        N(["Get pointed to a human<br/>or the FAQ page"])
    end
    subgraph MIGO["MIGO"]
        B{"Grounded in the knowledge base<br/>or weather source?"}
    end
    A --> B
    B -->|Yes| Y
    B -->|No| N
```

### Set up profile and preferences

```mermaid
flowchart TD
    A(["Resident gives name, age, sex,<br/>address, contact, language"]) --> B["Profile saved"]
    B --> C(["Reused on future reports"])
    B --> D(["Broadcast opt-in toggled anytime"])
```

## Responder flows

### Monitor the live incident feed

```mermaid
flowchart TD
    A(["Sign in"]) --> B["Feed updates in near real time"]
    B --> C["Filter or sort by severity,<br/>type or time"]
    C --> D(["Open a report in a side panel<br/>without leaving the feed"])
```

### Validate and correct a report

```mermaid
flowchart TD
    subgraph RSP["Responder"]
        A(["Open a report"])
        B["Review auto-parsed fields"]
        C{"Accurate?"}
        D["Edit the wrong fields"]
        E["Update the status"]
        F(["Log the partner agency<br/>it was referred to"]):::stretch
    end
    subgraph MIGO["MIGO"]
        R["Record each change<br/>in the edit history"]
    end
    subgraph RES["Resident"]
        Z(["See the new status"])
    end
    A --> B --> C
    C -->|No| D --> E
    C -->|Yes| E
    D --> R
    E --> R
    E --> F
    R --> Z

    classDef stretch stroke-dasharray: 5 5
```

### Compose and send a broadcast

```mermaid
flowchart TD
    subgraph RSP["Responder"]
        A(["Draft an advisory<br/>or survey"])
        B["Pick a target: whole municipality,<br/>or by barangay or hazard"]
        C["Send"]
        K(["See delivery counts"])
        V["See survey results and<br/>non-respondents"]:::stretch
        X(["Escalate a response<br/>into a report"]):::stretch
    end
    subgraph MIGO["MIGO"]
        Q["Queue one delivery per<br/>targeted resident"]
        W{"Inside the<br/>messaging window?"}
        S["Send and mark sent<br/>or failed"]
        O["Mark outside_window"]
        L["Log the response"]:::stretch
    end
    subgraph RES["Resident"]
        R(["Receive the message"])
        T["Tap a survey option"]:::stretch
    end
    A --> B --> C --> Q --> W
    W -->|Yes| S --> R
    W -->|No| O
    S --> K
    O --> K
    R --> T --> L --> V --> X

    classDef stretch stroke-dasharray: 5 5
```

Only residents who have messaged the Page can be reached, so delivery counts show real reach, not the size of the target.

### Message a resident directly (Stretch)

```mermaid
flowchart TD
    subgraph RSP["Responder"]
        A(["Open a report or<br/>resident profile"])
        B["Send a follow-up message"]
        Z(["See the reply in the panel"])
    end
    subgraph MIGO["MIGO"]
        L["Deliver and log it<br/>against the incident"]
    end
    subgraph RES["Resident"]
        R["Receive it and reply"]
    end
    A --> B --> L --> R
    R --> L
    L --> Z
```

### Generate reports and sync records (Stretch)

```mermaid
flowchart TD
    A(["Open the export page"]) --> B["Auto-generate a situational report"]
    A --> C["Export or autofill standard forms<br/>(e.g. DROMIC), as a locked PDF"]
    A --> D["Sync incidents to the office's<br/>spreadsheets"]
```

### Manage accounts (admin, Stretch)

```mermaid
flowchart TD
    subgraph ADM["Admin"]
        A(["Send an email invite"])
        C["Assign a role:<br/>admin or responder"]
    end
    subgraph MIGO["MIGO"]
        E["Email the invite link"]
        G(["Restrict access by role"])
    end
    subgraph NEW["Invitee"]
        R["Register through the link"]
    end
    A --> E --> R --> C --> G
```

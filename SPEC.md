# AI Mystery Room --- Implementation Specification

**Document:** `SPEC.md`\
**Project:** AI Mystery Room\
**Version:** 1.0\
**Status:** Implementation-ready\
**Primary coding tool:** Google Antigravity\
**Deadline:** 2 November 2026, 11:59 PM (local time, India)\
**Primary objective:** Build, test, deploy, and demonstrate a complete
AI-powered mystery investigation game.

------------------------------------------------------------------------

## 1. Project Summary

AI Mystery Room is a responsive full-stack web application where a
player creates a mystery from a short premise, investigates a case
generated with Google Gemini, discovers clues, requests hints, accuses a
suspect, and receives a verdict and score.

The application must provide a complete playable flow on the deployed
website. The AI may generate the story and structured case content, but
the backend must validate the generated content and enforce all game
rules.

### 1.1 Problem Statement

Players need a simple, engaging mystery-solving experience without
requiring a human game master. The application uses generative AI to
create replayable mysteries while preserving fair gameplay, consistent
clues, secure answer handling, and server-authoritative scoring.

### 1.2 Goals

-   Generate mysteries at Easy, Medium, and Hard difficulty.
-   Provide an investigation interface for suspects, clues, and hints.
-   Make clue discovery and hint usage persistent for the active case.
-   Accept one final accusation per case.
-   Reveal the correct culprit and solution explanation only after
    accusation.
-   Calculate scores on the server.
-   Handle invalid AI output, API failures, duplicate requests, and
    expired or completed cases safely.
-   Deploy a usable frontend and backend with a hosted MongoDB database.
-   Provide a public GitHub repository containing source code but no
    secrets.

### 1.3 Out of Scope for Version 1

-   Multiplayer or real-time co-op.
-   User accounts, social profiles, and cross-device saved progress.
-   Payments, subscriptions, or leaderboards.
-   User-created public case sharing.
-   Voice input, image generation, or animated cutscenes.
-   An admin dashboard.
-   Guaranteed unlimited case generation. Generation may be
    rate-limited.

------------------------------------------------------------------------

## 2. Target Users and User Experience

### 2.1 Target Users

-   Casual players who enjoy detective stories and puzzles.
-   Students or hobbyists exploring AI-generated interactive
    experiences.
-   Players who want short, replayable mystery sessions.

### 2.2 UX Principles

-   The next action should be obvious on every screen.
-   The game should explain the rules before a player starts.
-   Show progress clearly: clues found, hints used, and suspects
    available.
-   Distinguish undiscovered clues from discovered clues.
-   Do not leak the culprit through API responses, client bundles, HTML,
    logs, or browser storage before accusation.
-   Provide loading, empty, error, and retry states.
-   Support keyboard navigation, readable contrast, and mobile layouts.

------------------------------------------------------------------------

## 3. Technology Stack

Use the following stack unless a documented technical blocker requires a
change.

### Frontend

-   React
-   Vite
-   JavaScript (ES modules)
-   Tailwind CSS
-   React Router
-   Axios
-   Optional: Lucide React for icons

### Backend

-   Node.js (LTS)
-   Express
-   MongoDB Atlas
-   Mongoose
-   Google Gen AI SDK: `@google/genai`
-   Zod for request and AI output validation
-   `dotenv`
-   `cors`
-   `helmet`
-   `express-rate-limit`
-   `pino` or another structured logger that redacts secrets
-   `nodemon` for local development

### Testing

-   Vitest and React Testing Library for frontend tests
-   Node test runner or Jest/Vitest plus Supertest for API tests
-   Manual production smoke test using the deployed website

### Deployment

-   Frontend: Vercel
-   Database: MongoDB Atlas
-   Backend: a Node.js-compatible hosting provider that supports a
    persistent Express service and environment variables

### Package and Runtime Notes

-   Pin compatible package versions in lockfiles.
-   Use the current Google Gen AI SDK API supported by the installed
    version; do not copy deprecated Gemini SDK examples.
-   Do not assume the frontend and backend share environment variables.
-   The frontend must call the deployed backend through a configured API
    base URL.

------------------------------------------------------------------------

## 4. Repository Structure

``` text
ai-mystery-room/
├── SPEC.md
├── README.md
├── .gitignore
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── AppHeader.jsx
│       │   ├── DifficultyBadge.jsx
│       │   ├── SuspectCard.jsx
│       │   ├── ClueCard.jsx
│       │   ├── HintPanel.jsx
│       │   ├── ProgressPanel.jsx
│       │   ├── LoadingState.jsx
│       │   ├── ErrorState.jsx
│       │   └── ConfirmDialog.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── CreateMysteryPage.jsx
│       │   ├── InvestigationPage.jsx
│       │   ├── AccusationPage.jsx
│       │   ├── ResultsPage.jsx
│       │   └── NotFoundPage.jsx
│       ├── services/
│       │   └── api.js
│       ├── hooks/
│       └── utils/
└── server/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        │   └── db.js
        ├── models/
        │   └── Case.js
        ├── routes/
        │   ├── health.routes.js
        │   └── case.routes.js
        ├── controllers/
        │   └── case.controller.js
        ├── services/
        │   ├── gemini.service.js
        │   ├── case.service.js
        │   └── scoring.service.js
        ├── validators/
        │   ├── case.schemas.js
        │   └── ai-case.schema.js
        ├── middleware/
        │   ├── error-handler.js
        │   ├── not-found.js
        │   └── rate-limiters.js
        └── utils/
            ├── api-error.js
            └── public-case.js
```

Keep modules small and focused. Do not put all routes, prompts, database
logic, and scoring in one file.

------------------------------------------------------------------------

## 5. Core User Flow

1.  Player opens the Home page.
2.  Player selects **Create a Mystery**.
3.  Player enters a premise and selects Easy, Medium, or Hard.
4.  Frontend validates the form and sends a request to the backend.
5.  Backend validates input, applies rate limits, asks Gemini for
    structured case data, validates the result, checks internal
    consistency, and saves the case to MongoDB.
6.  Backend returns only the public case view. The culprit and solution
    remain private.
7.  Player reviews the story and suspects.
8.  Player discovers clues. The server records each discovery once and
    returns updated progress and score.
9.  Player may request hints. The server returns the next available hint
    and records its use.
10. Player opens the accusation screen and selects one suspect.
11. Backend validates the suspect ID, locks the case as completed,
    calculates the final score, and stores the verdict.
12. Results page displays correct/incorrect verdict, culprit,
    explanation, score breakdown, and a **Play Again** action.
13. **Play Again** starts a new case.

### Route Guarding

-   `/` --- Home
-   `/create` --- Create Mystery
-   `/case/:id` --- Investigation Room
-   `/case/:id/accuse` --- Accusation
-   `/case/:id/result` --- Results
-   `*` --- Not Found

The frontend may hide routes from navigation, but authorization and
case-state enforcement must be implemented on the backend. A player who
refreshes a case URL should recover the case state from the API. A
completed case must not return to active status.

------------------------------------------------------------------------

## 6. Page and UI Specifications

### 6.1 Home Page (`/`)

**Purpose:** Explain the game and help the player start quickly.

Required elements: - Brand/title: AI Mystery Room. - Short description:
create a case, inspect clues, and identify the culprit. - Primary CTA:
**Create a Mystery**. - Three difficulty summaries. - Brief rules
section explaining clues, hints, and scoring. - Footer with
project/source link if appropriate.

States: - Default landing state. - Navigation/loading state when moving
to creation.

### 6.2 Create Mystery Page (`/create`)

Required elements: - Page title and short instructions. - Premise
textarea, 20--500 characters. - Difficulty selector: Easy, Medium,
Hard. - Character count. - Submit button: **Generate Mystery**. -
Validation messages. - Loading state with clear text while Gemini
generates the case. - Error state with retry action.

Suggested premise placeholder: \> A rare manuscript disappears from a
locked museum archive during a private exhibition.

Validation: - Trim whitespace. - Reject empty input. - Reject fewer than
20 or more than 500 characters. - Do not accept arbitrary difficulty
values. - Disable repeated submit while a request is pending. - Never
expose raw provider errors or API keys.

### 6.3 Investigation Room (`/case/:id`)

Required elements: - Case title, difficulty, and story. - Progress
summary: clues discovered / total clues. - Hint usage count / hint
limit. - Suspect cards showing public descriptions and alibis. - Clue
cards showing undiscovered/discovered states. - **Discover Clue** action
on each undiscovered clue. - **Request Hint** action. - **Make an
Accusation** CTA. - Score preview or score breakdown that does not
reveal the solution. - Clear notice that accusation completes the case.

Behavior: - A discovered clue remains discovered after refresh. -
Discovering the same clue repeatedly must not grant points more than
once. - The UI must not display hidden solution fields. - If the case is
completed, redirect to or show the Results page. - Show a confirmation
dialog before final accusation.

### 6.4 Accusation Page (`/case/:id/accuse`)

Required elements: - Brief instruction that the choice is final. -
Selectable suspect cards/radio controls. - Submit button disabled until
a suspect is selected. - Confirmation step before submission. - Loading
and error states.

Behavior: - Only suspect IDs returned in the public case can be
selected. - The server must reject invalid suspect IDs. - A completed
case cannot be accused again. - Do not reveal whether the selected
suspect is correct before the final submission response.

### 6.5 Results Page (`/case/:id/result`)

Required elements: - Verdict: **Case Solved** or **Incorrect
Accusation**. - Culprit name and description. - Explanation of the
culprit's motive/opportunity and how clues support the solution. - Final
score. - Score breakdown: base points, clue points, hint penalties,
final points. - Button to **Play Again**. - Optional **Review Case**
link.

Behavior: - Results must be fetched from the backend. - Do not calculate
the final score in React. - Only return solution fields after the case
has been completed. - Repeated result requests should return the same
saved result.

### 6.6 Shared Visual Design

Create a polished detective/noir interface without making text difficult
to read: - Dark navy/charcoal surfaces with warm amber accents. - Clear
typography hierarchy and readable body text. - Subtle evidence-board,
file-folder, or case-file motifs. - Use animation sparingly; respect
reduced-motion preferences. - Avoid overusing blur, glow, or
low-contrast gray text. - Responsive layout: mobile first, tablet,
desktop. - On mobile, stack suspect and clue cards vertically. - Ensure
visible keyboard focus, labels for form fields, semantic headings, and
accessible buttons.

### 6.7 Global UI States

-   Initial loading/skeleton.
-   Empty state.
-   Inline validation error.
-   API/network error with retry.
-   Gemini generation failure.
-   Not found case.
-   Rate-limited response.
-   Completed case.
-   Disabled/pending button state.
-   Success feedback after clue discovery or hint use.

------------------------------------------------------------------------

## 7. Difficulty Rules

The server owns the difficulty configuration. Never trust counts
supplied by the client.

  ------------------------------------------------------------------------
  Difficulty         Suspects          Clues          Hints        Correct
                                                                accusation
                                                               base points
  ------------ -------------- -------------- -------------- --------------
  Easy                      3              5              2            100

  Medium                    4              7              3            150

  Hard                      5              9              3            200
  ------------------------------------------------------------------------

Each generated case must contain exactly the number of suspects, clues,
and hints required for its difficulty. If output fails validation, retry
generation a limited number of times (maximum 2 generation attempts
total per user request, unless explicitly configured otherwise), then
return a safe error. Do not save malformed cases.

------------------------------------------------------------------------

## 8. Scoring Rules

Scoring must be implemented in `scoring.service.js` and run on the
backend only.

### 8.1 Formula

If the accusation is correct:

`finalScore = max(0, basePoints + (uniqueCluesDiscovered × 5) - (hintsUsed × 10))`

If the accusation is incorrect:

`finalScore = 0`

Base points: - Easy: 100 - Medium: 150 - Hard: 200

Additional rules: - A clue can award points once only. - Each hint used
applies one penalty. - The number of hints used cannot exceed the
difficulty limit. - An accusation can be submitted once. - The score is
finalized and persisted when the accusation is submitted. - The client
cannot send or override `basePoints`, `cluesDiscovered`, `hintsUsed`,
`isCorrect`, or `finalScore`. - Do not accept score values from the
request body. - Clamp the score to zero minimum. - If the assignment
rubric expects clue points to be earned even on an incorrect accusation,
this specification intentionally follows the explicit rule above:
incorrect accusation receives 0. Keep this rule consistent in tests and
UI.

### 8.2 Score Examples

Easy, correct, 3 unique clues, 1 hint: `100 + (3 × 5) - 10 = 105`

Hard, correct, 5 unique clues, 3 hints: `200 + (5 × 5) - (3 × 10) = 195`

Any incorrect accusation: `0`

------------------------------------------------------------------------

## 9. AI Generation Contract

### 9.1 Model Responsibilities

Gemini generates: - Title. - Story. - Suspects and their public
details. - Clues and their public descriptions. - Hints in progressive
order. - Private culprit ID. - Private solution explanation. - Internal
consistency metadata if useful.

The server must validate and normalize the output before persistence.
Treat model output as untrusted input.

### 9.2 Required JSON Shape

The model must return a single JSON object without Markdown fences or
commentary.

``` json
{
  "title": "The Missing Manuscript",
  "story": "A complete introductory mystery story...",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Mira Vale",
      "role": "Archive curator",
      "description": "A concise public description.",
      "alibi": "A claim that can be investigated."
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "title": "The Dust-Free Shelf",
      "description": "A public clue description available to discover.",
      "detail": "The additional information revealed after discovery.",
      "relevance": "How this clue contributes to the reasoning, without directly naming the culprit."
    }
  ],
  "hints": [
    {
      "id": "hint_1",
      "text": "A gentle nudge toward a relevant contradiction."
    }
  ],
  "solution": {
    "culpritSuspectId": "suspect_1",
    "motive": "The private motive.",
    "method": "How the culprit committed the act.",
    "explanation": "A complete explanation linking the evidence to the culprit.",
    "clueReasoning": [
      {
        "clueId": "clue_1",
        "reason": "Why this clue supports or rules out a hypothesis."
      }
    ]
  }
}
```

The example is illustrative. The actual schema must enforce exact array
counts according to difficulty and validate all IDs and references.

### 9.3 Prompt Requirements

The system/developer prompt sent to Gemini must instruct it to: -
Generate a fair, solvable mystery appropriate for the selected
difficulty. - Use only the requested number of suspects, clues, and
hints. - Assign stable unique IDs to every suspect, clue, and hint. -
Ensure `culpritSuspectId` matches exactly one suspect ID. - Make the
solution logically supported by multiple clues. - Avoid contradictions
between the story, alibis, clues, and solution. - Ensure the case can be
solved from the available information without requiring outside
knowledge. - Make hints progressively more informative without
immediately naming the culprit. - Keep names, locations, motives, and
events internally consistent. - Return valid JSON only. - Never include
secrets, external links, real-person allegations, or disallowed
content. - Avoid making the culprit obvious solely from their name or
role.

### 9.4 Validation and Consistency Checks

Use Zod schemas for: - String length limits. - Exact suspect/clue/hint
counts. - Allowed difficulty values. - Unique IDs. - `culpritSuspectId`
existence. - Every clue reasoning `clueId` referencing a real clue. -
Required non-empty explanation, motive, and method. - Maximum output
lengths to control storage and response sizes.

Additional semantic checks: - The culprit must be one of the suspects. -
At least two clues should materially support the final solution. - Clue
and hint content must not be empty. - No duplicate IDs. - Reject
unexpected fields where practical. - Do not rely only on the AI's
assertion that the mystery is consistent.

If validation fails, retry once with a correction prompt containing
validation errors but no secrets. If the second attempt fails, return
`AI_GENERATION_FAILED` and do not save the case.

### 9.5 Gemini Integration

-   Use `@google/genai` only on the server.
-   Read `GEMINI_API_KEY` from server environment variables.
-   Read model name from `GEMINI_MODEL`; choose a currently available
    Gemini model configured for the project.
-   Request structured JSON output when supported by the selected
    model/API version.
-   Set sensible timeout and output-token limits.
-   Handle quota, timeout, malformed output, and provider errors.
-   Do not log full secrets or sensitive environment variables.
-   Never place the Gemini key in a `VITE_` variable or frontend source.
-   Do not expose private solution fields in generation responses.

------------------------------------------------------------------------

## 10. Backend Data Model

Use a single `Case` Mongoose model for Version 1.

### 10.1 Case Document

``` js
{
  title: String,
  story: String,
  premise: String,
  difficulty: "easy" | "medium" | "hard",

  suspects: [{
    id: String,
    name: String,
    role: String,
    description: String,
    alibi: String
  }],

  clues: [{
    id: String,
    title: String,
    description: String,
    detail: String,
    relevance: String
  }],

  hints: [{
    id: String,
    text: String
  }],

  solution: {
    culpritSuspectId: String,
    motive: String,
    method: String,
    explanation: String,
    clueReasoning: [{
      clueId: String,
      reason: String
    }]
  },

  progress: {
    discoveredClueIds: [String],
    usedHintIds: [String]
  },

  status: "active" | "completed",

  accusation: {
    suspectId: String,
    isCorrect: Boolean,
    submittedAt: Date
  },

  score: {
    basePoints: Number,
    cluePoints: Number,
    hintPenalty: Number,
    finalScore: Number
  },

  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

### 10.2 Model Requirements

-   Generate a MongoDB ObjectId for the case.
-   Add timestamps.
-   Validate enum values and required fields at schema and service
    levels.
-   Add a TTL policy only if case expiration is implemented and
    documented. Do not silently expire active cases.
-   Store only the minimum data needed.
-   Do not send `solution`, `accusation`, or private score state through
    public case serializers before completion.
-   Ensure all clue/hint IDs are unique within their respective arrays.
-   Consider optimistic concurrency or conditional updates to prevent
    duplicate scoring under concurrent requests.

### 10.3 Public Serialization

Create a `toPublicCase()` or equivalent function. It must explicitly
select allowed fields rather than removing a few known private fields
from a large object.

For active cases, return: - Case ID, title, story, difficulty. - Public
suspect fields. - Clue IDs, titles, descriptions, and discovery state. -
Progress counts. - Hint limit and hints used count. - Current non-secret
score preview if implemented. - Status.

For active cases, never return: - `solution` - `culpritSuspectId` -
Private motive/method/explanation - `accusation.isCorrect` - Any hidden
field that identifies the answer

After completion, the result endpoint may return the culprit,
explanation, verdict, and saved score.

------------------------------------------------------------------------

## 11. REST API Contract

Base path: `/api`

Use JSON request and response bodies. Return consistent errors:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  }
}
```

Never include stack traces, provider secrets, database connection
strings, or internal prompts in production errors.

### 11.1 `GET /api/health`

Purpose: deployment health check.

Success `200`:

``` json
{
  "status": "ok"
}
```

Do not expose environment variables or detailed infrastructure
information.

### 11.2 `POST /api/cases`

Create a mystery.

Request:

``` json
{
  "premise": "A rare manuscript disappears from a locked museum archive during a private exhibition.",
  "difficulty": "medium"
}
```

Success `201`:

``` json
{
  "case": {
    "id": "CASE_ID",
    "title": "The Missing Manuscript",
    "story": "Public story...",
    "difficulty": "medium",
    "suspects": [],
    "clues": [],
    "progress": {
      "discoveredClueIds": [],
      "cluesDiscovered": 0,
      "totalClues": 7,
      "hintsUsed": 0,
      "hintLimit": 3
    },
    "status": "active"
  }
}
```

Requirements: - Validate premise and difficulty. - Apply generation rate
limit. - Generate and validate the case server-side. - Save only after
all validations pass. - Return the public serializer output only.

Possible errors: - `400 VALIDATION_ERROR` - `429 RATE_LIMITED` -
`502 AI_GENERATION_FAILED` - `503 AI_SERVICE_UNAVAILABLE`

### 11.3 `GET /api/cases/:id`

Retrieve a case.

Success `200`: public case view for active cases; completed public state
for completed cases, without using this endpoint to bypass result rules.

Errors: - `400 INVALID_CASE_ID` - `404 CASE_NOT_FOUND`

The response must never reveal the active case solution.

### 11.4 `POST /api/cases/:id/clues/:clueId/discover`

Discover a clue.

Request body: empty.

Success `200`:

``` json
{
  "caseId": "CASE_ID",
  "clue": {
    "id": "clue_1",
    "title": "The Dust-Free Shelf",
    "description": "Public clue description.",
    "detail": "The additional detail revealed after discovery."
  },
  "progress": {
    "cluesDiscovered": 1,
    "totalClues": 7,
    "discoveredClueIds": ["clue_1"]
  },
  "scorePreview": 5
}
```

Requirements: - Case must exist and be active. - Clue ID must belong to
that case. - Add the clue ID only once. - Award no duplicate points on
repeated calls. - Return the same discovered clue details on repeated
calls. - Do not include the culprit or private solution.

Errors: - `404 CASE_NOT_FOUND` - `404 CLUE_NOT_FOUND` -
`409 CASE_COMPLETED`

### 11.5 `POST /api/cases/:id/hints`

Request:

``` json
{}
```

Success `200`:

``` json
{
  "hint": {
    "id": "hint_1",
    "text": "A gentle nudge toward a relevant contradiction."
  },
  "progress": {
    "hintsUsed": 1,
    "hintLimit": 3
  },
  "scorePreview": -5
}
```

`scorePreview` may be clamped to zero if that is the chosen UI
convention. The final scoring formula remains authoritative on the
server.

Requirements: - Return the next unused hint in the configured order. -
Record each hint ID once. - Do not return all hints at case creation. -
If the limit is reached, return `409 HINT_LIMIT_REACHED`. - Reject
requests after case completion. - Do not expose solution fields.

### 11.6 `POST /api/cases/:id/accuse`

Request:

``` json
{
  "suspectId": "suspect_2"
}
```

Success `200`:

``` json
{
  "caseId": "CASE_ID",
  "status": "completed",
  "verdict": "incorrect",
  "resultUrl": "/case/CASE_ID/result"
}
```

Requirements: - Validate the suspect ID against the case. - Case must be
active. - Make completion and scoring atomic or concurrency-safe. -
Calculate correctness and score on the server. - Persist accusation,
verdict, score breakdown, and completion timestamp. - Do not accept
score or correctness fields from the client. - Do not return the full
explanation from this endpoint; the client should navigate to the result
endpoint. - Repeated accusation requests must not overwrite the first
result.

Errors: - `400 VALIDATION_ERROR` - `404 CASE_NOT_FOUND` -
`404 SUSPECT_NOT_FOUND` - `409 CASE_ALREADY_COMPLETED`

### 11.7 `GET /api/cases/:id/result`

Requirements: - Case must exist. - Case must be completed. - Return
saved verdict, culprit, explanation, motive, method, clue reasoning, and
score breakdown. - Repeated requests must return the same result. - If
active, return `409 CASE_NOT_COMPLETED`.

Success `200`:

``` json
{
  "caseId": "CASE_ID",
  "status": "completed",
  "verdict": "correct",
  "culprit": {
    "id": "suspect_1",
    "name": "Mira Vale",
    "role": "Archive curator",
    "description": "Public description."
  },
  "solution": {
    "motive": "Private motive.",
    "method": "How the culprit committed the act.",
    "explanation": "How the evidence supports the conclusion.",
    "clueReasoning": []
  },
  "score": {
    "basePoints": 150,
    "cluePoints": 15,
    "hintPenalty": 10,
    "finalScore": 155
  }
}
```

### 11.8 Error Code Catalogue

-   `VALIDATION_ERROR`
-   `INVALID_CASE_ID`
-   `CASE_NOT_FOUND`
-   `CLUE_NOT_FOUND`
-   `SUSPECT_NOT_FOUND`
-   `CASE_COMPLETED`
-   `CASE_ALREADY_COMPLETED`
-   `CASE_NOT_COMPLETED`
-   `HINT_LIMIT_REACHED`
-   `AI_GENERATION_FAILED`
-   `AI_SERVICE_UNAVAILABLE`
-   `RATE_LIMITED`
-   `INTERNAL_SERVER_ERROR`

Map codes to appropriate HTTP statuses and user-friendly frontend
messages.

------------------------------------------------------------------------

## 12. Security and Privacy Requirements

### 12.1 Solution Protection

This is a critical requirement.

-   Store the solution in MongoDB, accessible only to backend code.
-   Never send the active solution to the browser, even in hidden React
    props or unused JSON fields.
-   Never embed the solution in the page HTML, JavaScript bundle, source
    maps, localStorage, sessionStorage, or client-side state.
-   Use explicit response DTOs/serializers.
-   Add automated tests that assert the active-case JSON does not
    contain `solution`, `culpritSuspectId`, or private
    motive/explanation fields.
-   Reveal the solution only after the accusation is persisted as
    completed.
-   Avoid logging entire case documents.

### 12.2 Secrets

Server `.env` example:

``` env
PORT=5000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=replace_me
GEMINI_MODEL=replace_with_available_model
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

-   Commit `.env.example`, never `.env`.
-   Add `.env`, `client/.env.local`, `node_modules`, build outputs,
    logs, and coverage output to `.gitignore`.
-   Never use `VITE_GEMINI_API_KEY`.
-   Configure production variables through the hosting provider's
    secret/environment settings.
-   Rotate any secret accidentally committed or exposed.

### 12.3 API Protection

-   Configure CORS to allow only the configured frontend origin(s).
-   Use Helmet.
-   Apply rate limits to case generation and other mutation endpoints.
-   Validate ObjectIds and all request bodies.
-   Limit JSON body size.
-   Set request timeouts and safe error handling.
-   Avoid exposing stack traces in production.
-   Do not trust client-provided IDs without checking that they belong
    to the requested case.
-   Ensure repeated clue/hint/accusation requests cannot inflate scores
    or mutate completed cases.

### 12.4 Anonymous Play and Abuse Limitations

Version 1 does not require accounts. Case IDs are therefore
unguessable-enough MongoDB ObjectIds, not a complete authorization
system. Rate limiting is required. Do not store personal information
unless needed. If stronger privacy or ownership is required later, add
signed player sessions or authentication as a separate versioned
enhancement.

------------------------------------------------------------------------

## 13. Environment Configuration

### Server `.env.example`

``` env
PORT=5000
MONGODB_URI=
GEMINI_API_KEY=
GEMINI_MODEL=
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client environment

`client/.env.example`:

``` env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, set `VITE_API_BASE_URL` to the deployed backend's `/api`
URL and rebuild/redeploy the frontend. Only non-secret public
configuration may use a `VITE_` prefix.

------------------------------------------------------------------------

## 14. Local Development Commands

### Frontend

``` bash
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom axios
npm install -D tailwindcss @tailwindcss/vite
```

Configure Tailwind according to the installed version's official setup.
Do not mix Tailwind v3 and v4 configuration instructions.

### Backend

From the repository root:

``` bash
mkdir server
cd server
npm init -y
npm install express cors dotenv mongoose @google/genai zod helmet express-rate-limit
npm install -D nodemon
```

Add scripts to `server/package.json`:

``` json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "node --test"
  }
}
```

Add suitable scripts to `client/package.json`, including `dev`, `build`,
`preview`, and `test` if tests are configured.

### Local Run Checklist

1.  Create the MongoDB Atlas database and allow network access securely.
2.  Create `server/.env` from `.env.example`.
3.  Add a valid Gemini API key and supported model name.
4.  Create `client/.env.local` from the client example.
5.  Start the backend from `server/`.
6.  Start the Vite frontend from `client/`.
7.  Verify `GET /api/health`.
8.  Create and solve one Easy case before testing other difficulties.

------------------------------------------------------------------------

## 15. Testing Strategy

### 15.1 Unit Tests

Test: - Scoring formula for all difficulties. - Correct and incorrect
accusations. - Minimum score clamp. - Duplicate clue discovery does not
add points twice. - Hint limit and hint penalty. - Difficulty
configuration counts. - AI output schema validation. - Public serializer
never returns solution fields for active cases.

### 15.2 API Integration Tests

Test: - Case creation with valid premise/difficulty. - Reject invalid
premise and difficulty. - Reject malformed case IDs. - Get active case
without solution leakage. - Discover valid clue. - Reject unknown
clue. - Discover the same clue twice without duplicate score. - Request
hints in order. - Reject hints after the limit. - Reject mutations after
completion. - Reject unknown suspect accusation. - Correct accusation
yields the expected score. - Incorrect accusation yields zero. - Results
endpoint rejects active case. - Results endpoint returns persisted
result after completion. - Repeated accusation does not overwrite the
original result.

Mock Gemini in automated tests. Do not require a paid/live Gemini call
for every test run.

### 15.3 Frontend Tests

Test: - Premise validation and difficulty selection. - Loading and error
states. - Investigation rendering. - Clue discovery updates. - Hint
limit state. - Accusation selection and confirmation. - Results page
rendering. - API failure messaging. - Responsive layout at mobile and
desktop widths.

### 15.4 Manual End-to-End Test

For each difficulty: 1. Generate a case. 2. Confirm exact suspect, clue,
and hint counts. 3. Discover at least one clue. 4. Request a hint. 5.
Refresh the investigation page and verify progress persists. 6. Submit
an accusation. 7. Verify the result and score. 8. Attempt a second
accusation and confirm it is rejected. 9. Inspect the active case API
response and verify the solution was not present before accusation. 10.
Repeat the complete flow on the deployed site.

------------------------------------------------------------------------

## 16. Deployment Plan

### 16.1 MongoDB Atlas

-   Create a production database and database user with only the
    permissions required.
-   Configure network access for the backend host.
-   Use a strong unique password.
-   Put the connection string in backend environment variables only.
-   Verify connection from the deployed backend.

### 16.2 Backend Host

-   Deploy the `server` application.
-   Set the correct build/start command for the chosen provider.
-   Configure `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
    `CLIENT_URL`, `NODE_ENV=production`, and `PORT` as required by the
    host.
-   Confirm `/api/health` returns `200`.
-   Configure logs without exposing secrets.
-   Confirm CORS permits the production frontend origin.

### 16.3 Vercel Frontend

-   Import the GitHub repository into Vercel.
-   Set the frontend root directory to `client`.
-   Configure the build command and output directory as appropriate for
    Vite (`npm run build`, `dist`).
-   Set `VITE_API_BASE_URL` to the deployed backend `/api` URL.
-   Configure SPA rewrites so React Router deep links such as
    `/case/:id/result` load correctly.
-   Redeploy after environment variable changes.

### 16.4 Production Verification

-   Test the full game from the production URL, not only localhost.
-   Verify API URLs are not pointing to localhost.
-   Verify browser console and network requests contain no secret
    values.
-   Test mobile layout.
-   Confirm case generation, persistence, clues, hints, accusation,
    scoring, and results.
-   Confirm the GitHub repository is public if the assignment requires
    it.
-   Ensure `.env` files, keys, database credentials, and generated build
    folders are not committed.

------------------------------------------------------------------------

## 17. README Requirements

The repository `README.md` must include: - Project overview and
screenshots. - Features. - Tech stack. - Architecture and folder
structure. - Local setup steps. - Required environment variables with
example values only. - How to run frontend and backend. - Test
commands. - Deployment URLs (fill in after deployment). - Known
limitations. - A note that Gemini output is validated and the solution
is withheld until accusation.

Never publish real API keys or database credentials in the README.

------------------------------------------------------------------------

## 18. Acceptance Criteria

The project is complete only when all required criteria pass.

### Functional

-   [ ] Home page explains the game and has a working start CTA.
-   [ ] User can enter a valid premise.
-   [ ] Easy, Medium, and Hard cases can be generated.
-   [ ] Each difficulty returns the exact required counts.
-   [ ] Investigation page shows the story and suspects.
-   [ ] Player can discover clues.
-   [ ] Clue discovery persists after refresh.
-   [ ] Duplicate clue requests do not grant duplicate points.
-   [ ] Player can request hints up to the difficulty limit.
-   [ ] Player can submit one accusation.
-   [ ] Correct and incorrect verdicts are accurate.
-   [ ] Score is calculated on the backend.
-   [ ] Result shows culprit and explanation after accusation.
-   [ ] Player can start another mystery.

### Security and Reliability

-   [ ] Gemini API key exists only on the server.
-   [ ] Active case responses never contain the solution.
-   [ ] Client cannot submit its own score or correctness value.
-   [ ] Invalid AI output is rejected and retried safely.
-   [ ] Duplicate and post-completion actions are handled safely.
-   [ ] Errors are user-friendly and do not expose internals.
-   [ ] Rate limiting and CORS are configured.
-   [ ] Production environment variables are configured correctly.

### Delivery

-   [ ] `SPEC.md` is committed.
-   [ ] `README.md` is complete.
-   [ ] Source code is pushed to the required GitHub repository.
-   [ ] Repository is public if required by the assignment.
-   [ ] Frontend and backend are deployed.
-   [ ] Production end-to-end flow has been tested.
-   [ ] One mystery has been created and solved on the live website.
-   [ ] GitHub repository URL and live website URL are ready for
    submission.

------------------------------------------------------------------------

## 19. Implementation Milestones

Recommended order for Antigravity. Finish and verify each milestone
before proceeding.

### Milestone 1 --- Read the Spec and Scaffold

-   Read this complete `SPEC.md`.
-   Create the repository structure and package scripts.
-   Add `.gitignore`, `.env.example` files, and a basic README.
-   Confirm both apps start locally.

**Done when:** frontend and backend start without errors and no secrets
are committed.

### Milestone 2 --- Backend Foundation

-   Add Express app, health route, error handler, CORS, Helmet, and rate
    limits.
-   Connect Mongoose to MongoDB.
-   Add Case model and request validators.

**Done when:** health check works and database connection is verified.

### Milestone 3 --- AI Generation

-   Implement Gemini service and prompt.
-   Implement Zod output validation and consistency checks.
-   Add case creation endpoint and public serializer.
-   Add tests for exact counts and solution secrecy.

**Done when:** valid cases save and the response does not contain
solution fields.

### Milestone 4 --- Game Mechanics

-   Implement get case, discover clue, request hint, accuse, and result
    endpoints.
-   Implement server-side scoring and concurrency-safe case completion.
-   Add integration tests.

**Done when:** all scoring, duplicate-action, and completed-case tests
pass.

### Milestone 5 --- Frontend

-   Build all five pages and shared components.
-   Connect API calls through one Axios service.
-   Add loading, empty, validation, and error states.
-   Ensure refresh restores case progress.

**Done when:** a player can complete the full flow locally.

### Milestone 6 --- Polish and QA

-   Improve responsive design and accessibility.
-   Test all difficulty levels.
-   Test API failure and rate limiting.
-   Inspect network responses for solution leakage.
-   Fix console errors and broken navigation.

**Done when:** acceptance checklist passes locally.

### Milestone 7 --- Deploy and Submit

-   Deploy database, backend, and frontend.
-   Configure production environment variables and routing.
-   Complete one full production game.
-   Update README with real URLs and screenshots.
-   Push the final code and submit repository + live URL.

**Done when:** the live website supports the complete game flow.

------------------------------------------------------------------------

## 20. Instructions for Antigravity

Use this specification as the source of truth.

1.  Read the entire `SPEC.md` before writing code.
2.  First inspect the repository and report the current state. Do not
    overwrite existing work blindly.
3.  Implement one milestone at a time in the order above.
4.  Before each milestone, briefly state the files to be created or
    changed.
5.  After each milestone, run the relevant tests or build commands and
    report actual results.
6.  Do not claim a test passed unless it was executed and passed.
7.  Do not skip backend validation, scoring tests, or solution-leakage
    tests to save time.
8.  Do not put Gemini API keys in frontend code or commit `.env` files.
9.  Do not return the solution from active-case API endpoints.
10. If a requirement is ambiguous, follow this specification and explain
    the assumption instead of silently changing the behavior.
11. Prefer small, reviewable changes over replacing the whole project at
    once.
12. If a dependency or API has changed, consult its current official
    documentation and use the installed version correctly.
13. At the end of each milestone, provide:
    -   Summary of changes.
    -   Commands executed.
    -   Test/build results.
    -   Any unresolved issues.
    -   The exact next milestone.
14. Before deployment, check the production environment variables, CORS
    origin, frontend API base URL, deep-link routing, and secret
    handling.

------------------------------------------------------------------------

## 21. Final Submission

Submission form: https://bit.ly/ai-mystery-room-sub-form

Deadline: **2 November 2026, 11:59 PM**.

Submit: - Public GitHub repository URL containing the source code. -
Live deployed website URL.

Before submitting, create and solve at least one mystery on the live
site and verify that the result and score are correct.

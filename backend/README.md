# CampusConnect Backend — Phase 1

Authentication & project foundation for the CampusConnect SRM Ramapuram College Super App.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values
npm run dev             # nodemon, http://localhost:5000
```

Create the first admin account (public registration only ever creates students):

```bash
npm run seed:admin -- --name "Admin Name" --email admin@srmist.edu.in --password Admin@12345
```

## Environment Variables

See `.env.example` for the full list: MongoDB Atlas URI, JWT secrets, cookie settings, SMTP credentials (forgot password emails), Firebase Storage credentials (used from Phase 2), and the Gemini API key (used from Phase 5).

## Architecture Notes

- **Access tokens** (JWT, short-lived, `15m` default) are returned in the JSON response body and should be kept in memory on the client (not localStorage) and sent as `Authorization: Bearer <token>`.
- **Refresh tokens** (JWT, long-lived, `7d` default) are stored in an `httpOnly` cookie scoped to `/api/auth`, and mirrored in the `refresh_tokens` collection so they can be revoked/rotated server-side.
- Refresh tokens are **rotated** on every `/refresh` call: the old one is marked `revoked` and a new one issued. This lets us detect refresh-token reuse/theft later if needed.
- Resetting or changing a password revokes **all** existing refresh tokens for that user.
- Public `/register` always creates a `student`; only an already-authenticated `admin` can create another `admin` via the same endpoint.

## API Reference — Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new student account |
| POST | `/api/auth/login` | Public | Log in, returns access token + sets refresh cookie |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token, get new access token |
| POST | `/api/auth/logout` | Public | Revoke refresh token, clear cookie |
| GET | `/api/auth/me` | Bearer | Get the current authenticated user |
| POST | `/api/auth/forgot-password` | Public | Email a password reset link |
| POST | `/api/auth/reset-password` | Public | Reset password using emailed token |
| POST | `/api/auth/change-password` | Bearer | Change password while logged in |

### POST /api/auth/register

Request body:
```json
{
  "name": "Jane Doe",
  "email": "jane@srmist.edu.in",
  "password": "Passw0rd123",
  "department": "CSE",
  "semester": 5,
  "registerNumber": "RA2111003010123"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": { "id": "...", "name": "Jane Doe", "email": "jane@srmist.edu.in", "role": "student", "...": "..." },
    "accessToken": "eyJhbGciOi..."
  }
}
```

### POST /api/auth/login
Request body: `{ "email": "jane@srmist.edu.in", "password": "Passw0rd123" }`
Response `200`: same shape as register, plus sets the `ccRefreshToken` httpOnly cookie.

### POST /api/auth/refresh
No body required — reads the `ccRefreshToken` cookie automatically (or accepts `{ "refreshToken": "..." }` in the body as a fallback for non-browser clients).
Response `200`: `{ "success": true, "data": { "accessToken": "..." } }`

### POST /api/auth/logout
Revokes the current refresh token and clears the cookie.

### GET /api/auth/me
Header: `Authorization: Bearer <accessToken>`
Response `200`: `{ "success": true, "data": { "user": { ... } } }`

### POST /api/auth/forgot-password
Body: `{ "email": "jane@srmist.edu.in" }`
Always returns a generic success message (does not reveal whether the email exists), and emails a reset link if it does: `{{CLIENT_URL}}/reset-password?token=...`

### POST /api/auth/reset-password
Body: `{ "token": "<raw token from email link>", "password": "NewPassw0rd1" }`

### POST /api/auth/change-password
Header: `Authorization: Bearer <accessToken>`
Body: `{ "currentPassword": "...", "newPassword": "..." }`

## Error Response Shape

```json
{
  "success": false,
  "status": "fail",
  "message": "Incorrect email or password.",
  "code": "TOKEN_EXPIRED"
}
```
`code` is only present for specific machine-readable cases (currently: `TOKEN_EXPIRED`, used by the frontend to trigger a silent `/refresh` before retrying).

## Collections (Phase 1)

- `users` — see `models/User.js`
- `refresh_tokens` — see `models/RefreshToken.js` (TTL-indexed; documents auto-expire at `expiresAt`)

## Collections (Phase 2)

- `notes` — see `models/Note.js`
- `pyqs` — see `models/Pyq.js`

## API Reference — Notes (`/api/notes`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/notes` | Any | Search/filter (`search`, `department`, `semester`, `subject`, `unit`, `bookmarkedOnly`), paginated |
| GET | `/api/notes/:id` | Any | Get one note |
| POST | `/api/notes` | Admin | Upload PDF/PPT (`multipart/form-data`, field `file`) |
| POST | `/api/notes/drive-link` | Admin | Add a note as a Drive link |
| PATCH | `/api/notes/:id` | Admin | Edit metadata |
| DELETE | `/api/notes/:id` | Admin | Delete (also removes the Firebase Storage object) |
| POST | `/api/notes/:id/download` | Any | Increment download count, returns `fileUrl` |
| POST | `/api/notes/:id/bookmark` | Any | Toggle bookmark for the current user |

## API Reference — PYQs (`/api/pyqs`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/pyqs` | Any | Search/filter (`search`, `department`, `semester`, `subject`, `year`, `examType`), paginated |
| GET | `/api/pyqs/:id` | Any | Get one PYQ |
| POST | `/api/pyqs` | Admin | Upload PDF (`multipart/form-data`, field `file`) |
| PATCH | `/api/pyqs/:id` | Admin | Edit metadata |
| DELETE | `/api/pyqs/:id` | Admin | Delete (also removes the Firebase Storage object) |
| POST | `/api/pyqs/:id/download` | Any | Increment download count, returns `fileUrl` |

Notes/PYQ uploads are streamed straight to Firebase Storage (`config/firebase.js`, `services/firebaseUploadService.js`) via Multer's in-memory storage — nothing is written to local disk. Files are capped at 25MB and restricted to PDF/PPT mime types.

## Collections (Phase 3)

- `placements` — see `models/Placement.js`
- `applications` — see `models/Application.js`
- `events` — see `models/Event.js`
- `event_registrations` — see `models/EventRegistration.js`

## API Reference — Users (`/api/users`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| PATCH | `/api/users/profile` | Any | Self-service profile update (name, department, semester, registerNumber, cgpa, backlogs, graduationYear, resumeUrl) |

This endpoint was added in Phase 3 so students can supply the CGPA/backlog/department data that placement eligibility checks run against — it isn't in the original module list but is required for "Check eligibility" to work against real data rather than mocks. Full admin user management (list/deactivate/change role) is deferred to a later phase.

## API Reference — Placements (`/api/placements`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/placements` | Any | List drives (`search`, `status`, `department`), paginated. For students, each drive is annotated with `eligibilityCheck` and `myApplicationStatus`. |
| GET | `/api/placements/:id` | Any | Get one drive, same student annotations as above |
| POST | `/api/placements` | Admin | Create a drive |
| PATCH | `/api/placements/:id` | Admin | Edit a drive |
| DELETE | `/api/placements/:id` | Admin | Delete a drive (cascades to its applications) |
| POST | `/api/placements/:id/apply` | Student | Apply — rejected with `403` if ineligible, `400` if closed/deadline passed, `409` if already applied |
| GET | `/api/placements/my-applications` | Student | List the current student's applications |
| DELETE | `/api/placements/applications/:id` | Student | Withdraw an application (only while status is still `applied`) |
| GET | `/api/placements/:id/applicants` | Admin | List every applicant for a drive, with student profile fields populated |
| PATCH | `/api/placements/applications/:id/status` | Admin | Move an application through `applied → shortlisted / rejected / selected`, with optional `notes` |

**Eligibility model**: each placement has `eligibility.minCgpa`, `eligibility.maxBacklogs`, `eligibility.allowedDepartments` (empty = all), and `eligibility.graduationYear` (null = any). `services/eligibilityService.js` compares these against the student's profile and returns human-readable reasons for any mismatch, shown directly in the UI before the student attempts to apply.

## API Reference — Events (`/api/events`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/events` | Any | List events (`search`, `category`, `upcomingOnly`), paginated. Each event includes `registeredCount`, `isFull`, and (for students) `isRegistered`. |
| GET | `/api/events/:id` | Any | Get one event with the same annotations |
| POST | `/api/events` | Admin | Create an event |
| PATCH | `/api/events/:id` | Admin | Edit an event |
| DELETE | `/api/events/:id` | Admin | Delete an event (cascades to its registrations) |
| POST | `/api/events/:id/register` | Student | Register — `409` if already registered, `400` if past deadline or at capacity |
| DELETE | `/api/events/:id/register` | Student | Cancel registration (re-registering later reuses the same record) |
| GET | `/api/events/my-registrations` | Student | List the current student's active registrations |
| GET | `/api/events/:id/registrations` | Admin | List everyone registered for an event |

Capacity of `0` means unlimited. Registration is blocked once `registeredCount` reaches `capacity`, and again once `registrationDeadline` has passed.

## Verified Phase 3 Checklist

- [x] `placements`, `applications`, `events`, `event_registrations` collections
- [x] Admin: create/edit/delete placement drives, view applicants, move applications through a status pipeline
- [x] Student: real eligibility check against CGPA/backlogs/department/graduation year, apply, track status, withdraw
- [x] Admin: create/edit/delete events, view registrations
- [x] Student: register/cancel/view own registrations, with capacity + deadline enforcement
- [x] Route ordering verified (literal routes like `/my-applications` registered before `/:id` wildcards) to avoid shadowing bugs
- [x] Every new file passes `node --check`; `app.js` loads all 6 route groups without error

## Collections (Phase 4)

- `notifications` — see `models/Notification.js` (one document per recipient — broadcasts fan out on write)
- `complaints` — see `models/Complaint.js`
- `support_tickets` — see `models/SupportTicket.js` (embeds a `responses` sub-array for the conversation thread)

**Naming fix carried back into earlier phases**: Mongoose auto-pluralizes model names (`RefreshToken` → `refreshtokens`, `EventRegistration` → `eventregistrations`, `SupportTicket` → `supporttickets`), which doesn't match the spec's underscored collection names. `models/RefreshToken.js`, `models/EventRegistration.js`, and `models/SupportTicket.js` now explicitly pass the collection name (`refresh_tokens`, `event_registrations`, `support_tickets`) as the third argument to `mongoose.model()` so the actual Atlas collections match the spec exactly.

## API Reference — Notifications (`/api/notifications`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | List own notifications (`isRead`, `type` filters), paginated, includes `unreadCount` |
| GET | `/api/notifications/unread-count` | Any | Just the unread count (cheap poll target) |
| POST | `/api/notifications/broadcast` | Admin | Send a notification to `target: "all" \| "students" \| "admins" \| [userIds]` |
| PATCH | `/api/notifications/:id/read` | Any | Mark one notification as read |
| PATCH | `/api/notifications/mark-all-read` | Any | Mark every unread notification as read |

**Real-time delivery**: `services/notificationService.js` bulk-inserts one document per resolved recipient, then emits a `notification:new` Socket.IO event to each recipient's personal room (`user:<id>`, joined automatically on socket connect — see `sockets/index.js`). The frontend listens for this event to show a toast and bump the unread badge without polling.

**Automatic notifications**: beyond the manual `/broadcast` endpoint (used for the `announcement` type), the system automatically notifies all students in real time when an admin uploads a note, uploads a PYQ, creates a placement drive, or creates an event — covering all 5 types (`notes`, `pyq`, `placement`, `event`, `announcement`) end-to-end rather than leaving them as an unused enum. Students are also individually notified when their placement application status changes.

## API Reference — Complaints (`/api/complaints`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/complaints` | Any | Student sees only their own; Admin sees all (`status`, `category` filters), paginated |
| POST | `/api/complaints` | Student | File a complaint |
| GET | `/api/complaints/:id` | Any | View one (student restricted to their own) |
| PATCH | `/api/complaints/:id/resolve` | Admin | Update `status` + optional `adminResponse`; notifies the student in real time |

## API Reference — Support Tickets (`/api/support-tickets`, all require auth)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/support-tickets` | Any | Student sees only their own; Admin sees all (`status`, `category` filters), paginated, response thread omitted from list view |
| POST | `/api/support-tickets` | Student | Open a ticket |
| GET | `/api/support-tickets/:id` | Any | View one ticket including the full response thread |
| POST | `/api/support-tickets/:id/responses` | Any | Add a message to the thread (either party); admin replying auto-moves `open → in_progress`; blocked once `resolved`/`closed` |
| PATCH | `/api/support-tickets/:id/status` | Admin | Change status; notifies the student in real time |

## Verified Phase 4 Checklist

- [x] `notifications`, `complaints`, `support_tickets` collections (with corrected naming, see above)
- [x] Broadcast notifications with role/user targeting, unread count, mark-as-read (single + bulk)
- [x] Real-time delivery via Socket.IO to each recipient's personal room — verified by re-reading `sockets/index.js`'s existing room-join logic from Phase 1, which this phase relies on unchanged
- [x] Automatic notifications wired into Notes, PYQ, Placement, and Event creation — not just the manual broadcast path
- [x] Complaints: student raise/track, admin resolve with response + real-time notify
- [x] Support tickets: student create/view, either party can respond, admin resolves; status transitions guarded (can't reply to a closed ticket)
- [x] Every new file passes `node --check`; `app.js` loads all 9 route groups without error; route ordering re-verified for the new modules

## API Reference — AI Study Assistant (`/api/ai`, all require auth, rate-limited per user)

Every endpoint here calls Google's Gemini API (`services/geminiService.js`) and requests a strict JSON response shape, so the frontend always gets typed data rather than free-form text (except `/chat`, which is genuinely conversational).

| Method | Endpoint | Request body | Response `data` shape |
|---|---|---|---|
| POST | `/api/ai/chat` | `{ message, history? }` — `history` is `[{role:'user'\|'model', content}]`, resent each turn (backend is stateless) | `{ reply: string }` |
| POST | `/api/ai/summarize` | `{ text, length?: 'short'\|'medium'\|'detailed' }` | `{ summary: string, keyPoints: string[] }` |
| POST | `/api/ai/quiz` | `{ topic, text?, numQuestions?, difficulty? }` | `{ questions: [{ question, options[4], correctAnswerIndex, explanation }] }` |
| POST | `/api/ai/viva` | `{ subject, topic?, numQuestions? }` | `{ questions: [{ question, modelAnswer }] }` |
| POST | `/api/ai/pyq-analysis` | `{ subject, department?, semester? }` | `{ likelyImportantTopics: string[], examPatternInsights: string, recommendation: string, recordsAnalyzed: number }` |
| POST | `/api/ai/interview-prep` | `{ role, companyName?, jobDescription? }` | `{ technicalQuestions: string[], hrQuestions: string[], tips: string[] }` |
| POST | `/api/ai/important-questions` | `{ subject, unit?, text? }` | `{ questions: [{ question, importance: 'high'\|'medium'\|'low', reason }] }` |

**Grounding, not mocking**: `/pyq-analysis` queries the real `pyqs` collection (subject/department/semester filters, up to 50 most recent records) and passes the actual year/exam-type counts on file into the prompt, and is instructed to say so explicitly if that count is too low to support a strong conclusion — rather than fabricating statistics from records that don't exist yet.

**Rate limiting**: capped per authenticated user (`AI_RATE_LIMIT_MAX`, default 30 requests / `AI_RATE_LIMIT_WINDOW_MIN`, default 15 minutes) since each call has a real API cost, distinct from the IP-based limiter on `/api/auth`.

**Configuration**: set `GEMINI_API_KEY` in `.env` (get one from [Google AI Studio](https://aistudio.google.com/apikey)); `GEMINI_MODEL` defaults to `gemini-1.5-flash` and can be overridden. If the key is missing, every AI endpoint fails clearly with a `503` rather than crashing the server — verified in this sandbox by unsetting the key and confirming the exact error path.

**What I could not verify here**: this sandbox's network egress only allows npm/pip/GitHub registries, not `generativelanguage.googleapis.com`, so I could not make a real Gemini call end-to-end. What I did verify: the `@google/generative-ai` SDK installs cleanly, `getGenerativeModel`, `generateContent`, `startChat`, and `sendMessage` all exist with the signatures this code calls, and the missing-API-key path fails exactly as designed. Please test the actual model responses once you add a real `GEMINI_API_KEY`.

## Verified Phase 5 Checklist

- [x] All 6 routes from the spec implemented, plus `/important-questions` for the 7th listed feature (Important Question Generator) that had no assigned route in the original spec
- [x] Every structured endpoint requests and parses strict JSON from Gemini so the frontend gets typed data
- [x] PYQ analysis grounded in real database records, not fabricated statistics
- [x] Per-user rate limiting on all AI routes
- [x] Missing-API-key path fails gracefully with a clear `503`, confirmed by direct test
- [x] Gemini SDK method signatures confirmed to exist and match usage (`getGenerativeModel`, `generateContent`, `startChat`, `sendMessage`)
- [x] Every file passes `node --check`; `app.js` loads all 10 route groups without error

## API Reference — Analytics (`/api/analytics`, admin only)

Every number here is a live read/aggregation against the existing collections from Phases 1–4 — no new collections, no mock data.

| Method | Endpoint | Query params | Returns |
|---|---|---|---|
| GET | `/api/analytics/overview` | — | The 12 metric cards: `totalUsers`, `activeUsers`, `totalNotes`, `totalNotesDownloads`, `totalPyqs`, `totalPyqDownloads`, `totalPlacements`, `totalApplications`, `totalEvents`, `totalRegistrations`, `totalComplaints`, `totalSupportTickets` |
| GET | `/api/analytics/downloads` | `department?`, `semester?`, `subject?` | `{ notesBySubject: [{subject, downloads, noteCount}], pyqsBySemester: [{semester, downloads, pyqCount}] }` |
| GET | `/api/analytics/events` | `startDate?`, `endDate?` (default: last 30 days) | `{ registrationsOverTime: [{date, count}], registrationsByCategory: [{category, count}], totalEvents, upcomingEvents, dateRange }` |
| GET | `/api/analytics/placements` | `startDate?`, `endDate?` (unset = all-time) | `{ applicationsByCompany: [{companyName, count}], applicationsByStatus: [{status, count}], totalPlacements, openPlacements }` |
| GET | `/api/analytics/users` | `startDate?`, `endDate?` (default: last 30 days) | `{ dailyActiveUsers: [{date, count}], usersByRole: [{role, count}], newSignupsOverTime: [{date, count}], dateRange }` |

**Design notes**:
- Downloads (`notes.downloads`, `pyqs.downloads`) are running counters incremented on each download call (Phase 2), not a separate download-log collection — so "downloads by subject/semester" reflects current totals, not a time series. Building a true downloads-over-time chart would require a new event-log collection, which this phase was explicitly scoped to avoid.
- "Daily Active Users" reuses each user's existing `lastLoginAt` field (set on every successful login since Phase 1) as the activity signal — again, no new collection.
- `services/analyticsService.js` uses `$lookup` against the `events` and `placements` collections by their actual Mongoose-assigned names, confirmed against each model's `mongoose.model()` call rather than assumed.

## Verified Phase 6 Checklist

- [x] All 5 endpoints from the spec implemented, backed entirely by existing collections — confirmed no new schema files were added anywhere in this phase
- [x] Every aggregation pipeline reviewed by hand for correct `$lookup` collection names and `$group`/`$project` shapes
- [x] Admin-only access enforced via `restrictTo('admin')` on the whole router
- [x] Every file passes `node --check`; `app.js` loads all 11 route groups without error
- [x] Firebase upload path hardened for both Uniform and fine-grained bucket ACL modes (see root `DEPLOYMENT.md`) — a real gap found while writing deployment docs, fixed rather than just noted
- [x] Dockerfile, Render blueprint, and Vercel config written and reviewed; Docker build itself could not be executed in this sandbox (no `docker` binary available) — see `DEPLOYMENT.md`'s Production Readiness section for exactly what was and wasn't verified


- [x] Folder structure matches spec (`config/controllers/middleware/models/routes/services/validations/sockets/uploads`)
- [x] MongoDB Atlas connection via Mongoose
- [x] `users` and `refresh_tokens` collections
- [x] Register / Login / Logout / Refresh / Forgot / Reset / Change password
- [x] JWT access + refresh tokens, refresh rotation & revocation
- [x] Role-based access control middleware (`restrictTo`)
- [x] express-validator input validation on every auth route
- [x] Centralized error handling + 404 handler
- [x] Rate limiting on auth endpoints
- [x] Socket.IO server wired with JWT-authenticated handshake (ready for Phase 4 notifications)
- [x] `.env.example`, `.gitignore`

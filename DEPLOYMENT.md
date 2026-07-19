# CampusConnect — Deployment Guide

This covers taking the app from local development to a production deployment:
**MongoDB Atlas** (database) → **Firebase Storage** (files) → **Render** (backend API + Socket.IO) → **Vercel** (frontend).

---

## 1. MongoDB Atlas (production)

1. Create a **dedicated production cluster**, separate from any dev/test cluster. M0 (free) is fine to start; upgrade to M10+ before real user load, since M0 has no backups and throttles under sustained traffic.
2. **Database Access** → add a database user with a generated (not hand-typed) password, scoped to `readWrite` on the `campusconnect` database only — not `Atlas admin`.
3. **Network Access**:
   - Render's IPs are dynamic, so the practical options are: allow `0.0.0.0/0` (simplest, relies entirely on the database user's password strength — acceptable for a starter deployment) **or** use [Render's static outbound IPs](https://render.com/docs/static-outbound-ip-addresses) (paid plans) and allowlist only those.
   - Do **not** leave the default "allow from anywhere" that some Atlas quick-starts create without understanding the tradeoff — make the choice deliberately.
4. **Backups**: enable Cloud Backup (Continuous or Scheduled) once off M0. This app has no soft-delete/undo anywhere — a bad `DELETE` request is permanent without a database-level backup.
5. Build the connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/campusconnect?retryWrites=true&w=majority` → this is your `MONGO_URI`.
6. **Indexes**: every model in this codebase already declares its indexes in the schema (`schema.index(...)`) — Mongoose creates them automatically on first connection in non-production `NODE_ENV`. In production, `autoIndex` is disabled by `config/db.js` for performance, so **run index creation once manually** after first deploy:
   ```bash
   # from the backend/ directory, with MONGO_URI pointed at production
   node -e "require('dotenv').config(); const mongoose=require('mongoose'); require('./app'); mongoose.connect(process.env.MONGO_URI).then(async()=>{ for (const name of mongoose.modelNames()) { await mongoose.model(name).syncIndexes(); console.log('synced', name); } process.exit(0); });"
   ```

## 2. Firebase Storage (production)

1. Create a Firebase project (or reuse one) and enable **Storage** in the Firebase console.
2. **Generate a service account**: Project Settings → Service Accounts → "Generate new private key". This gives you `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` for `.env`. Never commit this file — `.gitignore` already excludes `firebase-service-account.json`.
3. **⚠️ Uniform Bucket-Level Access**: buckets created after ~2020 default to this setting, which blocks the per-object `makePublic()` call this app uses for note/PYQ files. `services/firebaseUploadService.js` now detects this and transparently falls back to a signed URL with a far-future expiry, so uploads won't hard-fail either way — but be aware of which mode you're in:
   - **Simplest**: Storage → bucket → Permissions → disable Uniform Bucket-Level Access, so `makePublic()` succeeds and you get clean permanent `storage.googleapis.com` URLs.
   - **More secure default**: leave Uniform Bucket-Level Access on and let the signed-URL fallback handle it. Signed URLs here are issued with a 2100 expiry so they behave like permanent links, but note they're not revocable individually — deleting the file (which the app already does on note/PYQ delete) is still the primary means of revoking access.
4. Set `FIREBASE_STORAGE_BUCKET` to `<project-id>.appspot.com`.
5. Files are streamed straight from Multer's in-memory buffer to Storage (`services/firebaseUploadService.js`) — nothing touches the container's local disk, so this works correctly on Render's ephemeral filesystem without any extra config.

## 3. Backend → Render

**Option A — Blueprint (recommended)**: this repo includes `render.yaml` at the project root. In the Render dashboard, "New" → "Blueprint", point it at your repo, and Render will read `render.yaml` and provision the service automatically, prompting you for the `sync: false` secrets (Mongo URI, Firebase creds, SMTP creds, Gemini key, and your Vercel `CLIENT_URL`).

**Option B — Manual web service**:
1. New → Web Service → connect the repo, set **Root Directory** to `backend`.
2. Runtime: **Docker** (uses `backend/Dockerfile` as-is), or Node if you'd rather skip Docker — `npm install && npm start` works identically since the Dockerfile does nothing exotic.
3. Health check path: `/api/health` (already implemented in `app.js` from Phase 1).
4. Add every variable from `backend/.env.example` in the Render dashboard's Environment tab. Specifically for production:
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` — **required** once the frontend (Vercel) and backend (Render) are on different domains, or the refresh-token cookie silently won't be sent and every session will appear to "not persist."
   - `CLIENT_URL` = your Vercel URL, exactly (used for CORS `origin` and password-reset email links) — no trailing slash.
5. After first deploy, seed an admin account (see backend README) by running `npm run seed:admin -- --name "..." --email "..." --password "..."` via Render's Shell tab, or locally against the production `MONGO_URI`.

## 4. Frontend → Vercel

1. New Project → import the repo, set **Root Directory** to `frontend`.
2. Framework preset: Vite (auto-detected). Build command `npm run build`, output directory `dist` — already codified in `frontend/vercel.json`, which also adds an SPA rewrite so refreshing a client-side route like `/notes` doesn't 404.
3. Environment variables:
   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://<your-render-service>.onrender.com`
4. Deploy. Then go back to Render and set `CLIENT_URL` to the resulting `https://<project>.vercel.app` URL (or your custom domain) and redeploy the backend so CORS and cookie settings line up.

## 5. Post-deploy verification checklist

Run through this once both services are live:

- [ ] `GET https://<render-url>/api/health` returns `200`
- [ ] Register a student on the deployed frontend → confirm a document appears in the Atlas `users` collection
- [ ] Log out and back in, then refresh the page — session should silently restore (validates the cross-origin cookie settings)
- [ ] Upload a note as admin → confirm the file appears in Firebase Storage and the returned URL is reachable in a browser
- [ ] Trigger forgot-password → confirm the email arrives with a working link back to the Vercel `CLIENT_URL`
- [ ] Open two browser sessions (admin + student), broadcast a notification, confirm it appears in real time on the student session (validates Socket.IO works cross-origin on Render)
- [ ] Hit `/api/ai/chat` with a real `GEMINI_API_KEY` set — this was never tested end-to-end during development (see Phase 5 notes) and is the single highest-priority thing to verify manually
- [ ] Confirm `/api/analytics/overview` returns real numbers once some data exists (all zeros on an empty database is expected, not a bug)

---

## Production Readiness Score: **7.5 / 10**

**What's solid:**
- Every module (auth, notes, PYQs, placements, events, notifications, complaints, tickets, AI assistant, analytics) is implemented against real collections with no mock data, validated with `express-validator`, and protected by role-based access control.
- Every backend file across all 6 phases passes `node --check`; `app.js` loads all 11 route groups without error; route ordering was manually re-verified at each phase to rule out `/:id` wildcards shadowing literal routes.
- Refresh-token rotation/revocation, rate limiting (auth + AI), centralized error handling, and Helmet/CORS are all in place, not deferred.
- The Firebase upload path now handles both Uniform and fine-grained bucket ACL modes without manual bucket configuration being a hard requirement.

**What brings it down from a 10:**
- **No live end-to-end test was possible in this build environment.** This sandbox's network egress only allows npm/pip/GitHub registries — not MongoDB's binary download, not `generativelanguage.googleapis.com`, not Firebase Storage. Every phase was verified by syntax checking, dependency installation, frontend builds, SDK interface checks, and manual code review — never by an actual request hitting a real database or third-party API. That is a meaningfully lower bar than integration-tested code, even though the code paths themselves follow standard, well-understood patterns.
- **No automated test suite.** Nothing here has unit or integration tests; correctness rests on the manual verification described above and on your own testing once deployed.
- **No CI pipeline.** No GitHub Actions/lint-on-PR/test-on-PR setup exists yet.

## Remaining Blockers (must resolve before go-live)

1. **Real Gemini API call has never been tested.** The SDK integration is verified at the interface level (method signatures match), but actual model output — especially whether Gemini reliably returns the exact JSON shapes each prompt requests — needs a manual pass with a real `GEMINI_API_KEY` before trusting it in front of users. Add a fallback UI state for malformed AI JSON if you see this in practice.
2. **No live MongoDB Atlas connection has been exercised against this code.** Run the full post-deploy checklist above before considering any environment "production."
3. **Firebase bucket ACL mode is unconfirmed for your specific project.** Confirm which path (`makePublic()` succeeding vs. the signed-URL fallback) your bucket actually takes, and decide if the far-future signed URL fallback is acceptable for your security requirements, or if you'd rather explicitly disable Uniform Bucket-Level Access.
4. **Email deliverability is unverified.** Gmail SMTP (the `.env.example` default) has sending limits and may land in spam without SPF/DKIM configured on a real sending domain — fine for a pilot, not for scale.
5. **No automated backups configured until you're off Atlas M0.** See §1 above.
6. **Secrets rotation.** `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are Render `generateValue: true` placeholders in `render.yaml` — confirm they were actually generated (not left as literal text) before going live.

## Deployment Checklist

- [ ] MongoDB Atlas production cluster created, network access deliberately chosen (not default-open), backups enabled
- [ ] Firebase Storage project + service account created, bucket ACL mode confirmed
- [ ] All backend env vars set on Render (`.env.example` is the source of truth)
- [ ] `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none` set (cross-origin requirement)
- [ ] Backend deployed on Render, `/api/health` returns 200
- [ ] Frontend env vars (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`) set on Vercel, pointed at the Render URL
- [ ] Frontend deployed on Vercel, `CLIENT_URL` on Render updated to match and redeployed
- [ ] Admin account seeded via `npm run seed:admin`
- [ ] Full post-deploy verification checklist (§5) completed manually
- [ ] `GEMINI_API_KEY` set and `/api/ai/chat` manually tested with a real request
- [ ] SMTP credentials set and forgot-password email manually tested
- [ ] Custom domains (optional) attached on both Render and Vercel, `CLIENT_URL`/CORS updated accordingly

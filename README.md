# Outbox Labs — Email Scheduler Assessment

Full-stack scheduled email application using **TypeScript + Express, PostgreSQL, Redis, BullMQ, React/Vite and Ethereal Email**.

## Features

### Backend
- TypeScript Express API
- PostgreSQL persistence
- Redis-backed BullMQ delayed jobs
- Restart rehydration from PostgreSQL (DB is the source of truth)
- Google OAuth credential verification + email/password fallback
- CSV/text recipient upload with deduplication
- Multiple recipients per campaign
- Configurable delay between recipients
- Redis-backed hourly sending limit per user
- Configurable BullMQ worker concurrency
- Retry with exponential backoff
- Idempotent BullMQ job IDs based on DB email IDs
- Cancel scheduled emails
- Ethereal preview URLs

### Frontend
- React + Vite
- Google OAuth button (when configured)
- Email/password fallback
- Dashboard with Scheduled / Sent / Failed / Cancelled tables
- CSV upload with detected recipient count
- Start time, per-email delay and hourly limit controls
- Responsive UI, loading and empty states

## Architecture

```text
React frontend
     |
     v
Express API -----> PostgreSQL (source of truth)
     |                    |
     v                    |
   BullMQ <------------ rehydrate on restart
     |
   Redis
     |
     v
Worker (configurable concurrency)
     |
     +--> Redis hourly counter + send-delay state
     |
     v
Ethereal SMTP
```

### Scheduling
Each recipient becomes a DB row and a BullMQ delayed job. The DB row is created before the job is queued. The BullMQ `jobId` is the email row ID, preventing duplicate queue entries for the same email.

### Persistence on restart
On API startup, every row with `status='scheduled'` is re-enqueued. If Redis retained the job, the same job ID already exists; if Redis was recreated, the job is restored from PostgreSQL. A scheduled time in the past is queued with zero delay so it is caught up instead of lost.

### Rate limiting
The worker uses a Redis counter per user and UTC hour. Once the configured hourly limit is reached, the job waits until the next hour. This state is external to a single Node process and survives worker restarts when Redis persistence is enabled.

### Delay and concurrency
The campaign stores `delay_ms` and offsets each recipient's initial scheduled time by the configured delay. The worker also enforces the delay using Redis state. `WORKER_CONCURRENCY` controls how many BullMQ jobs the worker can process in parallel.

### Idempotency
Every email row has one BullMQ job ID equal to its DB ID. The worker checks the DB status before sending and skips already-sent/cancelled records.

## Run locally

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

In a second terminal:

```bash
cd backend
npm run worker
```

For Linux/macOS use `cp .env.example .env` instead of `copy`.

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Environment variables

Backend `.env`:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-me
DATABASE_URL=postgres://outbox:outbox@localhost:5432/outbox
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=
ETHEREAL_USER=
ETHEREAL_PASS=
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
WORKER_CONCURRENCY=5
EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=
```

## Google OAuth setup

1. Create a Google OAuth Web Client ID in Google Cloud Console.
2. Add `http://localhost:5173` as an authorized JavaScript origin.
3. Put the client ID in both backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID`.
4. If Google OAuth is not configured, the email/password login still works for local development.

## Ethereal setup

Create an Ethereal test account and put its SMTP username/password in the backend `.env`. If blank, the worker creates a temporary Ethereal test account automatically and prints the credentials.

## Demo checklist (max 5 minutes)

1. Sign in (Google OAuth if configured, otherwise fallback account).
2. Open Compose.
3. Upload a CSV containing several email addresses; show the detected count.
4. Set a future start time, delay and hourly limit.
5. Schedule the campaign.
6. Show the Scheduled table.
7. Stop and restart the API; show that future rows remain scheduled.
8. Let the worker send the messages and show Sent + Ethereal Preview links.
9. Briefly explain concurrency, Redis rate limiting and restart rehydration.

## Submission

- Make the repository **private**.
- Grant GitHub access to the assessment users requested by the client email: `Mitrajit` and `Yadav036`.
- Add the repository URL, demo video URL, and any other requested links/details to the provided ClickUp submission form.
- Do not commit `.env`, OAuth secrets, SMTP passwords or database credentials.

## Assumptions / trade-offs

- PostgreSQL and Redis are provided by Docker Compose for reproducibility.
- Ethereal is used instead of a production email provider because the assessment is for test delivery.
- Email/password remains available as a local-development fallback if Google OAuth credentials are not configured.
- The hourly limit is enforced per user and per UTC clock hour.
- CSV parsing intentionally accepts common simple CSV/text layouts and extracts valid email addresses; it does not attempt to interpret arbitrary spreadsheet formulas.

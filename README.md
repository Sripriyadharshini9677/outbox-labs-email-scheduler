# Outbox Labs — Email Scheduler

A full-stack email scheduling application built for the Outbox Labs technical assessment.

## Tech Stack

* **Frontend:** React, Vite, TypeScript
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL
* **Queue:** Redis, BullMQ
* **Email:** Ethereal Email
* **Authentication:** JWT, Google OAuth

## Features

* Schedule emails for multiple recipients
* Upload recipients using CSV/text files
* Remove duplicate email addresses
* Configure email delay and hourly sending limit
* Background email processing using BullMQ
* Configurable worker concurrency
* Retry failed email jobs with exponential backoff
* Cancel scheduled emails
* Track Scheduled, Sent, Failed and Cancelled emails
* Resume scheduled emails after application restart
* Ethereal preview links for sent emails

## How It Works

PostgreSQL stores the email and campaign data, while Redis and BullMQ handle background scheduling and processing.

Each recipient is stored separately and gets its own BullMQ job. The database ID is used as the job ID to avoid duplicate jobs.

On restart, scheduled emails are loaded from PostgreSQL and re-added to the queue if required.

## Run Locally

### 1. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 2. Start Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Start the worker in another terminal:

```bash
cd backend
npm run worker
```

### 3. Start Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

For Linux/macOS, use `cp .env.example .env` instead of `copy`.

## Environment Variables

Backend requires configuration for:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
ETHEREAL_USER=
ETHEREAL_PASS=
```

Frontend:

```env
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```

Actual `.env` files and credentials should not be committed to the repository.

## Demo

The demo covers:

1. Login
2. CSV recipient upload
3. Campaign scheduling
4. Scheduled email tracking
5. Application restart and job recovery
6. Email processing
7. Ethereal preview links
8. Rate limiting and worker concurrency

## Project Structure

```text
outbox-labs-email-scheduler/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

## Assessment Submission

* **Repository:** Add your GitHub repository URL
* **Demo Video:** Add your demo video URL

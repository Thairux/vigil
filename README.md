# Vigil

Runnable React app scaffolded with Vite.

## Backend (Supabase + Express)

### 1) Configure environment

Copy `.env.example` to `.env` and set your Supabase values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional frontend variable:
- `VITE_API_BASE_URL` (defaults to `http://localhost:4000/api`)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for login and realtime in the frontend

### 2) Create database tables

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

### 3) Seed initial users

```bash
npm run seed:users
```

Seed an analyst auth account + mapped profile:

```bash
npm run seed:analyst
```

Optional env overrides:
- `ANALYST_EMAIL`
- `ANALYST_PASSWORD`
- `ANALYST_NAME`

### 4) Run frontend + backend

```bash
npm install
npm run dev
```

This starts:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### Run backend tests

```bash
npm run test:backend
```

### Backend API endpoints
- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/users`
- `GET /api/events`
- `POST /api/events`
- `GET /api/alerts`
- `PATCH /api/alerts/:alertId`
- `POST /api/transactions`

All `/api/*` routes except `/api/health` require a Supabase bearer token.

### Auth and Roles

Vigil reads role from Supabase user metadata:
- `app_metadata.role` or `user_metadata.role`
- supported roles: `admin`, `analyst`, `customer`

Profile mapping:
- Auth users are mapped to `public.users` via `users.auth_user_id`.
- `GET /api/auth/me` returns both auth identity and mapped profile.

Role access:
- `admin` / `analyst`: dashboard reads, alerts management
- `customer`: event/transaction creation

Realtime updates use Supabase Realtime subscriptions on `events` and `alerts`.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (typically `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

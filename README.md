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

### 2) Create database tables

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

### 3) Seed initial users

```bash
npm run seed:users
```

### 4) Run frontend + backend

```bash
npm install
npm run dev
```

This starts:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### Backend API endpoints
- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/users`
- `GET /api/events`
- `POST /api/events`
- `GET /api/alerts`
- `PATCH /api/alerts/:alertId`
- `POST /api/transactions`

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

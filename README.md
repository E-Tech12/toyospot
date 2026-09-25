# Toyo's Pot — Full Stack

This zip contains all three parts of the project:

```
toyos-pot-fullstack/
  frontend/   Customer-facing React + Vite + Tailwind PWA  (see frontend/README.md)
  admin/      Admin dashboard, React + Vite + Tailwind      (see admin/README.md)
  backend/    FastAPI + SQLAlchemy + Supabase API            (see backend/README.md)
```

They're three separate deployables (frontend → Vercel, admin → Vercel,
backend → Render), not a monorepo build — each has its own `package.json` /
`requirements.txt` and runs independently. Start here:

## 1. Backend first

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: DATABASE_URL (a Supabase Postgres connection string), JWT_SECRET_KEY,
# SMTP_* (for OTP/order emails), and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# if you want admin food-image uploads to work
python -m app.seed        # populates categories + foods + one admin account
uvicorn app.main:app --reload
```

Confirm it's up at http://localhost:8000/docs.

## 2. Customer frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173 — this now talks entirely to the backend above;
there's no mock data left in the app itself.

## 3. Admin dashboard

```bash
cd admin
npm install
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5174 (a different port so you can run both frontends
at once) and log in with the seeded admin account.

## What's real vs. what you'll still need to do

**Fully working end-to-end:** registration + OTP email verification, login,
forgot/reset password, browsing the live menu, cart, checkout (creates a
real order and atomically decrements stock), **real online payment via
Paystack** (Inline popup + server-side verification + webhook backstop),
order tracking, **live per-order chat over WebSocket** (both sides — the
customer app and admin dashboard talk to each other instantly, no
polling), favorites, saved addresses, in-app notifications, profile
editing, admin food/inventory management (including photo upload to
Supabase Storage), admin order management with status + payment updates,
customer list, announcements, and analytics (revenue, orders/day, best
sellers, customer growth, inventory usage).

**Not wired up (flagged, not hidden):**
- SMTP/VAPID push need real credentials in `backend/.env` before emails or
  push notifications actually send (they no-op safely without them)
- Supabase Storage needs a public bucket created and
  `SUPABASE_SERVICE_ROLE_KEY` set before admin image uploads work (also
  no-ops safely with a clear error otherwise)
- Paystack needs real API keys (`PAYSTACK_SECRET_KEY`/`PAYSTACK_PUBLIC_KEY`)
  before online payment works — initializing a payment returns a clear
  error rather than failing silently if these aren't set
- The order status timeline still polls every 8s rather than pushing over
  the WebSocket (only chat messages are pushed live right now)

## A note on "seed" data

`backend/app/seed.py` populates your database with a starting catalog
(matching your original food photos/prices) so the app isn't empty on
first run. It's a one-time script, not something the app depends on at
runtime — after running it once, everything (including future price
changes, restocks, new items) lives in your actual Postgres database and
is only ever read from there by both the API and the frontend.

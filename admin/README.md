# Toyo's Pot — Admin Dashboard

React + Vite + Tailwind admin app for running Toyo's Pot day-to-day. Talks
to the same backend as the customer app (`../backend`), gated to accounts
with `role = admin`.

## Running it

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL pointing at the backend
npm run dev
```

Runs on http://localhost:5174 (a different port from the customer app's
5173, so you can run both at once locally). Log in with the seeded admin
account (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from the backend's
`python -m app.seed` run).

## What's here (mapped to the original brief's "Admin Dashboard" spec)

- **Overview** — today's/weekly/monthly revenue, orders today, pending
  orders, delivered orders, low stock count
- **Foods** — add/edit/archive/unarchive/mark sold out, with photo upload
  (uploads to Supabase Storage — see backend README's Storage section; this
  page will show a clear error if that isn't configured yet rather than
  fail silently)
- **Inventory** — everything currently low-stock or sold out, with inline
  restock; a "today's stock usage" view showing what % of each food's daily
  quantity has sold so far
- **Orders** — filterable by status (or by customer, linked from the
  Customers page), each order opens to status updates (respecting the
  backend's allowed transitions), payment status, full delivery/customer
  details, and a **live chat reply panel** over WebSocket (instant both
  ways, with the customer app — not polling)
- **Customers** — registered users, order count, lifetime spend, a link
  into their order history
- **Announcements** — send a broadcast notification to every customer, with
  the three example messages from the brief as quick-fill suggestions, plus
  a log of what's been sent
- **Analytics** — revenue and order-count charts (14 days), best-selling
  meals by units sold, new-customer growth (30 days), and inventory usage —
  all built with a small dependency-free SVG chart component rather than
  pulling in a charting library for a handful of simple series

## Auth

Uses the same `/auth/login` endpoint as the customer app, but rejects the
login client-side (and doesn't store tokens) if the returned user's `role`
isn't `admin`. This is a UX gate, not a security boundary — every actual
admin endpoint on the backend independently checks the JWT's role via
`get_current_admin`, so a non-admin token is rejected server-side regardless
of what this frontend does.

## Deploy

Same pattern as the customer app: build (`npm run build`), deploy the
`dist/` folder to Vercel (a `vercel.json` SPA rewrite is included), point
`VITE_API_BASE_URL` at the deployed backend, and add this app's deployed
URL to the backend's `CORS_ORIGINS`.

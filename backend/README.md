# Toyo's Pot — Backend API (FastAPI + SQLAlchemy + Supabase)

This is the backend for Toyo's Pot: a single-vendor food ordering API covering
auth, catalog/inventory, checkout, order lifecycle, per-order chat,
notifications (in-app + email + web push), and an admin surface.

> **A note on how this was built:** this backend was written and
> syntax-checked (`python -m py_compile` on every file, plus a static
> import-resolution pass) in a sandbox with no network access, so
> `pip install` / `uvicorn run` / a live Postgres connection could not be
> exercised here. Run `pip install -r requirements.txt` and start the server
> locally as a first step before deploying — see below.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: DATABASE_URL (Supabase), JWT_SECRET_KEY, SMTP_*, VAPID_* (see below)
```

### Database (Supabase)

1. Create a Supabase project.
2. Project Settings → Database → Connection string → URI. Use the
   **Session pooler** connection string for a long-running server like
   Render (the direct connection is fine for local dev).
3. Paste it into `DATABASE_URL` in `.env`.

Tables are created automatically on startup via `Base.metadata.create_all`
(see `app/main.py`). That's fine for getting started; once this is a real
production database, switch to Alembic migrations so schema changes are
tracked and reversible instead of relying on auto-create.

### Seed data

Populates the same categories and foods used by the frontend's mock data, so
the two match once wired together, plus one admin account:

```bash
SEED_ADMIN_EMAIL=admin@toyospot.ng SEED_ADMIN_PASSWORD=<a-real-password> python -m app.seed
```

### SMTP

Any SMTP provider works (Gmail with an App Password, SendGrid SMTP, Postmark,
your own mail server, etc). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`,
`SMTP_PASSWORD`, `SMTP_FROM_EMAIL`. Emails silently no-op with a log warning
if these aren't set, so the rest of the API still works without them during
early development.

### Paystack (online payments)

1. Create a Paystack account, switch to Test mode while developing.
2. Dashboard → Settings → API Keys & Webhooks. Copy the test secret/public
   keys into `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY`.
3. On that same page, add a webhook URL: `https://<your-deployed-api>/webhooks/paystack`
   (Paystack can't reach `localhost`, so this only matters once deployed --
   locally, the `/orders/{id}/pay/verify` call the frontend makes right
   after payment is what confirms it; the webhook is the production-grade
   fallback for when that call never happens, e.g. the tab closes right
   after paying).
4. Go live later by swapping in `sk_live_...` / `pk_live_...` keys and
   re-pointing the webhook at the same URL.

Flow: `POST /orders` creates an order (already covered above); for
`payment_method: "online"` orders, the frontend then calls
`POST /orders/{id}/pay/initialize` to start a Paystack transaction and get
back an `access_code` for Paystack's Inline popup. After the popup reports
success, the frontend calls `POST /orders/{id}/pay/verify`, which
independently re-checks the transaction with Paystack (never trusts the
browser's word for it) before marking `payment_status: paid`. The webhook
does the same confirmation server-to-server as a backstop.

### Web Push (PWA notifications)

Generate a VAPID key pair once:

```bash
pip install pywebpush
python -c "from pywebpush import webpush; from py_vapid import Vapid02; v = Vapid02(); v.generate_keys(); print('done')"
# or use the `web-push` npm CLI: npx web-push generate-vapid-keys
```

Put the public/private keys in `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`. The
frontend service worker fetches the public key from
`GET /push/vapid-public-key` and subscribes via `POST /push/subscribe`.

## Run

```bash
uvicorn app.main:app --reload
```

API docs (Swagger UI) are then at `http://localhost:8000/docs` (Swagger UI
doesn't exercise WebSocket routes, so `/ws/orders/{id}/chat` won't show up
as testable there -- see "Live chat" below for how to test it).

## Live chat (WebSocket)

`GET /ws/orders/{order_id}/chat?token=<jwt access token>` -- both the
customer and admin frontends connect here (see their `src/hooks/useOrderChat.js`)
instead of polling. Authorization matches the REST chat endpoints: the
order's owner or any admin. Messages are plain JSON frames both ways:
send `{"text": "..."}`, receive `{"id", "sender", "text", "created_at"}`
broadcast to everyone currently connected to that order's chat.

No special deployment config is needed for this on Render -- standard web
services proxy WebSocket upgrades by default. If you put another reverse
proxy in front of the API (nginx, Cloudflare in certain modes), make sure
it's configured to pass through `Upgrade: websocket` requests.

## Deploy

- **Render**: `render.yaml` is included — connect the repo, Render reads the
  blueprint, fill in the flagged env vars (`sync: false`) in the dashboard.
- **Supabase**: already your database from setup above.
- **Frontend (Vercel)**: set `VITE_API_BASE_URL` to this service's Render URL
  and add that URL to `CORS_ORIGINS` here.

## Project structure

```
app/
  main.py            FastAPI app, router wiring, CORS, startup
  config.py          Settings (env vars)
  database.py        SQLAlchemy engine/session
  security.py        Password hashing, JWT, refresh/OTP token helpers
  deps.py            get_current_user / get_current_admin dependencies
  models/            SQLAlchemy models (user, catalog, order, chat, misc)
  schemas/           Pydantic request/response models
  services/
    email.py         SMTP sending + branded HTML templates
    otp.py            OTP issue/verify (email verification, password reset)
    orders.py         Checkout: atomic inventory decrement + order creation
    notifications.py  Single entry point for in-app + push + email fan-out
    push.py            Web Push (pywebpush) sending
  routers/
    auth.py, categories.py, foods.py, orders.py, addresses.py,
    favorites.py, notifications.py, push.py         (customer-facing)
    admin_foods.py, admin_categories.py, admin_orders.py,
    admin_customers.py, admin_analytics.py, admin_announcements.py
  templates/emails/base.html   Branded email shell
  seed.py            Populates categories/foods matching the frontend mock data
```

## How inventory & order status actually work

- `Food.quantity_available` is the live count. `POST /orders` locks each
  food row (`SELECT ... FOR UPDATE`) inside the order transaction, checks
  stock, decrements it, and writes the order in one commit — two customers
  checking out for the last two portions of a dish can't both succeed.
- A food with `quantity_available <= 0` is sold out everywhere
  (`Food.is_sold_out`) — there's no separate "sold out" flag to drift out of
  sync with the count.
- Cancelling an order (`PATCH /admin/orders/{id}/status` → `cancelled`)
  restocks its items automatically.
- Order status can only move forward through
  `pending → accepted → preparing → ready → out_for_delivery → delivered`,
  or to `cancelled` from any non-terminal state — enforced server-side in
  `routers/admin_orders.py`, not just in the UI.
- Every status change fans out through `services/notifications.py` to the
  in-app Notification row, a web push, and (for customer-facing statuses) a
  branded email — from one call site, so a status update can't update one
  channel and silently skip another.

## Connecting the frontend

## Frontend integration status

Both frontends (`../frontend` for customers, `../admin` for staff) are
already wired up to this API — nothing here runs on mock data anymore. If
you're extending either app, see their own READMEs for what talks to what.

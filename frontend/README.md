# Toyo's Pot — Frontend

React + Vite + Tailwind PWA for Toyo's Pot, wired to the companion FastAPI
backend (`toyos-pot-api`). Evolved from BiteOnGo's original warm branding.

## Running it

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your running backend
npm run dev
```

Open http://localhost:5173. The backend must be running (see the API
project's README) — every page here now calls it directly; there's no mock
data fallback if it's unreachable, so you'll see loading/error states
instead of content.

```bash
npm run build
npm run preview
```

## What's implemented (against the real API)

- **Storefront**: home (live featured/popular foods), category menu with
  debounced search, food detail, cart (client-side, keyed by real food IDs),
  checkout that posts to `POST /orders` and surfaces stock-conflict errors
  if something sold out between add-to-cart and checkout
- **Real payment**: "Pay online" opens Paystack's Inline popup
  (`src/lib/paystack.js`); on success the app calls the backend to verify
  the charge independently before showing it as paid. Needs
  `PAYSTACK_SECRET_KEY`/`PAYSTACK_PUBLIC_KEY` set on the backend (see its
  README) — until then, initializing payment returns a clear error rather
  than failing silently. "Pay on delivery" needs no payment setup at all.
- **Live chat**: order chat connects over a WebSocket
  (`src/hooks/useOrderChat.js`) for instant delivery both ways, with a
  small live/connecting indicator; falls back to auto-reconnect if the
  connection drops
- **Auth**: register → OTP verify (with resend) → login, JWT access token +
  refresh token stored client-side, automatic silent refresh on a 401,
  forgot/reset password by emailed code
- **Customer dashboard**: real order history, order detail with a live
  status timeline, favorites (persisted server-side, with a heart toggle on
  every food card), saved addresses (full CRUD), real notifications, and a
  profile editor
- **Live inventory**: sold-out / low-stock states come straight from the
  API's `is_sold_out` / `is_low_stock` / `quantity_available` fields
- **PWA push notifications**: `src/sw.js` is a real (not auto-generated)
  service worker handling `push` and `notificationclick` events; the
  Notifications page has an "Enable notifications" opt-in that requests
  permission and registers the subscription with the backend
  (`src/lib/push.js`)

## Environment

```
VITE_API_BASE_URL=http://localhost:8000
```

## Next steps

- **Admin dashboard**: this build is customer-facing only — see the
  companion `../admin` app for order/food/inventory management.
- **VAPID keys**: push notifications silently no-op until the backend has
  `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` set (see the backend README).
- **Order status via WebSocket**: only chat messages are pushed live right
  now; the order status/timeline on this page still polls every 8s. If you
  want that instant too, the backend's chat socket would need to also
  broadcast status-change events (small addition — see
  `backend/app/ws_manager.py`).

## Project structure

```
src/
  components/       shared UI (Navbar, BottomNav, FoodCard, StatusTimeline, ...)
  context/          AuthContext, CartContext, CategoriesContext, FavoritesContext
  hooks/
    useOrderChat.js    WebSocket-backed order chat (history backfill + live updates)
  lib/
    api.js             fetch wrapper: JWT header, auto-refresh-on-401, WS base URL helper
    endpoints.js        one function per backend endpoint, grouped by resource
    paystack.js         Paystack Inline popup wrapper
    push.js             Web Push subscribe/unsubscribe
    format.js           currency/date formatting helpers
  sw.js              custom service worker (precaching + push handling)
  mock/data.js       only what the backend doesn't own: homepage reviews, status labels
  pages/             storefront pages
  pages/dashboard/   customer dashboard pages
```

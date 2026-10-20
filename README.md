# Gaming Lounge — Customer App

Customer-facing frontend for **Quantum Gaming Center**: game lounge room booking, private events (renting a whole branch), play credits top-up, and F&B ordering. Built with **Vue 3 + Vite + Tailwind CSS v4**. Backend: the `game_lounge_be` repo (Go).

---

## Tech Stack

| Technology | Version | Notes |
|---|---|---|
| Vue 3 | ^3.5 | Composition API (`<script setup>`) |
| Vite | ^8.0 | Build tool & dev server |
| Vue Router | ^4.6 | Client-side routing |
| Pinia | ^3.0 | State management |
| Tailwind CSS | ^4.3 | Utility-first styling via the Vite plugin |
| Axios | ^1.16 | HTTP client (cookie auth, `withCredentials`) |
| lucide-vue-next | ^1.0 | Icons (no emoji used as icons) |
| Swiper.js | ^12.1 | Hero banner slider |
| Russo One + Chakra Petch + JetBrains Mono | fontsource | Self-hosted fonts (display / body / data), no Google Fonts |
| Vitest + @vue/test-utils + jsdom | ^4.1 / ^2.4 | Unit & component tests |
| Node.js | 22 (CI), 18 minimum | Runtime |

---

## Commands

```bash
npm run dev        # Dev server → http://localhost:5174
npm run build      # Production build to /dist (fails if VITE_API_URL is empty)
npm run preview    # Preview the build
npm run test       # Unit tests in watch mode
npm run test:run   # Single unit test run (used by CI)
npm run coverage   # Coverage report
```

---

## Setup

```bash
git clone <repo-url>
cd game_lounge_customer
npm install
cp .env.example .env.local   # .env.local is gitignored
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL, e.g. `http://localhost:8080/api`. Required for production builds. |
| `VITE_PAYMENT_HOSTS` | Hosts allowed as invoice redirect targets (comma-separated). Empty = `checkout.xendit.co,checkout-staging.xendit.co`. |
| `VITE_ENABLE_MOCK_PAYMENT` | `true` enables `/payment/mock` (dev/staging only). Leave empty in production. |

Every `VITE_*` value is baked into the browser bundle, so **never put secrets in them**.

The local backend listens on `localhost:8080` by default (`APP_PORT`). If it runs on another port (for example because 8080 is taken), point `VITE_API_URL` at that port and restart `npm run dev`; Vite reads env values only at startup. The login cookie is set by the backend, so the frontend origin must be allowed by the backend's CORS config.

---

## Deploy

- Multi-stage `Dockerfile`: build with `node:22-alpine`, serve with `nginx:1.27-alpine` (port 80).
- `VITE_API_URL` is passed as a **build arg** (set in Coolify), not through a file. The ARG only exists in the builder stage.
- `nginx.conf` sends security headers: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- The frontend depends on the backend API contract. When endpoints change, **deploy the backend first, or together** with the frontend.

### CI (`.github/workflows/ci.yml`)

Runs on every push and PR to `main`: `npm ci` → `npm audit --omit=dev --audit-level=high` → `npm run test:run` → coverage → `npm run build` (with a placeholder `VITE_API_URL`; CI artifacts are not deployed).

---

## Architecture

### Layout & Routing

- `src/main.js` installs Pinia + Router and mounts to `#app`. Components are imported locally; there is no global registration.
- Every page except the auth pages uses `src/layouts/CustomerLayout.vue`: `CustomerNavbar`, `RouterView`, `SiteFooter` (desktop only) and `BottomNav` (below `lg`, with iPhone safe area).
- Breakpoint: the phone layout is used below `lg` (1024px); desktop starts at `lg`.
  - `CustomerNavbar` on phone is a 52px top bar: logo, credits chip, notification bell and avatar menu.
  - From `lg` it adds the center links Home · Booking · My Bookings · Play Credits · Promo.
  - For guests, protected links open `LoginPromptModal` instead of navigating.
- `BottomNav` (phone): Home · My Bookings · **Booking** (raised hexagon in the center) · Credits · Promo. Profile is reached from the avatar menu.
- `src/router/guard.js` → `authGuard` for routes with `meta.requiresAuth`:
  - in-app navigation → opens `LoginPromptModal`, the user stays on the current page;
  - first load from a URL (shared link, returning from the payment gateway) → `/login?redirect=<path>`.
- `src/router/scroll.js` handles scroll position between pages.

### Auth (httpOnly cookie)

- The backend keeps the session in the `customer_token` cookie (HttpOnly, SameSite=Lax, Secure). **The frontend never reads the token.**
- `src/stores/authStore.js` only stores profile data in `localStorage` (`customer_data`) for display. `isLoggedIn` = customer data exists; `isMember` = `customer.type === 'member'`.
- `fetchMe()` validates the session against `GET /customer/me` on app boot. A 401 clears the local state.
- On boot, legacy `localStorage` tokens (`customer_token`, `staff_token`) are removed.

### API Layer (`src/api/`)

`index.js` creates two Axios instances, both with `withCredentials: true` and a 10-second timeout:

- **`api`**: customer endpoints. Response interceptor: **every 401** clears `customer_data` and redirects to `/login?redirect=<current page>`. `LoginView` filters `redirect` through `sanitizeRedirect` (internal paths only, which prevents open redirects).
- **`publicApi`**: public endpoints, no 401 interceptor.

| File | Contents |
|---|---|
| `authApi.js` | Login, me, logout, profile, change password, credits, vouchers, my bookings |
| `bookingApi.js` | Stores, room templates, slots, booking quote, booking initiate, payment status (`by-hold`), event quote & initiate |
| `playCreditsApi.js` | Credit packages, purchase initiate, mock confirm |
| `fnbApi.js` | F&B menu, create order, my orders |
| `bannerApi.js` | Promo banners (list & detail) |
| `roomApi.js` / `storeApi.js` | Room recommendations / branch data |

### Composables (`src/composables/`)

| File | Purpose |
|---|---|
| `useBookingForm.js` | All state and actions for the Booking page (the view and step components only render) |
| `useBookingQuote.js` | Booking price from the server (`GET /public/booking/quote`) |
| `useEventBooking.js` | Private event flow: branch → schedule → details → payment |
| `useHoldConfirmation.js` | Polls payment status after the Xendit redirect |
| `useCart.js` | F&B cart |
| `useFocusTrap.js` | Focus trap for modals and sheets |
| `useToast.js` | Toast singleton (`success` / `error` / `info` / `warning`), rendered by `ToastContainer` |
| `useCheckoutStep.js` | Phone checkout state as `?step=pay` (hardware back returns to the steps; an incomplete form drops the param; scrolls to top) |
| `useMediaQuery.js` | Reactive `matchMedia`; returns `false` without `matchMedia` (jsdom), so tests render the phone layout |
| `useCreditsSummary.js` | Shared total of active credit hours for the navbar chip and Home; one request at a time; stale responses from a previous session are dropped |
| `useCountUp.js` | One-time count-up of a number for display only (accessible labels use the real value; off under reduced motion) |
| `useActiveSession.js` | Home session card: the `ongoing` booking first, otherwise the nearest `upcoming` one |

### Utils (`src/utils/`)

| File | Purpose |
|---|---|
| `payment.js` | `redirectToInvoice` (the only way to an invoice; host is validated), `mockPaymentGuard`, countdown from `expires_at` |
| `security.js` | `sanitizeRedirect`, `safeJsonParse`, `getImgUrl`, payment host allowlist |
| `dates.js` | `localISODate` (do not use `toISOString` for local dates), `dateOnlyExpiryState` |
| `format.js` | `formatRp`, `formatRpShort` (15RB, 1.5JT), `formatDayLabel` (Hari ini / Besok / Sab, 24 Okt), date formats, capacity |
| `fnb.js` | `fnbOrderLink(booking)`: link to F&B ordering for an ongoing booking |
| `slots.js` | Hour slot selection (slots must be consecutive) |
| `voucher.js` | Voucher discount estimate based on the server's `total_price` |
| `radioKeys.js` | Keyboard navigation for radio groups |

---

## Design System: "HUD Tactical"

The full design spec is kept outside the repo (private draft). The rules that matter in code:

- **Tokens:** color, font, shadow, drop-shadow and easing tokens are defined **only** in `@theme` in `src/style.css`. Views never use raw hex values (a test enforces this). The colors are locked: new tokens may only be alpha or gradient variants of the existing ones.
- **Main tokens:** `q-bg`, `q-card`, `q-card2`, `q-border`, `q-primary` (accent), `q-primary-strong` (background of buttons with text, 5.3:1 contrast), `q-primary-l`, `q-gold`, `q-green`, `q-red`, `q-text` / `q-text-2` / `q-text-3`, `surface`, `surface-raised`, `border-subtle`, `focus-ring`.
- **Fonts:**
  - `font-display` = Russo One (titles, big numbers; uppercase);
  - `font-sans` = Chakra Petch (body);
  - `font-mono` = JetBrains Mono (codes, times, HUD labels).
  - Body text is at least 14px. Form labels and hints are at least 12px. Only short decorative HUD labels go below that.
- **Shape:** chamfered corners via `clip-path`. **`clip-path` also clips outlines and outer shadows**, so:
  - Panels and buttons draw the chamfered background on a child (`HudFace`), and the focusable parent stays unclipped and holds the focus ring.
  - Radio/toggle options use the `hud-option` utility. It draws the focus outline *inside* the element (`outline-offset: -4px`) and styles itself from `aria-checked` / `aria-pressed` (`data-solid` gives a solid selected state).
  - Inputs use `hud-input` (16px so iOS Safari does not zoom; never clipped).
- **Utilities in `style.css`:** `hud-cut`, `hud-cut-sm`, `hud-hex`, `hud-label`, `hud-press`, `hud-focus`, `hud-option`, `hud-input`.
- **Motion:**
  - Feedback takes ≤ 200ms and entrances ≤ 300ms, and nothing blocks input.
  - There are no looping effects and no scroll-reveal.
  - Everything is disabled under `prefers-reduced-motion: reduce` (a global rule in `style.css`).
- **Status** is always shown as color + icon + text (`StatusBadge`).

### UI Components (`src/components/ui/`)

- `HudPanel`: chamfered panel. Props: `tag`, `interactive`, `brackets`, `tone`, `cut`.
- `HudFace`: the clipped background used inside panels and buttons.
- `HudLabel`: small mono label.
- `BaseButton`: variants `primary`, `secondary`, `ghost`, `danger`.
- `BaseCard`: alias of `HudPanel`.
- `BaseBadge`.
- `BaseSheet`: bottom sheet on phone, centered dialog from `lg`.
- `BaseSegmented`.
- `BaseSkeleton`.
- `BaseEmptyState`.
- `PageHeader`: the title draws a one-time scan line.
- `SectionHeader`.
- `ResultScreen`: success/failure pages.
- `StatusBadge`.
- `PasswordInput`.

> **Gotchas:**
> - `BaseButton` respects a display class you pass (`class="hidden lg:flex"` works).
> - `BaseBadge` still forces `inline-flex`, so wrap it in a `<div class="hidden lg:block">` to hide it at a breakpoint.

### Multi-step flow pattern (`src/components/flow/`)

Booking, Top Up Credits and Private Event use a **one-screen, sequentially locked flow**. The business requires the order (for Booking: Branch → Room → Date → Time).

- `useFlowSteps(count, current)` gives every step a state: `locked`, `active` or `done`.
  - Steps after the current one are locked: a dashed placeholder says what unlocks them, and Tab skips them.
  - Done steps collapse to a summary with "Ubah".
  - The **last step stays open** after it is complete, so several hours can be picked.
- Changing an earlier step resets the later ones (logic in the composables) and shows a toast ("Ruangan & jam di-reset"). Re-picking the same value resets nothing.
- `FlowStep` renders one step with its rail node. `FlowProgress` shows `n/N` or `READY`.
- **Phone:**
  - `PayBar` sits above `BottomNav`. It shows the live price and "Lanjut"; when Lanjut is disabled, the bar says why ("Lengkapi N langkah lagi").
  - "Lanjut" opens `CheckoutShell mode="screen"` via `?step=pay`, where the final button is "Bayar Sekarang".
- **Desktop:** `CheckoutShell mode="panel"` is a sticky right panel with the summary, the payment options and "Bayar Sekarang".

---

## Payment Flow

```
User submits
   ↓
POST .../initiate → { invoice_url, hold_id | intent_id | event_booking_id, expires_at }
   ↓
redirectToInvoice(invoice_url)   ← host validated against VITE_PAYMENT_HOSTS
   ↓
[Xendit]                                 [/payment/mock, only if VITE_ENABLE_MOCK_PAYMENT=true]
   ↓                                          ↓
webhook to backend                       POST .../mock-confirm
   ↓                                          ↓
/payment/success?hold_id=…               /payment/success?booking_code=…
```

**Booking success page** (`PaymentSuccessView` + `useHoldConfirmation`):

- If the URL carries a valid `booking_code` (mock payment, or paying in full with play credits), the code is shown right away.
- If it only carries `hold_id`, the page polls `GET /customer/bookings/by-hold/:hold_id`:
  - `hold_id` must be a UUID, otherwise no request is made;
  - one request immediately, then every 2 seconds, up to 11 requests (~20 seconds; the backend allows 30 requests/minute);
  - `confirmed` → show the code; `pending` and `expired` → keep polling (`expired` is not final, a late webhook can still confirm);
  - 401 / 404 / 429 → stop; network error / 5xx → retry;
  - limit reached without a code → point the user to My Bookings.
- The page does **not** take the "latest booking" from the list, because the list is sorted by schedule, not by payment time.

---

## Modules

### Room Booking (`/booking`)

Locked steps: Branch → Room → Date → Time, then checkout (`?step=pay` on phone, right panel on desktop).

- The date step shows a 7-day strip ("Hari ini", "Besok", …) plus a calendar cell for later dates.
- Rooms show 4 at a time, with "+N lainnya" for the rest.

- Time slots must be consecutive.
- Prices always come from the server (`GET /public/booking/quote`), including multi-hour packages, happy hour, and flash sales. The on-screen voucher discount is only an estimate; the final amount comes from initiate.
- The payment countdown is computed from `expires_at`.

| Purpose | Endpoint |
|---|---|
| Branches | `GET /public/stores` |
| Room templates | `GET /public/room-templates?store_id=` |
| Room detail (+ facilities) | `GET /public/room-templates/:id` |
| Hourly slots | `GET /public/booking/slots` |
| Price | `GET /public/booking/quote` |
| Vouchers | `GET /customer/vouchers/available` |
| Initiate | `POST /customer/bookings/initiate` |
| Payment status | `GET /customer/bookings/by-hold/:hold_id` |

### Private Event (`/event-booking`)

Rent a whole branch. Locked steps: Branch → Schedule (must be available) → Event Details, then checkout.

- Availability **and** price come from `GET /public/event-booking/quote?store_id&booking_date&start_time&end_time` → `{ duration_hours, price_per_day, total_price, available }`.
- `total_price` is the amount that will be charged (rounded to Rp1,000 on the server), so the frontend does not recompute it.
- Schedule conflicts, including events that cross midnight, are checked on the backend.
- Start time equal to end time is rejected (it is not a 24-hour event).
- A 400 shows the server's message, without a "Coba lagi" (retry) button.
- The pay button is enabled only when `available === true` and `total_price` is present.

| Purpose | Endpoint |
|---|---|
| Quote (price + availability) | `GET /public/event-booking/quote` |
| Initiate | `POST /customer/event-bookings/initiate` |
| Mock confirm | `POST /customer/event-bookings/:id/mock-confirm` |

### Play Credits (`/credits`, `/my-credits`)

| Purpose | Endpoint |
|---|---|
| Packages per branch | `GET /public/play-credits/packages?store_id=` |
| Purchase initiate | `POST /customer/play-credits/purchase/initiate` |
| Mock confirm | `POST /customer/play-credits/purchase/:id/mock-confirm` |
| Active + expiring credits | `GET /customer/credits/expiring` |

Top Up uses locked steps: Branch → Package, then checkout.

`CustomerNavbar` polls `GET /customer/credits/expiring` every 5 minutes for the notification badge. The credits chip (`GET /customer/my-credits`) refreshes on login, on `/payment/success`, `/credits/success` and `/my-credits`.

### F&B (`/fnb-order`, `/my-fnb-orders`)

Order food & drinks for a booking that is in progress (`status = ongoing`). The cart opens in a bottom sheet.

| Purpose | Endpoint |
|---|---|
| Menu | `GET /public/fnb/menu` |
| Create order | `POST /customer/fnb/orders` |
| My orders | `GET /customer/fnb/orders` |

### My Bookings (`/my-bookings`)

- Status filtering and pagination happen on the server: `GET /customer/bookings?page&per_page=20&status=`. `status` values: `upcoming`, `ongoing`, `completed`, `cancelled` (comma-separated allowed).
- The "Muat lagi" (load more) button shows while `meta.page < meta.total_page`.
- Responses for an old filter are discarded once the user switches filters.

### Account

- **Profile** (`/profile`): edit name/WhatsApp and change password.
  - Change password: wrong old password → 400, more than 10 requests/minute → 429; both show the server's `message`.
  - On success, other devices are signed out.
- **Forgot password**: always shows the same message, so it does not reveal whether the email is registered.
- **Promo** (`/promo`): member-only vouchers.
- **Banner** (`/banner/:id`): inactive banners return 404.

---

## Routes

| Path | View | Auth |
|---|---|---|
| `/` | `HomeView` | public |
| `/banner/:id` | `BannerDetailView` | public |
| `/room/:id` | `RoomDetailView` | public |
| `/booking` | `BookingView` | required |
| `/event-booking` | `EventBookingView` | required |
| `/credits`, `/credits/success`, `/credits/failed` | `CreditsView`, `CreditsSuccessView`, `CreditsFailedView` | required |
| `/my-bookings` | `MyBookingsView` | required |
| `/my-credits` | `MyCreditsView` | required |
| `/fnb-order`, `/my-fnb-orders` | `FnbOrderView`, `MyFnbOrdersView` | required |
| `/promo` | `PromoView` | required |
| `/profile` | `ProfileView` | required |
| `/payment/success`, `/payment/failed` | `PaymentSuccessView`, `PaymentFailedView` | required |
| `/payment/mock` | `PaymentMockView` | required + `VITE_ENABLE_MOCK_PAYMENT=true` |
| `/login` | `LoginView` | public |
| `/forgot-password` | `ForgotPasswordView` | public |
| `/reset-password/:token` | `ResetPasswordView` | public |

Bottom nav (phone, below `lg`): Home · My Bookings · Booking (center) · Credits · Promo. Profile is in the avatar menu.

---

## Folder Structure

```
src/
├── api/                  # Axios instances (index.js) + one file per domain
├── assets/               # Logo
├── components/
│   ├── auth/             # AuthShell + AuthBrand (login / forgot / reset password)
│   ├── booking/          # Branch, room, date strip, slot grid, price summary, voucher sheet, payment picker
│   ├── flow/             # Locked-step flow: useFlowSteps, FlowStep, FlowProgress, PayBar, CheckoutShell
│   ├── ui/               # Design system base components (HudPanel, HudFace, HudLabel, Base*)
│   ├── CustomerNavbar.vue
│   ├── BottomNav.vue
│   ├── SiteFooter.vue    # Desktop footer
│   ├── SocialLinks.vue   # Instagram / TikTok / YouTube links (footer + profile)
│   ├── LoginPromptModal.vue
│   └── ToastContainer.vue
├── composables/          # Page logic & shared state
├── layouts/              # CustomerLayout
├── router/               # index.js, guard.js, scroll.js
├── stores/               # authStore (Pinia)
├── utils/                # payment, security, dates, format, fnb, slots, voucher, radioKeys
├── views/                # Pages (+ auth/, banner/)
├── __tests__/            # Unit & component tests (mirrors src/)
├── test/setup.js         # Global test setup: localStorage, window.location stub, clipboard
├── App.vue
├── main.js
└── style.css             # Tailwind + @theme design tokens
```

---

## Testing

```bash
npm run test:run
npm run coverage
```

- Stack: Vitest + jsdom + @vue/test-utils. The time zone is pinned to `TZ=Asia/Jakarta`.
- APIs are mocked per file with `vi.mock('@/api/...')`. Pinia uses `setActivePinia(createPinia())` in `beforeEach`.
- Polling and countdowns are tested with fake timers (`vi.useFakeTimers()`).
- One test scans `src/` to make sure nothing assigns `window.location.href` except `utils/payment.js` and the API interceptor.
- Important fixes are written test-first (TDD) and checked with a mutation check.
- Before pushing, make sure every file is committed (`git status` is clean) and run `npm run test:run`. Committing tests without the views they test turns CI red.

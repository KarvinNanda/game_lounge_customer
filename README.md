# Gaming Lounge — Customer App

Frontend aplikasi customer untuk **Quantum Gaming Center**: booking ruangan game lounge, private event (sewa satu cabang), top up play credits, dan pesan F&B. Dibangun dengan **Vue 3 + Vite + Tailwind CSS v4**. Backend: repo `game_lounge_be` (Go).

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| Vue 3 | ^3.5 | Composition API (`<script setup>`) |
| Vite | ^8.0 | Build tool & dev server |
| Vue Router | ^4.6 | Client-side routing |
| Pinia | ^3.0 | State management |
| Tailwind CSS | ^4.3 | Utility-first styling via Vite plugin |
| Axios | ^1.16 | HTTP client (cookie auth, `withCredentials`) |
| lucide-vue-next | ^1.0 | Icon (tidak memakai emoji sebagai icon) |
| Swiper.js | ^12.1 | Hero banner slider |
| Inter + Space Grotesk | fontsource | Font di-self-host, tanpa Google Fonts |
| Vitest + @vue/test-utils + jsdom | ^4.1 / ^2.4 | Unit & component test |
| Node.js | 22 (CI), minimal 18 | Runtime |

---

## Commands

```bash
npm run dev        # Dev server → http://localhost:5174
npm run build      # Build production ke /dist (gagal kalau VITE_API_URL kosong)
npm run preview    # Preview hasil build
npm run test       # Unit test watch mode
npm run test:run   # Unit test sekali jalan (dipakai CI)
npm run coverage   # Coverage report
```

---

## Setup

```bash
git clone <repo-url>
cd game_lounge_customer
npm install
cp .env.example .env.local   # .env.local di-gitignore
```

| Variabel | Keterangan |
|---|---|
| `VITE_API_URL` | Base URL API, mis. `http://localhost:8080/api`. Wajib saat build production. |
| `VITE_PAYMENT_HOSTS` | Host yang boleh jadi tujuan redirect invoice (pisah koma). Kosong = `checkout.xendit.co,checkout-staging.xendit.co`. |
| `VITE_ENABLE_MOCK_PAYMENT` | `true` = aktifkan `/payment/mock` (dev/staging saja). Production: kosongkan. |

Semua `VITE_*` di-bake ke bundle browser, jadi **jangan isi dengan secret**.

Backend lokal diharapkan jalan di `localhost:8080`. Cookie login di-set oleh backend, jadi origin frontend harus diizinkan di CORS backend.

---

## Deploy

- `Dockerfile` multi-stage: build dengan `node:22-alpine`, serve dengan `nginx:1.27-alpine` (port 80).
- `VITE_API_URL` dikirim sebagai **build arg** (di-set di Coolify), bukan lewat file. ARG hanya ada di stage builder.
- `nginx.conf` mengirim security header: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Frontend bergantung pada kontrak API backend. **Deploy backend lebih dulu, atau bersamaan**, kalau ada perubahan endpoint.

### CI (`.github/workflows/ci.yml`)

Jalan di setiap push dan PR ke `main`: `npm ci` → `npm audit --omit=dev --audit-level=high` → `npm run test:run` → coverage → `npm run build` (dengan `VITE_API_URL` placeholder; artefak CI tidak di-deploy).

---

## Arsitektur

### Layout & Routing

- `src/main.js` memasang Pinia + Router, lalu mount ke `#app`. Komponen di-import lokal, tidak ada global registration.
- Semua halaman (kecuali halaman auth) memakai `src/layouts/CustomerLayout.vue`: `CustomerNavbar` (sticky, desktop nav + bell notifikasi), `RouterView`, dan `BottomNav` (hanya mobile, dengan safe area iPhone).
- `src/router/guard.js` → `authGuard` untuk route ber-`meta.requiresAuth`:
  - navigasi di dalam app → buka `LoginPromptModal`, user tetap di halaman sekarang;
  - load pertama lewat URL (link dibagikan, kembali dari payment gateway) → `/login?redirect=<path>`.
- `src/router/scroll.js` mengatur posisi scroll antar halaman.

### Auth (cookie httpOnly)

- Backend menyimpan sesi di cookie `customer_token` (HttpOnly, SameSite=Lax, Secure). **Frontend tidak pernah membaca token.**
- `src/stores/authStore.js` hanya menyimpan data profil di `localStorage` (`customer_data`) untuk tampilan. `isLoggedIn` = data customer ada; `isMember` = `customer.type === 'member'`.
- `fetchMe()` memvalidasi sesi ke `GET /customer/me` saat app boot. Respons 401 menghapus state lokal.
- Saat boot, token lama era `localStorage` (`customer_token`, `staff_token`) dibersihkan.

### API Layer (`src/api/`)

`index.js` membuat dua instance Axios dengan `withCredentials: true` dan timeout 10 detik:

- **`api`**: untuk endpoint customer. Interceptor response: **setiap 401** menghapus `customer_data` lalu redirect ke `/login?redirect=<halaman asal>`. `LoginView` memfilter nilai `redirect` dengan `sanitizeRedirect` (hanya path internal, mencegah open redirect).
- **`publicApi`**: untuk endpoint public, tanpa interceptor 401.

| File | Isi |
|---|---|
| `authApi.js` | Login, me, logout, profil, ganti password, credits, vouchers, my bookings |
| `bookingApi.js` | Stores, room templates, slot, quote booking, initiate booking, status pembayaran (`by-hold`), quote & initiate event |
| `playCreditsApi.js` | Paket credits, initiate purchase, mock confirm |
| `fnbApi.js` | Menu F&B, buat pesanan, daftar pesanan saya |
| `bannerApi.js` | Banner promo (list & detail) |
| `roomApi.js` / `storeApi.js` | Room recommendations / data cabang |

### Composables (`src/composables/`)

| File | Fungsi |
|---|---|
| `useBookingForm.js` | Semua state + aksi halaman Booking (view dan step component hanya menampilkan) |
| `useBookingQuote.js` | Harga booking dari server (`GET /public/booking/quote`) |
| `useEventBooking.js` | Alur private event: cabang → jadwal → detail → bayar |
| `useHoldConfirmation.js` | Polling status pembayaran setelah redirect Xendit |
| `useCart.js` | Keranjang F&B |
| `useFocusTrap.js` | Focus trap untuk modal/sheet |
| `useToast.js` | Toast singleton (`success` / `error` / `info` / `warning`), dirender oleh `ToastContainer` |

### Utils (`src/utils/`)

| File | Fungsi |
|---|---|
| `payment.js` | `redirectToInvoice` (satu-satunya jalan ke invoice; host divalidasi), `mockPaymentGuard`, countdown dari `expires_at` |
| `security.js` | `sanitizeRedirect`, `safeJsonParse`, `getImgUrl` |
| `dates.js` | `localISODate` (jangan pakai `toISOString` untuk tanggal lokal), `dateOnlyExpiryState` |
| `format.js` | `formatRp`, format tanggal, kapasitas |
| `slots.js` | Pemilihan slot jam (harus berurutan) |
| `voucher.js` | Estimasi potongan voucher dari `total_price` server |
| `radioKeys.js` | Navigasi keyboard untuk radio group |

---

## Design System

- Token warna, font, shadow, dan easing **hanya** didefinisikan di `@theme` pada `src/style.css`. View tidak memakai hex mentah.
- Tema: dark blue. Token utama: `q-bg`, `q-card`, `q-card2`, `q-border`, `q-primary` (aksen), `q-primary-strong` (background tombol berteks, kontras 5.3:1), `q-primary-l`, `q-gold`, `q-green`, `q-red`, `q-text` / `q-text-2` / `q-text-3`, `surface`, `surface-raised`, `border-subtle`, `focus-ring`.
- Font: `font-sans` = Inter Variable, `font-display` = Space Grotesk Variable.
- Animasi dimatikan otomatis untuk `prefers-reduced-motion: reduce` (aturan global di `style.css`).

### Komponen UI (`src/components/ui/`)

`BaseButton`, `BaseCard`, `BaseBadge`, `BaseSheet` (bottom sheet), `BaseSegmented`, `BaseSkeleton`, `BaseEmptyState`, `PageHeader`, `SectionHeader`, `ResultScreen` (halaman sukses/gagal), `StatusBadge`, `PasswordInput`, `RevealOnScroll`.

> **Jebakan:** `BaseButton` selalu memakai `inline-flex`, jadi `class="hidden lg:flex"` di BaseButton tidak menyembunyikannya. Bungkus dengan `<div class="hidden lg:block">`.

### Pola alur multi-langkah

Booking, Credits, dan Private Event memakai **accordion stepper** (`components/booking/BookingStep.vue`): satu langkah terbuka, langkah selesai tampil sebagai ringkasan dengan tombol "Ubah". Di mobile, tombol bayar ada di **bar sticky** di atas `BottomNav`.

---

## Alur Pembayaran

```
User submit
   ↓
POST .../initiate → { invoice_url, hold_id | intent_id | event_booking_id, expires_at }
   ↓
redirectToInvoice(invoice_url)   ← host divalidasi terhadap VITE_PAYMENT_HOSTS
   ↓
[Xendit]                                 [/payment/mock, hanya jika VITE_ENABLE_MOCK_PAYMENT=true]
   ↓                                          ↓
webhook ke backend                       POST .../mock-confirm
   ↓                                          ↓
/payment/success?hold_id=…               /payment/success?booking_code=…
```

**Halaman sukses booking** (`PaymentSuccessView` + `useHoldConfirmation`):

- Kalau URL membawa `booking_code` yang valid (mock payment, atau bayar penuh dengan play credits), kode langsung ditampilkan.
- Kalau hanya membawa `hold_id`, halaman melakukan polling `GET /customer/bookings/by-hold/:hold_id`:
  - `hold_id` harus UUID, kalau tidak, tidak ada request;
  - 1 request langsung, lalu tiap 2 detik, maksimal 11 request (~20 detik; backend membatasi 30 request/menit);
  - `confirmed` → tampilkan kode; `pending` dan `expired` → lanjut polling (`expired` belum final, webhook yang telat masih bisa mengonfirmasi);
  - 401 / 404 / 429 → berhenti; error jaringan / 5xx → coba lagi;
  - batas habis tanpa kode → arahkan ke My Bookings.
- Halaman ini **tidak** mengambil "booking terbaru" dari list, karena list diurutkan berdasarkan jadwal, bukan waktu bayar.

---

## Modul

### Booking Ruangan (`/booking`)

Accordion: Cabang → Ruangan → Tanggal → Jam → Pembayaran.

- Slot jam harus berurutan.
- Harga selalu dari server (`GET /public/booking/quote`), termasuk paket multi-jam, happy hour, dan flash sale. Potongan voucher di layar hanya estimasi; angka final dari initiate.
- Countdown pembayaran dihitung dari `expires_at`.

| Fungsi | Endpoint |
|---|---|
| Cabang | `GET /public/stores` |
| Room templates | `GET /public/room-templates?store_id=` |
| Detail ruangan (+ fasilitas) | `GET /public/room-templates/:id` |
| Slot per jam | `GET /public/booking/slots` |
| Harga | `GET /public/booking/quote` |
| Voucher | `GET /customer/vouchers/available` |
| Initiate | `POST /customer/bookings/initiate` |
| Status pembayaran | `GET /customer/bookings/by-hold/:hold_id` |

### Private Event (`/event-booking`)

Sewa satu cabang penuh. Accordion: Cabang → Jadwal → Detail Event → Pembayaran.

- Ketersediaan **dan** harga dari `GET /public/event-booking/quote?store_id&booking_date&start_time&end_time` → `{ duration_hours, price_per_day, total_price, available }`.
- `total_price` adalah angka yang ditagih (dibulatkan ke Rp1.000 di server), jadi tidak dihitung ulang di frontend.
- Bentrok jadwal, termasuk event yang melewati tengah malam, dicek di backend.
- Jam mulai = jam selesai ditolak (bukan event 24 jam).
- Error 400 menampilkan pesan dari server, tanpa tombol "Coba lagi".
- Tombol bayar aktif hanya jika `available === true` dan `total_price` ada.

| Fungsi | Endpoint |
|---|---|
| Quote (harga + ketersediaan) | `GET /public/event-booking/quote` |
| Initiate | `POST /customer/event-bookings/initiate` |
| Mock confirm | `POST /customer/event-bookings/:id/mock-confirm` |

### Play Credits (`/credits`, `/my-credits`)

| Fungsi | Endpoint |
|---|---|
| Paket per cabang | `GET /public/play-credits/packages?store_id=` |
| Initiate pembelian | `POST /customer/play-credits/purchase/initiate` |
| Mock confirm | `POST /customer/play-credits/purchase/:id/mock-confirm` |
| Credits aktif + expiring | `GET /customer/credits/expiring` |

`CustomerNavbar` polling `GET /customer/credits/expiring` tiap 5 menit untuk badge notifikasi.

### F&B (`/fnb-order`, `/my-fnb-orders`)

Pesan makanan & minuman untuk booking yang sedang berjalan (`status = ongoing`). Keranjang tampil di bottom sheet.

| Fungsi | Endpoint |
|---|---|
| Menu | `GET /public/fnb/menu` |
| Buat pesanan | `POST /customer/fnb/orders` |
| Pesanan saya | `GET /customer/fnb/orders` |

### My Bookings (`/my-bookings`)

- Filter status dan pagination dilakukan di server: `GET /customer/bookings?page&per_page=20&status=`. Nilai `status`: `upcoming`, `ongoing`, `completed`, `cancelled` (bisa dipisah koma).
- Tombol "Muat lagi" muncul selama `meta.page < meta.total_page`.
- Respons dari filter lama dibuang kalau user sudah ganti filter.

### Akun

- **Profil** (`/profile`): ubah nama/WhatsApp dan ganti password.
  - Ganti password: password lama salah → 400, lebih dari 10 request/menit → 429; keduanya menampilkan `message` dari server.
  - Setelah berhasil, perangkat lain dikeluarkan.
- **Lupa password**: selalu menampilkan pesan yang sama, supaya tidak membocorkan apakah email terdaftar.
- **Promo** (`/promo`): voucher khusus member.
- **Banner** (`/banner/:id`): banner nonaktif → 404.

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

Bottom nav (mobile): Home · My Booking · My Credits · Promo · Profil.

---

## Struktur Folder

```
src/
├── api/                  # Axios instance (index.js) + satu file per domain
├── assets/               # Logo
├── components/
│   ├── auth/             # AuthShell (layout halaman login/lupa/reset password)
│   ├── booking/          # Step accordion, slot grid, ringkasan harga, voucher sheet, payment picker
│   ├── ui/               # Komponen dasar design system
│   ├── CustomerNavbar.vue
│   ├── BottomNav.vue
│   ├── LoginPromptModal.vue
│   └── ToastContainer.vue
├── composables/          # Logika halaman & state bersama
├── layouts/              # CustomerLayout
├── router/               # index.js, guard.js, scroll.js
├── stores/               # authStore (Pinia)
├── utils/                # payment, security, dates, format, slots, voucher, radioKeys
├── views/                # Halaman (+ auth/, banner/)
├── __tests__/            # Unit & component test (struktur mengikuti src/)
├── test/setup.js         # Setup global test: localStorage, stub window.location, clipboard
├── App.vue
├── main.js
└── style.css             # Tailwind + @theme design token
```

---

## Testing

```bash
npm run test:run
npm run coverage
```

- Stack: Vitest + jsdom + @vue/test-utils. Zona waktu di-pin ke `TZ=Asia/Jakarta`.
- API di-mock per file dengan `vi.mock('@/api/...')`. Pinia memakai `setActivePinia(createPinia())` di `beforeEach`.
- Polling dan countdown dites dengan fake timers (`vi.useFakeTimers()`).
- Ada test yang memindai `src/` untuk memastikan tidak ada `window.location.href =` selain lewat `redirectToInvoice` / interceptor.
- Perbaikan penting ditulis dengan TDD (test gagal dulu) dan dicek dengan mutation check.
- Sebelum push, pastikan semua file ikut ter-commit (`git status` kosong) lalu jalankan `npm run test:run`. Commit yang hanya membawa test tanpa view-nya membuat CI merah.

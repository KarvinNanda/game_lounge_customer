# Gaming Lounge — Customer App

Frontend aplikasi customer untuk **Quantum Gaming Center**, sebuah platform booking ruangan game lounge berbasis web. Dibangun dengan **Vue 3 + Vite + Tailwind CSS v4**.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| Vue 3 | ^3.5 | Composition API (`<script setup>`) |
| Vite | ^8.0 | Build tool & dev server |
| Vue Router | ^4.6 | Client-side routing |
| Pinia | ^3.0 | State management |
| Tailwind CSS | ^4.3 | Utility-first styling via Vite plugin |
| Axios | ^1.16 | HTTP client |
| Swiper.js | ^12.1 | Hero banner slider |
| Vitest | ^4.1 | Unit testing |
| @vue/test-utils | ^2.4 | Vue component testing |
| Node.js | >=18 | Runtime requirement |

---

## Commands

```bash
npm run dev        # Dev server → http://localhost:5173
npm run build      # Build production ke /dist
npm run preview    # Preview hasil build
npm run test       # Unit test watch mode
npm run test:run   # Unit test sekali jalan (CI)
npm run coverage   # Coverage report
```

---

## Setup

```bash
git clone <repo-url>
cd game_lounge_customer
npm install
```

Buat file `.env` di root:

```env
VITE_API_URL=http://localhost:8080/api
```

---

## Arsitektur

### Entry & Bootstrap

`src/main.js` menginstall Pinia + Router lalu mount App ke `#app`. Tidak ada global component registration — setiap komponen di-import secara lokal di file yang membutuhkannya.

### Single Layout

Semua halaman berbagi satu layout: `src/layouts/CustomerLayout.vue`. Layout ini terdiri dari:
- `<CustomerNavbar />` — sticky top, desktop navigation + bell notifikasi + profile dropdown
- `<RouterView />` — konten halaman, padding bawah `pb-20 md:pb-0` untuk mengakomodasi BottomNav mobile
- `<BottomNav class="md:hidden" />` — navigasi tab bawah, hanya muncul di mobile

`CustomerLayout.vue` juga memanggil `authStore.fetchMe()` di `onMounted` untuk refresh data customer jika sudah login.

### Routing & Auth Guard

`src/router/index.js` memiliki `beforeEach` yang memeriksa `meta.requiresAuth`:
- Jika route butuh auth dan user belum login → redirect ke `/login?redirect=<path>`
- Setelah login berhasil, user diarahkan kembali ke halaman yang semula dituju via query `redirect`

Route tanpa `meta.requiresAuth` (Home, Booking, Credits) bisa diakses siapa saja — namun aksi di dalamnya (submit booking, purchase credits) tetap membutuhkan login dan akan memunculkan `LoginPromptModal`.

### Auth Store

`src/stores/authStore.js` (Pinia composition store) menyimpan `token` + `customer`:

- `authStore.isLoggedIn` → `true` jika token tersedia
- `authStore.isMember` → `true` jika `customer.type === 'member'` (untuk fitur Play Credits)
- `setAuth(token, customerData)` → simpan ke store + `localStorage`
- `logout()` → hapus store + `localStorage`
- `fetchMe()` → `GET /customer/me`, refresh data customer; jika `401` otomatis logout

Token dan data customer di-persist di `localStorage` dengan key `customer_token` dan `customer_data`.

### API Layer

`src/api/index.js` — dua Axios instance:

**`api` (authenticated)** — untuk endpoint yang butuh login:
- `baseURL`: `VITE_API_URL`, fallback ke `http://localhost:8080/api`
- Token JWT dari `localStorage` diinjeksi otomatis di setiap request
- Response `401` → hapus token + `localStorage` + redirect ke `/login`

**`publicApi`** — untuk endpoint publik (tanpa token):
- `baseURL` sama, tidak ada interceptor auth

Setiap domain punya file sendiri di `src/api/`:

| File | Fungsi |
|---|---|
| `authApi.js` | Login, me, logout, update profil, ganti password, credits expiring, my credits, my bookings, vouchers |
| `bookingApi.js` | Availability, stores, room templates, initiate booking, event booking, vouchers for booking |
| `playCreditsApi.js` | Paket credits, initiate purchase, mock confirm |
| `bannerApi.js` | Daftar banner promo |
| `roomApi.js` | Room recommendations, room templates |
| `storeApi.js` | Data cabang |

### Notifikasi Toast

`src/composables/useToast.js` — module-level singleton (bukan `provide/inject`):

```js
import { useToast } from '@/composables/useToast'
const toast = useToast()

toast.success('Booking berhasil!')
toast.error('Gagal memuat data')
toast.info('Sesi kamu akan segera berakhir')
toast.warning('Credits hampir habis')
```

`toasts` adalah `ref([])` di level modul — satu instance yang di-share ke seluruh aplikasi. `ToastContainer.vue` me-render daftar toast ini secara global di `App.vue`.

### Styling — Tailwind CSS v4 Dark Theme

Seluruh aplikasi menggunakan dark theme dengan design tokens yang didefinisikan via `@theme` di `src/style.css`:

| Token | Nilai | Keterangan |
|---|---|---|
| `q-bg` | `#080810` | Background utama |
| `q-card` | `#11111E` | Background card / section |
| `q-card2` | `#181828` | Background input / nested card |
| `q-border` | `#252540` | Warna border |
| `q-primary` | `#7C3AED` | Ungu — aksi utama |
| `q-primary-d` | `#5B21B6` | Ungu gelap — hover state |
| `q-text-2` | `#9CA3AF` | Teks sekunder |
| `q-text-3` | `#6B7280` | Teks tersier / placeholder |
| `q-green` | `#10B981` | Sukses / tersedia |
| `q-red` | `#EF4444` | Error / gagal |
| `q-gold` | `#F59E0B` | Rating / best value |

Semua style view menggunakan utility class Tailwind langsung di template. `<style scoped>` hanya dipakai untuk CSS yang tidak bisa diekspresikan dengan utility (animasi, `appearance: none` pada select, dll).

### Alur Pembayaran

Semua transaksi (booking, credits, event) mengikuti pola yang sama:

```
User submit form
      ↓
POST /initiate → API returns { invoice_url, hold_id / intent_id / event_booking_id }
      ↓
Simpan ID ke sessionStorage → window.location.href = invoice_url
      ↓
  [Xendit — production]          [/payment/mock — testing]
      ↓                                    ↓
Xendit callback ke backend        User klik "Konfirmasi"
      ↓                                    ↓
                    Redirect ke /payment/success atau /payment/failed
```

`PaymentMockView` membaca `type` dari query string (`booking` / `credits` / `event`) dan memanggil endpoint mock-confirm yang sesuai. Setelah berhasil, `sessionStorage` key dibersihkan.

---

## Struktur Folder

```
src/
├── api/
│   ├── index.js              # Axios instance: api (auth) + publicApi (public)
│   ├── authApi.js            # Auth, profil, bookings, credits, vouchers
│   ├── bookingApi.js         # Booking ruangan + event booking
│   ├── playCreditsApi.js     # Paket & pembelian play credits
│   ├── bannerApi.js          # Banner promo
│   ├── roomApi.js            # Room recommendations + templates
│   └── storeApi.js           # Data cabang
│
├── assets/
│   ├── logo.svg              # Logo utama (favicon)
│   └── logo.png              # Logo fallback
│
├── components/
│   ├── CustomerNavbar.vue    # Navbar sticky: nav links + bell notifikasi + profile dropdown
│   ├── BottomNav.vue         # Tab bar mobile (Home, My Booking, Credits, Promo, Profile)
│   ├── ToastContainer.vue    # Render daftar toast notifikasi
│   └── LoginPromptModal.vue  # Modal "login dulu" untuk guest yang klik aksi auth-required
│
├── composables/
│   └── useToast.js           # Toast singleton: success / error / info / warning
│
├── layouts/
│   └── CustomerLayout.vue    # Layout utama: Navbar + RouterView + BottomNav
│
├── router/
│   └── index.js              # Routes + beforeEach auth guard
│
├── stores/
│   └── authStore.js          # Pinia: token, customer, isLoggedIn, isMember, fetchMe
│
├── views/
│   ├── HomeView.vue              # Landing: hero banner, quick actions, rekomendasi ruangan
│   ├── BookingView.vue           # Form booking 5-step (cabang → ruangan → tanggal → slot → bayar)
│   ├── EventBookingView.vue      # Form private event booking (full venue)
│   ├── CreditsView.vue           # Top up play credits (pilih cabang → paket → bayar)
│   ├── CreditsSuccessView.vue    # Halaman sukses top up
│   ├── CreditsFailedView.vue     # Halaman gagal top up
│   ├── MyBookingsView.vue        # Riwayat booking dengan filter status
│   ├── MyCreditsView.vue         # Daftar paket credits aktif + progress pemakaian
│   ├── PromoView.vue             # Daftar voucher tersedia untuk akun
│   ├── ProfileView.vue           # Edit profil & ganti password
│   ├── PaymentMockView.vue       # Simulasi pembayaran (mode testing, pengganti Xendit)
│   ├── PaymentSuccessView.vue    # Konfirmasi pembayaran berhasil
│   ├── PaymentFailedView.vue     # Konfirmasi pembayaran gagal
│   ├── auth/
│   │   ├── LoginView.vue
│   │   ├── ForgotPasswordView.vue
│   │   └── ResetPasswordView.vue
│   └── banner/
│       └── BannerDetailView.vue
│
├── __tests__/                # Unit tests (Vitest)
│   ├── api/
│   ├── components/
│   ├── composables/
│   ├── stores/
│   └── views/
│
├── test/
│   └── setup.js              # Global test setup: clear localStorage, stub window.location
│
├── App.vue                   # Root component: ToastContainer + RouterView
├── main.js                   # Entry point: Pinia + Router + mount
└── style.css                 # Tailwind directives + @theme design tokens
```

---

## Routes

| Path | Komponen | Auth |
|---|---|---|
| `/` | `HomeView` | public |
| `/banner/:id` | `BannerDetailView` | public |
| `/booking` | `BookingView` | public* |
| `/event-booking` | `EventBookingView` | ✅ required |
| `/credits` | `CreditsView` | public* |
| `/credits/success` | `CreditsSuccessView` | public |
| `/credits/failed` | `CreditsFailedView` | public |
| `/my-bookings` | `MyBookingsView` | ✅ required |
| `/my-credits` | `MyCreditsView` | ✅ required |
| `/promo` | `PromoView` | ✅ required |
| `/profile` | `ProfileView` | ✅ required |
| `/payment/success` | `PaymentSuccessView` | public |
| `/payment/failed` | `PaymentFailedView` | public |
| `/payment/mock` | `PaymentMockView` | public |
| `/login` | `LoginView` | public |
| `/forgot-password` | `ForgotPasswordView` | public |
| `/reset-password/:token` | `ResetPasswordView` | public |

> *public artinya halaman bisa dibuka, tapi aksi submit (booking/purchase) akan memunculkan `LoginPromptModal` jika belum login.

---

## Bottom Navigation (Mobile)

```
🏠 Home  |  📅 My Booking  |  💳 Credits  |  🏷️ Promo  |  👤 Profile
```

Semua tab kecuali **Home** membutuhkan login. Jika guest mengetuk tab yang membutuhkan auth, akan di-redirect ke `/login?redirect=<path>`.

---

## Modul Booking Ruangan

Form 5-step dengan progressive reveal — setiap section muncul setelah section sebelumnya diisi.

| Step | Konten |
|---|---|
| 1 – Pilih Cabang | Dropdown cabang + info card (foto, alamat, jam operasional, Google Maps) |
| 2 – Pilih Ruangan | Grid room templates (foto, fasilitas, kapasitas, harga mulai) |
| 3 – Tanggal & Durasi | Date picker + tombol durasi 1–10 jam |
| 4 – Pilih Jam | Grid slot tersedia/penuh `grid-cols-4`, harga per slot |
| 5 – Pembayaran | Ringkasan, toggle Play Credits, voucher picker (bottom sheet), metode bayar |

**Voucher Picker** — tidak ditampilkan inline, melainkan via bottom sheet (`<Teleport to="body">`). Trigger: tombol "Punya voucher?" → sheet slide up → pilih → sheet tutup otomatis. Voucher terpilih ditampilkan sebagai chip compact dengan tombol `✕` untuk membatalkan.

**Kalkulasi diskon voucher:**
- `percentage` → `harga × persen / 100`, di-cap oleh `max_discount` jika ada
- `flat` → `discount_value`, di-cap maksimal sama dengan harga slot

| Fungsi | Endpoint |
|---|---|
| Daftar cabang | `GET /public/stores` |
| Room templates per cabang | `GET /public/room-templates?store_id=` |
| Cek ketersediaan slot | `GET /public/booking/availability` |
| Voucher tersedia | `GET /customer/vouchers/available` |
| Inisiasi booking | `POST /customer/bookings/initiate` |
| Mock confirm | `POST /customer/bookings/:id/mock-confirm` |

---

## Modul Private Event Booking

Booking full venue (seluruh ruangan di 1 cabang) untuk acara.

Form 4-section:
1. Pilih cabang → info card dengan foto store + harga/jam
2. Detail event: nama event + tanggal + jam mulai & selesai (grid 3 kolom)
3. Ketersediaan & harga — deteksi konflik dengan `blocked_ranges` dari API, kalkulasi total
4. Metode pembayaran + CTA

**Deteksi konflik jadwal** — `blocked_ranges[]` di-check dengan overlap logic:
```
startMins < bE && endMins > bS
```
Mendukung event lintas tengah malam (`endMins += 24*60` jika `endMins <= startMins`).

| Fungsi | Endpoint |
|---|---|
| Cek ketersediaan + harga event | `GET /public/event-booking/availability` |
| Inisiasi event booking | `POST /customer/event-bookings/initiate` |
| Mock confirm | `POST /customer/event-bookings/:id/mock-confirm` |

---

## Modul Play Credits

Beli paket jam bermain yang bisa digunakan saat booking.

Form 3-step:
1. Pilih cabang → load paket
2. Pilih paket — kartu kompak (nama, total jam, masa berlaku, harga, harga/jam, badge "Best Value")
3. Ringkasan + metode bayar + info penting

| Fungsi | Endpoint |
|---|---|
| Paket per cabang | `GET /public/play-credits/packages?store_id=` |
| Inisiasi pembelian | `POST /customer/play-credits/purchase/initiate` |
| Mock confirm | `POST /customer/play-credits/purchase/:id/mock-confirm` |
| Credits aktif + expiring | `GET /customer/credits/expiring` |

---

## Modul Notifikasi Bell

`CustomerNavbar` polling `GET /customer/credits/expiring` setiap **5 menit** (`setInterval` di `onMounted`, dibersihkan di `onUnmounted`). Jika ada credits yang akan expired, badge merah muncul di ikon 🔔 dengan jumlah paket. Dropdown menampilkan detail: nama paket, sisa jam, dan waktu expired.

---

## Unit Tests

```bash
npm run test:run   # sekali jalan
npm run coverage   # dengan laporan coverage
```

**124 tests · 11 file · 100% pass**

| File | Deskripsi |
|---|---|
| `__tests__/api/index.test.js` | Axios instance: interceptor token, handler 401, publicApi tanpa auth |
| `__tests__/api/authApi.test.js` | login, getMe, logout, updateProfile, changePassword, getCreditsExpiring |
| `__tests__/api/bannerApi.test.js` | getBanners, getBannerById |
| `__tests__/api/bookingApi.test.js` | availability, stores, room templates, initiate, getMyBookings, getById |
| `__tests__/stores/authStore.test.js` | isLoggedIn, isMember, setAuth, logout, fetchMe, localStorage sync |
| `__tests__/composables/useToast.test.js` | success/error/info/warning, auto-remove, custom duration, singleton |
| `__tests__/components/ToastContainer.test.js` | Render toast berdasarkan type, animasi masuk/keluar |
| `__tests__/components/BottomNav.test.js` | Render tab, auth-guard redirect, active state |
| `__tests__/components/LoginPromptModal.test.js` | v-model show/hide, link redirect dengan query param |
| `__tests__/views/auth/LoginView.test.js` | Form submit, validasi, error handling, redirect setelah login |
| `__tests__/views/HomeView.test.js` | Render banner, quick actions, auth guard pada handleQuickAction |

Stack: **Vitest** + **jsdom** + `vi.mock('@/api/index')` pattern. Pinia stores ditest dengan `setActivePinia(createPinia())` di `beforeEach`. `useToast` menggunakan `vi.resetModules()` per test karena module-level singleton.

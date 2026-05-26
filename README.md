# Quantum Gaming Center — Customer App

Frontend aplikasi customer untuk **Quantum Gaming Center**, sebuah platform booking ruangan game lounge berbasis web. Dibangun dengan Vue 3 + Vite, terhubung ke REST API backend Laravel.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🏠 **Home** | Hero banner slider, quick actions, rekomendasi ruangan |
| 📅 **Booking Ruangan** | Pilih cabang → ruangan → tanggal → slot jam → pembayaran, support voucher |
| 🏟️ **Private Event Booking** | Booking full venue untuk acara, deteksi konflik jadwal |
| 💳 **Top Up Play Credits** | Beli paket jam bermain, digunakan saat booking |
| 📋 **My Bookings** | Riwayat & status booking real-time dengan filter |
| 🎮 **My Credits** | Daftar paket credits aktif + progress pemakaian |
| 🏷️ **Promo / Voucher** | Daftar voucher yang tersedia untuk akun |
| 👤 **Profile** | Edit profil & ganti password |
| 🔔 **Notifikasi** | Alert credits yang akan habis masa berlaku |
| 🔒 **Auth** | Login, Lupa Password, Reset Password |

---

## 🛠️ Tech Stack

| Layer | Library / Tool | Versi |
|---|---|---|
| Framework | [Vue.js](https://vuejs.org/) | `^3.5.34` |
| Build Tool | [Vite](https://vitejs.dev/) | `^8.0.14` |
| Styling | [Tailwind CSS](https://tailwindcss.com/) (v4 — Vite plugin) | `^4.3.0` |
| State Management | [Pinia](https://pinia.vuejs.org/) | `^3.0.4` |
| Routing | [Vue Router](https://router.vuejs.org/) | `^4.6.4` |
| HTTP Client | [Axios](https://axios-http.com/) | `^1.16.1` |
| Slider / Carousel | [Swiper.js](https://swiperjs.com/) | `^12.1.4` |
| Testing | [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/) | `^4.1.7` |
| Coverage | @vitest/coverage-v8 | `^4.1.7` |
| Test DOM | jsdom | `^29.1.1` |

> **Node.js minimum:** v18+

---

## 🚀 Cara Menjalankan Project

### 1. Clone Repository

```bash
git clone https://github.com/<username>/game_lounge_customer.git
cd game_lounge_customer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` di root project (salin dari contoh di bawah):

```env
VITE_API_URL=http://localhost:8080/api
```

> Sesuaikan `VITE_API_URL` dengan URL backend Laravel yang sedang berjalan.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka browser di `http://localhost:5173`

### 5. Build untuk Production

```bash
npm run build
```

Output tersimpan di folder `dist/`.

### 6. Preview Build Production

```bash
npm run preview
```

---

## 🧪 Testing

```bash
# Jalankan semua unit test (watch mode)
npm run test

# Jalankan sekali (CI mode)
npm run test:run

# Jalankan dengan laporan coverage
npm run coverage
```

---

## 📁 Struktur Folder

```
game_lounge_customer/
│
├── public/                     # Static assets (langsung di-serve)
│
├── src/
│   ├── assets/                 # Logo, gambar statis
│   │   ├── logo.svg
│   │   └── logo.png
│   │
│   ├── api/                    # Layer komunikasi ke backend
│   │   ├── index.js            # Axios instance (authenticated + public)
│   │   ├── authApi.js          # Login, logout, profile, voucher, bookings
│   │   ├── bannerApi.js        # Banner promo
│   │   ├── bookingApi.js       # Booking ruangan & event
│   │   ├── playCreditsApi.js   # Paket play credits
│   │   ├── roomApi.js          # Room templates & rekomendasi
│   │   └── storeApi.js         # Data cabang
│   │
│   ├── components/             # Komponen reusable
│   │   ├── CustomerNavbar.vue  # Navbar sticky (desktop) + notifikasi
│   │   ├── BottomNav.vue       # Navigasi bawah (mobile)
│   │   ├── ToastContainer.vue  # Toast notification UI
│   │   └── LoginPromptModal.vue# Modal redirect ke login
│   │
│   ├── composables/
│   │   └── useToast.js         # Composable toast (success / error / info)
│   │
│   ├── layouts/
│   │   └── CustomerLayout.vue  # Layout utama (Navbar + View + BottomNav)
│   │
│   ├── router/
│   │   └── index.js            # Vue Router + route guard (requiresAuth)
│   │
│   ├── stores/
│   │   └── authStore.js        # Pinia store: auth state, token, customer data
│   │
│   ├── views/                  # Halaman-halaman utama
│   │   ├── HomeView.vue                # Landing page
│   │   ├── BookingView.vue             # Form booking ruangan (5 step)
│   │   ├── EventBookingView.vue        # Form booking private event
│   │   ├── CreditsView.vue             # Top up play credits
│   │   ├── CreditsSuccessView.vue      # Konfirmasi top up berhasil
│   │   ├── CreditsFailedView.vue       # Konfirmasi top up gagal
│   │   ├── MyBookingsView.vue          # Riwayat booking
│   │   ├── MyCreditsView.vue           # Daftar credits aktif
│   │   ├── PromoView.vue               # Daftar voucher tersedia
│   │   ├── ProfileView.vue             # Edit profil & ganti password
│   │   ├── PaymentMockView.vue         # Halaman simulasi pembayaran (testing)
│   │   ├── PaymentSuccessView.vue      # Konfirmasi pembayaran berhasil
│   │   ├── PaymentFailedView.vue       # Konfirmasi pembayaran gagal
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   ├── ForgotPasswordView.vue
│   │   │   └── ResetPasswordView.vue
│   │   └── banner/
│   │       └── BannerDetailView.vue
│   │
│   ├── __tests__/              # Unit tests (Vitest)
│   │   ├── api/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   └── views/
│   │
│   ├── test/
│   │   └── setup.js            # Test setup global
│   │
│   ├── App.vue                 # Root component
│   ├── main.js                 # Entry point
│   └── style.css               # Global styles + Tailwind directives
│
├── index.html                  # HTML entry (favicon + app mount)
├── vite.config.js              # Konfigurasi Vite
├── package.json
└── .env                        # Environment variables (tidak di-commit)
```

---

## 🔐 Autentikasi

- Token disimpan di `localStorage` dengan key `customer_token`
- Axios interceptor otomatis menyisipkan `Authorization: Bearer <token>` di setiap request
- Jika response `401`, token dihapus dan user di-redirect ke `/login`
- Route yang membutuhkan login diberi `meta: { requiresAuth: true }` dan diproteksi via `router.beforeEach`

---

## 💳 Alur Pembayaran

```
Booking / Top Up Credits / Event Booking
        ↓
  initiateBooking() → API returns invoice_url
        ↓
  Redirect ke Xendit (production) 
  atau /payment/mock (mode testing)
        ↓
  Konfirmasi → Redirect ke /payment/success
  Batal     → Redirect ke /payment/failed
```

> `PaymentMockView` hanya aktif saat akun Xendit belum terdaftar / mode testing.

---

## 🌐 Environment Variables

| Variable | Keterangan | Default |
|---|---|---|
| `VITE_API_URL` | Base URL backend API | `http://localhost:8080/api` |

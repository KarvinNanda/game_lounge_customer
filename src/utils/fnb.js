// F&B belum masuk scope (keputusan 2026-11-16): semua pintu masuk F&B disembunyikan
// kecuali VITE_ENABLE_FNB=true. Kode halaman F&B tetap ada supaya mudah diaktifkan lagi.
export const isFnbEnabled = () => import.meta.env.VITE_ENABLE_FNB === 'true'

// Route guard untuk /fnb-order dan /my-fnb-orders
export const fnbGuard = () => (isFnbEnabled() ? true : { path: '/' })

// Link ke halaman pesan F&B untuk satu booking (dipakai Home & My Bookings)
export const fnbOrderLink = (b) => ({
  path:  '/fnb-order',
  query: { booking_id: b.id, room_info: `${b.store?.name || ''} — ${b.room?.room_template?.name || ''}` },
})

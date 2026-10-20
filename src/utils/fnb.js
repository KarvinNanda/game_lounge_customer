// Link ke halaman pesan F&B untuk satu booking (dipakai Home & My Bookings)
export const fnbOrderLink = (b) => ({
  path:  '/fnb-order',
  query: { booking_id: b.id, room_info: `${b.store?.name || ''} — ${b.room?.room_template?.name || ''}` },
})

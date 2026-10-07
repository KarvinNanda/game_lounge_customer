// ── Pemilihan slot booking ─────────────────────────────────────────
// Backend mewajibkan selected_slots berurutan per jam (10:00, 11:00, 12:00).
// Fungsi murni di sini menjaga pilihan selalu satu rentang bersambung.

const DAY_MINUTES = 24 * 60

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// true jika `b` tepat satu jam setelah `a` (23:00 → 00:00 ikut dihitung)
const isNextHour = (a, b) => (toMinutes(b) - toMinutes(a) + DAY_MINUTES) % DAY_MINUTES === 60

/**
 * Hitung pilihan slot berikutnya setelah user tap satu slot.
 * - Tap slot terpilih → slot itu dan semua setelahnya dilepas (rentang tetap bersambung)
 * - Tap slot tepat sebelum/sesudah rentang → ditambahkan
 * - Tap slot lain → pilihan dimulai ulang dari slot itu (restarted: true)
 *
 * @param {string[]} selected  rentang saat ini, urut, format "HH:MM"
 * @param {string}   tapped    start_time slot yang di-tap
 * @returns {{ slots: string[], restarted: boolean }}
 */
export const nextSlotSelection = (selected, tapped) => {
  const idx = selected.indexOf(tapped)
  if (idx !== -1) return { slots: selected.slice(0, idx), restarted: false }
  if (selected.length === 0) return { slots: [tapped], restarted: false }

  if (isNextHour(selected[selected.length - 1], tapped)) {
    return { slots: [...selected, tapped], restarted: false }
  }
  if (isNextHour(tapped, selected[0])) {
    return { slots: [tapped, ...selected], restarted: false }
  }
  return { slots: [tapped], restarted: true }
}

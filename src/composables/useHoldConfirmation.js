import { ref, onMounted, onUnmounted } from 'vue'
import { getBookingByHold } from '@/api/bookingApi'

// hold_id dari query URL = input tidak tepercaya; backend memakai UUID
const UUID_RE         = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOOKING_CODE_RE = /^[A-Z0-9-]{4,32}$/i
const INTERVAL_MS     = 2000
const MAX_REQUESTS    = 11 // detik 0, 2, …, 20; batas backend 30 request/menit

/**
 * Menunggu webhook Xendit mengonfirmasi hold lalu mengambil kode booking.
 * state: checking → confirmed | unknown (unknown = arahkan user ke My Bookings).
 * 'expired' bukan akhir: webhook yang telat masih bisa mengonfirmasi, jadi tetap polling sampai batas.
 */
export const useHoldConfirmation = (holdId) => {
  const state       = ref('checking')
  const bookingCode = ref('')

  let timer    = null
  let stopped  = false
  let requests = 0

  const giveUp = () => { state.value = 'unknown' }

  const poll = async () => {
    requests++
    try {
      const { data } = await getBookingByHold(holdId)
      if (stopped) return
      if (data.data?.status === 'confirmed') {
        const code = data.data.booking_code || ''
        if (BOOKING_CODE_RE.test(code)) {
          bookingCode.value = code
          state.value       = 'confirmed'
        } else {
          giveUp()
        }
        return
      }
    } catch (e) {
      if (stopped) return
      // 404: tidak ada / bukan milik kita / sudah dibersihkan. 429: kena rate limit. Mengulang tidak membantu.
      const status = e?.response?.status
      if (status === 404 || status === 429) { giveUp(); return }
      // Error jaringan / 5xx: coba lagi di putaran berikutnya
    }
    if (requests >= MAX_REQUESTS) { giveUp(); return }
    timer = setTimeout(poll, INTERVAL_MS)
  }

  if (typeof holdId !== 'string' || !UUID_RE.test(holdId)) {
    giveUp()
  } else {
    onMounted(poll)
  }

  onUnmounted(() => {
    stopped = true
    clearTimeout(timer)
  })

  return { state, bookingCode }
}

import { ref } from 'vue'
import { getMyBookings } from '@/api/authApi'
import { useAuthStore } from '@/stores/authStore'

const startKey = (b) => `${b.booking_date ?? ''} ${b.start_time ?? ''}`

// Kartu sesi di Home: booking yang sedang berjalan dulu (hanya itu yang bisa pesan F&B),
// kalau tidak ada → booking upcoming terdekat. List API diurutkan terbaru dulu.
export function useActiveSession() {
  const authStore = useAuthStore()
  const session   = ref(null)
  const kind      = ref(null)
  const loading   = ref(false)

  const load = async () => {
    session.value = null
    kind.value    = null
    if (!authStore.isLoggedIn) return

    loading.value = true
    try {
      const { data: ongoing } = await getMyBookings({ status: 'ongoing', page: 1, per_page: 1 })
      if (ongoing.data?.length) {
        session.value = ongoing.data[0]
        kind.value    = 'ongoing'
        return
      }
      const { data: upcoming } = await getMyBookings({ status: 'upcoming', page: 1, per_page: 20 })
      const rows = upcoming.data || []
      if (rows.length) {
        session.value = rows.reduce((min, b) => (startKey(b) < startKey(min) ? b : min))
        kind.value    = 'upcoming'
      }
    } catch {
      session.value = null
      kind.value    = null
    } finally {
      loading.value = false
    }
  }

  load()
  return { session, kind, loading, reload: load }
}

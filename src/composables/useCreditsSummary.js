import { ref } from 'vue'
import { getMyCredits } from '@/api/authApi'
import { useAuthStore } from '@/stores/authStore'

// State dibagi semua pemakai (chip navbar + Home), satu request sekaligus.
const totalHours = ref(0)
const credits    = ref([])
const loading    = ref(false)
let inflight     = null
let seq          = 0 // respons dari sesi sebelumnya (logout → login lain) dibuang

const isActive = (c, now) =>
  Number(c.remaining_hours) > 0 && (!c.expires_at || new Date(c.expires_at).getTime() > now)

export function useCreditsSummary() {
  const authStore = useAuthStore()

  const refresh = () => {
    if (!authStore.isLoggedIn) {
      seq++
      inflight         = null
      loading.value    = false
      totalHours.value = 0
      credits.value    = []
      return Promise.resolve()
    }
    if (inflight) return inflight

    const mySeq = ++seq
    loading.value = true
    inflight = getMyCredits()
      .then(({ data }) => {
        if (mySeq !== seq) return
        const now = Date.now()
        credits.value    = (data.data || []).filter((c) => isActive(c, now))
        totalHours.value = credits.value.reduce((sum, c) => sum + Number(c.remaining_hours), 0)
      })
      .catch(() => {
        if (mySeq !== seq) return
        // Chip & kartu cukup diam (0 jam) — halaman tidak boleh ikut error
        credits.value    = []
        totalHours.value = 0
      })
      .finally(() => {
        if (mySeq !== seq) return
        loading.value = false
        inflight      = null
      })
    return inflight
  }

  return { totalHours, credits, loading, refresh }
}

export const __resetCreditsSummary = () => {
  totalHours.value = 0
  credits.value    = []
  loading.value    = false
  inflight         = null
  seq              = 0
}

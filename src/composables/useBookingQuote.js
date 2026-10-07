import { ref, computed, watch, onScopeDispose } from 'vue'
import { getBookingQuote } from '@/api/bookingApi'

/**
 * Harga booking dari server (GET /public/booking/quote).
 * Dipanggil ulang tiap parameter berubah — di-debounce supaya tap slot beruntun
 * hanya mengirim satu request, dan response lama yang telat datang dibuang.
 *
 * @param {() => object|null} getParams  null = parameter belum lengkap (tidak ada request)
 * @param {{ delay?: number }} [opts]
 */
export const useBookingQuote = (getParams, { delay = 250 } = {}) => {
  const quote   = ref(null)
  const loading = ref(false)
  const error   = ref('')

  let seq   = 0   // nomor request terbaru; response dengan nomor lain = basi
  let timer = null

  const fetchQuote = async (params, mySeq) => {
    try {
      const { data } = await getBookingQuote(params)
      if (mySeq !== seq) return
      quote.value = data.data
      error.value = ''
    } catch (e) {
      if (mySeq !== seq) return
      quote.value = null
      error.value = e?.response?.data?.message || 'Gagal menghitung harga. Coba lagi.'
    } finally {
      if (mySeq === seq) loading.value = false
    }
  }

  watch(getParams, (params) => {
    clearTimeout(timer)
    const mySeq = ++seq
    if (!params) {
      quote.value   = null
      error.value   = ''
      loading.value = false
      return
    }
    loading.value = true
    timer = setTimeout(() => fetchQuote(params, mySeq), delay)
  }, { deep: true, immediate: true })

  onScopeDispose(() => clearTimeout(timer))

  const unavailable = computed(() => quote.value?.available === false)

  // Coba lagi dengan parameter yang sama (mis. setelah timeout jaringan)
  const refresh = () => {
    const params = getParams()
    if (!params) return
    clearTimeout(timer)
    const mySeq = ++seq
    loading.value = true
    fetchQuote(params, mySeq)
  }

  return { quote, loading, error, unavailable, refresh }
}

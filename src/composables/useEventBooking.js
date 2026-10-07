import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { getPublicStores, getEventQuote, initiateEventBooking } from '@/api/bookingApi'
import { redirectToInvoice, rememberPaymentExpiry, INVALID_PAYMENT_LINK } from '@/utils/payment'
import { localISODate } from '@/utils/dates'

const NO_INVOICE   = 'Link pembayaran tidak tersedia. Silakan coba lagi.'
const DAY_MINUTES  = 24 * 60

const toMinutes = (t) => {
  if (!t || t.length < 5) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Private event booking (sewa seluruh cabang): cabang → jadwal → detail → bayar.
 * Harga dan ketersediaan dari GET /public/event-booking/quote. total_price = angka yang ditagih
 * (dibulatkan ke Rp1.000 di server), jadi tidak dihitung ulang di sini.
 */
export const useEventBooking = () => {
  const router    = useRouter()
  const authStore = useAuthStore()
  const toast     = useToast()

  const stores       = ref([])
  const quote        = ref(null)
  const quoteError   = ref('') // pesan 400 dari server (mis. harga cabang belum diatur)
  const availability = ref('idle') // idle | checking | available | conflict | error
  const initiating   = ref(false)
  const bookingError = ref('')

  const today = localISODate()

  const form = reactive({
    storeId:       '',
    eventName:     '',
    date:          '',
    startTime:     '',
    endTime:       '',
    description:   '',
    paymentMethod: '',
  })

  const selectedStore = computed(() => stores.value.find((s) => s.id === form.storeId) ?? null)
  const scheduleReady = computed(() => !!(form.storeId && form.date && form.startTime && form.endTime))

  // Jam mulai = jam selesai dianggap salah input, bukan event 24 jam
  const sameTime      = computed(() => !!form.startTime && form.startTime === form.endTime)
  const durationHours = computed(() => {
    if (!form.startTime || !form.endTime || sameTime.value) return 0
    let mins = toMinutes(form.endTime) - toMinutes(form.startTime)
    if (mins <= 0) mins += DAY_MINUTES // selesai ≤ mulai = melewati tengah malam
    return Math.round((mins / 60) * 10) / 10
  })

  // null = belum ada harga yang valid (belum dicek, bentrok, atau gagal) → tampil "—", bukan Rp 0
  const totalPrice = computed(() =>
    availability.value === 'available' ? quote.value?.total_price ?? null : null)

  const canPay = computed(() =>
    availability.value === 'available'
    && !!form.eventName.trim()
    && !!form.paymentMethod
    && !initiating.value,
  )

  // Jadwal berubah → hasil cek lama tidak berlaku lagi, dan request yang masih jalan dianggap basi
  let checkSeq = 0
  const scheduleKey = () => `${form.storeId}|${form.date}|${form.startTime}|${form.endTime}`
  // flush 'sync': langsung saat jadwal berubah, sebelum pengecekan baru dimulai
  watch(scheduleKey, () => {
    checkSeq++
    availability.value = 'idle'
    quote.value        = null
    quoteError.value   = ''
  }, { flush: 'sync' })

  const checkAvailability = async () => {
    if (!scheduleReady.value || durationHours.value <= 0) return
    const mySeq = ++checkSeq
    availability.value = 'checking'
    quoteError.value   = ''
    try {
      const { data } = await getEventQuote({
        store_id:     form.storeId,
        booking_date: form.date,
        start_time:   form.startTime,
        end_time:     form.endTime,
      })
      if (mySeq !== checkSeq) return // ada pengecekan yang lebih baru / jadwal sudah berubah
      quote.value        = data.data ?? null
      // Hanya available === true yang boleh lanjut bayar; respons tanpa field ini dianggap bentrok
      availability.value = quote.value?.available === true ? 'available' : 'conflict'
    } catch (e) {
      // Jangan menebak "tersedia" saat pengecekan gagal
      if (mySeq !== checkSeq) return
      quote.value        = null
      quoteError.value   = e?.response?.status === 400 ? e.response.data?.message || '' : ''
      availability.value = 'error'
    }
  }

  const fail = (message) => {
    bookingError.value = message
    toast.error(message)
    initiating.value = false
  }

  const handleBookEvent = async () => {
    if (!authStore.isLoggedIn) { router.push('/login'); return }
    if (!form.eventName.trim()) { bookingError.value = 'Nama event wajib diisi'; return }
    initiating.value   = true
    bookingError.value = ''
    try {
      const { data } = await initiateEventBooking({
        store_id:       form.storeId,
        event_name:     form.eventName,
        booking_date:   form.date,
        start_time:     form.startTime,
        end_time:       form.endTime,
        payment_method: form.paymentMethod,
        description:    form.description || undefined,
      })
      const eventId = data.data?.event_booking_id
      const result  = redirectToInvoice(data.data?.invoice_url, () => {
        if (eventId) sessionStorage.setItem('quantum_event_id', eventId)
        rememberPaymentExpiry(data.data?.expires_at)
      })
      // 'redirected': halaman pindah, biarkan tombol tetap "Memproses"
      if (result === 'invalid') fail(INVALID_PAYMENT_LINK)
      if (result === 'none')    fail(NO_INVOICE)
    } catch (e) {
      fail(e?.response?.data?.message || 'Gagal membuat event booking')
    }
  }

  const init = async () => {
    try {
      const { data } = await getPublicStores()
      stores.value = data.data || []
    } catch {
      toast.error('Gagal memuat daftar cabang')
    }
  }

  return {
    stores, form, today, selectedStore, scheduleReady, durationHours, sameTime,
    quote, quoteError, availability, totalPrice, canPay, initiating, bookingError,
    checkAvailability, handleBookEvent, init,
  }
}

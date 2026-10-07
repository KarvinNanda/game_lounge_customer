import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { getPublicStores, checkEventAvailability, initiateEventBooking } from '@/api/bookingApi'
import { redirectToInvoice, rememberPaymentExpiry, INVALID_PAYMENT_LINK } from '@/utils/payment'
import { localISODate } from '@/utils/dates'

const NO_INVOICE   = 'Link pembayaran tidak tersedia. Silakan coba lagi.'
const DAY_MINUTES  = 24 * 60

const toMinutes = (t) => {
  if (!t || t.length < 5) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Rentang [mulai, selesai) dalam menit; selesai ≤ mulai berarti melewati tengah malam
const toRange = (start, end) => {
  const s = toMinutes(start)
  let e   = toMinutes(end)
  if (e <= s) e += DAY_MINUTES
  return [s, e]
}

/**
 * Private event booking (sewa seluruh cabang): cabang → jadwal → detail → bayar.
 * Harga di sini ESTIMASI dari price_per_day — backend belum punya endpoint quote event;
 * angka final dari /customer/event-bookings/initiate.
 */
export const useEventBooking = () => {
  const router    = useRouter()
  const authStore = useAuthStore()
  const toast     = useToast()

  const stores       = ref([])
  const pricePerDay  = ref(0)
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
    const [s, e] = toRange(form.startTime, form.endTime)
    return Math.round(((e - s) / 60) * 10) / 10
  })

  // Dibulatkan ke ribuan, sama seperti perhitungan lama. null = tidak bisa diestimasi
  const estimatedPrice = computed(() =>
    availability.value === 'available' && pricePerDay.value > 0
      ? Math.round((pricePerDay.value / 24) * durationHours.value / 1000) * 1000
      : null,
  )

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
  watch(scheduleKey, () => { checkSeq++; availability.value = 'idle' }, { flush: 'sync' })

  const checkAvailability = async () => {
    if (!scheduleReady.value || durationHours.value <= 0) return
    const mySeq = ++checkSeq
    availability.value = 'checking'
    try {
      const { data } = await checkEventAvailability({ store_id: form.storeId, date: form.date })
      if (mySeq !== checkSeq) return // ada pengecekan yang lebih baru / jadwal sudah berubah
      pricePerDay.value = data.data?.event_price?.price_per_day || 0
      const [start, end] = toRange(form.startTime, form.endTime)
      const blocked = (data.data?.blocked_ranges || []).some((b) => {
        const [bs, be] = toRange(b.start_time, b.end_time)
        return start < be && end > bs
      })
      availability.value = blocked ? 'conflict' : 'available'
    } catch {
      // Jangan menebak "tersedia" saat pengecekan gagal
      if (mySeq === checkSeq) availability.value = 'error'
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
    pricePerDay, availability, estimatedPrice, canPay, initiating, bookingError,
    checkAvailability, handleBookEvent, init,
  }
}

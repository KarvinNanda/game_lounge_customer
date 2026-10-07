import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useBookingQuote } from '@/composables/useBookingQuote'
import { getPublicStores, getPublicRoomTemplates, getBookingSlots, initiateBooking, getMyVouchersForBooking } from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'
import { redirectToInvoice, rememberPaymentExpiry, INVALID_PAYMENT_LINK } from '@/utils/payment'
import { nextSlotSelection } from '@/utils/slots'
import { estimateVoucherDiscount } from '@/utils/voucher'
import { localISODate, parseLocalDate } from '@/utils/dates'

/**
 * State + aksi halaman Booking: cabang → ruangan → tanggal → jam → bayar.
 * View dan komponen step hanya menampilkan; semua panggilan API ada di sini.
 */
export const useBookingForm = () => {
  const router    = useRouter()
  const route     = useRoute()
  const authStore = useAuthStore()
  const toast     = useToast()

  const stores        = ref([])
  const roomTemplates = ref([])
  const hourlySlots   = ref([])
  const selectedSlots = ref([])   // ["10:00","11:00"] — selalu berurutan (utils/slots.js)
  const loadingRooms  = ref(false)
  const loadingSlots  = ref(false)
  const initiating    = ref(false)
  const availableVouchers = ref([])
  const selectedVoucher   = ref(null)

  // Play Credits — validitas per booking
  const allMyCredits     = ref([])   // semua credits milik customer (termasuk yang expired)
  const validCredits     = ref([])   // credits yang valid untuk tanggal + durasi ini
  const selectedCreditId = ref('')
  const loadingCredits   = ref(false)

  // Tanggal lokal, bukan UTC — lihat utils/dates.js
  const today = localISODate()

  const form = reactive({
    storeId:        '',
    roomTemplateId: 0,
    date:           '',
    paymentMethod:  '',
    voucherID:      '',
  })

  // ── Harga dari server (GET /public/booking/quote) ─────────────────
  const {
    quote, loading: quoteLoading, error: quoteError, unavailable: quoteUnavailable, refresh: refreshQuote,
  } = useBookingQuote(() =>
    form.storeId && form.roomTemplateId && form.date && selectedSlots.value.length
      ? {
          store_id:         form.storeId,
          room_template_id: form.roomTemplateId,
          booking_date:     form.date,
          selected_slots:   [...selectedSlots.value],
        }
      : null,
  )

  // Tombol bayar hanya aktif jika harga server sudah ada dan slot masih tersedia
  const quoteReady = computed(() => !!quote.value && !quoteLoading.value && !quoteError.value && !quoteUnavailable.value)

  // Estimasi potongan voucher dari total server. Angka final tetap dari /bookings/initiate.
  const discountAmount = computed(() => estimateVoucherDiscount(selectedVoucher.value, quote.value?.total_price))

  const totalSelectedHours = computed(() => selectedSlots.value.length)

  const currentStep = computed(() => {
    if (!form.storeId)               return 0
    if (!form.roomTemplateId)        return 1
    if (!form.date)                  return 2
    if (!selectedSlots.value.length) return 3
    return 4
  })

  const selectedStore = computed(() => stores.value.find((s) => s.id === form.storeId) ?? null)
  const selectedRoom  = computed(() => roomTemplates.value.find((r) => r.id === form.roomTemplateId) ?? null)

  const storeHours = computed(() => {
    const hours = selectedStore.value?.operating_hours?.[0]
    if (!hours) return '10:00 – 02:00'
    return `${hours.open_time?.slice(0, 5)} – ${hours.close_time?.slice(0, 5)}`
  })

  const canPay = computed(() =>
    !!(form.paymentMethod || selectedCreditId.value) && quoteReady.value && !initiating.value,
  )

  // ── Voucher ───────────────────────────────────────────────────────
  const onSelectVoucher = (voucher) => {
    selectedVoucher.value = voucher || null
    form.voucherID        = voucher?.voucher_id || ''
  }

  // ── Cabang / ruangan / tanggal ────────────────────────────────────
  const onStoreChange = async () => {
    Object.assign(form, { roomTemplateId: 0, date: '' })
    hourlySlots.value       = []
    selectedSlots.value     = []
    availableVouchers.value = []
    onSelectVoucher(null)
    if (!form.storeId) return
    loadingRooms.value = true
    try {
      const { data } = await getPublicRoomTemplates(form.storeId)
      roomTemplates.value = data.data || []
    } catch {
      toast.error('Gagal memuat daftar ruangan')
    } finally {
      loadingRooms.value = false
    }
  }

  const onRoomSelect = (room) => {
    form.roomTemplateId     = room.id
    form.date               = ''
    hourlySlots.value       = []
    selectedSlots.value     = []
    availableVouchers.value = []
    onSelectVoucher(null)
  }

  let slotsSeq = 0 // response jadwal dari tanggal lama yang telat datang diabaikan

  const loadHourlySlots = async () => {
    if (!form.storeId || !form.roomTemplateId || !form.date) return
    const mySeq = ++slotsSeq
    loadingSlots.value  = true
    hourlySlots.value   = []
    selectedSlots.value = []
    try {
      const { data } = await getBookingSlots({
        store_id:         form.storeId,
        room_template_id: form.roomTemplateId,
        date:             form.date,
      })
      if (mySeq !== slotsSeq) return
      hourlySlots.value = data.data?.slots || []

      // Voucher yang berlaku untuk cabang + ruangan ini
      if (authStore.isLoggedIn) {
        try {
          const { data: vData } = await getMyVouchersForBooking({
            store_id:         form.storeId,
            room_template_id: form.roomTemplateId,
          })
          if (mySeq === slotsSeq) availableVouchers.value = vData.data || []
        } catch {}
      }
    } catch {
      if (mySeq === slotsSeq) toast.error('Gagal memuat jadwal')
    } finally {
      if (mySeq === slotsSeq) loadingSlots.value = false
    }
  }

  const onDateChange = () => {
    selectedSlots.value     = []
    availableVouchers.value = []
    onSelectVoucher(null)
    if (form.date && form.roomTemplateId && form.storeId) loadHourlySlots()
  }

  // ── Slot ──────────────────────────────────────────────────────────
  const toggleSlot = (slotStart) => {
    const slot = hourlySlots.value.find((s) => s.start_time === slotStart)
    if (!slot?.available) return
    // Backend mewajibkan slot berurutan — lihat utils/slots.js
    const { slots, restarted } = nextSlotSelection(selectedSlots.value, slotStart)
    selectedSlots.value = slots
    if (restarted) toast.info('Slot harus berurutan, pilihan dimulai ulang')
  }

  const clearAllSlots = () => {
    selectedSlots.value = []
    onSelectVoucher(null)
  }

  const isSlotSelected = (slotStart) => selectedSlots.value.includes(slotStart)

  // ── Play Credits ──────────────────────────────────────────────────
  const hasExpiredCreditsForDate = computed(() => {
    if (!form.date || !authStore.isLoggedIn) return false
    return allMyCredits.value.length > 0 && validCredits.value.length === 0
  })

  const clearCredit = () => {
    selectedCreditId.value = ''
    if (form.paymentMethod === 'play_credits') form.paymentMethod = ''
  }

  const fetchValidCredits = async () => {
    if (!authStore.isLoggedIn || !form.date || selectedSlots.value.length === 0) return
    loadingCredits.value = true
    try {
      const { data } = await getMyCredits()
      allMyCredits.value = data.data || []
      const bookingDate  = parseLocalDate(form.date)

      validCredits.value = allMyCredits.value.filter((cr) =>
        new Date(cr.expires_at) >= bookingDate
        && cr.remaining_hours >= totalSelectedHours.value
        && cr.is_active,
      )
    } catch {
      validCredits.value = []
    } finally {
      loadingCredits.value = false
    }
    // Credits yang dipilih tidak cukup lagi (mis. jam bertambah) → lepas, jangan dikirim ke server
    if (selectedCreditId.value && !validCredits.value.some((cr) => cr.id === selectedCreditId.value)) {
      clearCredit()
    }
  }

  const selectCredit = (cr) => {
    if (selectedCreditId.value === cr.id) {
      clearCredit()
    } else {
      selectedCreditId.value = cr.id
      form.paymentMethod     = 'play_credits'
      onSelectVoucher(null) // voucher tidak bisa digabung dengan credits (UI-nya juga disembunyikan)
    }
  }

  // Validitas credits bergantung pada jumlah jam — cek ulang tiap pilihan slot berubah
  watch(selectedSlots, fetchValidCredits)

  // ── Bayar ─────────────────────────────────────────────────────────
  const handleBooking = async () => {
    if (!authStore.isLoggedIn) { router.push('/login'); return }
    if (selectedSlots.value.length === 0) {
      toast.error('Pilih minimal 1 jam bermain')
      return
    }
    initiating.value = true
    try {
      const { data } = await initiateBooking({
        store_id:         form.storeId,
        room_template_id: form.roomTemplateId,
        booking_date:     form.date,
        selected_slots:   selectedSlots.value,
        payment_method:   form.paymentMethod,
        voucher_id:       form.voucherID          || undefined,
        credit_id:        selectedCreditId.value || undefined,
      })

      if (form.paymentMethod === 'play_credits') {
        // Langsung ke success page — tidak perlu Xendit
        router.push({ name: 'PaymentSuccess', query: { booking_code: data.data?.booking_code } })
        return
      }

      const holdId = data.data?.hold_id
      const result = redirectToInvoice(data.data?.invoice_url, () => {
        if (holdId) sessionStorage.setItem('quantum_hold_id', holdId)
        rememberPaymentExpiry(data.data?.expires_at)
      })
      if (result === 'invalid') toast.error(INVALID_PAYMENT_LINK)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Gagal membuat booking')
    } finally {
      initiating.value = false
    }
  }

  // ── Init (prefill dari RoomDetail: ?store_id&room_template_id) ────
  const init = async () => {
    try {
      const { data } = await getPublicStores()
      stores.value = data.data || []

      if (route.query.store_id) {
        form.storeId = route.query.store_id
        await onStoreChange()
      }
      if (route.query.room_template_id && roomTemplates.value.length) {
        const rt = roomTemplates.value.find((r) => String(r.id) === String(route.query.room_template_id))
        if (rt) onRoomSelect(rt)
      }
    } catch {
      toast.error('Gagal memuat daftar cabang')
    }
  }

  return {
    // state
    stores, roomTemplates, hourlySlots, selectedSlots, form, today,
    loadingRooms, loadingSlots, initiating,
    availableVouchers, selectedVoucher,
    allMyCredits, validCredits, selectedCreditId, loadingCredits,
    // derived
    selectedStore, selectedRoom, storeHours, currentStep, totalSelectedHours,
    quote, quoteLoading, quoteError, quoteUnavailable, quoteReady, refreshQuote,
    discountAmount, hasExpiredCreditsForDate, canPay,
    // actions
    onStoreChange, onRoomSelect, onDateChange, toggleSlot, clearAllSlots, isSlotSelected,
    selectCredit, onSelectVoucher, handleBooking, init,
  }
}

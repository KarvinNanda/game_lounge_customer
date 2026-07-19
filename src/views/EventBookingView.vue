<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-32">

    <div class="mb-4">
      <h1 class="text-2xl font-bold text-white">Private Event Booking</h1>
      <p class="text-[#9CA3AF] text-sm mt-0.5">Booking seluruh gedung untuk acara spesialmu</p>
    </div>

    <!-- Info banner -->
    <div class="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
      <span class="text-xl flex-shrink-0">🏠</span>
      <div class="flex-1 min-w-0">
        <div class="text-white font-bold text-sm">Full Venue Booking</div>
        <div class="text-[#9CA3AF] text-xs mt-0.5">Semua ruangan terblokir selama event berlangsung.</div>
      </div>
    </div>

    <!-- ── SECTION 1: Pilih Cabang ─────────────────────────── -->
    <section class="event-section">
      <div class="section-header">
        <div class="section-num">1</div>
        <div>
          <div class="section-title">Pilih Cabang</div>
          <div class="section-desc">Pilih cabang yang ingin kamu booking untuk event</div>
        </div>
      </div>

      <select v-model="form.storeId" @change="onStoreChange" class="event-select">
        <option value="">-- Pilih Cabang --</option>
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <Transition name="fade">
        <div v-if="selectedStore" class="mt-2 bg-[#181828] border border-[#252540] rounded-xl p-3">
          <div class="flex items-center gap-2.5">
            <img
              v-if="selectedStore.photo_url"
              :src="getImgUrl(selectedStore.photo_url)"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div v-else class="w-12 h-12 rounded-lg bg-[#11111E] flex items-center justify-center text-xl flex-shrink-0">🏢</div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold text-sm">{{ selectedStore.name }}</div>
              <div class="text-[#9CA3AF] text-xs mt-0.5 line-clamp-1">{{ selectedStore.address }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="eventPrice" class="text-[#10B981] text-xs font-semibold">
                  Rp {{ Math.round(eventPrice / 24).toLocaleString('id-ID') }} / jam
                </span>
                <a
                  v-if="selectedStore.link_gmaps"
                  :href="selectedStore.link_gmaps"
                  target="_blank"
                  class="text-[#0282DE] text-xs hover:underline"
                >📍 Maps</a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- ── SECTION 2: Detail Event ─────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.storeId" class="event-section">
        <div class="section-header">
          <div class="section-num">2</div>
          <div>
            <div class="section-title">Detail Event</div>
            <div class="section-desc">Isi informasi event kamu</div>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Nama event -->
          <div>
            <label class="block text-xs text-[#9CA3AF] mb-1.5">Nama Event *</label>
            <input
              v-model="form.eventName"
              type="text"
              placeholder="Contoh: Birthday Party, Tournament PS5"
              class="event-select"
            />
          </div>

          <!-- Tanggal + Jam mulai + Jam selesai (1 row) -->
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-[#9CA3AF] mb-1.5">Tanggal *</label>
              <input
                v-model="form.date"
                type="date"
                :min="today"
                @change="onDateChange"
                class="event-select text-xs"
              />
            </div>
            <div>
              <label class="block text-xs text-[#9CA3AF] mb-1.5">Jam Mulai *</label>
              <input
                v-model="form.startTime"
                type="time"
                @change="recalculatePrice"
                class="event-select"
              />
            </div>
            <div>
              <label class="block text-xs text-[#9CA3AF] mb-1.5">Jam Selesai *</label>
              <input
                v-model="form.endTime"
                type="time"
                @change="recalculatePrice"
                class="event-select"
              />
            </div>
          </div>

          <!-- Deskripsi / catatan untuk admin -->
          <div>
            <label class="block text-xs text-[#9CA3AF] mb-1.5">
              Deskripsi / Info Tambahan (Opsional)
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Contoh: Acara ulang tahun, butuh dekorasi, dll."
              class="event-select resize-none"
            />
          </div>
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 3: Ketersediaan & Harga ─────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.date && form.startTime && form.endTime" class="event-section">
        <div class="section-header">
          <div class="section-num">3</div>
          <div class="section-title">Ketersediaan & Harga</div>
        </div>

        <!-- Conflict warning -->
        <div v-if="hasConflict" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div class="text-red-400 text-sm font-semibold">⚠️ Jam ini sudah ada booking/event lain</div>
          <div class="text-red-300 text-xs mt-0.5">Silakan pilih jam yang lain.</div>
        </div>

        <!-- Available + Price breakdown (weekday/weekend) -->
        <div v-else-if="!hasConflict && pricePreview"
          class="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4">

          <div class="text-[#10B981] text-sm font-semibold mb-3">✅ Tersedia!</div>

          <!-- Badge weekday/weekend -->
          <div
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-3"
            :class="pricePreview.day_type === 'Weekday'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-orange-500/20 text-orange-400'"
          >
            {{ pricePreview.day_type === 'Weekday' ? '📅 Hari Kerja' : '🏖️ Weekend / Hari Libur' }}
          </div>

          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-[#9CA3AF]">Durasi</span>
              <span class="text-white">{{ pricePreview.duration_hours }} Jam</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#9CA3AF]">Harga per Jam</span>
              <span class="text-white">
                Rp {{ Math.round(pricePreview.active_price / 24).toLocaleString('id-ID') }}
              </span>
            </div>
            <div class="flex justify-between border-t border-[#252540] pt-2 mt-1">
              <span class="text-[#9CA3AF] font-medium">Total Estimasi</span>
              <span class="text-[#10B981] font-black text-lg">
                Rp {{ Math.round(pricePreview.total_price).toLocaleString('id-ID') }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 4: Pembayaran ────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="calculatedPrice > 0 && !hasConflict" class="event-section">
        <div class="section-header">
          <div class="section-num">4</div>
          <div>
            <div class="section-title">Pembayaran</div>
          </div>
        </div>

        <div class="space-y-1.5 mb-4">
          <label
            v-for="method in PAYMENT_METHODS"
            :key="method.value"
            class="payment-card"
            :class="form.paymentMethod === method.value ? 'payment-card-active' : ''"
          >
            <input type="radio" v-model="form.paymentMethod" :value="method.value" class="hidden" />
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              :style="{ background: method.bg }"
            >{{ method.icon }}</div>
            <div class="flex-1">
              <div class="text-white font-semibold text-sm">{{ method.label }}</div>
              <div class="text-[#6B7280] text-[11px]">{{ method.desc }}</div>
            </div>
            <div
              class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
              :class="form.paymentMethod === method.value ? 'border-[#10B981] bg-[#10B981]' : 'border-[#252540]'"
            >
              <div v-if="form.paymentMethod === method.value" class="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </label>
        </div>

        <div class="flex items-center gap-1.5 text-[11px] text-[#6B7280] mb-3">
          <span>🛡️</span><span>Transaksi aman & terenkripsi.</span>
        </div>

        <!-- Info paket / description dari admin -->
        <div v-if="eventDescription"
          class="bg-[#0B2350] border border-[#063271] rounded-xl p-3 mb-3">
          <div class="text-[#6B7280] text-xs mb-1">ℹ️ Info Paket</div>
          <p class="text-white text-sm leading-relaxed">{{ eventDescription }}</p>
        </div>

        <!-- Error -->
        <div
          v-if="bookingError"
          class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 text-red-400 text-sm text-center"
        >
          {{ bookingError }}
        </div>

        <button
          @click="handleBookEvent"
          :disabled="!form.paymentMethod || !form.eventName.trim() || initiating"
          class="w-full py-3.5 text-white font-bold rounded-2xl transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2 text-sm"
          style="background: linear-gradient(135deg, #10B981, #059669)"
        >
          <span v-if="initiating">⏳ Memproses...</span>
          <span v-else>Booking Event → {{ formatRp(calculatedPrice) }}</span>
        </button>
      </section>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter }          from 'vue-router'
import { useAuthStore }       from '@/stores/authStore'
import { useToast }           from '@/composables/useToast'
import api                                                                from '@/api/index'
import { getPublicStores, checkEventAvailability, initiateEventBooking } from '@/api/bookingApi'
import { getImgUrl } from '@/utils/security'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const stores           = ref([])
const eventPrice       = ref(0)   // price_per_day from API
const hasConflict      = ref(false)
const calculatedPrice  = ref(0)
const pricePreview     = ref(null) // weekday/weekend price detail dari API
const eventDescription = ref('')   // deskripsi paket dari admin (jika ada)
const initiating       = ref(false)
const bookingError     = ref('')

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  storeId:       '',
  eventName:     '',
  date:          '',
  startTime:     '',
  endTime:       '',
  description:   '',
  paymentMethod: '',
})

const PAYMENT_METHODS = [
  { value: 'qris',    label: 'QRIS',                desc: 'Bayar dengan semua e-wallet',  icon: '⬛', bg: '#1a1a2e' },
  { value: 'ewallet', label: 'E-Wallet',             desc: 'OVO, GoPay, DANA, ShopeePay', icon: '💳', bg: '#0d3b6e' },
  { value: 'va',      label: 'Virtual Account',      desc: 'BCA, Mandiri, BNI, BRI',      icon: '🏦', bg: '#1a3a1a' },
  { value: 'card',    label: 'Kartu Debit / Kredit', desc: 'Visa, Mastercard, JCB',        icon: '💳', bg: '#3a1a0d' },
]

const selectedStore = computed(() => stores.value.find(s => s.id === form.storeId))

const durationHours = computed(() => {
  if (!form.startTime || !form.endTime) return 0
  const [sh, sm] = form.startTime.split(':').map(Number)
  const [eh, em] = form.endTime.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return Math.round(mins / 60 * 10) / 10
})

const onStoreChange = async () => {
  form.date = ''; form.startTime = ''; form.endTime = ''
  calculatedPrice.value = 0; hasConflict.value = false; eventPrice.value = 0
  if (!form.storeId) return
  try {
    const { data } = await checkEventAvailability({ store_id: form.storeId, date: today })
    eventPrice.value = data.data?.event_price?.price_per_day || 0
  } catch {}
}

const onDateChange = () => {
  form.startTime = ''; form.endTime = ''
  calculatedPrice.value = 0; hasConflict.value = false
}

const recalculatePrice = async () => {
  if (!form.storeId || !form.date || !form.startTime || !form.endTime) return
  if (durationHours.value <= 0) return

  pricePreview.value    = null
  eventDescription.value = ''

  try {
    // 1. Conflict check
    const { data }   = await checkEventAvailability({ store_id: form.storeId, date: form.date })
    eventPrice.value  = data.data?.event_price?.price_per_day || 0
    const blocked     = data.data?.blocked_ranges || []

    const startMins = timeToMins(form.startTime)
    let   endMins   = timeToMins(form.endTime)
    if (endMins <= startMins) endMins += 24 * 60

    hasConflict.value = blocked.some(b => {
      const bS = timeToMins(b.start_time)
      let   bE = timeToMins(b.end_time)
      if (bE <= bS) bE += 24 * 60
      return startMins < bE && endMins > bS
    })

    if (hasConflict.value) {
      calculatedPrice.value = 0
      return
    }

    // 2. Fetch weekday/weekend price preview
    const priceRes = await api.get('/event-bookings/preview-price', {
      params: {
        store_id:     form.storeId,
        start_time:   form.startTime,
        end_time:     form.endTime,
        booking_date: form.date,
      },
    })

    const preview          = priceRes.data.data
    pricePreview.value     = preview || null
    calculatedPrice.value  = preview?.total_price || 0
    eventDescription.value = preview?.description || ''
  } catch {
    // fallback: hitung manual dari eventPrice jika preview-price belum ada di backend
    calculatedPrice.value = (!hasConflict.value && eventPrice.value > 0)
      ? Math.round((eventPrice.value / 24 * durationHours.value) / 1000) * 1000
      : 0
  }
}

const handleBookEvent = async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  if (!form.eventName.trim()) {
    bookingError.value = 'Nama event wajib diisi'
    return
  }
  initiating.value  = true
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

    const invoiceURL = data.data?.invoice_url
    const eventId    = data.data?.event_booking_id

    if (invoiceURL) {
      if (eventId) sessionStorage.setItem('quantum_event_id', eventId)
      window.location.href = invoiceURL
    }
  } catch (e) {
    bookingError.value = e?.response?.data?.message || 'Gagal membuat event booking'
    toast.error(bookingError.value)
    initiating.value = false
  }
}

const timeToMins = (t) => {
  if (!t || t.length < 5) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const formatRp = (p) => 'Rp ' + Math.round(p || 0).toLocaleString('id-ID')

onMounted(async () => {
  try {
    const { data } = await getPublicStores()
    stores.value = data.data || []
  } catch {
    toast.error('Gagal memuat daftar cabang')
  }
})
</script>

<style scoped>
.event-section {
  background: #11111E; border: 0.5px solid #252540;
  border-radius: 14px; padding: 14px 16px; margin-bottom: 12px; position: relative;
}

.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

.section-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #10B981; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}

.section-title { font-size: 15px; font-weight: 700; color: white; }
.section-desc  { font-size: 12px; color: #9CA3AF; margin-top: 2px; }

.event-select {
  width: 100%; background: #181828; border: 0.5px solid #252540;
  border-radius: 12px; padding: 12px 14px; color: white;
  font-size: 14px; outline: none; transition: border-color 0.15s; appearance: none;
}
.event-select:focus { border-color: #10B981; }

.payment-card {
  display: flex; align-items: center; gap: 10px;
  background: #181828; border: 0.5px solid #252540;
  border-radius: 12px; padding: 10px 12px; cursor: pointer; transition: all 0.15s;
}
.payment-card:hover    { border-color: #10B981; }
.payment-card-active   { border-color: #10B981; background: rgba(16, 185, 129, 0.08); }

.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-12px); }
.fade-enter-active { transition: opacity 0.2s; }
.fade-enter-from   { opacity: 0; }
</style>

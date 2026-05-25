<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-32">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Booking Ruangan</h1>
      <p class="text-q-text-2 text-sm mt-1">Isi form di bawah untuk booking ruangan favoritmu</p>
    </div>

    <!-- ── STEP INDICATOR ──────────────────────────────────── -->
    <div class="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
      <div v-for="(step, i) in STEPS" :key="i" class="flex items-center gap-2 flex-shrink-0">
        <div class="flex flex-col items-center gap-1">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            :class="currentStep > i
              ? 'bg-q-primary text-white'
              : currentStep === i
                ? 'bg-q-primary text-white ring-2 ring-q-primary/30'
                : 'bg-q-card border border-q-border text-q-text-3'"
          >
            <span v-if="currentStep > i">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-[10px] whitespace-nowrap" :class="currentStep >= i ? 'text-q-primary' : 'text-q-text-3'">
            {{ step }}
          </span>
        </div>
        <div
          v-if="i < STEPS.length - 1"
          class="w-8 h-px mt-[-14px] flex-shrink-0 transition-colors"
          :class="currentStep > i ? 'bg-q-primary' : 'bg-q-border'"
        />
      </div>
    </div>

    <!-- ── SECTION 1: PILIH CABANG ─────────────────────────── -->
    <section class="booking-section">
      <SectionHeader :num="1" title="Pilih Cabang" desc="Pilih cabang Quantum terdekat dari kamu" />

      <select v-model="form.storeId" @change="onStoreChange" class="booking-select">
        <option value="">-- Pilih Cabang --</option>
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <Transition name="fade">
        <div v-if="selectedStore" class="mt-3 bg-q-card2 border border-q-border rounded-xl p-3">
          <div class="flex items-center gap-3">
            <img
              v-if="selectedStore.photo_url"
              :src="getImgUrl(selectedStore.photo_url)"
              class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div v-else class="w-16 h-16 rounded-xl bg-q-card flex items-center justify-center text-2xl flex-shrink-0">🏢</div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold">{{ selectedStore.name }}</div>
              <div class="text-q-text-2 text-xs mt-0.5 line-clamp-2">{{ selectedStore.address }}</div>
              <a
                v-if="selectedStore.link_gmaps"
                :href="selectedStore.link_gmaps"
                target="_blank"
                class="inline-flex items-center gap-1 text-q-primary text-xs mt-1 hover:underline"
              >
                📍 Lihat di Google Maps
              </a>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-q-border flex items-center justify-between text-xs">
            <span class="text-q-text-2">Jam Operasional</span>
            <span class="text-q-green font-medium">Buka {{ storeHours }}</span>
          </div>
        </div>
      </Transition>
    </section>

    <!-- ── SECTION 2: PILIH RUANGAN ────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.storeId" class="booking-section">
        <SectionHeader :num="2" title="Pilih Ruangan" desc="Pilih tipe ruangan sesuai kebutuhanmu" />

        <div v-if="loadingRooms" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-20 bg-q-card rounded-xl animate-pulse" />
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="room in roomTemplates"
            :key="room.id"
            @click="onRoomSelect(room)"
            class="flex items-center gap-3 bg-q-card2 border rounded-xl p-3 cursor-pointer transition-all relative"
            :class="form.roomTemplateId === room.id
              ? 'border-q-primary bg-q-primary/5'
              : 'border-q-border hover:border-q-primary'"
          >
            <img
              v-if="room.image_url"
              :src="getImgUrl(room.image_url)"
              class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div v-else class="w-16 h-16 rounded-xl bg-q-card flex items-center justify-center text-2xl flex-shrink-0">🎮</div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-white font-bold text-sm">{{ room.name }}</span>
                <span class="text-[10px] bg-q-card text-q-text-2 px-2 py-0.5 rounded-full">
                  {{ formatCapacity(room.capacity_min, room.capacity_max) }}
                </span>
              </div>
              <p class="text-q-text-3 text-xs mt-1 line-clamp-1">{{ room.description }}</p>
              <div class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-for="f in room.facilities?.slice(0, 4)"
                  :key="f"
                  class="text-[10px] bg-q-card text-q-text-2 px-1.5 py-0.5 rounded"
                >
                  {{ f }}
                </span>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <div class="text-q-text-3 text-[10px]">Mulai dari</div>
              <div class="text-q-primary font-bold text-sm">{{ formatRp(room.min_price) }}</div>
              <div class="text-q-text-3 text-[10px]">/ jam</div>
            </div>

            <div
              v-if="form.roomTemplateId === room.id"
              class="absolute top-2 right-2 w-5 h-5 bg-q-primary rounded-full flex items-center justify-center text-white text-xs"
            >✓</div>
          </div>
        </div>

        <p class="text-q-text-3 text-xs mt-3 text-center">
          ⓘ Harga dapat berubah sesuai hari dan jam yang dipilih
        </p>
      </section>
    </Transition>

    <!-- ── SECTION 3: TANGGAL & DURASI ─────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.roomTemplateId" class="booking-section">
        <SectionHeader :num="3" title="Tanggal & Durasi" desc="Pilih tanggal dan berapa lama kamu bermain" />

        <div class="mb-4">
          <label class="block text-sm text-q-text-2 mb-1.5">Tanggal Bermain</label>
          <input
            type="date"
            v-model="form.date"
            :min="today"
            @change="onDateChange"
            class="booking-select"
          />
        </div>

        <div>
          <label class="block text-sm text-q-text-2 mb-1.5">Durasi Bermain</label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="h in DURATION_OPTIONS"
              :key="h"
              @click="onDurationSelect(h)"
              class="py-2 rounded-xl text-sm font-medium border transition-all"
              :class="form.durationHours === h
                ? 'bg-q-primary border-q-primary text-white shadow-purple-sm'
                : 'bg-q-card border-q-border text-q-text-2 hover:border-q-primary'"
            >
              {{ h }} Jam
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 4: PILIH JAM ────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.date && form.durationHours" class="booking-section">
        <SectionHeader :num="4" title="Pilih Jam Mulai" desc="Pilih jam bermain yang tersedia" />

        <div v-if="loadingSlots" class="grid grid-cols-3 gap-2">
          <div v-for="i in 9" :key="i" class="h-16 bg-q-card rounded-xl animate-pulse" />
        </div>

        <div v-else-if="slots.length" class="grid grid-cols-3 gap-2">
          <button
            v-for="slot in slots"
            :key="slot.start_time"
            :disabled="!slot.available"
            @click="onSlotSelect(slot)"
            class="py-3 rounded-xl text-center border transition-all relative"
            :class="!slot.available
              ? 'bg-q-card/50 border-q-border/30 opacity-40 cursor-not-allowed'
              : form.startTime === slot.start_time
                ? 'bg-q-primary border-q-primary text-white shadow-purple-sm'
                : 'bg-q-card border-q-border hover:border-q-primary cursor-pointer'"
          >
            <div class="font-bold text-sm">{{ slot.start_time }}</div>
            <div class="text-xs mt-0.5" :class="form.startTime === slot.start_time ? 'text-white/80' : 'text-q-text-3'">
              <template v-if="slot.available">
                {{ slot.price ? formatRp(slot.price) : `s/d ${slot.end_time}` }}
              </template>
              <template v-else>Penuh</template>
            </div>
            <div
              v-if="form.startTime === slot.start_time"
              class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
            >
              <span class="text-q-primary text-[10px] font-bold">✓</span>
            </div>
          </button>
        </div>

        <div v-else class="text-center py-8 text-q-text-3 text-sm">
          Tidak ada slot tersedia untuk tanggal dan durasi ini
        </div>

        <div class="flex gap-4 mt-3 text-xs text-q-text-3">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-card border border-q-border rounded" /> Tersedia
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-card/50 border border-q-border/30 rounded opacity-40" /> Penuh
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-primary rounded" /> Dipilih
          </div>
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 5: PEMBAYARAN ───────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.startTime" class="booking-section">
        <SectionHeader :num="5" title="Pembayaran" desc="Periksa ringkasan dan pilih metode bayar" />

        <!-- Ringkasan -->
        <div class="bg-q-card2 rounded-xl p-4 mb-4 space-y-2.5 text-sm">
          <SummaryRow label="Cabang"      :value="selectedStore?.name" />
          <SummaryRow label="Ruangan"     :value="selectedRoom?.name" />
          <SummaryRow label="Tanggal"     :value="formatDate(form.date)" />
          <SummaryRow
            label="Jam Bermain"
            :value="`${form.startTime} – ${endTime} (${form.durationHours} Jam)`"
          />
          <div class="border-t border-q-border pt-2.5 flex justify-between items-center">
            <span class="text-q-text-2">Total Pembayaran</span>
            <span class="text-q-primary font-bold text-lg">{{ formatRp(estimatedPrice) }}</span>
          </div>
          <div v-if="selectedSlotBreakdown" class="pt-2 border-t border-q-border/50">
            <div class="text-q-primary text-xs">{{ selectedSlotBreakdown }}</div>
          </div>
        </div>

        <!-- Play Credits toggle -->
        <div
          v-if="authStore.isMember && availableCredits > 0"
          class="bg-q-card border border-q-primary/30 rounded-xl p-4 mb-4 flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-full bg-q-primary/20 flex items-center justify-center text-lg">🎮</div>
          <div class="flex-1">
            <div class="text-white font-semibold text-sm">Gunakan Play Credits</div>
            <div class="text-q-text-2 text-xs">Tersedia {{ availableCredits }} jam</div>
          </div>
          <button
            @click="form.useCredits = !form.useCredits"
            class="w-11 h-6 rounded-full transition-all relative"
            :class="form.useCredits ? 'bg-q-primary' : 'bg-q-card2 border border-q-border'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              :class="form.useCredits ? 'right-0.5' : 'left-0.5'"
            />
          </button>
        </div>

        <!-- Metode pembayaran -->
        <div class="mb-4">
          <label class="block text-sm text-q-text-2 mb-2">Metode Pembayaran</label>
          <div class="space-y-2">
            <label
              v-for="method in PAYMENT_METHODS"
              :key="method.value"
              class="flex items-center gap-3 bg-q-card2 border rounded-xl p-3 cursor-pointer transition-all"
              :class="form.paymentMethod === method.value
                ? 'border-q-primary bg-q-primary/5'
                : 'border-q-border hover:border-q-primary'"
            >
              <input type="radio" v-model="form.paymentMethod" :value="method.value" class="hidden" />
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                :style="{ background: method.bg }"
              >{{ method.icon }}</div>
              <div class="flex-1">
                <div class="text-white font-semibold text-sm">{{ method.label }}</div>
                <div class="text-q-text-3 text-xs">{{ method.desc }}</div>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                :class="form.paymentMethod === method.value ? 'border-q-primary bg-q-primary' : 'border-q-border'"
              >
                <div v-if="form.paymentMethod === method.value" class="w-2 h-2 rounded-full bg-white" />
              </div>
            </label>
          </div>
        </div>

        <div class="flex items-start gap-2 text-xs text-q-text-3 mb-5">
          <span>🛡️</span>
          <span>Transaksi aman & terenkripsi. Data pembayaran kamu akan kami jaga kerahasiaannya.</span>
        </div>

        <button
          @click="handleBooking"
          :disabled="!form.paymentMethod || initiating"
          class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl shadow-purple transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          <span v-if="initiating">⏳ Memproses...</span>
          <span v-else>Bayar Sekarang →</span>
        </button>

        <p class="text-center text-q-text-3 text-xs mt-3">
          Kamu akan diarahkan ke halaman pembayaran Xendit yang aman
        </p>
      </section>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { getPublicStores, getPublicRoomTemplates, getAvailability, initiateBooking } from '@/api/bookingApi'

// ── Inline sub-components ──────────────────────────────────────
const SectionHeader = defineComponent({
  props: { num: Number, title: String, desc: String },
  setup(props) {
    return () => h('div', { class: 'flex items-start gap-3 mb-4' }, [
      h('div', { class: 'w-7 h-7 rounded-full bg-q-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5' }, String(props.num)),
      h('div', {}, [
        h('div', { class: 'text-white font-bold text-[15px]' }, props.title),
        h('div', { class: 'text-q-text-2 text-xs mt-0.5' }, props.desc),
      ]),
    ])
  },
})

const SummaryRow = defineComponent({
  props: { label: String, value: String },
  setup(props) {
    return () => h('div', { class: 'flex justify-between gap-4' }, [
      h('span', { class: 'text-q-text-2' }, props.label),
      h('span', { class: 'text-white font-medium text-right' }, props.value ?? '—'),
    ])
  },
})

// ── Constants ──────────────────────────────────────────────────
const STEPS            = ['Cabang', 'Ruangan', 'Tanggal', 'Jam', 'Bayar']
const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const PAYMENT_METHODS  = [
  { value: 'qris',    label: 'QRIS',                desc: 'Bayar cepat dengan semua e-wallet',  icon: '⬛', bg: 'rgba(124,58,237,0.15)' },
  { value: 'ewallet', label: 'E-Wallet',             desc: 'OVO, GoPay, DANA, ShopeePay',        icon: '💳', bg: 'rgba(14,165,233,0.15)'  },
  { value: 'va',      label: 'Virtual Account',      desc: 'BCA, Mandiri, BNI, BRI, Permata',    icon: '🏦', bg: 'rgba(16,185,129,0.15)'  },
  { value: 'card',    label: 'Kartu Debit / Kredit', desc: 'Visa, Mastercard, JCB',              icon: '💳', bg: 'rgba(245,158,11,0.15)'  },
]

// ── Setup ──────────────────────────────────────────────────────
const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const stores        = ref([])
const roomTemplates = ref([])
const slots         = ref([])
const loadingRooms  = ref(false)
const loadingSlots  = ref(false)
const initiating    = ref(false)
const estimatedPrice   = ref(0)
const availableCredits = ref(0)

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  storeId:       '',
  roomTemplateId: 0,
  date:          '',
  durationHours: 0,
  startTime:     '',
  paymentMethod: '',
  useCredits:    false,
})

// ── Computed ───────────────────────────────────────────────────
const currentStep = computed(() => {
  if (!form.storeId)        return 0
  if (!form.roomTemplateId) return 1
  if (!form.date || !form.durationHours) return 2
  if (!form.startTime)      return 3
  return 4
})

const selectedStore = computed(() => stores.value.find((s) => s.id === form.storeId) ?? null)
const selectedRoom  = computed(() => roomTemplates.value.find((r) => r.id === form.roomTemplateId) ?? null)

const storeHours = computed(() => {
  const hours = selectedStore.value?.operating_hours?.[0]
  if (!hours) return '10:00 - 02:00'
  return `${hours.open_time?.slice(0, 5)} - ${hours.close_time?.slice(0, 5)}`
})

const endTime = computed(() => {
  if (!form.startTime || !form.durationHours) return ''
  const [h, m] = form.startTime.split(':').map(Number)
  const total  = h * 60 + m + form.durationHours * 60
  const endH   = Math.floor(total / 60) % 24
  const endM   = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
})

// ── Handlers ───────────────────────────────────────────────────
const onStoreChange = async () => {
  Object.assign(form, { roomTemplateId: 0, date: '', durationHours: 0, startTime: '' })
  slots.value = []
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
  form.roomTemplateId = room.id
  Object.assign(form, { date: '', durationHours: 0, startTime: '' })
  slots.value = []
  estimatedPrice.value = room.min_price || 0
}

const onDateChange = () => {
  form.startTime = ''
  if (form.durationHours) loadAvailability()
}

const onDurationSelect = (h) => {
  form.durationHours = h
  form.startTime = ''
  if (form.date) loadAvailability()
}

const selectedSlotBreakdown = ref('')

const onSlotSelect = (slot) => {
  if (!slot.available) return
  form.startTime              = slot.start_time
  estimatedPrice.value        = slot.price     || 0
  selectedSlotBreakdown.value = slot.breakdown || ''
}

const loadAvailability = async () => {
  if (!form.storeId || !form.roomTemplateId || !form.date || !form.durationHours) return
  loadingSlots.value = true
  slots.value = []
  try {
    const { data } = await getAvailability({
      store_id:         form.storeId,
      room_template_id: form.roomTemplateId,
      date:             form.date,
      duration_hours:   form.durationHours,
    })
    slots.value          = data.data?.slots         || []
    estimatedPrice.value = data.data?.estimated_price || 0
  } catch {
    toast.error('Gagal memuat ketersediaan slot')
  } finally {
    loadingSlots.value = false
  }
}

const handleBooking = async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  initiating.value = true
  try {
    const { data } = await initiateBooking({
      store_id:         form.storeId,
      room_template_id: form.roomTemplateId,
      booking_date:     form.date,
      start_time:       form.startTime,
      duration_hours:   form.durationHours,
      payment_method:   form.paymentMethod,
    })
    const invoiceURL = data.data?.invoice_url
    const holdId     = data.data?.hold_id  // ← ambil hold_id dari response

    if (invoiceURL) {
      // Simpan hold_id ke sessionStorage sebelum redirect
      // (karena setelah redirect ke mock page, data response hilang)
      if (holdId) sessionStorage.setItem('quantum_hold_id', holdId)

      window.location.href = invoiceURL
    }
  } catch (e) {
    const msg = e?.response?.data?.message || 'Gagal membuat booking'
    toast.error(msg)
    if (msg.includes('tersedia')) loadAvailability()
  } finally {
    initiating.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────
const getImgUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_URL?.replace('/api', '') || '') + url
}

const formatRp = (price) =>
  price ? 'Rp ' + Math.round(price).toLocaleString('id-ID') : '—'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

const formatCapacity = (min, max) =>
  min === max ? `${max} Orang` : `Hingga ${max} Orang`

// ── Init ───────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await getPublicStores()
    stores.value = data.data || []
    if (route.query.store_id) form.storeId = route.query.store_id
  } catch {
    toast.error('Gagal memuat daftar cabang')
  }
})
</script>

<style scoped>
.booking-section {
  background: var(--color-q-card);
  border: 1px solid var(--color-q-border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.booking-select {
  width: 100%;
  background: var(--color-q-card2);
  border: 1px solid var(--color-q-border);
  border-radius: 12px;
  padding: 12px 14px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}
.booking-select:focus { border-color: var(--color-q-primary); }
.booking-select option { background: #0F0F1E; }

.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-12px); }
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-enter-from   { opacity: 0; }
</style>

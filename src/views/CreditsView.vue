<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-32">

    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-white">Top Up Play Credits</h1>
      <p class="text-q-text-2 text-sm mt-0.5">Beli paket credits dan hemat lebih banyak saat booking</p>
    </div>

    <!-- Info banner -->
    <div class="bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
      <span class="text-xl flex-shrink-0">🎮</span>
      <div class="flex-1 min-w-0">
        <div class="text-white font-bold text-sm">Main lebih hemat dengan Play Credits!</div>
        <div class="flex gap-3 mt-1 flex-wrap">
          <span class="text-[#9CA3AF] text-[11px]">⚡ Aktif setelah bayar</span>
          <span class="text-[#9CA3AF] text-[11px]">📅 Durasi fleksibel</span>
          <span class="text-[#9CA3AF] text-[11px]">💰 Harga per jam lebih murah</span>
        </div>
      </div>
    </div>

    <!-- ── STEP 1: PILIH CABANG ──────────────────────────────── -->
    <section class="credits-section">
      <div class="section-header">
        <div class="section-num">1</div>
        <div>
          <div class="section-title">Pilih Cabang</div>
          <div class="section-desc">Pilih cabang untuk melihat paket yang tersedia</div>
        </div>
      </div>

      <select v-model="selectedStoreId" @change="onStoreChange" class="credits-select">
        <option value="">-- Pilih Cabang --</option>
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </section>

    <!-- ── STEP 2: PILIH PAKET ────────────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="selectedStoreId" class="credits-section">
        <div class="section-header">
          <div class="section-num">2</div>
          <div>
            <div class="section-title">Pilih Paket Credits</div>
            <div class="section-desc">Paket akan aktif setelah pembayaran berhasil</div>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loadingPackages" class="grid grid-cols-1 gap-3">
          <div v-for="i in 3" :key="i" class="h-24 bg-q-card2 rounded-2xl animate-pulse" />
        </div>

        <!-- Package list -->
        <div v-else-if="packages.length" class="space-y-2">
          <div
            v-for="pkg in packages"
            :key="pkg.id"
            @click="onSelectPackage(pkg)"
            class="package-card"
            :class="selectedPackage?.id === pkg.id ? 'package-card-active' : ''"
          >
            <!-- Best value badge (inline, not absolute) -->
            <div v-if="pkg.is_best_value" class="flex justify-between items-center mb-1.5">
              <span class="bg-[#F59E0B] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                Best Value
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-white font-bold text-sm">{{ pkg.name }}</div>
                <div class="text-q-text-2 text-xs">{{ pkg.total_hours }} Jam · {{ pkg.validity_days }} Hari</div>
              </div>

              <div class="text-right flex-shrink-0">
                <div class="text-white font-black">{{ formatRp(pkg.price) }}</div>
                <div class="text-q-text-3 text-[11px]">{{ formatRp(Math.round(pkg.price / pkg.total_hours)) }}/jam</div>
              </div>

              <!-- Selected indicator -->
              <div class="flex-shrink-0">
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  :class="selectedPackage?.id === pkg.id ? 'border-q-primary bg-q-primary' : 'border-q-border'"
                >
                  <div v-if="selectedPackage?.id === pkg.id" class="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-q-text-3 text-sm">
          Tidak ada paket credits untuk cabang ini
        </div>
      </section>
    </Transition>

    <!-- ── STEP 3: RINGKASAN & PEMBAYARAN ────────────────────── -->
    <Transition name="slide-down">
      <section v-if="selectedPackage" class="credits-section">
        <div class="section-header">
          <div class="section-num">3</div>
          <div>
            <div class="section-title">Ringkasan & Pembayaran</div>
            <div class="section-desc">Periksa detail paket sebelum melanjutkan</div>
          </div>
        </div>

        <!-- Ringkasan paket -->
        <div class="bg-q-card2 rounded-xl p-4 mb-4 space-y-2.5 text-sm">
          <div class="flex justify-between">
            <span class="text-q-text-2">Paket</span>
            <span class="text-white font-semibold">{{ selectedPackage.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Total Jam</span>
            <span class="text-white">{{ selectedPackage.total_hours }} Jam</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Masa Berlaku</span>
            <span class="text-white">{{ selectedPackage.validity_days }} Hari</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Cabang</span>
            <span class="text-white">{{ selectedStoreName }}</span>
          </div>
          <div class="border-t border-q-border pt-2 flex justify-between">
            <span class="text-q-text-2">Total Pembayaran</span>
            <span class="text-q-primary font-black text-lg">{{ formatRp(selectedPackage.price) }}</span>
          </div>
        </div>

        <!-- Info penting -->
        <div class="bg-q-card2 rounded-xl px-3 py-2.5 mb-3">
          <div class="text-[#9CA3AF] text-[11px] font-semibold mb-1.5">ℹ️ Informasi Penting</div>
          <div class="grid grid-cols-1 gap-1">
            <div v-for="item in infoItems" :key="item" class="flex items-start gap-1.5 text-[11px] text-q-text-2">
              <span class="text-q-primary mt-0.5 flex-shrink-0">✓</span>{{ item }}
            </div>
          </div>
        </div>

        <!-- Metode pembayaran -->
        <div class="mb-5">
          <label class="block text-xs text-q-text-2 mb-2 font-medium">Metode Pembayaran</label>
          <div class="space-y-2">
            <label
              v-for="method in paymentMethods"
              :key="method.value"
              class="payment-card"
              :class="paymentMethod === method.value ? 'payment-card-active' : ''"
            >
              <input type="radio" v-model="paymentMethod" :value="method.value" class="hidden" />
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                :style="{ background: method.bg }"
              >
                {{ method.icon }}
              </div>
              <div class="flex-1">
                <div class="text-white font-semibold text-sm">{{ method.label }}</div>
                <div class="text-q-text-3 text-xs">{{ method.desc }}</div>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                :class="paymentMethod === method.value ? 'border-q-primary bg-q-primary' : 'border-q-border'"
              >
                <div v-if="paymentMethod === method.value" class="w-2 h-2 rounded-full bg-white" />
              </div>
            </label>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="purchaseError"
          class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-q-red text-sm text-center"
        >
          {{ purchaseError }}
        </div>

        <!-- Security note -->
        <div class="flex items-center gap-2 text-xs text-q-text-3 mb-4">
          <span>🛡️</span>
          <span>Transaksi aman & terenkripsi.</span>
        </div>

        <!-- CTA -->
        <button
          @click="handlePurchase"
          :disabled="!paymentMethod || purchasing"
          class="w-full py-4 bg-gradient-purple text-white font-bold rounded-2xl shadow-purple hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          <span v-if="purchasing">⏳ Memproses...</span>
          <span v-else>Lanjutkan ke Pembayaran →</span>
        </button>
      </section>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { getPublicStores } from '@/api/bookingApi'
import { getPlayCreditsPackages, initiatePlayCreditsPurchase } from '@/api/playCreditsApi'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const stores          = ref([])
const packages        = ref([])
const selectedStoreId = ref('')
const selectedPackage = ref(null)
const paymentMethod   = ref('')
const loadingPackages = ref(false)
const purchasing      = ref(false)
const purchaseError   = ref('')

const paymentMethods = [
  { value: 'qris',    label: 'QRIS',                desc: 'Bayar cepat dengan semua e-wallet',  icon: '⬛', bg: '#1a1a2e' },
  { value: 'ewallet', label: 'E-Wallet',             desc: 'OVO, GoPay, DANA, ShopeePay',        icon: '💳', bg: '#0d3b6e' },
  { value: 'va',      label: 'Virtual Account',      desc: 'BCA, Mandiri, BNI, BRI, Permata',    icon: '🏦', bg: '#1a3a1a' },
  { value: 'card',    label: 'Kartu Debit / Kredit', desc: 'Visa, Mastercard, JCB',              icon: '💳', bg: '#3a1a0d' },
]

const infoItems = [
  'Paket akan berlaku sejak pembayaran berhasil',
  'Booking menggunakan credits tidak dapat di-reschedule',
  'Paket akan hangus apabila telah melewati masa berlaku',
  'Paket tidak dapat direfund dengan alasan apapun',
]

const selectedStoreName = computed(() =>
  stores.value.find(s => s.id === selectedStoreId.value)?.name || ''
)

const onStoreChange = async () => {
  selectedPackage.value = null
  paymentMethod.value   = ''
  purchaseError.value   = ''
  packages.value        = []
  if (!selectedStoreId.value) return

  loadingPackages.value = true
  try {
    const { data } = await getPlayCreditsPackages(selectedStoreId.value)
    packages.value = data.data || []
  } catch {
    toast.error('Gagal memuat paket credits')
  } finally {
    loadingPackages.value = false
  }
}

const onSelectPackage = (pkg) => {
  selectedPackage.value = pkg
  paymentMethod.value   = ''
  purchaseError.value   = ''
  setTimeout(() => {
    document.querySelector('.credits-section:last-child')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

const handlePurchase = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  purchasing.value    = true
  purchaseError.value = ''
  try {
    const { data } = await initiatePlayCreditsPurchase({
      package_id:     selectedPackage.value.id,
      store_id:       selectedStoreId.value,
      payment_method: paymentMethod.value,
    })

    const invoiceURL = data.data?.invoice_url
    const intentId   = data.data?.intent_id

    if (invoiceURL) {
      if (intentId) sessionStorage.setItem('quantum_intent_id', intentId)
      window.location.href = invoiceURL
    }
  } catch (e) {
    purchaseError.value = e?.response?.data?.message || 'Gagal membuat transaksi'
    purchasing.value    = false
  }
}

const formatRp = (price) =>
  'Rp ' + Math.round(price || 0).toLocaleString('id-ID')

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
.credits-section {
  background: #11111E;
  border: 0.5px solid #252540;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  position: relative;
}

.section-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }

.section-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #7C3AED; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}

.section-title { font-size: 15px; font-weight: 700; color: white; }
.section-desc  { font-size: 12px; color: #9CA3AF; margin-top: 2px; }

.credits-select {
  width: 100%; background: #181828;
  border: 0.5px solid #252540; border-radius: 12px;
  padding: 12px 14px; color: white; font-size: 14px;
  outline: none; transition: border-color 0.15s; appearance: none;
}
.credits-select:focus { border-color: #7C3AED; }

.package-card {
  background: #181828; border: 0.5px solid #252540;
  border-radius: 12px; padding: 12px 14px;
  cursor: pointer; transition: all 0.15s; position: relative;
}
.package-card:hover    { border-color: #7C3AED; }
.package-card-active   { border-color: #7C3AED; background: rgba(124, 58, 237, 0.08); }

.payment-card {
  display: flex; align-items: center; gap: 12px;
  background: #181828; border: 0.5px solid #252540;
  border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.15s;
}
.payment-card:hover  { border-color: #7C3AED; }
.payment-card-active { border-color: #7C3AED; background: rgba(124, 58, 237, 0.08); }

.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-12px); }
</style>

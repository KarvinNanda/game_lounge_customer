<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-44 lg:pb-10">
    <PageHeader title="Top Up Play Credits" subtitle="Beli paket jam bermain, lebih hemat per jam" />

    <ul class="mb-5 flex flex-wrap gap-2 text-xs text-q-text-2">
      <li v-for="perk in PERKS" :key="perk.label" class="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
        <component :is="perk.icon" class="size-3.5 text-q-primary-l" aria-hidden="true" /> {{ perk.label }}
      </li>
    </ul>

    <div class="space-y-3">
      <BookingStep
        v-for="(step, i) in steps"
        :key="step.title"
        data-step
        :data-open="openStep === i"
        :index="i + 1"
        :title="step.title"
        :summary="step.summary"
        :open="openStep === i"
        :done="currentStep > i"
        :cancelable="editingStep === i"
        @edit="editingStep = i"
        @cancel="editingStep = null"
      >
        <BranchStep v-if="i === 0" :stores="stores" :model-value="selectedStoreId" @select="chooseStore" />

        <template v-else-if="i === 1">
          <div v-if="loadingPackages" class="grid gap-2 sm:grid-cols-2" aria-busy="true">
            <BaseSkeleton v-for="n in 4" :key="n" class="h-24" />
          </div>
          <p v-else-if="!packages.length" class="py-6 text-center text-sm text-q-text-3">Belum ada paket di cabang ini.</p>
          <div v-else role="radiogroup" aria-label="Paket credits" class="grid gap-2 sm:grid-cols-2" @keydown="onRadioKeydownManual">
            <button
              v-for="(pkg, n) in packages"
              :key="pkg.id"
              type="button"
              role="radio"
              :aria-checked="selectedPackage?.id === pkg.id"
              :tabindex="radioTabindex(selectedPackage?.id === pkg.id, n, packages.some((p) => p.id === selectedPackage?.id))"
              class="relative rounded-xl border p-4 text-left cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
              :class="selectedPackage?.id === pkg.id ? 'border-q-primary bg-q-primary/10' : 'border-border-subtle hover:border-q-primary/60'"
              @click="choosePackage(pkg)"
            >
              <BaseBadge v-if="pkg.is_best_value" tone="gold" class="mb-2"><Sparkles class="size-3" aria-hidden="true" /> Terbaik</BaseBadge>
              <span class="block text-sm font-semibold text-q-text">{{ pkg.name }}</span>
              <span class="block text-xs text-q-text-3">{{ pkg.total_hours }} jam · berlaku {{ pkg.validity_days }} hari</span>
              <span class="mt-2 block font-display text-lg font-semibold text-q-text tabular-nums">{{ formatRp(pkg.price) }}</span>
              <span class="block text-xs text-q-gold">{{ formatRp(pkg.price / pkg.total_hours) }} / jam</span>
            </button>
          </div>
        </template>

        <div v-else class="space-y-4">
          <dl class="space-y-1.5 rounded-xl bg-surface-raised/50 p-3 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right text-q-text">{{ row.value }}</dd>
            </div>
          </dl>

          <div>
            <p class="mb-2 text-xs font-medium text-q-text-2">Metode pembayaran</p>
            <PaymentMethodPicker v-model="paymentMethod" />
          </div>

          <details class="rounded-xl bg-surface-raised/50 p-3 text-xs text-q-text-2">
            <summary class="cursor-pointer font-semibold text-q-text">Ketentuan paket</summary>
            <ul class="mt-2 space-y-1">
              <li v-for="item in TERMS" :key="item" class="flex gap-1.5"><Check class="size-3.5 shrink-0 text-q-green" aria-hidden="true" />{{ item }}</li>
            </ul>
          </details>

          <p v-if="purchaseError" role="alert" class="rounded-xl bg-q-red/10 p-3 text-center text-sm text-q-red">{{ purchaseError }}</p>

          <!-- Wrapper: `hidden` di BaseButton kalah oleh inline-flex miliknya -->
          <div class="hidden lg:block">
            <BaseButton size="lg" block :disabled="!canPay" :loading="purchasing" @click="handlePurchase">
              {{ purchasing ? 'Memproses...' : 'Bayar Sekarang' }}
            </BaseButton>
          </div>
        </div>
      </BookingStep>
    </div>

    <!-- Bar bayar sticky (mobile), di atas BottomNav -->
    <div
      v-if="selectedPackage"
      data-pay-bar
      class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 md:pb-[env(safe-area-inset-bottom)] z-40 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl lg:hidden"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs text-q-text-3">Total</p>
          <p class="font-display text-lg font-semibold text-q-text tabular-nums">{{ formatRp(selectedPackage.price) }}</p>
        </div>
        <BaseButton size="lg" :disabled="!canPay" :loading="purchasing" @click="handlePurchase">
          {{ purchasing ? 'Memproses...' : 'Bayar Sekarang' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Zap, CalendarClock, BadgePercent, Sparkles, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { redirectToInvoice, rememberPaymentExpiry, INVALID_PAYMENT_LINK } from '@/utils/payment'
import { formatRp } from '@/utils/format'
import { onRadioKeydownManual, radioTabindex } from '@/utils/radioKeys'
import { getPublicStores } from '@/api/bookingApi'
import { getPlayCreditsPackages, initiatePlayCreditsPurchase } from '@/api/playCreditsApi'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BookingStep from '@/components/booking/BookingStep.vue'
import BranchStep from '@/components/booking/BranchStep.vue'
import PaymentMethodPicker from '@/components/booking/PaymentMethodPicker.vue'

const PERKS = [
  { icon: Zap,           label: 'Aktif setelah bayar' },
  { icon: CalendarClock, label: 'Jam fleksibel' },
  { icon: BadgePercent,  label: 'Lebih murah per jam' },
]
const TERMS = [
  'Paket berlaku sejak pembayaran berhasil',
  'Booking dengan credits tidak dapat di-reschedule',
  'Paket hangus setelah masa berlaku habis',
  'Paket tidak dapat di-refund',
]
const NO_INVOICE = 'Link pembayaran tidak tersedia. Silakan coba lagi.'

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

const selectedStoreName = computed(() => stores.value.find((s) => s.id === selectedStoreId.value)?.name || '')
const canPay = computed(() => !!selectedPackage.value && !!paymentMethod.value && !purchasing.value)

// ── Accordion ─────────────────────────────────────────────────────
const editingStep = ref(null)
const currentStep = computed(() => (!selectedStoreId.value ? 0 : !selectedPackage.value ? 1 : 2))
const openStep    = computed(() => editingStep.value ?? currentStep.value)
const steps = computed(() => [
  { title: 'Pilih Cabang', summary: selectedStoreName.value },
  { title: 'Pilih Paket',  summary: selectedPackage.value?.name ?? '' },
  { title: 'Pembayaran',   summary: '' },
])
const summaryRows = computed(() => [
  { label: 'Paket',        value: selectedPackage.value?.name },
  { label: 'Total jam',    value: `${selectedPackage.value?.total_hours} jam` },
  { label: 'Masa berlaku', value: `${selectedPackage.value?.validity_days} hari` },
  { label: 'Cabang',       value: selectedStoreName.value },
  { label: 'Total',        value: formatRp(selectedPackage.value?.price) },
])

// ── Aksi ──────────────────────────────────────────────────────────
let packagesSeq = 0 // paket dari cabang yang sudah tidak dipilih, yang telat datang, diabaikan

const chooseStore = async (id) => {
  editingStep.value = null
  if (id === selectedStoreId.value) return
  const mySeq = ++packagesSeq
  selectedStoreId.value = id
  selectedPackage.value = null
  paymentMethod.value   = ''
  purchaseError.value   = ''
  packages.value        = []
  loadingPackages.value = true
  try {
    const { data } = await getPlayCreditsPackages(id)
    if (mySeq === packagesSeq) packages.value = data.data || []
  } catch {
    if (mySeq === packagesSeq) toast.error('Gagal memuat paket credits')
  } finally {
    if (mySeq === packagesSeq) loadingPackages.value = false
  }
}

const choosePackage = (pkg) => {
  editingStep.value     = null
  selectedPackage.value = pkg
  purchaseError.value   = ''
}

const failPurchase = (message) => {
  purchaseError.value = message
  toast.error(message)
  purchasing.value = false
}

const handlePurchase = async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  purchasing.value    = true
  purchaseError.value = ''
  try {
    const { data } = await initiatePlayCreditsPurchase({
      package_id:     selectedPackage.value.id,
      store_id:       selectedStoreId.value,
      payment_method: paymentMethod.value,
    })
    const intentId = data.data?.intent_id
    const result   = redirectToInvoice(data.data?.invoice_url, () => {
      if (intentId) sessionStorage.setItem('quantum_intent_id', intentId)
      rememberPaymentExpiry(data.data?.expires_at)
    })
    // 'redirected': halaman pindah, biarkan tombol tetap "Memproses"
    if (result === 'invalid') failPurchase(INVALID_PAYMENT_LINK)
    if (result === 'none')    failPurchase(NO_INVOICE)
  } catch (e) {
    failPurchase(e?.response?.data?.message || 'Gagal membuat transaksi')
  }
}

onMounted(async () => {
  try {
    const { data } = await getPublicStores()
    stores.value = data.data || []
  } catch {
    toast.error('Gagal memuat daftar cabang')
  }
})
</script>

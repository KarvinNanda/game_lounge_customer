<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <!-- ── HP: layar checkout (?step=pay) ── -->
    <template v-if="phoneCheckout">
      <h1 class="sr-only">Top Up Play Credits</h1>
      <CheckoutShell mode="screen" title="Pembayaran" @close="closeCheckout">
        <div class="space-y-4">
          <HudPanel class="p-4">
            <dl class="space-y-1.5 text-sm">
              <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
                <dt class="text-q-text-3">{{ row.label }}</dt>
                <dd class="text-right text-q-text">{{ row.value }}</dd>
              </div>
            </dl>
          </HudPanel>
          <div>
            <p class="hud-label mb-2">Metode pembayaran</p>
            <PaymentMethodPicker v-model="paymentMethod" />
          </div>
          <details class="hud-cut-sm bg-surface-raised/50 p-3 text-xs text-q-text-2">
            <summary class="cursor-pointer font-semibold text-q-text">Ketentuan paket</summary>
            <ul class="mt-2 space-y-1">
              <li v-for="item in TERMS" :key="item" class="flex gap-1.5"><Check class="size-3.5 shrink-0 text-q-green" aria-hidden="true" />{{ item }}</li>
            </ul>
          </details>
          <p v-if="purchaseError" role="alert" class="hud-cut-sm bg-q-red/10 p-3 text-center text-sm text-q-red">{{ purchaseError }}</p>
        </div>
      </CheckoutShell>
    </template>

    <!-- ── Loadout: cabang → paket ── -->
    <template v-else>
      <PageHeader title="Top Up Play Credits" subtitle="Beli paket jam bermain, lebih hemat per jam">
        <template #actions>
          <FlowProgress :current="currentStep" :count="STEP_COUNT" class="mt-1.5" />
        </template>
      </PageHeader>

      <ul class="mb-4 flex flex-wrap gap-1.5">
        <li v-for="perk in PERKS" :key="perk.label" data-benefit class="hud-cut-sm flex items-center gap-1.5 bg-q-primary/10 px-2.5 py-1.5 text-xs text-q-text-2">
          <component :is="perk.icon" class="size-3.5 text-q-primary-l" aria-hidden="true" /> {{ perk.label }}
        </li>
      </ul>

      <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div class="space-y-5">
          <FlowStep
            v-for="(step, i) in STEPS"
            :key="step.title"
            data-step
            :index="i + 1"
            :title="step.title"
            :locked-hint="step.hint"
            :state="flow.stateOf(i)"
            :summary="i === 0 ? selectedStoreName : selectedPackage?.name ?? ''"
            :cancelable="flow.editing.value === i"
            :expand-done="isDesktop"
            :last="i === STEP_COUNT - 1"
            @edit="flow.edit(i)"
            @cancel="flow.cancelEdit()"
          >
            <BranchStep v-if="i === 0" :stores="stores" :model-value="selectedStoreId" @select="chooseStore" />

            <template v-else>
              <div v-if="loadingPackages" class="grid gap-1.5 sm:grid-cols-3" aria-busy="true">
                <BaseSkeleton v-for="n in 3" :key="n" class="h-[132px]" />
              </div>
              <p v-else-if="!packages.length" class="py-4 text-center text-sm text-q-text-3">Belum ada paket di cabang ini.</p>
              <div v-else role="radiogroup" aria-label="Paket credits" class="grid grid-cols-2 gap-1.5 sm:grid-cols-3" @keydown="onRadioKeydownManual">
                <button
                  v-for="(pkg, n) in packages"
                  :key="pkg.id"
                  type="button"
                  role="radio"
                  :aria-checked="selectedPackage?.id === pkg.id"
                  :tabindex="radioTabindex(selectedPackage?.id === pkg.id, n, packages.some((p) => p.id === selectedPackage?.id))"
                  class="hud-option flex min-w-0 flex-col p-3 text-left"
                  @click="choosePackage(pkg)"
                >
                  <span class="flex items-start justify-between gap-1">
                    <span class="font-display text-[26px] leading-none text-q-text tabular-nums">{{ pkg.total_hours }}<span class="ml-0.5 font-mono text-[11px] text-q-text-3">JAM</span></span>
                    <BaseBadge v-if="pkg.is_best_value" tone="gold"><Sparkles class="size-3" aria-hidden="true" /> Terbaik</BaseBadge>
                  </span>
                  <span class="mt-2 block truncate text-sm font-semibold">{{ pkg.name }}</span>
                  <span class="block text-xs text-q-text-3">berlaku {{ pkg.validity_days }} hari</span>
                  <span class="mt-1.5 block font-semibold tabular-nums">{{ formatRp(pkg.price) }}</span>
                  <span class="block text-xs text-q-gold">{{ formatRp(pkg.price / pkg.total_hours) }} / jam</span>
                </button>
              </div>
            </template>
          </FlowStep>
        </div>

        <!-- Desktop: ringkasan + pembayaran di kanan -->
        <CheckoutShell v-if="isDesktop" mode="panel" title="Ringkasan">
          <dl class="space-y-1.5 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right" :class="selectedPackage ? 'text-q-text' : 'text-q-text-3'">{{ selectedPackage ? row.value : '—' }}</dd>
            </div>
          </dl>
          <template v-if="flow.ready.value">
            <div class="mt-4 border-t border-border-subtle pt-4">
              <p class="hud-label mb-2">Metode pembayaran</p>
              <PaymentMethodPicker v-model="paymentMethod" />
            </div>
            <details class="hud-cut-sm mt-3 bg-surface-raised/50 p-3 text-xs text-q-text-2">
              <summary class="cursor-pointer font-semibold text-q-text">Ketentuan paket</summary>
              <ul class="mt-2 space-y-1">
                <li v-for="item in TERMS" :key="item" class="flex gap-1.5"><Check class="size-3.5 shrink-0 text-q-green" aria-hidden="true" />{{ item }}</li>
              </ul>
            </details>
            <p v-if="purchaseError" role="alert" class="hud-cut-sm mt-3 bg-q-red/10 p-3 text-center text-sm text-q-red">{{ purchaseError }}</p>
          </template>
          <template #footer>
            <BaseButton size="lg" block :disabled="!flow.ready.value || !canPay" :loading="purchasing" @click="handlePurchase">
              {{ purchasing ? 'Memproses...' : 'Bayar Sekarang' }}
            </BaseButton>
            <p v-if="!flow.ready.value" class="mt-2 text-center text-xs text-q-text-3">Lengkapi {{ flow.remaining.value }} langkah lagi</p>
          </template>
        </CheckoutShell>
      </div>
    </template>

    <PayBar
      v-if="!isDesktop"
      label="Total"
      :amount="selectedPackage ? formatRp(selectedPackage.price) : '—'"
      :action-label="phoneCheckout ? (purchasing ? 'Memproses...' : 'Bayar Sekarang') : 'Lanjut'"
      :disabled="phoneCheckout ? !canPay : !flow.ready.value"
      :loading="phoneCheckout && purchasing"
      :hint="`Lengkapi ${flow.remaining.value} langkah lagi`"
      @action="phoneCheckout ? handlePurchase() : openCheckout()"
    />
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
import HudPanel from '@/components/ui/HudPanel.vue'
import FlowStep from '@/components/flow/FlowStep.vue'
import FlowProgress from '@/components/flow/FlowProgress.vue'
import PayBar from '@/components/flow/PayBar.vue'
import CheckoutShell from '@/components/flow/CheckoutShell.vue'
import { useFlowSteps } from '@/components/flow/useFlowSteps'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useCheckoutStep } from '@/composables/useCheckoutStep'
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

// ── Langkah berurutan: cabang → paket, lalu checkout ─────────────
const STEP_COUNT  = 2
const STEPS = [
  { title: 'Pilih Cabang', hint: '' },
  { title: 'Pilih Paket',  hint: 'Pilih cabang dulu' },
]
const currentStep = computed(() => (!selectedStoreId.value ? 0 : !selectedPackage.value ? 1 : 2))
const flow        = useFlowSteps(STEP_COUNT, currentStep)
const isDesktop   = useMediaQuery('(min-width: 1024px)')
const { inCheckout, open: openCheckout, close: closeCheckout } = useCheckoutStep(flow.ready)
const phoneCheckout = computed(() => inCheckout.value && !isDesktop.value)
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
  flow.cancelEdit()
  if (id === selectedStoreId.value) return
  if (selectedPackage.value) toast.info('Paket di-reset')
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
  flow.cancelEdit()
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

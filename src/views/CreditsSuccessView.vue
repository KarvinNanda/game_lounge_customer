<template>
  <div v-if="confirming" class="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-q-text-2" role="status">
    <Loader2 class="size-8 animate-spin text-q-primary-l" aria-hidden="true" />
    Mengkonfirmasi pembayaran…
  </div>

  <ResultScreen
    v-else-if="!error"
    tone="success"
    title="Pembelian Berhasil"
    message="Play Credits kamu sudah aktif dan siap dipakai untuk booking."
  >
    <BaseCard class="p-4">
      <p class="mb-3 flex items-center gap-2 font-semibold text-q-text">
        <Gamepad2 class="size-5 text-q-primary-l" aria-hidden="true" /> {{ packageName || 'Play Credits' }}
      </p>
      <dl class="space-y-1.5 text-sm">
        <div class="flex justify-between"><dt class="text-q-text-3">Total jam</dt><dd class="text-q-text">{{ totalHours }} jam</dd></div>
        <div class="flex justify-between"><dt class="text-q-text-3">Masa berlaku</dt><dd class="text-q-text">{{ validityDays }} hari</dd></div>
        <div class="flex justify-between"><dt class="text-q-text-3">Status</dt><dd class="font-semibold text-q-green">Aktif</dd></div>
      </dl>
    </BaseCard>
    <template #actions>
      <BaseButton to="/booking" size="lg" block>Booking sekarang</BaseButton>
      <BaseButton to="/" variant="ghost" block>Kembali ke Beranda</BaseButton>
    </template>
  </ResultScreen>

  <ResultScreen v-else tone="error" title="Terjadi Kesalahan" :message="error">
    <template #actions>
      <BaseButton to="/credits" size="lg" block>Coba lagi</BaseButton>
    </template>
  </ResultScreen>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2, Gamepad2 } from 'lucide-vue-next'
import ResultScreen from '@/components/ui/ResultScreen.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { mockConfirmPlayCredits } from '@/api/playCreditsApi'
import { isMockPaymentEnabled, clearPaymentSession } from '@/utils/payment'

const route        = useRoute()
const confirming   = ref(false)
const error        = ref('')
const packageName  = ref('')
const totalHours   = ref(0)
const validityDays = ref(0)

onMounted(async () => {
  // Mock flow menaruh intent_id di URL. Xendit asli (termasuk test mode di staging) tidak,
  // walau quantum_intent_id ada di sessionStorage — jadi sessionStorage TIDAK dipakai di sini.
  // Flag tetap wajib: endpoint mock-confirm tidak ada di production.
  const intentId = route.query.intent_id

  if (intentId && isMockPaymentEnabled()) {
    confirming.value = true
    try {
      const { data } = await mockConfirmPlayCredits(intentId)
      packageName.value  = data.data?.package_name  || ''
      totalHours.value   = data.data?.total_hours   || 0
      validityDays.value = data.data?.validity_days || 0
      clearPaymentSession()
    } catch (e) {
      error.value = e?.response?.data?.message || 'Gagal mengkonfirmasi pembayaran'
    } finally {
      confirming.value = false
    }
  } else {
    clearPaymentSession()
    // Dari Xendit real — ambil data dari query params
    packageName.value  = route.query.package_name  || ''
    totalHours.value   = Number(route.query.total_hours)   || 0
    validityDays.value = Number(route.query.validity_days) || 0
  }
})
</script>

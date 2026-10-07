<template>
  <div role="radiogroup" aria-label="Metode pembayaran" class="grid gap-2 sm:grid-cols-2">
    <button
      v-for="m in PAYMENT_METHODS"
      :key="m.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === m.value"
      class="flex w-full items-center gap-3 rounded-xl border p-3 text-left cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
      :class="modelValue === m.value ? 'border-q-primary bg-q-primary/10' : 'border-border-subtle hover:border-q-primary/60'"
      @click="emit('update:modelValue', m.value)"
    >
      <span class="size-9 shrink-0 rounded-lg bg-white/5 text-q-primary-l flex items-center justify-center">
        <component :is="m.icon" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-q-text">{{ m.label }}</span>
        <span class="block text-xs text-q-text-3">{{ m.desc }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { QrCode, Wallet, Landmark, CreditCard } from 'lucide-vue-next'

defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

// Satu-satunya daftar metode bayar gateway (Booking, Credits, Event)
const PAYMENT_METHODS = [
  { value: 'qris',    label: 'QRIS',                 desc: 'Semua e-wallet & m-banking',      icon: QrCode },
  { value: 'ewallet', label: 'E-Wallet',             desc: 'OVO, GoPay, DANA, ShopeePay',     icon: Wallet },
  { value: 'va',      label: 'Virtual Account',      desc: 'BCA, Mandiri, BNI, BRI, Permata', icon: Landmark },
  { value: 'card',    label: 'Kartu Debit / Kredit', desc: 'Visa, Mastercard, JCB',           icon: CreditCard },
]
</script>

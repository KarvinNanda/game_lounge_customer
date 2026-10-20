<template>
  <div role="radiogroup" aria-label="Metode pembayaran" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" @keydown="onRadioKeydown">
    <button
      v-for="(m, i) in PAYMENT_METHODS"
      :key="m.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === m.value"
      :tabindex="radioTabindex(modelValue === m.value, i, !!modelValue)"
      class="hud-option flex w-full items-center gap-3 p-3 text-left lg:py-2"
      @click="emit('update:modelValue', m.value)"
    >
      <span class="hud-cut-sm size-9 shrink-0 bg-q-primary/10 text-q-primary-l flex items-center justify-center">
        <component :is="m.icon" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-q-text">{{ m.label }}</span>
        <span class="block text-xs text-q-text-3 lg:hidden">{{ m.desc }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { QrCode, Wallet, Landmark, CreditCard } from 'lucide-vue-next'
import { onRadioKeydown, radioTabindex } from '@/utils/radioKeys'

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

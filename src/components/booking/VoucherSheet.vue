<template>
  <BaseSheet
    :model-value="modelValue"
    title="Pilih Voucher"
    :description="description"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div role="radiogroup" aria-label="Voucher" class="divide-y divide-border-subtle" @keydown="onRadioKeydown">
      <button type="button" role="radio" :aria-checked="!selected" :tabindex="selectedInList ? -1 : 0" :class="[ROW, PICKABLE]" @click="pick(null)">
        <span class="hud-cut-sm size-9 shrink-0 bg-white/5 text-q-text-3 flex items-center justify-center">
          <Ban class="size-5" aria-hidden="true" />
        </span>
        <span class="flex-1">
          <span class="block text-sm font-semibold text-q-text">Tidak pakai voucher</span>
          <span class="block text-xs text-q-text-3">Bayar harga normal</span>
        </span>
        <Check v-if="!selected" class="size-5 text-q-primary-l" aria-hidden="true" />
      </button>

      <button
        v-for="v in vouchers"
        :key="v.voucher_id"
        type="button"
        role="radio"
        :aria-checked="selected?.voucher_id === v.voucher_id"
        :tabindex="selected?.voucher_id === v.voucher_id ? 0 : -1"
        :disabled="isVoucherReserved(v)"
        :data-reserved="isVoucherReserved(v) || undefined"
        :class="[ROW, isVoucherReserved(v) ? LOCKED : PICKABLE]"
        @click="pick(v)"
      >
        <span class="hud-cut-sm size-9 shrink-0 bg-q-gold/15 text-q-gold flex items-center justify-center">
          <TicketPercent class="size-5" aria-hidden="true" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block truncate text-sm font-semibold text-q-text">{{ v.name }}</span>
          <span class="block text-xs text-q-text-3">
            <span class="font-semibold" :class="isVoucherReserved(v) ? 'text-q-text-2' : 'text-q-gold'">{{ v.discount_type === 'percentage' ? `${v.discount_value}% off` : `Hemat ${formatRp(v.discount_value)}` }}</span>
            · {{ v.code }}<template v-if="v.min_purchase > 0"> · <span class="whitespace-nowrap">min {{ formatRp(v.min_purchase) }}</span></template>
          </span>
        </span>
        <ReservedChip v-if="isVoucherReserved(v)" :until="v.reserved_until" />
        <Check v-else-if="selected?.voucher_id === v.voucher_id" class="size-5 text-q-primary-l" aria-hidden="true" />
      </button>
    </div>
  </BaseSheet>
</template>

<script setup>
import { Ban, Check, TicketPercent } from 'lucide-vue-next'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import { computed } from 'vue'
import { formatRp } from '@/utils/format'
import { onRadioKeydown } from '@/utils/radioKeys'
import { isVoucherReserved, usableVouchers } from '@/utils/voucher'
import ReservedChip from '@/components/ui/ReservedChip.vue'

const props = defineProps({
  modelValue: Boolean,
  vouchers:   { type: Array, default: () => [] },
  selected:   { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'select'])

const description = computed(() => {
  const usable = usableVouchers(props.vouchers).length
  const locked = props.vouchers.length - usable
  return `${usable} voucher tersedia${locked ? ` · ${locked} dikunci pembayaran lain` : ''}`
})

// Voucher terpilih tapi tidak ada di daftar → baris "Tidak pakai voucher" jadi Tab stop
const selectedInList = computed(() => props.vouchers.some((v) => v.voucher_id === props.selected?.voucher_id))

const ROW = 'flex w-full min-h-16 items-center gap-3 px-5 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring'
const PICKABLE = 'cursor-pointer hover:bg-white/[0.03]'
const LOCKED   = 'hud-reserved cursor-not-allowed shadow-[inset_3px_0_0_var(--color-q-gold)]' // garis emas di kiri

const pick = (voucher) => {
  emit('select', voucher)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseSheet
    :model-value="modelValue"
    title="Pilih Voucher"
    :description="`${vouchers.length} voucher tersedia`"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div role="radiogroup" aria-label="Voucher" class="divide-y divide-border-subtle">
      <button type="button" role="radio" :aria-checked="!selected" :class="ROW" @click="pick(null)">
        <span class="size-9 shrink-0 rounded-lg bg-white/5 text-q-text-3 flex items-center justify-center">
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
        :class="ROW"
        @click="pick(v)"
      >
        <span class="size-9 shrink-0 rounded-lg bg-q-gold/15 text-q-gold flex items-center justify-center">
          <TicketPercent class="size-5" aria-hidden="true" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block truncate text-sm font-semibold text-q-text">{{ v.name }}</span>
          <span class="block text-xs text-q-text-3">
            <span class="font-semibold text-q-gold">{{ v.discount_type === 'percentage' ? `${v.discount_value}% off` : `Hemat ${formatRp(v.discount_value)}` }}</span>
            · {{ v.code }}<template v-if="v.min_purchase > 0"> · min {{ formatRp(v.min_purchase) }}</template>
          </span>
        </span>
        <Check v-if="selected?.voucher_id === v.voucher_id" class="size-5 text-q-primary-l" aria-hidden="true" />
      </button>
    </div>
  </BaseSheet>
</template>

<script setup>
import { Ban, Check, TicketPercent } from 'lucide-vue-next'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import { formatRp } from '@/utils/format'

defineProps({
  modelValue: Boolean,
  vouchers:   { type: Array, default: () => [] },
  selected:   { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'select'])

const ROW = 'flex w-full min-h-16 items-center gap-3 px-5 py-3 text-left cursor-pointer hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring'

const pick = (voucher) => {
  emit('select', voucher)
  emit('update:modelValue', false)
}
</script>

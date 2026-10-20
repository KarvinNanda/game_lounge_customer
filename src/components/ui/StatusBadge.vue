<template>
  <BaseBadge :tone="entry.tone" :data-tone="entry.tone">
    <component :is="entry.icon" v-if="entry.icon" class="size-3.5" aria-hidden="true" />{{ entry.label }}
  </BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import { Clock, CalendarClock, Gamepad2, Hourglass, CircleCheck, CircleX, ChefHat, Truck } from 'lucide-vue-next'
import BaseBadge from './BaseBadge.vue'

// Satu-satunya peta status → label + warna + ikon (booking & pesanan F&B).
// Ikon wajib: status tidak boleh dibedakan dari warna saja.
const STATUS = {
  booking: {
    pending_payment: { label: 'Menunggu bayar',  tone: 'warning', icon: Clock },
    upcoming:        { label: 'Akan datang',     tone: 'info',    icon: CalendarClock },
    ongoing:         { label: 'Sedang main',     tone: 'success', icon: Gamepad2 },
    ending_soon:     { label: 'Hampir selesai',  tone: 'warning', icon: Hourglass },
    completed:       { label: 'Selesai',         tone: 'neutral', icon: CircleCheck },
    cancelled:       { label: 'Dibatalkan',      tone: 'danger',  icon: CircleX },
  },
  fnb: {
    pending:   { label: 'Menunggu',   tone: 'warning', icon: Clock },
    preparing: { label: 'Disiapkan',  tone: 'info',    icon: ChefHat },
    delivered: { label: 'Diantar',    tone: 'success', icon: Truck },
    cancelled: { label: 'Dibatalkan', tone: 'danger',  icon: CircleX },
  },
}

const props = defineProps({
  kind:   { type: String, required: true, validator: (v) => ['booking', 'fnb'].includes(v) },
  status: { type: String, default: '' },
})

const entry = computed(() => STATUS[props.kind][props.status] ?? { label: props.status, tone: 'neutral', icon: null })
</script>

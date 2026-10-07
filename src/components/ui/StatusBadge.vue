<template>
  <BaseBadge :tone="entry.tone" :data-tone="entry.tone">{{ entry.label }}</BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

// Satu-satunya peta status → label + warna (booking & pesanan F&B)
const STATUS = {
  booking: {
    pending_payment: { label: 'Menunggu bayar',  tone: 'warning' },
    upcoming:        { label: 'Akan datang',     tone: 'info' },
    ongoing:         { label: 'Sedang main',     tone: 'success' },
    ending_soon:     { label: 'Hampir selesai',  tone: 'warning' },
    completed:       { label: 'Selesai',         tone: 'neutral' },
    cancelled:       { label: 'Dibatalkan',      tone: 'danger' },
  },
  fnb: {
    pending:   { label: 'Menunggu',   tone: 'warning' },
    preparing: { label: 'Disiapkan',  tone: 'info' },
    delivered: { label: 'Diantar',    tone: 'success' },
    cancelled: { label: 'Dibatalkan', tone: 'danger' },
  },
}

const props = defineProps({
  kind:   { type: String, required: true, validator: (v) => ['booking', 'fnb'].includes(v) },
  status: { type: String, default: '' },
})

const entry = computed(() => STATUS[props.kind][props.status] ?? { label: props.status, tone: 'neutral' })
</script>

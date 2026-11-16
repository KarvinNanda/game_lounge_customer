<template>
  <span
    data-reserved-chip
    class="hud-cut-sm inline-flex shrink-0 items-center gap-1 whitespace-nowrap bg-q-gold/15 px-2 py-0.5 font-mono text-xs font-semibold tracking-[0.12em] text-q-gold"
  >
    <Lock class="size-3" aria-hidden="true" />TERKUNCI S/D {{ formatTimeWIB(until) }}
  </span>
</template>

<script setup>
// Voucher yang sedang dipakai hold pembayaran lain. Jam dari reserved_until (WIB).
import { Lock } from 'lucide-vue-next'
import { formatTimeWIB } from '@/utils/dates'

defineProps({ until: { type: String, required: true } })
</script>

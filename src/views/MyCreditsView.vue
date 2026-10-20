<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6">
    <PageHeader title="Play Credits" subtitle="Paket jam bermain yang kamu miliki">
      <template #actions>
        <BaseButton to="/credits" size="sm"><Plus class="size-4" aria-hidden="true" /> Beli</BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="grid gap-2 lg:grid-cols-3" aria-busy="true">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-28" />
    </div>

    <BaseEmptyState v-else-if="!credits.length" :icon="Gamepad2" title="Belum ada Play Credits" text="Beli paket credits supaya booking lebih hemat per jam.">
      <BaseButton to="/credits">Beli credits</BaseButton>
    </BaseEmptyState>

    <ul v-else class="grid gap-2 lg:grid-cols-3">
      <li v-for="cr in credits" :key="cr.id">
        <HudPanel class="h-full p-3.5" :class="{ 'opacity-60': expiry(cr).state === 'expired' }">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-q-text">{{ cr.package?.name }}</p>
              <p class="truncate text-xs text-q-text-3">{{ cr.store?.name }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-display text-2xl leading-none text-q-primary-l tabular-nums">{{ cr.remaining_hours }}</p>
              <p class="hud-label mt-1">jam tersisa</p>
            </div>
          </div>

          <!-- Health bar: segmen menyala = jam tersisa -->
          <div
            v-if="cr.total_hours"
            role="progressbar"
            :aria-valuenow="cr.used_hours ?? 0"
            aria-valuemin="0"
            :aria-valuemax="cr.total_hours"
            :aria-label="`${cr.used_hours ?? 0} dari ${cr.total_hours} jam terpakai`"
            class="mt-3 flex gap-0.5"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="h-1.5 flex-1"
              :class="n <= remainingSegments(cr) ? 'bg-q-primary-l shadow-glow-l' : 'bg-q-card2'"
            />
          </div>
          <div class="mt-1.5 flex justify-between gap-2 text-xs">
            <span class="text-q-text-3"><template v-if="cr.total_hours">{{ cr.used_hours ?? 0 }}/{{ cr.total_hours }} jam terpakai</template></span>
            <span :data-expiry="expiryTone(cr)" :class="EXPIRY_TONE[expiryTone(cr)]">
              <template v-if="expiry(cr).state === 'ok'">Berlaku s/d {{ formatDateShort(cr.expires_at) }}</template>
              <template v-else>{{ expiry(cr).label }}</template>
            </span>
          </div>
        </HudPanel>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Gamepad2, Plus } from 'lucide-vue-next'
import { getMyCredits } from '@/api/authApi'
import { expiryState } from '@/utils/dates'
import { formatDateShort } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'

const EXPIRY_TONE = { none: 'text-q-text-3', ok: 'text-q-text-3', soon: 'font-semibold text-q-gold', danger: 'font-semibold text-q-red', expired: 'font-semibold text-q-red' }

const credits = ref([])
const loading = ref(true)

const expiry = (cr) => expiryState(cr.expires_at)
// ≤ 7 hari = emas, ≤ 1 hari = merah
const expiryTone = (cr) => {
  const e = expiry(cr)
  return e.state === 'soon' && e.days <= 1 ? 'danger' : e.state
}
const remainingSegments = (cr) => {
  if (!cr.total_hours) return 0
  const left = Math.max(0, Number(cr.remaining_hours ?? cr.total_hours - (cr.used_hours ?? 0)))
  return Math.min(10, Math.round((left / cr.total_hours) * 10))
}

onMounted(async () => {
  try {
    const { data } = await getMyCredits()
    credits.value = data.data || []
  } catch {
    credits.value = []
  } finally {
    loading.value = false
  }
})
</script>

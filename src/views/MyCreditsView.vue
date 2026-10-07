<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6">
    <PageHeader title="Play Credits" subtitle="Paket jam bermain yang kamu miliki">
      <template #actions>
        <BaseButton to="/credits" size="sm"><Plus class="size-4" aria-hidden="true" /> Beli</BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="space-y-2" aria-busy="true">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-24" />
    </div>

    <BaseEmptyState v-else-if="!credits.length" :icon="Gamepad2" title="Belum ada Play Credits" text="Beli paket credits supaya booking lebih hemat per jam.">
      <BaseButton to="/credits">Beli credits</BaseButton>
    </BaseEmptyState>

    <ul v-else class="space-y-2">
      <li v-for="cr in credits" :key="cr.id">
        <BaseCard class="p-4" :class="{ 'opacity-60': expiry(cr).state === 'expired' }">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-q-text">{{ cr.package?.name }}</p>
              <p class="truncate text-xs text-q-text-3">{{ cr.store?.name }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-display text-xl font-semibold leading-none text-q-primary-l tabular-nums">{{ cr.remaining_hours }}</p>
              <p class="text-xs text-q-text-3">jam tersisa</p>
            </div>
          </div>

          <div
            v-if="cr.total_hours"
            role="progressbar"
            :aria-valuenow="cr.used_hours ?? 0"
            aria-valuemin="0"
            :aria-valuemax="cr.total_hours"
            :aria-label="`${cr.used_hours ?? 0} dari ${cr.total_hours} jam terpakai`"
            class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
          >
            <div class="h-full rounded-full bg-q-primary" :style="{ width: `${usedPercent(cr)}%` }" />
          </div>
          <div class="mt-1.5 flex justify-between text-xs">
            <span class="text-q-text-3"><template v-if="cr.total_hours">{{ cr.used_hours ?? 0 }}/{{ cr.total_hours }} jam terpakai</template></span>
            <span :class="EXPIRY_TONE[expiry(cr).state]">
              <template v-if="expiry(cr).state === 'ok'">Berlaku s/d {{ formatDateShort(cr.expires_at) }}</template>
              <template v-else>{{ expiry(cr).label }}</template>
            </span>
          </div>
        </BaseCard>
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
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'

const EXPIRY_TONE = { none: 'text-q-text-3', ok: 'text-q-text-3', soon: 'font-semibold text-q-gold', expired: 'font-semibold text-q-red' }

const credits = ref([])
const loading = ref(true)

const expiry = (cr) => expiryState(cr.expires_at)
const usedPercent = (cr) => (cr.total_hours ? Math.min(100, Math.max(0, (cr.used_hours / cr.total_hours) * 100)) : 0)

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

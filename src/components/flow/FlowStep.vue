<template>
  <section
    :data-state="state"
    :aria-disabled="state === 'locked' || undefined"
    class="relative pl-7"
  >
    <!-- Rail: garis ke langkah berikutnya + node diamond -->
    <span
      v-if="!last"
      aria-hidden="true"
      class="absolute left-[6px] top-4 -bottom-3 w-0.5 transition-colors duration-150"
      :class="state === 'done' ? 'bg-q-primary-l shadow-glow-l' : 'bg-q-border'"
    />
    <span
      aria-hidden="true"
      class="absolute left-0 top-0.5 size-3.5 rotate-45 border-2 transition-[background-color,border-color,box-shadow] duration-150"
      :class="NODE[state]"
    />

    <div class="flex min-h-5 items-center justify-between gap-3">
      <h2 class="hud-label" :class="state === 'active' ? 'text-q-primary-l!' : ''">
        <span aria-hidden="true">{{ String(index).padStart(2, '0') }} · </span>{{ title }}
      </h2>
      <button
        v-if="state === 'done'"
        type="button"
        aria-expanded="false"
        class="hud-label -my-3 inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-q-primary-l! hover:text-q-text! cursor-pointer hud-focus"
        @click="emit('edit')"
      >Ubah</button>
      <button
        v-else-if="state === 'active' && cancelable"
        type="button"
        class="hud-label -my-3 inline-flex min-h-11 min-w-11 items-center justify-center px-2 hover:text-q-text! cursor-pointer hud-focus"
        @click="emit('cancel')"
      >Batal</button>
    </div>

    <div class="mt-1.5">
      <div
        v-if="state === 'locked'"
        data-locked
        class="hud-cut-sm flex items-center justify-center gap-2 border border-dashed border-q-border px-3 py-3 font-mono text-[11px] tracking-[0.1em] text-q-text-3 uppercase"
      >
        <Lock class="size-3.5" aria-hidden="true" /> {{ lockedHint }}
      </div>
      <template v-else-if="state === 'done' && !expandDone">
        <p class="truncate text-sm font-semibold text-q-text">{{ summary || 'Belum dipilih' }}</p>
      </template>
      <slot v-else />
    </div>
  </section>
</template>

<script setup>
import { Lock } from 'lucide-vue-next'

defineProps({
  index:      { type: Number, required: true }, // 1-based
  title:      { type: String, required: true },
  state:      { type: String, required: true, validator: (v) => ['locked', 'active', 'done'].includes(v) },
  summary:    { type: String, default: '' },
  lockedHint: { type: String, default: '' },
  expandDone: Boolean, // desktop: langkah selesai tetap terbuka
  cancelable: Boolean, // sedang dibuka lewat "Ubah" → boleh ditutup tanpa mengubah apa pun
  last:       Boolean,
})
const emit = defineEmits(['edit', 'cancel'])

const NODE = {
  locked: 'border-q-border bg-q-bg',
  active: 'border-q-primary-l bg-q-bg shadow-glow-l',
  done:   'border-q-primary-l bg-q-primary-l shadow-glow-l',
}
</script>

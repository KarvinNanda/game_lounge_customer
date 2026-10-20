<template>
  <span
    data-face
    :data-tone="tone"
    aria-hidden="true"
    :class="[
      'pointer-events-none absolute inset-0 -z-10 transition-[background-color,box-shadow,opacity] duration-150',
      CUTS[cut],
      TONES[tone],
      hoverable && HOVER[tone],
    ]"
  />
</template>

<script setup>
// Latar ber-chamfer di belakang konten. Parent wajib `relative isolate` supaya -z-10 tetap di dalam parent, dan focus ring tetap di parent (tidak terpotong).
defineProps({
  tone:      { type: String, default: 'default', validator: (v) => ['default', 'raised', 'active', 'primary', 'danger', 'ghost', 'locked'].includes(v) },
  cut:       { type: String, default: 'md', validator: (v) => ['md', 'sm'].includes(v) },
  hoverable: Boolean, // parent punya class `group`
})

const CUTS = { md: 'hud-cut', sm: 'hud-cut-sm' }

// Border digambar dengan inset box-shadow: tetap terlihat di dalam clip-path
const TONES = {
  default: 'bg-surface/85 shadow-[inset_0_0_0_1px_var(--color-q-border)]',
  raised:  'bg-surface-raised shadow-[inset_0_0_0_1px_var(--color-q-border)]',
  active:  'bg-q-primary/15 shadow-[inset_0_0_0_1px_var(--color-q-primary-l),inset_0_0_16px_color-mix(in_srgb,var(--color-q-primary)_22%,transparent)]',
  primary: 'bg-q-primary-strong bg-gradient-to-b from-q-primary-strong to-q-primary-d shadow-[inset_0_0_0_1px_var(--color-q-primary-l)]',
  danger:  'bg-q-red/10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-red)_55%,transparent)]',
  ghost:   'bg-transparent',
  locked:  'bg-transparent border border-dashed border-q-border',
}

const HOVER = {
  default: 'group-hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-primary)_70%,transparent)]',
  raised:  'group-hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-primary)_70%,transparent)]',
  active:  '',
  primary: 'group-hover:to-q-primary-strong', // tetap ≥4.5:1 dengan teks putih

  danger:  'group-hover:bg-q-red/20',
  ghost:   'group-hover:bg-white/5',
  locked:  '',
}
</script>

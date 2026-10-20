import { ref, watch, onScopeDispose, getCurrentScope } from 'vue'

const prefersReducedMotion = () =>
  typeof window === 'undefined'
  || typeof window.matchMedia !== 'function'
  || typeof window.requestAnimationFrame !== 'function'
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Angka "naik" sekali saat nilai pertama muncul (≤ durasi). Perubahan berikutnya langsung.
// Hanya untuk tampilan — label aksesibel harus memakai nilai asli.
export function useCountUp(source, duration = 400) {
  const display = ref(source.value)
  let frame = 0
  let animated = false
  const cancel = () => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame) }

  watch(source, (to) => {
    cancel()
    if (animated || !to || prefersReducedMotion()) {
      display.value = to
      return
    }
    animated = true
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      display.value = t < 1 ? Math.round(to * (1 - (1 - t) ** 3)) : to
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }, { immediate: true })

  if (getCurrentScope()) onScopeDispose(cancel)
  return display
}

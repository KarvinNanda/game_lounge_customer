import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Layar checkout di HP = state `?step=pay` di URL, supaya tombol back HP kembali ke pilihan.
// Reload / deep link ke ?step=pay saat form belum lengkap → kembali ke pilihan.
export function useCheckoutStep(ready) {
  const route  = useRoute()
  const router = useRouter()
  let openedHere = false

  const inCheckout = computed(() => route.query.step === 'pay')

  const withoutStep = () => {
    const rest = { ...route.query }
    delete rest.step
    return rest
  }

  const open = () => {
    if (inCheckout.value) return
    openedHere = true
    router.push({ query: { ...route.query, step: 'pay' } })
  }

  const close = () => {
    if (!inCheckout.value) return
    if (openedHere) {
      openedHere = false
      router.back()
    } else {
      router.replace({ query: withoutStep() })
    }
  }

  // Navigasi yang hanya mengubah query tidak di-scroll oleh router → mulai dari atas
  watch(inCheckout, () => window.scrollTo({ top: 0 }))

  watch([inCheckout, ready], ([checkout, isReady]) => {
    if (checkout && !isReady) router.replace({ query: withoutStep() })
  }, { immediate: true })

  return { inCheckout, open, close }
}

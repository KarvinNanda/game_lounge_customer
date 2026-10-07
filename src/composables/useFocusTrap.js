import { watch, onBeforeUnmount } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Kunci fokus keyboard di dalam dialog selama terbuka (Tab / Shift+Tab berputar),
 * lalu kembalikan fokus ke elemen pemicu saat ditutup.
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef  root dialog
 * @param {() => boolean} isOpen
 */
export const useFocusTrap = (containerRef, isOpen) => {
  let returnTo = null

  const onKeydown = (e) => {
    if (e.key !== 'Tab' || !containerRef.value) return
    const items = [...containerRef.value.querySelectorAll(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]
    const last  = items[items.length - 1]
    const active = document.activeElement
    const inside = containerRef.value.contains(active)

    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !inside)) {
      e.preventDefault()
      first.focus()
    }
  }

  const release = () => {
    document.removeEventListener('keydown', onKeydown, true)
    if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) returnTo.focus()
    returnTo = null
  }

  watch(isOpen, (open) => {
    if (open) {
      returnTo = document.activeElement
      document.addEventListener('keydown', onKeydown, true)
    } else {
      release()
    }
  }, { immediate: true })

  // Dialog di-unmount saat masih terbuka (mis. pindah halaman): tetap kembalikan fokus
  onBeforeUnmount(() => { if (isOpen()) release() })
}

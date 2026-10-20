import { ref, getCurrentScope, onScopeDispose } from 'vue'

// Reaktif terhadap window.matchMedia. Tanpa matchMedia (jsdom/SSR) selalu false,
// jadi test & render awal memakai layout HP.
export function useMediaQuery(query) {
  const matches = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return matches

  const mql = window.matchMedia(query)
  matches.value = mql.matches
  const onChange = (e) => { matches.value = e.matches }
  mql.addEventListener('change', onChange)
  if (getCurrentScope()) onScopeDispose(() => mql.removeEventListener('change', onChange))
  return matches
}

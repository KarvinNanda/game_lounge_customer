// ── Scroll saat pindah halaman ─────────────────────────────────────
// CustomerLayout memakai <Transition mode="out-in">: halaman lama fade-out dulu.
// Kalau scroll ke atas langsung, halaman lama terlihat "loncat" saat menghilang.
// Jadi router menunggu sinyal after-leave dari layout (dengan batas waktu).

const LEAVE_TIMEOUT_MS = 300 // > durasi leave (120ms); jaga-jaga kalau tidak ada transisi

let pending = null
let timer   = null
let navId   = 0  // navigasi terbaru; navigasi lama yang tersalip tidak boleh scroll

/** Dipanggil CustomerLayout di @after-leave */
export const notifyPageLeft = () => {
  pending?.()
  pending = null
}

const waitForPageLeave = () => new Promise((resolve) => {
  pending?.()            // lepaskan navigasi sebelumnya (akan dianggap tersalip)
  clearTimeout(timer)
  pending = resolve
  timer = setTimeout(resolve, LEAVE_TIMEOUT_MS)
})

export const scrollBehavior = async (to, from, savedPosition) => {
  if (to.path === from.path) return false // hanya query/hash berubah: biarkan posisi
  const myId = ++navId
  await waitForPageLeave()
  if (myId !== navId) return false
  return savedPosition || { top: 0 }
}

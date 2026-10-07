// ── Radio group dari <button role="radio"> ─────────────────────────
// Pola ARIA: satu Tab stop per grup (roving tabindex). Dua mode:
// - onRadioKeydown:       panah memindah fokus SEKALIGUS memilih (pilihan tidak memicu navigasi)
// - onRadioKeydownManual: panah hanya memindah fokus; Enter/Spasi memilih
//   (untuk grup yang langsung maju ke langkah berikutnya saat dipilih)

const NEXT = ['ArrowDown', 'ArrowRight']
const PREV = ['ArrowUp', 'ArrowLeft']

const handle = (e, select) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  if (e.target?.getAttribute?.('role') !== 'radio') return // mis. link Maps di dalam grup
  const radios = [...e.currentTarget.querySelectorAll('[role="radio"]:not([disabled])')]
  const i = radios.indexOf(e.target)
  if (i === -1) return

  let next
  if (NEXT.includes(e.key))   next = radios[(i + 1) % radios.length]
  else if (PREV.includes(e.key)) next = radios[(i - 1 + radios.length) % radios.length]
  else if (e.key === 'Home')  next = radios[0]
  else if (e.key === 'End')   next = radios[radios.length - 1]
  else return

  e.preventDefault()
  next.focus()
  if (select) next.click()
}

export const onRadioKeydown       = (e) => handle(e, true)
export const onRadioKeydownManual = (e) => handle(e, false)

/** tabindex tiap radio: yang terpilih, atau yang pertama jika tidak ada yang terpilih di daftar */
export const radioTabindex = (checked, index, anyChecked) =>
  checked || (!anyChecked && index === 0) ? 0 : -1

import { ref, computed } from 'vue'

// State machine langkah berurutan (Booking, Top Up, Event).
// `current` = indeks langkah pertama yang belum selesai (count = semua selesai).
// Aturan bisnis: langkah setelah `current` terkunci; hanya satu langkah aktif.
// Langkah terakhir tetap terbuka setelah lengkap (mis. pilih beberapa jam) —
// konfirmasinya lewat tombol Lanjut di pay bar.
export function useFlowSteps(count, current) {
  const editing = ref(null)

  const stateOf = (i) => {
    if (i > current.value) return 'locked'
    if (editing.value !== null) return i === editing.value ? 'active' : 'done'
    if (i === count - 1) return 'active'
    return i < current.value ? 'done' : 'active'
  }

  const edit       = (i) => { if (i <= current.value) editing.value = i }
  const cancelEdit = () => { editing.value = null }

  const remaining = computed(() => Math.max(0, count - current.value))
  const ready     = computed(() => current.value >= count)

  return { editing, stateOf, edit, cancelEdit, remaining, ready }
}

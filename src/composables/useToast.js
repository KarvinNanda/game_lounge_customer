import { ref } from 'vue'

const toasts = ref([])
let uid = 0

const add = (message, type = 'info', duration = 3500) => {
  const id = ++uid
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), duration)
  return id
}

const remove = (id) => {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export const useToast = () => ({
  toasts,
  success: (msg, duration) => add(msg, 'success', duration),
  error:   (msg, duration) => add(msg, 'error',   duration),
  info:    (msg, duration) => add(msg, 'info',     duration),
  warning: (msg, duration) => add(msg, 'warning',  duration),
  remove,
})

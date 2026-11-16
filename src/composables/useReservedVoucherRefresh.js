import { onScopeDispose } from 'vue'
import { voucherRefreshDelay } from '@/utils/voucher'

/**
 * Ambil ulang daftar voucher setelah voucher yang dikunci dilepas backend
 * (reserved_until + 1 menit), supaya voucher kembali tanpa refresh halaman.
 *
 * @param {() => unknown} reload  fungsi yang mengambil ulang daftar voucher
 * @returns {(list: object[]) => void} panggil setiap kali daftar voucher baru diterima
 */
export function useReservedVoucherRefresh(reload) {
  let timer = null
  const clear = () => { clearTimeout(timer); timer = null }

  const schedule = (list) => {
    clear()
    const delay = voucherRefreshDelay(list)
    if (delay !== null) timer = setTimeout(reload, delay)
  }

  onScopeDispose(clear)
  return schedule
}

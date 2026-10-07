/**
 * Estimasi potongan voucher di layar Booking, dihitung dari total_price server (quote).
 * Angka final tetap dari /bookings/initiate — ini hanya untuk tampilan.
 *
 * @param {{ discount_type: 'percentage'|'fixed', discount_value: number, max_discount?: number|null }|null} voucher
 * @param {number} base  total_price dari quote
 * @returns {number} potongan, 0..base
 */
export const estimateVoucherDiscount = (voucher, base) => {
  if (!voucher || !base) return 0
  let discount = voucher.discount_type === 'percentage'
    ? base * voucher.discount_value / 100
    : voucher.discount_value
  // max_discount 0/null = tanpa batas
  if (voucher.discount_type === 'percentage' && voucher.max_discount) {
    discount = Math.min(discount, voucher.max_discount)
  }
  return Math.min(discount, base)
}

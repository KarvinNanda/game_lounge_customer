import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

vi.mock('@/api/bookingApi', () => ({ getBookingByHold: vi.fn() }))
import { getBookingByHold } from '@/api/bookingApi'
import { useHoldConfirmation } from '@/composables/useHoldConfirmation'

const HOLD = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'
const res = (data) => ({ data: { data } })
const fail = (status) => Object.assign(new Error(String(status)), { response: { status } })

const setup = async (holdId = HOLD) => {
  let c
  const w = mount(defineComponent({ setup() { c = useHoldConfirmation(holdId); return () => h('div') } }))
  await flushPromises()
  return { c, w }
}
const tick = async (ms = 2000) => { await vi.advanceTimersByTimeAsync(ms); await flushPromises() }

describe('useHoldConfirmation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getBookingByHold.mockReset().mockResolvedValue(res({ status: 'pending' }))
  })
  afterEach(() => { vi.useRealTimers() })

  it('a missing or non-UUID hold id makes no request and falls back', async () => {
    for (const id of ['', 'h1', '../bookings', null]) {
      const { c } = await setup(id)
      expect(c.state.value).toBe('unknown')
    }
    expect(getBookingByHold).not.toHaveBeenCalled()
  })

  it('polls while pending and stops with the code once confirmed', async () => {
    getBookingByHold
      .mockResolvedValueOnce(res({ status: 'pending' }))
      .mockResolvedValueOnce(res({ status: 'confirmed', booking_code: 'BK-0042', booking_id: 'b1' }))
    const { c } = await setup()
    expect(c.state.value).toBe('checking')
    await tick()
    expect(c.state.value).toBe('confirmed')
    expect(c.bookingCode.value).toBe('BK-0042')
    await tick(10000)
    expect(getBookingByHold).toHaveBeenCalledTimes(2)
    expect(getBookingByHold).toHaveBeenCalledWith(HOLD)
  })

  it('expired is not final: a late webhook can still confirm', async () => {
    getBookingByHold
      .mockResolvedValueOnce(res({ status: 'expired' }))
      .mockResolvedValueOnce(res({ status: 'confirmed', booking_code: 'BK-0042' }))
    const { c } = await setup()
    expect(c.state.value).toBe('checking')
    await tick()
    expect(c.bookingCode.value).toBe('BK-0042')
  })

  it('stops after about 20 seconds (11 requests at 2s) and falls back', async () => {
    const { c } = await setup()
    await tick(30000)
    expect(getBookingByHold).toHaveBeenCalledTimes(11)
    expect(c.state.value).toBe('unknown')
  })

  it.each([401, 404, 429])('%i stops polling at once', async (status) => {
    getBookingByHold.mockRejectedValue(fail(status))
    const { c } = await setup()
    await tick(10000)
    expect(getBookingByHold).toHaveBeenCalledTimes(1)
    expect(c.state.value).toBe('unknown')
  })

  it('a network error keeps polling', async () => {
    getBookingByHold
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(res({ status: 'confirmed', booking_code: 'BK-0042' }))
    const { c } = await setup()
    await tick()
    expect(c.state.value).toBe('confirmed')
  })

  it('a confirmed response without a valid code is not shown', async () => {
    getBookingByHold.mockResolvedValue(res({ status: 'confirmed', booking_code: '<b>hi</b>' }))
    const { c } = await setup()
    expect(c.bookingCode.value).toBe('')
    expect(c.state.value).toBe('unknown')
  })

  it('leaving the page stops polling', async () => {
    const { w } = await setup()
    w.unmount()
    await tick(30000)
    expect(getBookingByHold).toHaveBeenCalledTimes(1)
  })

  it('leaving the page while a request is in flight ignores its answer and polls no more', async () => {
    let resolve
    getBookingByHold.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const { c, w } = await setup()
    w.unmount()
    resolve(res({ status: 'pending' })); await flushPromises()
    await tick(30000)
    expect(getBookingByHold).toHaveBeenCalledTimes(1)
    expect(c.state.value).toBe('checking')
  })
})

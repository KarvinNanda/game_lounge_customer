import { describe, it, expect } from 'vitest'
import { nextSlotSelection } from '@/utils/slots'

describe('nextSlotSelection', () => {
  it('starts a selection from empty', () => {
    expect(nextSlotSelection([], '10:00')).toEqual({ slots: ['10:00'], restarted: false })
  })

  it('appends the next consecutive hour', () => {
    expect(nextSlotSelection(['10:00', '11:00'], '12:00').slots).toEqual(['10:00', '11:00', '12:00'])
  })

  it('prepends the previous consecutive hour', () => {
    expect(nextSlotSelection(['10:00', '11:00'], '09:00').slots).toEqual(['09:00', '10:00', '11:00'])
  })

  it('restarts from the tapped slot when it is not adjacent', () => {
    expect(nextSlotSelection(['10:00', '11:00'], '14:00')).toEqual({ slots: ['14:00'], restarted: true })
  })

  it('removes the tapped slot and everything after it', () => {
    expect(nextSlotSelection(['10:00', '11:00', '12:00'], '11:00')).toEqual({ slots: ['10:00'], restarted: false })
  })

  it('removes only the last slot when the last one is tapped', () => {
    expect(nextSlotSelection(['10:00', '11:00', '12:00'], '12:00').slots).toEqual(['10:00', '11:00'])
  })

  it('clears the selection when the first slot is tapped', () => {
    expect(nextSlotSelection(['10:00', '11:00'], '10:00').slots).toEqual([])
  })

  it('treats 23:00 → 00:00 as consecutive (late-night sessions)', () => {
    expect(nextSlotSelection(['22:00', '23:00'], '00:00').slots).toEqual(['22:00', '23:00', '00:00'])
  })

  it('does not mutate the input array', () => {
    const selected = ['10:00']
    nextSlotSelection(selected, '11:00')
    expect(selected).toEqual(['10:00'])
  })
})

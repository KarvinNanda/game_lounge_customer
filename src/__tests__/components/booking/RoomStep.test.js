import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RoomStep from '@/components/booking/RoomStep.vue'

// Bentuk GET /public/room-templates: tanpa facilities (hanya ada di endpoint detail)
const ROOMS = [{ id: 8, name: 'VIP', description: null, image_url: null, capacity_min: 2, capacity_max: 6, min_price: 25000 }]

describe('RoomStep', () => {
  it('lists rooms with capacity and the starting price', () => {
    const w = mount(RoomStep, { props: { rooms: ROOMS, modelValue: 0 } })
    expect(w.text()).toContain('2–6 orang')
    expect(w.text()).toContain('Rp 25.000')
  })

  it('renders no facility chips (the list API never sends facilities; RoomDetail shows them)', () => {
    const w = mount(RoomStep, { props: { rooms: [{ ...ROOMS[0], facilities: [{ id: 1, name: 'PlayStation 5' }] }], modelValue: 0 } })
    expect(w.find('[data-facility]').exists()).toBe(false)
  })
  it('emits select with the room', async () => {
    const w = mount(RoomStep, { props: { rooms: ROOMS, modelValue: 0 } })
    await w.find('[role="radio"]').trigger('click')
    expect(w.emitted('select')[0]).toEqual([ROOMS[0]])
  })
  it('shows skeletons while loading and an empty state when there are no rooms', () => {
    expect(mount(RoomStep, { props: { rooms: [], loading: true } }).findAll('.skeleton').length).toBeGreaterThan(0)
    expect(mount(RoomStep, { props: { rooms: [] } }).text()).toContain('Belum ada ruangan')
  })


  it('stays reachable by Tab when the selected value is not in the list', () => {
    const w = mount(RoomStep, { props: { rooms: ROOMS, modelValue: 999 } })
    expect(w.find('[role="radio"]').attributes('tabindex')).toBe('0')
  })

  it('arrow keys only move focus (choosing a room advances the accordion)', async () => {
    const rooms = [ROOMS[0], { ...ROOMS[0], id: 9, name: 'Regular' }]
    const w = mount(RoomStep, { props: { rooms, modelValue: 0 }, attachTo: document.body })
    w.findAll('[role="radio"]')[0].element.focus()
    await w.findAll('[role="radio"]')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('select')).toBeUndefined()
    w.unmount()
  })
})

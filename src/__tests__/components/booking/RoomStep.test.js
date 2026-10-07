import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RoomStep from '@/components/booking/RoomStep.vue'

const ROOMS = [{ id: 8, name: 'VIP', capacity_min: 2, capacity_max: 6, min_price: 25000, facilities: ['PS5', 'AC', 'TV', 'Sofa'] }]

describe('RoomStep', () => {
  it('lists rooms with capacity, up to 3 facilities and the starting price', () => {
    const w = mount(RoomStep, { props: { rooms: ROOMS, modelValue: 0 } })
    expect(w.text()).toContain('2–6 orang')
    expect(w.text()).toContain('PS5')
    expect(w.text()).not.toContain('Sofa')
    expect(w.text()).toContain('Rp 25.000')
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

  it('accepts facilities as objects (detail API shape) as well as strings', () => {
    const w = mount(RoomStep, { props: { rooms: [{ ...ROOMS[0], facilities: [{ id: 1, name: 'PlayStation 5' }] }], modelValue: 0 } })
    // Vue merender object sebagai JSON — cek isi chip persis, bukan sekadar "mengandung"
    expect(w.findAll('[data-facility]').map((c) => c.text())).toEqual(['PlayStation 5'])
  })
})

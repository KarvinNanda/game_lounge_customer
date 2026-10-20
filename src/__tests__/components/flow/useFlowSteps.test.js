import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFlowSteps } from '@/components/flow/useFlowSteps'

const states = (f, n = 4) => Array.from({ length: n }, (_, i) => f.stateOf(i))

describe('useFlowSteps', () => {
  it('states follow the current step', () => {
    const f = useFlowSteps(4, ref(2))
    expect(states(f)).toEqual(['done', 'done', 'active', 'locked'])
  })

  it('when complete, the last step stays open (multi-select, confirmed via the pay bar)', () => {
    const f = useFlowSteps(4, ref(4))
    expect(states(f)).toEqual(['done', 'done', 'done', 'active'])
    expect(f.ready.value).toBe(true)
    expect(f.remaining.value).toBe(0)
  })

  it('editing an earlier step makes it the only active one; later unlocked steps show as done', () => {
    const f = useFlowSteps(4, ref(3))
    f.edit(0)
    expect(states(f)).toEqual(['active', 'done', 'done', 'done'])
  })

  it('editing an earlier step of a complete flow collapses the last step', () => {
    const f = useFlowSteps(4, ref(4))
    f.edit(1)
    expect(states(f)).toEqual(['done', 'active', 'done', 'done'])
  })

  it('edit() on a locked step is ignored', () => {
    const f = useFlowSteps(4, ref(1))
    f.edit(3)
    expect(f.editing.value).toBeNull()
    expect(states(f)).toEqual(['done', 'active', 'locked', 'locked'])
  })

  it('cancelEdit() returns to the natural states', () => {
    const f = useFlowSteps(4, ref(2))
    f.edit(0); f.cancelEdit()
    expect(f.editing.value).toBeNull()
    expect(states(f)).toEqual(['done', 'done', 'active', 'locked'])
  })

  it('remaining tracks the current step', async () => {
    const current = ref(1)
    const f = useFlowSteps(4, current)
    expect(f.remaining.value).toBe(3)
    current.value = 3; await nextTick()
    expect(f.remaining.value).toBe(1)
    expect(f.ready.value).toBe(false)
  })
})

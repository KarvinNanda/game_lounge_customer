import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ToastContainer from '@/components/ToastContainer.vue'

// Mock useToast so we control what toasts are rendered
vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(),
}))

import { useToast } from '@/composables/useToast'

const mountContainer = (toastList = []) => {
  const mockToasts = ref(toastList)
  const mockRemove = vi.fn()
  useToast.mockReturnValue({ toasts: mockToasts, remove: mockRemove })

  return {
    wrapper: mount(ToastContainer, {
      global: {
        // Stub Teleport so it renders inline — easier to query in jsdom
        stubs: { Teleport: true, TransitionGroup: false },
      },
      attachTo: document.body,
    }),
    mockToasts,
    mockRemove,
  }
}

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Empty state ──────────────────────────────────────────────────────────────

  it('renders nothing when there are no toasts', () => {
    const { wrapper } = mountContainer([])
    expect(wrapper.findAll('[class*="rounded-2xl"]')).toHaveLength(0)
  })

  // ── Rendering toasts ─────────────────────────────────────────────────────────

  it('renders one toast card per toast in the list', () => {
    const { wrapper } = mountContainer([
      { id: 1, message: 'Hello', type: 'success' },
      { id: 2, message: 'Oops',  type: 'error'   },
    ])
    // Each toast renders as a div with cursor-pointer
    expect(wrapper.findAll('[class*="cursor-pointer"]')).toHaveLength(2)
  })

  it('displays the toast message text', () => {
    const { wrapper } = mountContainer([
      { id: 1, message: 'File saved!', type: 'success' },
    ])
    expect(wrapper.text()).toContain('File saved!')
  })

  it('displays the correct icon for success toasts', () => {
    const { wrapper } = mountContainer([{ id: 1, message: 'OK', type: 'success' }])
    expect(wrapper.text()).toContain('✅')
  })

  it('displays the correct icon for error toasts', () => {
    const { wrapper } = mountContainer([{ id: 1, message: 'Fail', type: 'error' }])
    expect(wrapper.text()).toContain('❌')
  })

  it('displays the correct icon for warning toasts', () => {
    const { wrapper } = mountContainer([{ id: 1, message: 'Watch out', type: 'warning' }])
    expect(wrapper.text()).toContain('⚠️')
  })

  it('displays the correct icon for info toasts', () => {
    const { wrapper } = mountContainer([{ id: 1, message: 'FYI', type: 'info' }])
    expect(wrapper.text()).toContain('ℹ️')
  })

  // ── Dismiss on click ─────────────────────────────────────────────────────────

  it('calls remove(id) when a toast card is clicked', async () => {
    const { wrapper, mockRemove } = mountContainer([
      { id: 7, message: 'Click to dismiss', type: 'info' },
    ])
    const toastEl = wrapper.find('[class*="cursor-pointer"]')
    await toastEl.trigger('click')
    expect(mockRemove).toHaveBeenCalledWith(7)
  })

  it('calls remove with the correct id for each individual toast', async () => {
    const { wrapper, mockRemove } = mountContainer([
      { id: 10, message: 'First',  type: 'success' },
      { id: 20, message: 'Second', type: 'error'   },
    ])
    const toasts = wrapper.findAll('[class*="cursor-pointer"]')
    await toasts[1].trigger('click')
    expect(mockRemove).toHaveBeenCalledWith(20)
    expect(mockRemove).not.toHaveBeenCalledWith(10)
  })
})

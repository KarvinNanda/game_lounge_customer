import { vi, beforeEach } from 'vitest'

// Reset localStorage before every test
beforeEach(() => {
  localStorage.clear()
})

// Stub browser APIs not in jsdom
Object.defineProperty(window, 'location', {
  value: { href: '', assign: vi.fn() },
  writable: true,
})

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Silence console.warn/error from Vue internals in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})

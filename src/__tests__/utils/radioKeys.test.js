import { describe, it, expect, afterEach } from 'vitest'
import { onRadioKeydown, onRadioKeydownManual, radioTabindex } from '@/utils/radioKeys'

let root
afterEach(() => root?.remove())

// Grup nyata (bukan currentTarget palsu): radio + link di dalamnya, seperti BranchStep
const group = (checkedIndex = -1, handler = onRadioKeydown) => {
  root = document.createElement('div')
  root.setAttribute('role', 'radiogroup')
  root.innerHTML = ['A', 'B', 'C'].map((t, i) =>
    `<div><button role="radio" aria-checked="${i === checkedIndex}">${t}</button><a href="#" id="link-${t}">maps</a></div>`).join('')
  document.body.appendChild(root)
  root.addEventListener('keydown', handler)
  const radios = [...root.querySelectorAll('[role=radio]')]
  radios.forEach((r) => r.addEventListener('click', () => { r.dataset.clicked = '1' }))
  return radios
}
const press = (el, key, opts = {}) => {
  el.focus()
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts })
  el.dispatchEvent(e)
  return e
}

describe('onRadioKeydown (selection follows focus)', () => {
  it('ArrowDown moves focus to the next radio and selects it', () => {
    const [a, b] = group(0)
    expect(press(a, 'ArrowDown').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(b)
    expect(b.dataset.clicked).toBe('1')
  })
  it('ArrowLeft wraps from first to last; Home/End jump', () => {
    const [a, , c] = group(0)
    press(a, 'ArrowLeft'); expect(document.activeElement).toBe(c)
    press(c, 'Home');      expect(document.activeElement).toBe(a)
    press(a, 'End');       expect(document.activeElement).toBe(c)
  })
  it('ignores keys pressed on a non-radio element inside the group (e.g. the Maps link)', () => {
    const radios = group(0)
    const e = press(root.querySelector('#link-A'), 'ArrowDown')
    expect(e.defaultPrevented).toBe(false)
    expect(radios.some((r) => r.dataset.clicked)).toBe(false)
  })
  it('ignores modifier + arrow (browser/OS shortcuts)', () => {
    const [a] = group(0)
    expect(press(a, 'ArrowDown', { altKey: true }).defaultPrevented).toBe(false)
  })
})

describe('onRadioKeydownManual (for groups that advance on select)', () => {
  it('arrows only move focus; nothing is selected', () => {
    const [a, b] = group(0, onRadioKeydownManual)
    press(a, 'ArrowDown')
    expect(document.activeElement).toBe(b)
    expect(b.dataset.clicked).toBeUndefined()
  })
})

describe('radioTabindex', () => {
  it('only the checked radio is a Tab stop', () => {
    expect([0, 1, 2].map((i) => radioTabindex(i === 1, i, true))).toEqual([-1, 0, -1])
  })
  it('the first radio is the Tab stop when nothing in the list is checked', () => {
    expect([0, 1, 2].map((i) => radioTabindex(false, i, false))).toEqual([0, -1, -1])
  })
})

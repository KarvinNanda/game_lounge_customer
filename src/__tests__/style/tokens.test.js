import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(process.cwd(), 'src/style.css'), 'utf8')

// Warna dikunci oleh owner — nilai ini tidak boleh berubah
const LOCKED_COLORS = [
  '#010214', '#020B2E', '#0B2350', '#063271', '#0282DE', '#016DBE', '#19B9EE',
  '#0160A8', '#FBBF24', '#34D399', '#F87171', '#F0F4FF', '#C9D4E2', '#7A8BA8',
]

const vueFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name)
  if (statSync(p).isDirectory()) return name === '__tests__' ? [] : vueFiles(p)
  return p.endsWith('.vue') ? [p] : []
})

describe('design tokens (style.css)', () => {
  it('uses the HUD font stack', () => {
    expect(css).toMatch(/--font-display:\s*'Russo One'/)
    expect(css).toMatch(/--font-sans:\s*'Chakra Petch'/)
    expect(css).toMatch(/--font-mono:\s*'JetBrains Mono Variable'/)
  })

  it('keeps every locked color value', () => {
    for (const hex of LOCKED_COLORS) expect(css).toContain(hex)
  })

  it('drops the scroll-reveal and Ken Burns motion', () => {
    expect(css).not.toContain('.reveal')
    expect(css).not.toContain('ken-burns')
  })

  it('respects prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion')
  })

  it('defines the HUD utilities', () => {
    for (const u of ['hud-cut', 'hud-cut-sm', 'hud-label', 'hud-press', 'hud-grid-bg']) {
      expect(css).toMatch(new RegExp(`@utility ${u}\\b`))
    }
  })
})

describe('no raw hex colors in components', () => {
  it('class and style attributes in .vue files contain no hex values', () => {
    const offenders = vueFiles(join(process.cwd(), 'src')).filter((f) =>
      /(class|style)="[^"]*#[0-9a-fA-F]{3,8}\b/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})

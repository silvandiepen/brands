import { describe, it, expect } from 'vitest'
import { generatePreviewSvg } from '../svg.js'

const innerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1DB954"/></svg>`

describe('generatePreviewSvg', () => {
  it('generates light preview with background', () => {
    const preview = generatePreviewSvg(innerSvg, { theme: 'light' })
    expect(preview).toContain('<svg')
    expect(preview).toContain('</svg>')
    expect(preview).toContain('#f8f9fa')
  })

  it('generates dark preview with dark background', () => {
    const preview = generatePreviewSvg(innerSvg, { theme: 'dark' })
    expect(preview).toContain('#1a1a2e')
  })

  it('generates checkerboard preview', () => {
    const preview = generatePreviewSvg(innerSvg, { theme: 'checkerboard' })
    expect(preview).toContain('pattern')
    expect(preview).toContain('checker')
  })

  it('preserves inner SVG content', () => {
    const preview = generatePreviewSvg(innerSvg, { theme: 'light' })
    expect(preview).toContain('circle')
    expect(preview).toContain('#1DB954')
  })

  it('wraps in a viewBox wrapper', () => {
    const preview = generatePreviewSvg(innerSvg, { theme: 'light' })
    expect(preview).toContain('viewBox="0 0 100 100"')
  })

  it('is deterministic', () => {
    const p1 = generatePreviewSvg(innerSvg, { theme: 'light' })
    const p2 = generatePreviewSvg(innerSvg, { theme: 'light' })
    expect(p1).toBe(p2)
  })
})

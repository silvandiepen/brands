import { describe, it, expect } from 'vitest'
import { validateSvgSecurity, extractSvgMetadata, normalizeSvg } from '../svg.js'

const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1DB954"/></svg>`

describe('validateSvgSecurity', () => {
  it('accepts safe SVG', () => {
    const result = validateSvgSecurity(safeSvg)
    expect(result.safe).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('rejects script elements', () => {
    const result = validateSvgSecurity(`<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>`)
    expect(result.safe).toBe(false)
    expect(result.violations.some((v) => v.includes('script'))).toBe(true)
  })

  it('rejects event handlers', () => {
    const result = validateSvgSecurity(`<svg viewBox="0 0 10 10" onload="alert(1)"></svg>`)
    expect(result.safe).toBe(false)
  })

  it('rejects DOCTYPE', () => {
    const result = validateSvgSecurity(`<!DOCTYPE svg><svg viewBox="0 0 10 10"></svg>`)
    expect(result.safe).toBe(false)
  })

  it('rejects foreignObject', () => {
    const result = validateSvgSecurity(`<svg viewBox="0 0 10 10"><foreignObject><div>x</div></foreignObject></svg>`)
    expect(result.safe).toBe(false)
  })

  it('rejects data URLs', () => {
    const result = validateSvgSecurity(`<svg viewBox="0 0 10 10"><image href="data:image/png;base64,abc"/></svg>`)
    expect(result.safe).toBe(false)
  })

  it('rejects JavaScript URLs', () => {
    const result = validateSvgSecurity(`<svg viewBox="0 0 10 10"><a xlink:href="javascript:alert(1)"><rect/></a></svg>`)
    expect(result.safe).toBe(false)
  })

  it('rejects missing viewBox', () => {
    const result = validateSvgSecurity(`<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>`)
    expect(result.safe).toBe(false)
  })
})

describe('extractSvgMetadata', () => {
  it('extracts viewBox', () => {
    const meta = extractSvgMetadata(safeSvg)
    expect(meta.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 })
    expect(meta.width).toBe(24)
    expect(meta.height).toBe(24)
  })

  it('computes sha256', () => {
    const meta = extractSvgMetadata(safeSvg)
    expect(meta.sha256).toMatch(/^[a-f0-9]{64}$/)
  })

  it('extracts colors', () => {
    const meta = extractSvgMetadata(safeSvg)
    expect(meta.colors).toContain('#1DB954')
  })

  it('counts elements', () => {
    const meta = extractSvgMetadata(safeSvg)
    expect(meta.elementCount).toBeGreaterThan(0)
  })
})

describe('normalizeSvg', () => {
  it('strips XML declaration', () => {
    const result = normalizeSvg(`<?xml version="1.0"?>\n<svg viewBox="0 0 10 10"><rect/></svg>`)
    expect(result).not.toContain('<?xml')
  })

  it('strips comments', () => {
    const result = normalizeSvg(`<svg viewBox="0 0 10 10"><!-- comment --><rect/></svg>`)
    expect(result).not.toContain('<!--')
  })

  it('replaces named colors', () => {
    const result = normalizeSvg(`<svg viewBox="0 0 10 10"><rect fill="red"/></svg>`)
    expect(result).toContain('#FF0000')
  })

  it('is deterministic', () => {
    const input = `<svg viewBox="0 0 10 10"><rect/></svg>`
    expect(normalizeSvg(input)).toBe(normalizeSvg(input))
  })
})

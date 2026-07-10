import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  relativeLuminance,
  contrastRatio,
  generateColorFormats,
} from '../colors.js'

describe('hexToRgb', () => {
  it('converts hex to RGB', () => {
    expect(hexToRgb('#4285F4')).toEqual({ r: 66, g: 133, b: 244 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex({ r: 66, g: 133, b: 244 })).toBe('#4285f4')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })
})

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 })
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('converts pure green', () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 })
    expect(hsl.h).toBe(120)
  })

  it('converts white', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 })
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(100)
  })
})

describe('rgbToOklch', () => {
  it('produces valid OKLCH values', () => {
    const oklch = rgbToOklch({ r: 66, g: 133, b: 244 })
    expect(oklch.l).toBeGreaterThan(0)
    expect(oklch.l).toBeLessThanOrEqual(1)
    expect(oklch.c).toBeGreaterThan(0)
    expect(oklch.h).toBeGreaterThanOrEqual(0)
    expect(oklch.h).toBeLessThan(360)
  })

  it('handles black', () => {
    const oklch = rgbToOklch({ r: 0, g: 0, b: 0 })
    expect(oklch.l).toBe(0)
    expect(oklch.c).toBe(0)
  })
})

describe('relativeLuminance', () => {
  it('white has luminance near 1', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2)
  })

  it('black has luminance 0', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
  })
})

describe('contrastRatio', () => {
  it('black on white has contrast 21:1', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('same color has contrast 1:1', () => {
    const ratio = contrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 })
    expect(ratio).toBeCloseTo(1, 2)
  })
})

describe('generateColorFormats', () => {
  it('generates all color formats', () => {
    const formats = generateColorFormats('#4285F4')
    expect(formats.hex).toBe('#4285F4')
    expect(formats.rgb).toContain('rgb(')
    expect(formats.hsl).toContain('hsl(')
    expect(formats.oklch).toContain('oklch(')
    expect(formats.luminance).toBeGreaterThan(0)
    expect(formats.contrastOnWhite).toBeGreaterThan(1)
    expect(formats.contrastOnBlack).toBeGreaterThan(1)
    expect(['#ffffff', '#000000']).toContain(formats.recommendedTextColor)
  })
})

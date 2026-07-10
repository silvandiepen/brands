export interface RGB { r: number; g: number; b: number }

export interface HSL { h: number; s: number; l: number }

export interface OKLCH { l: number; c: number; h: number }

export interface ColorFormats {
  hex: string
  rgb: string
  hsl: string
  oklch: string
  luminance: number
  contrastOnWhite: number
  contrastOnBlack: number
  cssVar: (name: string) => string
  scssVar: (name: string) => string
  recommendedTextColor: string
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return { r, g, b }
}

export function rgbToHex(rgb: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const lr = srgbToLinear(rgb.r / 255)
  const lg = srgbToLinear(rgb.g / 255)
  const lb = srgbToLinear(rgb.b / 255)

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  const okL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const okA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const chroma = Math.sqrt(okA * okA + okB * okB)
  const hue = okA === 0 && okB === 0 ? 0 : (Math.atan2(okB, okA) * 180) / Math.PI

  return {
    l: +okL.toFixed(4),
    c: +chroma.toFixed(4),
    h: +(hue < 0 ? hue + 360 : hue).toFixed(2),
  }
}

export function relativeLuminance(rgb: RGB): number {
  const r = srgbToLinear(rgb.r / 255)
  const g = srgbToLinear(rgb.g / 255)
  const b = srgbToLinear(rgb.b / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = relativeLuminance(rgb1)
  const l2 = relativeLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const WHITE: RGB = { r: 255, g: 255, b: 255 }
const BLACK: RGB = { r: 0, g: 0, b: 0 }

export function generateColorFormats(hex: string): ColorFormats {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const oklch = rgbToOklch(rgb)
  const lum = relativeLuminance(rgb)
  const cw = contrastRatio(rgb, WHITE)
  const cb = contrastRatio(rgb, BLACK)
  const recommendedText = cw >= cb ? '#ffffff' : '#000000'

  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    oklch: `oklch(${oklch.l} ${oklch.c} ${oklch.h})`,
    luminance: +lum.toFixed(4),
    contrastOnWhite: +cw.toFixed(2),
    contrastOnBlack: +cb.toFixed(2),
    cssVar: (name: string) => `--${name}: ${hex};`,
    scssVar: (name: string) => `$${name}: ${hex};`,
    recommendedTextColor: recommendedText,
  }
}

import { createHash } from 'node:crypto'

export interface SvgSecurityResult {
  safe: boolean
  violations: string[]
  warnings: string[]
}

export interface SvgMetadata {
  viewBox: { x: number; y: number; width: number; height: number } | null
  width: number
  height: number
  sha256: string
  byteSize: number
  elementCount: number
  pathCount: number
  filterCount: number
  gradientCount: number
  colors: string[]
}

const SECURITY_PATTERNS: [RegExp, string][] = [
  [/<!DOCTYPE/i, 'DOCTYPE declarations'],
  [/<!ENTITY/i, 'XML entities'],
  [/<\?(?!xml\b)/i, 'processing instructions'],
  [/<script\b/i, 'script elements'],
  [/<foreignObject\b/i, 'foreignObject elements'],
  [/<(?:iframe|object|embed|audio|video)\b/i, 'active or embedded media elements'],
  [/\son[a-z0-9_-]+\s*=/i, 'event-handler attributes'],
  [/javascript\s*:/i, 'JavaScript URLs'],
  [/(?:href|xlink:href)\s*=\s*["']data:/i, 'embedded data URLs'],
  [/@import\b/i, 'stylesheet imports'],
  [/expression\s*\(/i, 'CSS expressions'],
  [/(?:href|xlink:href)\s*=\s*["'](?!#|https?:\/\/)/i, 'non-fragment external href references'],
  [/url\s*\(\s*(?!["']?#)/i, 'external CSS URL references'],
]

const MAX_ELEMENTS = 5000
const MAX_PATHS = 2000
const MAX_FILTERS = 50
const MAX_GRADIENTS = 200
const MAX_BYTES = 512 * 1024

export function validateSvgSecurity(source: string): SvgSecurityResult {
  const violations: string[] = []
  const warnings: string[] = []

  const bytes = Buffer.byteLength(source)
  if (bytes > MAX_BYTES) violations.push(`File size ${bytes} exceeds maximum ${MAX_BYTES} bytes`)

  if (!/<svg\b/i.test(source) || !/<\/svg>\s*$/i.test(source)) {
    violations.push('Not a complete SVG document')
  }
  if (!/\bviewBox\s*=\s*["'][^"']+["']/i.test(source)) {
    violations.push('Missing viewBox attribute')
  }
  if (/\b(?:NaN|Infinity|-Infinity)\b/.test(source)) {
    violations.push('Contains non-finite values')
  }

  for (const [pattern, label] of SECURITY_PATTERNS) {
    if (pattern.test(source)) violations.push(`Contains forbidden ${label}`)
  }

  const elementCount = (source.match(/<[A-Za-z][^!?/\s>]*/g) || []).length
  const pathCount = (source.match(/<path\b/gi) || []).length
  const filterCount = (source.match(/<filter\b/gi) || []).length
  const gradientCount = (source.match(/<(?:linearGradient|radialGradient)\b/gi) || []).length

  if (elementCount > MAX_ELEMENTS) violations.push(`${elementCount} elements exceeds max ${MAX_ELEMENTS}`)
  if (pathCount > MAX_PATHS) violations.push(`${pathCount} paths exceeds max ${MAX_PATHS}`)
  if (filterCount > MAX_FILTERS) violations.push(`${filterCount} filters exceeds max ${MAX_FILTERS}`)
  if (gradientCount > MAX_GRADIENTS) violations.push(`${gradientCount} gradients exceeds max ${MAX_GRADIENTS}`)

  return { safe: violations.length === 0, violations, warnings }
}

export function normalizeSvg(source: string): string {
  let svg = source

  svg = svg.replace(/<\?xml[^?]*\?>\s*/i, '')
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  svg = svg.trim()

  svg = svg.replace(/\s+\/>/g, '/>')
  svg = svg.replace(/\s+>/g, '>')
  svg = svg.replace(/>\s+</g, '><')

  const colors: Record<string, string> = {
    white: '#FFFFFF', black: '#000000', red: '#FF0000', green: '#00FF00',
    blue: '#0000FF', yellow: '#FFFF00', cyan: '#00FFFF', magenta: '#FF00FF',
    gray: '#808080', grey: '#808080',
  }
  for (const [name, hex] of Object.entries(colors)) {
    const re = new RegExp(`\\b${name}\\b`, 'gi')
    svg = svg.replace(re, hex)
  }

  svg = svg.replace(/\bid\s*=\s*["']([^"']+)["']/gi, (match, id) => {
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-')
    return `id="${safeId}"`
  })

  return svg + '\n'
}

export function extractSvgMetadata(source: string): SvgMetadata {
  const sha256 = createHash('sha256').update(source).digest('hex')
  const byteSize = Buffer.byteLength(source)

  const viewBoxMatch = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  let viewBox: SvgMetadata['viewBox'] = null
  let width = 0
  let height = 0

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1]!.split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      viewBox = { x: parts[0]!, y: parts[1]!, width: parts[2]!, height: parts[3]! }
      width = parts[2]!
      height = parts[3]!
    }
  }

  const elementCount = (source.match(/<[A-Za-z][^!?/\s>]*/g) || []).length
  const pathCount = (source.match(/<path\b/gi) || []).length
  const filterCount = (source.match(/<filter\b/gi) || []).length
  const gradientCount = (source.match(/<(?:linearGradient|radialGradient)\b/gi) || []).length

  const hexColors = new Set<string>()
  const hexMatches = source.match(/#([0-9A-Fa-f]{3,8})\b/g) || []
  for (const h of hexMatches) hexColors.add(h.toUpperCase())

  const fillMatches = source.match(/\bfill\s*=\s*["']([^"']+)["']/gi) || []
  const strokeMatches = source.match(/\bstroke\s*=\s*["']([^"']+)["']/gi) || []
  for (const m of [...fillMatches, ...strokeMatches]) {
    const val = m.match(/["']([^"']+)["']/)?.[1]
    if (val && val.startsWith('#')) hexColors.add(val.toUpperCase())
  }

  return {
    viewBox,
    width,
    height,
    sha256,
    byteSize,
    elementCount,
    pathCount,
    filterCount,
    gradientCount,
    colors: [...hexColors].sort(),
  }
}

export function generatePreviewSvg(
  innerSvg: string,
  opts: { theme: 'light' | 'dark' | 'checkerboard'; padding?: number } = { theme: 'light' },
): string {
  const padding = opts.padding ?? 40

  const inner = innerSvg.replace(/^<\?xml[^?]*\?>\s*/i, '')
  const svgMatch = inner.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i)
  const content = svgMatch ? svgMatch[1]! : inner
  const viewBoxMatch = inner.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const viewBox = viewBoxMatch ? viewBoxMatch[1]! : '0 0 100 100'

  const bg = opts.theme === 'dark' ? '#1a1a2e' : opts.theme === 'checkerboard' ? 'transparent' : '#f8f9fa'
  const checkerboard = opts.theme === 'checkerboard'
    ? `<defs><pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#e0e0e0"/><rect x="10" y="10" width="10" height="10" fill="#e0e0e0"/></pattern></defs><rect width="100%" height="100%" fill="url(#checker)"/>`
    : `<rect width="100%" height="100%" fill="${bg}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g>${checkerboard}<svg viewBox="${viewBox}" x="${padding / 2}" y="${padding / 2}" width="${100 - padding}" height="${100 - padding}">${content}</svg></g></svg>\n`
}

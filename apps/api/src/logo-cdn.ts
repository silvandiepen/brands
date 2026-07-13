import { getIndex, getBrand } from './data.js'
import { corsHeaders } from './http.js'
import type { Env } from './env.js'
import allSvgsData from '../../../packages/data/generated/all-svgs.json'

const indexData = getIndex()
const bundledSvgs = allSvgsData as Record<string, string>

// Resolves the asset id to serve for a requested logo `type`, honoring the
// brand's actual manifest instead of guessing at filenames — an asset's id
// doesn't always match its type, and untyped guesses previously fell back
// to the brand's default asset regardless of what type was requested.
function resolveAsset(brandId: string, type: string): { id: string; file: string } | null {
  const brand = getBrand(brandId)
  if (!brand) return null

  const byType = brand.assets.filter((a) => a.type === type)
  const match = byType.find((a) => a.current) ?? byType[0]
  if (match) return { id: match.id, file: match.file }

  const fallback = brand.assets.find((a) => a.current) ?? brand.assets[0]
  return fallback ? { id: fallback.id, file: fallback.file } : null
}

function findBrandByDomain(domain: string): string | null {
  const lk = domain.toLowerCase().replace(/^www\./, '')
  for (const [id, brand] of Object.entries(indexData)) {
    if (brand.domains.some((d: string) => d.toLowerCase() === lk)) return id
  }
  return null
}

function findBrandById(id: string): string | null {
  const lk = id.toLowerCase()
  for (const [id2, brand] of Object.entries(indexData)) {
    if (id2 === lk) return id2
    if (brand.name.toLowerCase() === lk) return id2
    if (brand.aliases.some((a: string) => a.toLowerCase() === lk)) return id2
  }
  return null
}

function lettermark(letter: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="transparent"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="currentColor" text-anchor="middle">${letter}</text></svg>`
}

function toMono(svg: string): string {
  let s = svg

  // Strip gradients, patterns, and style blocks
  s = s.replace(/<linearGradient\b[^>]*>[\s\S]*?<\/linearGradient>/gi, '')
  s = s.replace(/<radialGradient\b[^>]*>[\s\S]*?<\/radialGradient>/gi, '')
  s = s.replace(/<pattern\b[^>]*>[\s\S]*?<\/pattern>/gi, '')
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  // Replace all explicit color fills/strokes with currentColor
  s = s.replace(/\sfill\s*=\s*"(?!none|currentColor)([^"]*)"/gi, ' fill="currentColor"')
  s = s.replace(/\sstroke\s*=\s*"(?!none|currentColor)([^"]*)"/gi, ' stroke="currentColor"')

  // Replace CSS style fills/strokes
  s = s.replace(/style="([^"]*)"/gi, (_match, style: string) => {
    const cleaned = style
      .replace(/fill\s*:\s*(?!none|currentColor)[^;]+/gi, 'fill: currentColor')
      .replace(/stroke\s*:\s*(?!none|currentColor)[^;]+/gi, 'stroke: currentColor')
    return `style="${cleaned}"`
  })

  // Remove class attributes
  s = s.replace(/\sclass\s*=\s*"[^"]*"/gi, '')

  // Set fill="currentColor" on root <svg> so unfilled paths inherit it
  // (SVG default fill is black; this overrides it for CSS control)
  if (!/\sfill\s*=/.test(s.match(/<svg[^>]*>/i)?.[0] ?? '')) {
    s = s.replace(/<svg\b/i, '<svg fill="currentColor"')
  }

  return s
}

const svgHeaders = {
  'Content-Type': 'image/svg+xml',
  'Cache-Control': 'public, max-age=86400',
  ...corsHeaders(),
}

function getBundledSvg(brandId: string, assetId: string): string | null {
  return bundledSvgs[`${brandId}/${assetId}`] ?? null
}

export async function handleLogoCdn(path: string, url: URL, env: Env): Promise<Response> {
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''
  const baseName = last.replace(/\.\w+$/, '')
  const theme = url.searchParams.get('theme') ?? 'mono'
  const width = url.searchParams.get('w')
  const type = url.searchParams.get('type') ?? 'icon'

  let brandId: string | null = null

  if (parts.length >= 2) {
    if (parts[0] === 'domain') brandId = findBrandByDomain(parts[1]!.replace(/\.\w+$/, ''))
    else if (parts[0] === 'id' || parts[0] === 'name') brandId = findBrandById(parts[1]?.replace(/\.\w+$/, '') ?? baseName)
  }
  if (!brandId) brandId = findBrandByDomain(baseName) ?? findBrandById(baseName)

  if (!brandId) {
    return new Response(lettermark(baseName.charAt(0).toUpperCase() || '?'), { headers: svgHeaders })
  }

  const asset = resolveAsset(brandId, type)
  let svg: string | null = null

  // 1. Try R2 — using the asset's real filename from the manifest, not a guess
  if (env.PUBLIC_ASSETS && asset) {
    const fileName = asset.file.replace(/^assets\//, '')
    const obj = await env.PUBLIC_ASSETS.get(`releases/current/brands/${brandId}/${fileName}`)
    if (obj) svg = await obj.text()
  }

  // 2. Fall back to bundled SVG data
  if (!svg && asset) svg = getBundledSvg(brandId, asset.id)

  // 3. Lettermark fallback
  if (!svg) {
    const brand = (indexData as Record<string, { name: string }>)[brandId]
    return new Response(lettermark((brand?.name ?? brandId).charAt(0).toUpperCase()), { headers: svgHeaders })
  }

  // Apply theme — mono by default so CSS currentColor controls the color
  if (theme !== 'color') svg = toMono(svg)
  if (width) svg = svg.replace(/<svg\b/, `<svg width="${width}" height="${width}"`)

  return new Response(svg, { headers: svgHeaders })
}

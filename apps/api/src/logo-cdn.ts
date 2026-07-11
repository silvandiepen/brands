import { getIndex } from './data.js'
import { corsHeaders } from './http.js'
import type { Env } from './env.js'

const indexData = getIndex()

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

function lettermarkSvg(letter: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#f0f0f0"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#666" text-anchor="middle">${letter}</text></svg>`
}

function toMonoInline(svg: string): string {
  let s = svg
  s = s.replace(/<linearGradient\b[^>]*>[\s\S]*?<\/linearGradient>/gi, '')
  s = s.replace(/<radialGradient\b[^>]*>[\s\S]*?<\/radialGradient>/gi, '')
  s = s.replace(/<pattern\b[^>]*>[\s\S]*?<\/pattern>/gi, '')
  s = s.replace(/fill\s*=\s*"(?:url\([^)]*\)|#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|red|blue|green|yellow|orange|purple|pink|gray|grey|black|white)"/gi, (m) => /none/i.test(m) ? m : 'fill="currentColor"')
  s = s.replace(/stroke\s*=\s*"(?:#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|\w+)"/gi, (m) => /none/i.test(m) ? m : 'stroke="currentColor"')
  return s
}

const svgHeaders = {
  'Content-Type': 'image/svg+xml',
  'Cache-Control': 'public, max-age=86400',
  ...corsHeaders(),
}

export async function handleLogoCdn(path: string, url: URL, env: Env): Promise<Response> {
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''
  const baseName = last.replace(/\.\w+$/, '')
  const theme = url.searchParams.get('theme') ?? ''
  const width = url.searchParams.get('w')
  const type = url.searchParams.get('type') ?? 'icon'

  let brandId: string | null = null

  if (parts.length >= 2) {
    if (parts[0] === 'domain') brandId = findBrandByDomain(parts[1]!.replace(/\.\w+$/, ''))
    else if (parts[0] === 'id' || parts[0] === 'name') brandId = findBrandById(parts[1]?.replace(/\.\w+$/, '') ?? baseName)
  }
  if (!brandId) brandId = findBrandByDomain(baseName) ?? findBrandById(baseName)

  if (!brandId) {
    const letter = baseName.charAt(0).toUpperCase() || '?'
    return new Response(lettermarkSvg(letter), { headers: svgHeaders })
  }

  // Try to get SVG from R2 — attempt multiple filename patterns
  const fileNames = [
    type === 'symbol' ? 'symbol.svg' : type === 'wordmark' ? 'wordmark.svg' : 'icon.svg',
    `${brandId}.svg`,
    `${brandId}_icon.svg`,
    `${brandId}_symbol.svg`,
    `${brandId}_wordmark.svg`,
  ]

  if (env.PUBLIC_ASSETS) {
    for (const fileName of fileNames) {
      const r2Key = `releases/current/brands/${brandId}/${fileName}`
      const obj = await env.PUBLIC_ASSETS.get(r2Key)
      if (obj) {
        let svg = await obj.text()
        if (theme === 'mono') svg = toMonoInline(svg)
        if (width) svg = svg.replace(/<svg\b/, `<svg width="${width}" height="${width}"`)
        return new Response(svg, { headers: svgHeaders })
      }
    }
  }

  // Fallback: lettermark
  const brand = (indexData as Record<string, { name: string }>)[brandId]
  const letter = (brand?.name ?? brandId).charAt(0).toUpperCase()
  return new Response(lettermarkSvg(letter), { headers: svgHeaders })
}

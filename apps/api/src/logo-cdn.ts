import { getIndex } from './data.js'
import { corsHeaders } from './http.js'

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

function lettermarkSvg(letter: string, bg = '#f0f0f0', fg = '#333'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="${fg}" text-anchor="middle">${letter}</text></svg>`
}

function applySize(svg: string, width?: number, height?: number): string {
  if (!width && !height) return svg
  const w = width ?? height ?? 128
  const h = height ?? width ?? 128
  return svg.replace(/<svg\b/, `<svg width="${w}" height="${h}"`)
}

function toMonoInline(svg: string): string {
  let s = svg
  s = s.replace(/<linearGradient\b[^>]*>[\s\S]*?<\/linearGradient>/gi, '')
  s = s.replace(/<radialGradient\b[^>]*>[\s\S]*?<\/radialGradient>/gi, '')
  s = s.replace(/<pattern\b[^>]*>[\s\S]*?<\/pattern>/gi, '')
  s = s.replace(/fill\s*=\s*"(?:url\([^)]*\)|#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|\w+)"/gi, (match) => {
    if (/none/i.test(match)) return match
    return 'fill="currentColor"'
  })
  s = s.replace(/stroke\s*=\s*"(?:#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|\w+)"/gi, (match) => {
    if (/none/i.test(match)) return match
    return 'stroke="currentColor"'
  })
  return s
}

export function handleLogoCdn(request: Request, path: string, url: URL, _requestId: string): Response {
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''

  const ext = last.match(/\.(svg|png|webp)$/)?.[1] ?? 'svg'
  const baseName = last.replace(/\.\w+$/, '')

  const theme = url.searchParams.get('theme') ?? ''
  const width = url.searchParams.get('w') ? parseInt(url.searchParams.get('w')!, 10) : undefined
  const height = url.searchParams.get('h') ? parseInt(url.searchParams.get('h')!, 10) : undefined
  const type = url.searchParams.get('type') ?? 'icon'

  let brandId: string | null = null

  if (parts.length >= 2) {
    if (parts[0] === 'domain') {
      brandId = findBrandByDomain(parts[1]!.replace(/\.\w+$/, ''))
    } else if (parts[0] === 'id' && parts[1]) {
      brandId = findBrandById(parts[1].replace(/\.\w+$/, ''))
    } else if (parts[0] === 'name' && parts[1]) {
      brandId = findBrandById(parts[1].replace(/\.\w+$/, ''))
    }
  }

  if (!brandId) {
    brandId = findBrandByDomain(baseName) ?? findBrandById(baseName)
  }

  if (!brandId) {
    const letter = baseName.charAt(0).toUpperCase() || '?'
    return new Response(lettermarkSvg(letter), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
    })
  }

  // For SVG, we can serve directly with transformations
  if (ext === 'svg') {
    // In production this would fetch from R2; for now redirect
    const fileName = type === 'symbol' ? 'symbol.svg' : type === 'wordmark' ? 'wordmark.svg' : 'icon.svg'
    const cdnUrl = `https://cdn.open-brands.org/current/brands/${brandId}/${fileName}`
    const params = new URLSearchParams()
    if (theme === 'mono') params.set('theme', 'mono')
    if (width) params.set('w', String(width))
    if (height) params.set('h', String(height))
    const query = params.toString()
    return Response.redirect(`${cdnUrl}${query ? '?' + query : ''}`, 302)
  }

  // For raster, redirect to CDN with size params
  const cdnUrl = `https://cdn.open-brands.org/current/brands/${brandId}/${type}.${ext}?w=${width ?? 128}${height ? '&h=' + height : ''}`
  return Response.redirect(cdnUrl, 302)
}

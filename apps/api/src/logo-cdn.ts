import { getIndex } from './data.js'
import { jsonResponse, redirectResponse, errorResponse, corsHeaders } from './http.js'

const CDN_ORIGIN = 'https://cdn.open-brands.org'

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

export function handleLogoCdn(request: Request, path: string, _requestId: string): Response {
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''

  const ext = last.match(/\.(svg|png|webp)$/)?.[1] ?? 'svg'
  const baseName = last.replace(/\.\w+$/, '')

  let brandId: string | null = null
  let resolvedBy = 'id'

  if (parts.length >= 2) {
    if (parts[0] === 'domain') {
      brandId = findBrandByDomain(parts[1]!)
      resolvedBy = 'domain'
    } else if (parts[0] === 'id' && parts[1]) {
      brandId = findBrandById(parts[1])
      resolvedBy = 'id'
    } else if (parts[0] === 'name' && parts[1]) {
      brandId = findBrandById(parts[1])
      resolvedBy = 'name'
    }
  }

  if (!brandId) {
    brandId = findBrandByDomain(baseName) ?? findBrandById(baseName)
  }

  if (!brandId) {
    const letter = baseName.charAt(0).toUpperCase() || '?'
    return new Response(lettermarkSvg(letter), {
      headers: { 'Content-Type': 'image/svg+xml', ...corsHeaders() },
    })
  }

  const brand = (indexData as Record<string, { name: string }>)[brandId]
  const redirectUrl = `${CDN_ORIGIN}/current/brands/${brandId}/${baseName === brandId ? 'symbol.svg' : baseName}.${ext}`

  return redirectResponse(redirectUrl)
}

import { getIndex, getManifest, getCategories, getCollections, getBrand, getAllBrands } from './data.js'
import type { GeneratedBrand } from './types.js'
import { jsonResponse, errorResponse, redirectResponse, makeEtag, checkNotModified } from './http.js'

const CDN_ORIGIN = 'https://cdn.open-brands.org'

function paginate<T>(items: T[], page: number, limit: number): { items: T[]; page: number; limit: number; total: number; totalPages: number } {
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages,
  }
}

export function handleMeta(request: Request, _requestId: string): Response {
  const manifest = getManifest()
  const etag = makeEtag(manifest)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse({
    ...manifest,
    cdnOrigin: CDN_ORIGIN,
  }, { etag, headers: { 'X-Dataset-Version': manifest.datasetVersion } })
}

export function handleBrands(request: Request, requestId: string, url: URL): Response {
  const index = getIndex()
  const allBrands = Object.values(index)

  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)))
  const category = url.searchParams.get('category')
  const tag = url.searchParams.get('tag')
  const sort = url.searchParams.get('sort') ?? 'name'

  let filtered = allBrands
  if (category) filtered = filtered.filter((b) => b.categories.includes(category))
  if (tag) filtered = filtered.filter((b) => b.tags.includes(tag))

  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'id') filtered.sort((a, b) => a.id.localeCompare(b.id))

  const result = paginate(filtered, page, limit)
  const etag = makeEtag(result)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })

  return jsonResponse(result, { etag })
}

export function handleBrandDetail(request: Request, requestId: string, brandId: string): Response {
  const brand = getBrand(brandId)
  if (!brand) return errorResponse('NOT_FOUND', `Brand '${brandId}' not found`, 404, requestId)
  const etag = makeEtag(brand)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse(brand, { etag })
}

export function handleBrandColors(request: Request, requestId: string, brandId: string): Response {
  const brand = getBrand(brandId)
  if (!brand) return errorResponse('NOT_FOUND', `Brand '${brandId}' not found`, 404, requestId)
  const etag = makeEtag(brand.colors)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse({ brandId, colors: brand.colors }, { etag })
}

export function handleBrandAssets(request: Request, requestId: string, brandId: string, url: URL): Response {
  const brand = getBrand(brandId)
  if (!brand) return errorResponse('NOT_FOUND', `Brand '${brandId}' not found`, 404, requestId)

  let assets = brand.assets
  const theme = url.searchParams.get('theme')
  const currentOnly = url.searchParams.get('current') === 'true'
  if (theme) assets = assets.filter((a) => a.themes.includes(theme as never) || a.themes.includes('any' as never))
  if (currentOnly) assets = assets.filter((a) => a.current)

  const etag = makeEtag(assets)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse({ brandId, assets }, { etag })
}

export function handleBrandImage(request: Request, requestId: string, brandId: string, url: URL): Response {
  const brand = getBrand(brandId)
  if (!brand) return errorResponse('NOT_FOUND', `Brand '${brandId}' not found`, 404, requestId)

  const type = url.searchParams.get('type') ?? 'symbol'

  const current = brand.assets.filter((a) => a.current)
  let selected = current.find((a) => a.type === type) ?? current[0]
  if (!selected) selected = brand.assets[0]
  if (!selected) return errorResponse('NO_ASSET', `Brand '${brandId}' has no assets`, 404, requestId)

  const file = selected.file.replace(/^assets\//, '')
  const redirectUrl = `${CDN_ORIGIN}/current/brands/${brandId}/${file}`

  return redirectResponse(redirectUrl)
}

export function handleResolve(request: Request, requestId: string, query: string): Response {
  const allBrands = getAllBrands()
  const lk = query.trim().toLowerCase()

  let found: GeneratedBrand | undefined
  let matchType = 'none'

  found = allBrands.find((b) => b.id === lk)
  if (found) matchType = 'id'
  if (!found) {
    found = allBrands.find((b) => b.domains.some((d) => d.toLowerCase() === lk))
    if (found) matchType = 'domain'
  }
  if (!found) {
    found = allBrands.find((b) => b.name.toLowerCase() === lk)
    if (found) matchType = 'name'
  }
  if (!found) {
    found = allBrands.find((b) => b.aliases.some((a) => a.toLowerCase() === lk))
    if (found) matchType = 'alias'
  }

  if (!found) return errorResponse('NOT_FOUND', `No brand matches '${query}'`, 404, requestId)

  return jsonResponse({ query, matchType, brand: found })
}

export function handleSearch(request: Request, requestId: string, url: URL): Response {
  const q = url.searchParams.get('q') ?? ''
  if (!q.trim()) return errorResponse('MISSING_QUERY', 'Query parameter q is required', 400, requestId)

  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)))
  const allBrands = getAllBrands()
  const query = q.toLowerCase()

  const scored = allBrands.map((brand) => {
    let score = 0
    if (brand.id === query) score = 1.0
    else if (brand.id.startsWith(query)) score = 0.8
    else if (brand.name.toLowerCase() === query) score = 1.0
    else if (brand.name.toLowerCase().startsWith(query)) score = 0.85
    else if (brand.name.toLowerCase().includes(query)) score = 0.7
    else if (brand.aliases.some((a) => a.toLowerCase().includes(query))) score = 0.6
    else if (brand.domains.some((d) => d.toLowerCase().includes(query))) score = 0.65
    else if (brand.tags.some((t) => t.toLowerCase().includes(query))) score = 0.3
    return { brand, score }
  }).filter((r) => r.score > 0)

  scored.sort((a, b) => b.score - a.score || a.brand.name.localeCompare(b.brand.name))
  const results = scored.slice(0, limit).map((r) => ({
    id: r.brand.id,
    name: r.brand.name,
    score: +r.score.toFixed(2),
    matchType: r.score >= 1 ? 'exact' : r.score >= 0.6 ? 'partial' : 'fuzzy',
  }))

  return jsonResponse({ query: q, count: results.length, results })
}

export function handleCategories(request: Request, _requestId: string): Response {
  const categories = getCategories()
  const etag = makeEtag(categories)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse(categories, { etag })
}

export function handleCollections(request: Request, _requestId: string): Response {
  const collections = getCollections()
  const etag = makeEtag(collections)
  if (checkNotModified(request, etag)) return new Response(null, { status: 304 })
  return jsonResponse({ collections: Object.values(collections) }, { etag })
}

export function handlePackCreate(request: Request, requestId: string): Response {
  return jsonResponse({
    requestId,
    message: 'Pack creation requires R2 and Queue bindings. Configure wrangler with production bindings.',
    code: 'NOT_CONFIGURED',
  }, { status: 503 })
}

export function handlePackStatus(request: Request, requestId: string, packId: string): Response {
  return errorResponse('NOT_FOUND', `Pack '${packId}' not found`, 404, requestId)
}

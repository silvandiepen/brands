import type { BrandDetail } from '../data/loader'

const API = 'https://open-brands-api.vandipyan.workers.dev'

const brandCache = new Map<string, { data: BrandDetail; fetchedAt: number }>()
const loadingBrands = new Map<string, Promise<BrandDetail | null>>()

export function useBrandApi() {
  async function fetchBrand(brandId: string): Promise<BrandDetail | null> {
    const cached = brandCache.get(brandId)
    if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return cached.data

    if (loadingBrands.has(brandId)) return loadingBrands.get(brandId)!

    const promise = (async () => {
      try {
        const res = await fetch(`${API}/v1/brands/${brandId}`)
        if (!res.ok) return null
        const data = await res.json() as BrandDetail
        brandCache.set(brandId, { data, fetchedAt: Date.now() })
        return data
      } catch {
        return null
      } finally {
        loadingBrands.delete(brandId)
      }
    })()

    loadingBrands.set(brandId, promise)
    return promise
  }

  function logoUrl(brandId: string, opts: { type?: string; theme?: 'mono' | 'color'; size?: number } = {}): string {
    const params = new URLSearchParams()
    if (opts.type) params.set('type', opts.type)
    if (opts.theme === 'mono') params.set('theme', 'mono')
    if (opts.size) params.set('w', String(opts.size))
    const q = params.toString()
    return `${API}/logo/${brandId}.svg${q ? '?' + q : ''}`
  }

  async function search(query: string): Promise<Array<{ id: string; name: string; domain: string | null; score: number }>> {
    if (!query.trim()) return []
    try {
      const res = await fetch(`${API}/v1/search?q=${encodeURIComponent(query)}&limit=20`)
      if (!res.ok) return []
      const data = await res.json() as { results: Array<{ id: string; name: string; domain: string | null; score: number }> }
      return data.results
    } catch {
      return []
    }
  }

  async function resolve(query: string): Promise<BrandDetail | null> {
    try {
      const res = await fetch(`${API}/v1/resolve/${encodeURIComponent(query)}`)
      if (!res.ok) return null
      const data = await res.json() as { brand: BrandDetail }
      brandCache.set(data.brand.id, { data: data.brand, fetchedAt: Date.now() })
      return data.brand
    } catch {
      return null
    }
  }

  return { fetchBrand, logoUrl, search, resolve, API }
}

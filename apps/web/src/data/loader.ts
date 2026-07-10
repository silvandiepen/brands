import indexData from '../../../../packages/data/generated/index.json'
import categoriesData from '../../../../packages/data/generated/categories.json'
import collectionsData from '../../../../packages/data/generated/collections-index.json'
import manifestData from '../../../../packages/data/generated/manifest.json'

export interface CompactBrand {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  categories: string[]
  tags: string[]
  status: string
  hasColors: boolean
  assetCount: number
  reviewStatus: string
}

export interface BrandColor {
  id: string
  name: string | null
  value: string
  role: string
  themes: string[]
  sourceIds: string[]
  reviewStatus: string
  formats: {
    hex: string
    rgb: string
    hsl: string
    oklch: string
    luminance: number
    contrastOnWhite: number
    contrastOnBlack: number
    recommendedTextColor: string
  }
}

export interface BrandAsset {
  id: string
  file: string
  type: string
  variant: string
  themes: string[]
  orientation?: string
  monochrome: boolean
  transformable: boolean
  current: boolean
  sourceIds: string[]
  reviewStatus: string
  metadata: {
    sha256: string
    byteSize: number
    width: number
    height: number
    viewBox: { x: number; y: number; width: number; height: number } | null
    colors: string[]
    elementCount: number
  }
}

export interface BrandDetail {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  status: string
  organization: Record<string, unknown> | null
  categories: string[]
  tags: string[]
  colors: BrandColor[]
  assets: BrandAsset[]
  sources: Array<{ id: string; type: string; url: string; title: string; publisher?: string | null; accessedAt: string; notes?: string | null }>
  review: { status: string; verifiedAt?: string | null; method: string; reviewer?: string | null; notes?: string | null }
}

export const brandIndex = indexData as Record<string, CompactBrand>
export const categories = categoriesData as { categories: Array<{ id: string; label: string; parentId: string | null; description?: string }> }
export const collectionsIndex = collectionsData as Record<string, { id: string; name: string; brandIds: string[] }>
export const releaseManifest = manifestData as { datasetVersion: string; createdAt: string; brandCount: number; assetCount: number; checksum: string }

export const allBrands: CompactBrand[] = Object.values(brandIndex).sort((a, b) => a.name.localeCompare(b.name))

const brandDetailCache = new Map<string, BrandDetail>()

export async function loadBrandDetail(brandId: string): Promise<BrandDetail | null> {
  if (brandDetailCache.has(brandId)) return brandDetailCache.get(brandId)!
  try {
    const mod = await import(`../../../../packages/data/generated/brands/${brandId}.json`)
    const brand = mod.default as BrandDetail
    brandDetailCache.set(brandId, brand)
    return brand
  } catch {
    return null
  }
}

export function getCategoryLabel(id: string): string {
  const cat = categories.categories.find((c) => c.id === id)
  return cat?.label ?? id
}

export function searchBrandsLocal(query: string, limit = 20): CompactBrand[] {
  const q = query.trim().toLowerCase()
  if (!q) return allBrands.slice(0, limit)

  const scored = allBrands.map((brand) => {
    let score = 0
    if (brand.id === q) score = 1.0
    else if (brand.id.startsWith(q)) score = 0.8
    else if (brand.name.toLowerCase() === q) score = 1.0
    else if (brand.name.toLowerCase().startsWith(q)) score = 0.85
    else if (brand.name.toLowerCase().includes(q)) score = 0.7
    else if (brand.aliases.some((a) => a.toLowerCase().includes(q))) score = 0.6
    else if (brand.domains.some((d) => d.toLowerCase().includes(q))) score = 0.65
    else if (brand.tags.some((t) => t.toLowerCase().includes(q))) score = 0.3
    return { brand, score }
  }).filter((r) => r.score > 0)

  scored.sort((a, b) => b.score - a.score || a.brand.name.localeCompare(b.brand.name))
  return scored.slice(0, limit).map((r) => r.brand)
}

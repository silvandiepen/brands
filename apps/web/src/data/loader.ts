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
  primaryColor: string | null
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
  formats?: {
    hex: string; rgb: string; hsl: string; oklch: string
    luminance: number; contrastOnWhite: number; contrastOnBlack: number
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
  current: boolean
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
  sources: Array<{ id: string; type: string; url: string; title: string; accessedAt: string }>
  review: { status: string; method: string }
  social?: Array<{ type: string; url: string }>
  company?: Record<string, unknown> | null
  description?: string | null
  qualityScore?: number
}

export const brandIndex = indexData as Record<string, CompactBrand>
export const categories = categoriesData as { categories: Array<{ id: string; label: string; parentId: string | null }> }
export const collectionsIndex = collectionsData as Record<string, { id: string; name: string; brandIds: string[] }>
export const releaseManifest = manifestData as { datasetVersion: string; createdAt: string; brandCount: number; assetCount: number }

export const allBrands: CompactBrand[] = Object.values(brandIndex).sort((a, b) => a.name.localeCompare(b.name))

export function getCategoryLabel(id: string): string {
  return categories.categories.find(c => c.id === id)?.label ?? id
}

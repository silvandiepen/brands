import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CategoriesFile, BrandManifest } from '@open-brands/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const generatedDir = join(__dirname, '..', 'generated')

function readGenerated<T>(name: string): T {
  return JSON.parse(readFileSync(join(generatedDir, name), 'utf8')) as T
}

export interface CompactBrandEntry {
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

export interface GeneratedColor {
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

export interface GeneratedAsset {
  id: string
  file: string
  type: string
  variant: string
  themes: string[]
  orientation?: string | undefined
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

export interface GeneratedBrand {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  status: string
  organization: BrandManifest['organization']
  categories: string[]
  tags: string[]
  colors: GeneratedColor[]
  assets: GeneratedAsset[]
  sources: BrandManifest['sources']
  review: BrandManifest['review']
}

export interface ReleaseManifest {
  datasetVersion: string
  createdAt: string
  brandCount: number
  assetCount: number
  checksum: string
  brands: Record<string, { name: string; checksum: string }>
}

export function getReleaseManifest(): ReleaseManifest {
  return readGenerated<ReleaseManifest>('manifest.json')
}

export function getCompactIndex(): Record<string, CompactBrandEntry> {
  return readGenerated<Record<string, CompactBrandEntry>>('index.json')
}

export function getBrand(brandId: string): GeneratedBrand | null {
  try {
    return readGenerated<GeneratedBrand>(`brands/${brandId}.json`)
  } catch {
    return null
  }
}

export function getAllBrands(): GeneratedBrand[] {
  const index = getCompactIndex()
  return Object.keys(index).map((id) => getBrand(id)!).filter(Boolean)
}

export function getCategories(): CategoriesFile {
  return readGenerated<CategoriesFile>('categories.json')
}

export function getCollections(): Record<string, { id: string; name: string; brandIds: string[] }> {
  return readGenerated('collections-index.json')
}

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import type { BrandManifest, BrandAsset } from '@open-brands/schema'
import { generateColorFormats } from '@open-brands/core'
import type { LoadedDataset, LoadedBrand } from './validate.js'
import { normalizeSvg, extractSvgMetadata } from './svg.js'

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

export interface CompactAsset {
  id: string
  type: string
  variant: string
  themes: string[]
  monochrome: boolean
  current: boolean
  orientation?: string
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
  colors: Array<{
    id: string
    name: string | null
    value: string
    role: string
    themes: string[]
    sourceIds: string[]
    reviewStatus: string
    formats: ReturnType<typeof generateColorFormats>
  }>
  assets: Array<{
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
  }>
  sources: BrandManifest['sources']
  review: BrandManifest['review']
}

export interface GeneratedRelease {
  datasetVersion: string
  createdAt: string
  brandCount: number
  assetCount: number
  checksum: string
}

function generateDatasetVersion(brandCount: number, assetCount: number): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${date}.${brandCount}.${assetCount}`
}

function deterministicJsonStringify(data: unknown): string {
  return JSON.stringify(data, null, 2) + '\n'
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function generateCompactIndex(dataset: LoadedDataset): Record<string, CompactBrand> {
  const index: Record<string, CompactBrand> = {}
  for (const [id, brand] of dataset.brands) {
    index[id] = {
      id,
      name: brand.manifest.name,
      aliases: brand.manifest.aliases,
      domains: brand.manifest.domains,
      categories: brand.manifest.categories,
      tags: brand.manifest.tags,
      status: brand.manifest.status,
      hasColors: brand.manifest.colors.length > 0,
      assetCount: brand.manifest.assets.length,
      reviewStatus: brand.manifest.review.status,
    }
  }
  return index
}

export function generateBrandDetail(brand: LoadedBrand): GeneratedBrand {
  const m = brand.manifest

  return {
    id: m.id,
    name: m.name,
    aliases: m.aliases,
    domains: m.domains,
    status: m.status,
    organization: m.organization ?? null,
    categories: m.categories,
    tags: m.tags,
    colors: m.colors.map((c) => ({
      id: c.id,
      name: c.name ?? null,
      value: c.value,
      role: c.role,
      themes: c.themes,
      sourceIds: c.sourceIds,
      reviewStatus: c.reviewStatus,
      formats: generateColorFormats(c.value),
    })),
    assets: m.assets.map((a) => {
      const assetData = brand.assets.get(a.id)
      const meta = assetData?.metadata
      return {
        id: a.id,
        file: a.file,
        type: a.type,
        variant: a.variant,
        themes: a.themes,
        orientation: a.orientation ?? undefined,
        monochrome: a.monochrome,
        transformable: a.transformable ?? false,
        current: a.current,
        sourceIds: a.sourceIds,
        reviewStatus: a.reviewStatus,
        metadata: meta ? {
          sha256: meta.sha256,
          byteSize: meta.byteSize,
          width: meta.width,
          height: meta.height,
          viewBox: meta.viewBox,
          colors: meta.colors,
          elementCount: meta.elementCount,
        } : {
          sha256: '',
          byteSize: 0,
          width: 0,
          height: 0,
          viewBox: null,
          colors: [],
          elementCount: 0,
        },
      }
    }),
    sources: m.sources,
    review: m.review,
  }
}

export function generateRelease(
  dataset: LoadedDataset,
  outputDir: string,
): { release: GeneratedRelease; writtenFiles: string[] } {
  const writtenFiles: string[] = []

  let assetCount = 0
  for (const brand of dataset.brands.values()) {
    assetCount += brand.assets.size
  }

  const datasetVersion = generateDatasetVersion(dataset.brands.size, assetCount)
  const createdAt = new Date().toISOString()

  const compactIndex = generateCompactIndex(dataset)
  const compactPath = join(outputDir, 'index.json')
  writeFileSync(compactPath, deterministicJsonStringify(compactIndex))
  writtenFiles.push(compactPath)

  const brandsDir = join(outputDir, 'brands')
  mkdirSync(brandsDir, { recursive: true })

  const brandsIndex: Record<string, { name: string; checksum: string }> = {}
  const allBrands: GeneratedBrand[] = []

  for (const [id, brand] of dataset.brands) {
    const detail = generateBrandDetail(brand)
    allBrands.push(detail)
    const detailPath = join(brandsDir, `${id}.json`)
    const detailJson = deterministicJsonStringify(detail)
    writeFileSync(detailPath, detailJson)
    writtenFiles.push(detailPath)
    brandsIndex[id] = { name: brand.manifest.name, checksum: sha256Hex(detailJson) }
  }

  const allBrandsPath = join(outputDir, 'all-brands.json')
  writeFileSync(allBrandsPath, deterministicJsonStringify(allBrands))
  writtenFiles.push(allBrandsPath)

  const categoriesPath = join(outputDir, 'categories.json')
  writeFileSync(categoriesPath, deterministicJsonStringify(dataset.categories))
  writtenFiles.push(categoriesPath)

  const collectionsDir = join(outputDir, 'collections')
  mkdirSync(collectionsDir, { recursive: true })
  const collectionsIndex: Record<string, { id: string; name: string; brandIds: string[] }> = {}
  for (const colId of dataset.collectionIds) {
    const colPath = join(process.cwd(), 'data/collections', `${colId}.json`)
    try {
      const col = JSON.parse(readFileSync(colPath, 'utf8'))
      collectionsIndex[colId] = { id: colId, name: col.name ?? colId, brandIds: col.brandIds ?? [] }
      writeFileSync(join(collectionsDir, `${colId}.json`), deterministicJsonStringify(col))
      writtenFiles.push(join(collectionsDir, `${colId}.json`))
    } catch { /* skip unreadable collections */ }
  }
  writeFileSync(join(outputDir, 'collections-index.json'), deterministicJsonStringify(collectionsIndex))
  writtenFiles.push(join(outputDir, 'collections-index.json'))

  const release: GeneratedRelease = {
    datasetVersion,
    createdAt,
    brandCount: dataset.brands.size,
    assetCount,
    checksum: '',
  }

  const manifestPath = join(outputDir, 'manifest.json')
  const manifestJson = deterministicJsonStringify({
    ...release,
    brands: brandsIndex,
  })
  const checksum = sha256Hex(manifestJson)
  release.checksum = checksum

  const finalManifest = deterministicJsonStringify({
    ...release,
    brands: brandsIndex,
  })
  writeFileSync(manifestPath, finalManifest)
  writtenFiles.push(manifestPath)

  return { release, writtenFiles }
}

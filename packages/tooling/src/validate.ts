import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  validateBrandManifest,
  validateCategories,
  validateCrossRecord,
  DiagnosticCollector,
  type BrandManifest,
  type CategoriesFile,
  type CrossRecordBrand,
  type CrossRecordContext,
  type Diagnostic,
} from '@open-brands/schema'
import { validateSvgSecurity, extractSvgMetadata, type SvgMetadata } from './svg.js'

export interface LoadedBrand {
  id: string
  dirPath: string
  manifest: BrandManifest
  assets: Map<string, { filePath: string; source: string; metadata: SvgMetadata }>
}

export interface LoadedDataset {
  brands: Map<string, LoadedBrand>
  categories: CategoriesFile
  collectionIds: string[]
}

export interface DatasetValidationResult {
  valid: boolean
  diagnostics: Diagnostic[]
  loaded?: LoadedDataset
}

export function loadCategories(root: string): CategoriesFile {
  const raw = readFileSync(join(root, 'data/categories.json'), 'utf8')
  return JSON.parse(raw) as CategoriesFile
}

export function loadCollectionIds(root: string): string[] {
  const collectionsDir = join(root, 'data/collections')
  if (!existsSync(collectionsDir)) return []
  return readdirSync(collectionsDir)
    .filter((f: string) => f.endsWith('.json'))
    .map((f: string) => f.replace(/\.json$/, ''))
}

export function loadBrandDir(brandDir: string, brandId: string): LoadedBrand | null {
  const manifestPath = join(brandDir, 'brand.json')
  if (!existsSync(manifestPath)) return null

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BrandManifest
  const assets = new Map<string, { filePath: string; source: string; metadata: SvgMetadata }>()

  for (const asset of manifest.assets) {
    const filePath = join(brandDir, asset.file)
    if (!existsSync(filePath)) continue
    const source = readFileSync(filePath, 'utf8')
    const metadata = extractSvgMetadata(source)
    assets.set(asset.id, { filePath, source, metadata })
  }

  return { id: brandId, dirPath: brandDir, manifest, assets }
}

export function loadDataset(root: string): LoadedDataset {
  const brandsDir = join(root, 'data/brands')
  const brands = new Map<string, LoadedBrand>()

  for (const entry of readdirSync(brandsDir)) {
    const brandDir = join(brandsDir, entry)
    if (!statSync(brandDir).isDirectory()) continue
    const loaded = loadBrandDir(brandDir, entry)
    if (loaded) brands.set(loaded.id, loaded)
  }

  return {
    brands,
    categories: loadCategories(root),
    collectionIds: loadCollectionIds(root),
  }
}

export function validateDataset(root: string): DatasetValidationResult {
  const dc = new DiagnosticCollector()

  const categories = loadCategories(root)
  const catResult = validateCategories(categories, { filePath: 'data/categories.json' })
  dc.merge(DiagnosticCollector.from(catResult.diagnostics))

  const validCategoryIds = new Set(categories.categories.map((c) => c.id))

  const crossRecordBrands: CrossRecordBrand[] = []

  for (const [brandId, loaded] of loadDataset(root).brands) {
    const manifestPath = `data/brands/${brandId}/brand.json`
    const result = validateBrandManifest(loaded.manifest, { filePath: manifestPath })
    dc.merge(DiagnosticCollector.from(result.diagnostics))

    crossRecordBrands.push({
      id: brandId,
      manifest: loaded.manifest,
      filePath: manifestPath,
    })

    for (const [assetId, assetData] of loaded.assets) {
      const secResult = validateSvgSecurity(assetData.source)
      for (const v of secResult.violations) {
        dc.error('SVG_SECURITY', v, {
          filePath: `data/brands/${brandId}/assets/${loaded.manifest.assets.find((a) => a.id === assetId)?.file ?? 'unknown'}`,
          brandId,
        })
      }
    }
  }

  const ctx: CrossRecordContext = { validCategoryIds, existingBrandIds: new Set(crossRecordBrands.map((b) => b.id)) }
  const crossResult = validateCrossRecord(crossRecordBrands, ctx)
  dc.merge(DiagnosticCollector.from(crossResult.diagnostics))

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

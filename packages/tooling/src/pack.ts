import { createHash } from 'node:crypto'
import { createZip, type ZipEntry } from './zip.js'
import type { LoadedDataset, LoadedBrand } from './validate.js'

export interface PackConfig {
  brandIds: string[]
  assetTypes: string[]
  themes: string[]
  formats: string[]
  metadata: 'none' | 'compact' | 'complete'
  folderLayout: 'flat' | 'by-brand'
  filenameStrategy: 'stable-id' | 'descriptive'
  includeHistorical: boolean
  includeProvenance: boolean
  datasetVersion: string
}

export interface PackResult {
  zipBuffer: Buffer
  sha256: string
  size: number
  fileCount: number
  brands: string[]
  manifest: Record<string, unknown>
}

const NOTICE_TEMPLATE = `# Open Brands Pack

This pack contains brand identity assets from Open Brands.

## Trademark Notice

Third-party logos, names, marks, and identity material remain the property
of their respective owners and are not relicensed by Open Brands.

Inclusion does not imply ownership, endorsement, affiliation, or permission
for every downstream use.

## Dataset Version

{DATASET_VERSION}

## Generated

{GENERATED_AT}
`

function selectAssetsForPack(
  brand: LoadedBrand,
  config: PackConfig,
): Array<{ assetId: string; file: string; type: string; variant: string }> {
  const assets = brand.manifest.assets.filter((a) => {
    if (!config.includeHistorical && !a.current) return false
    if (config.assetTypes.includes('recommended')) return a.current
    if (config.assetTypes.includes('all-current')) return a.current
    return config.assetTypes.includes(a.type)
  })

  return assets.map((a) => ({
    assetId: a.id,
    file: a.file,
    type: a.type,
    variant: a.variant,
  }))
}

function buildFilePath(
  brandId: string,
  assetFile: string,
  config: PackConfig,
): string {
  const fileName = assetFile.replace(/^assets\//, '')
  if (config.folderLayout === 'by-brand') {
    return `brands/${brandId}/${fileName}`
  }
  return fileName
}

export function buildPack(dataset: LoadedDataset, config: PackConfig): PackResult {
  const entries: ZipEntry[] = []
  const brands: string[] = []
  const manifestAssets: Array<{ brandId: string; assetId: string; sha256: string; file: string }> = []

  for (const brandId of config.brandIds) {
    const brand = dataset.brands.get(brandId)
    if (!brand) continue
    brands.push(brandId)

    const selectedAssets = selectAssetsForPack(brand, config)

    for (const asset of selectedAssets) {
      const assetData = brand.assets.get(asset.assetId)
      if (!assetData) continue

      const filePath = buildFilePath(brandId, asset.file, config)
      entries.push({
        path: filePath,
        data: Buffer.from(assetData.source, 'utf8'),
      })
      manifestAssets.push({
        brandId,
        assetId: asset.assetId,
        sha256: assetData.metadata.sha256,
        file: filePath,
      })
    }

    if (config.metadata !== 'none') {
      const metaPath = config.folderLayout === 'by-brand'
        ? `brands/${brandId}/metadata.json`
        : `${brandId}-metadata.json`

      const metaData = config.metadata === 'complete'
        ? brand.manifest
        : {
            id: brand.manifest.id,
            name: brand.manifest.name,
            colors: brand.manifest.colors.map((c) => ({ id: c.id, value: c.value, role: c.role })),
            sources: brand.manifest.sources.map((s) => ({ id: s.id, url: s.url, title: s.title })),
          }

      entries.push({
        path: metaPath,
        data: Buffer.from(JSON.stringify(metaData, null, 2) + '\n', 'utf8'),
      })
    }
  }

  const generatedAt = new Date().toISOString()
  const manifest = {
    datasetVersion: config.datasetVersion,
    generatedAt,
    brands: brands.map((id) => ({ id, name: dataset.brands.get(id)?.manifest.name })),
    assets: manifestAssets,
    config,
    warnings: [] as string[],
  }

  entries.push({
    path: 'manifest.json',
    data: Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8'),
  })

  entries.push({
    path: 'NOTICE.md',
    data: Buffer.from(
      NOTICE_TEMPLATE
        .replace('{DATASET_VERSION}', config.datasetVersion)
        .replace('{GENERATED_AT}', generatedAt),
      'utf8',
    ),
  })

  const zipBuffer = createZip(entries)
  const sha256 = createHash('sha256').update(zipBuffer).digest('hex')

  return {
    zipBuffer,
    sha256,
    size: zipBuffer.length,
    fileCount: entries.length,
    brands,
    manifest,
  }
}

export function computePackKey(config: PackConfig): string {
  const normalized = JSON.stringify(config, Object.keys(config).sort())
  return createHash('sha256').update(normalized).digest('hex')
}

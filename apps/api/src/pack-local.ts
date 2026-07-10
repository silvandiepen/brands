import { createHash } from 'node:crypto'
import { createZip, type ZipEntry } from '@open-brands/tooling'

interface AssetMeta {
  id: string
  file: string
  type: string
  variant: string
  current: boolean
}

interface BrandData {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  status: string
  categories: string[]
  tags: string[]
  colors: unknown[]
  assets: AssetMeta[]
  sources: unknown[]
  review: unknown
}

import allBrandsData from '../../../packages/data/generated/all-brands.json'

const allBrands = allBrandsData as unknown as BrandData[]
const brandMap = new Map(allBrands.map((b) => [b.id, b]))

export interface LocalPackResult {
  zipBuffer: Buffer
  sha256: string
  size: number
  fileCount: number
  brands: string[]
}

export function computePackKey(config: Record<string, unknown>): string {
  const normalized = JSON.stringify(config, Object.keys(config).sort())
  return createHash('sha256').update(normalized).digest('hex')
}

const svgCache = new Map<string, string>()

async function loadSvg(brandId: string, assetFile: string): Promise<string | null> {
  const fileName = assetFile.replace(/^assets\//, '')
  const key = `${brandId}/${fileName}`
  if (svgCache.has(key)) return svgCache.get(key)!
  try {
    const mod = await import(`../../../data/brands/${brandId}/assets/${fileName}?raw`)
    const svg = (mod as { default: string }).default
    svgCache.set(key, svg)
    return svg
  } catch {
    return null
  }
}

export async function buildLocalPack(config: {
  brandIds: string[]
  assetTypes: string[]
  metadata: string
  folderLayout: string
  datasetVersion: string
}): Promise<LocalPackResult> {
  const entries: ZipEntry[] = []
  const brands: string[] = []

  for (const brandId of config.brandIds) {
    const brand = brandMap.get(brandId)
    if (!brand) continue
    brands.push(brandId)

    const assets = brand.assets.filter((a) => {
      if (!a.current) return false
      if (config.assetTypes.includes('recommended') || config.assetTypes.includes('all-current')) return true
      return config.assetTypes.includes(a.type)
    })

    for (const asset of assets) {
      const svg = await loadSvg(brandId, asset.file)
      if (!svg) continue

      const fileName = asset.file.replace(/^assets\//, '')
      const filePath = config.folderLayout === 'by-brand'
        ? `brands/${brandId}/${fileName}`
        : fileName

      entries.push({ path: filePath, data: Buffer.from(svg, 'utf8') })
    }

    if (config.metadata !== 'none') {
      const metaPath = config.folderLayout === 'by-brand'
        ? `brands/${brandId}/metadata.json`
        : `${brandId}-metadata.json`

      const meta = config.metadata === 'complete' ? brand : {
        id: brand.id,
        name: brand.name,
        colors: brand.colors,
        sources: brand.sources,
      }

      entries.push({ path: metaPath, data: Buffer.from(JSON.stringify(meta, null, 2) + '\n', 'utf8') })
    }
  }

  const generatedAt = new Date().toISOString()
  entries.push({
    path: 'manifest.json',
    data: Buffer.from(JSON.stringify({
      datasetVersion: config.datasetVersion,
      generatedAt,
      brands: brands.map((id) => ({ id, name: brandMap.get(id)?.name })),
      config,
    }, null, 2) + '\n', 'utf8'),
  })

  entries.push({
    path: 'NOTICE.md',
    data: Buffer.from(
      `# Open Brands Pack\n\nDataset version: ${config.datasetVersion}\nGenerated: ${generatedAt}\n\nThird-party logos remain property of their owners.\n`,
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
  }
}

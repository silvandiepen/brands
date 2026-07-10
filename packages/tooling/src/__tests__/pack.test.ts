import { describe, it, expect } from 'vitest'
import { createZip, type ZipEntry } from '../zip.js'
import { buildPack, computePackKey } from '../pack.js'
import type { LoadedDataset, LoadedBrand } from '../validate.js'
import { extractSvgMetadata } from '../svg.js'

function makeBrand(id: string, name: string): LoadedBrand {
  const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#333"/></svg>`
  const metadata = extractSvgMetadata(svgSource)
  return {
    id,
    dirPath: `/fake/${id}`,
    manifest: {
      id,
      name,
      aliases: [],
      domains: [`${id}.com`],
      status: 'active',
      categories: ['technology'],
      tags: [],
      colors: [{ id: 'primary', value: '#333333', role: 'primary', themes: ['light'], sourceIds: ['src'], reviewStatus: 'community-sourced' }],
      assets: [{ id: 'logo', file: 'assets/logo.svg', type: 'symbol', variant: 'color', themes: ['light'], monochrome: false, current: true, sourceIds: ['src'], reviewStatus: 'community-sourced' }],
      sources: [{ id: 'src', type: 'official-website', url: 'https://example.com', title: 'Test', accessedAt: '2026-07-10' }],
      review: { status: 'partial', method: 'community-review' },
    },
    assets: new Map([['logo', { filePath: `/fake/${id}/assets/logo.svg`, source: svgSource, metadata }]]),
  }
}

function makeDataset(): LoadedDataset {
  return {
    brands: new Map([
      ['brand-a', makeBrand('brand-a', 'Brand A')],
      ['brand-b', makeBrand('brand-b', 'Brand B')],
    ]),
    categories: { categories: [{ id: 'technology', label: 'Technology', parentId: null }] },
    collectionIds: [],
  }
}

describe('createZip', () => {
  it('creates a valid ZIP buffer', () => {
    const entries: ZipEntry[] = [
      { path: 'a.txt', data: Buffer.from('hello') },
      { path: 'b.txt', data: Buffer.from('world') },
    ]
    const zip = createZip(entries)
    expect(zip).toBeInstanceOf(Buffer)
    expect(zip.length).toBeGreaterThan(0)
    expect(zip.readUInt32LE(0)).toBe(0x04034b50)
  })

  it('is deterministic for same input', () => {
    const entries: ZipEntry[] = [
      { path: 'a.txt', data: Buffer.from('hello') },
      { path: 'b.txt', data: Buffer.from('world') },
    ]
    const zip1 = createZip(entries)
    const zip2 = createZip([...entries].reverse())
    expect(zip1.equals(zip2)).toBe(true)
  })

  it('sorts entries by path', () => {
    const entries: ZipEntry[] = [
      { path: 'z.txt', data: Buffer.from('z') },
      { path: 'a.txt', data: Buffer.from('a') },
    ]
    const zip = createZip(entries)
    const firstFile = zip.slice(30, 35).toString('utf8')
    expect(firstFile).toBe('a.txt')
  })
})

describe('buildPack', () => {
  const dataset = makeDataset()

  it('builds a pack with assets', () => {
    const result = buildPack(dataset, {
      brandIds: ['brand-a', 'brand-b'],
      assetTypes: ['recommended'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'by-brand',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      includeProvenance: true,
      datasetVersion: 'test-1',
    })
    expect(result.zipBuffer).toBeInstanceOf(Buffer)
    expect(result.fileCount).toBeGreaterThan(0)
    expect(result.brands).toEqual(['brand-a', 'brand-b'])
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/)
  })

  it('includes manifest.json and NOTICE.md', () => {
    const result = buildPack(dataset, {
      brandIds: ['brand-a'],
      assetTypes: ['recommended'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'by-brand',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      includeProvenance: true,
      datasetVersion: 'test-1',
    })
    const manifestEntry = result.manifest
    expect(manifestEntry).toBeDefined()
    expect((manifestEntry as { datasetVersion: string }).datasetVersion).toBe('test-1')
  })

  it('is deterministic for same config', () => {
    const config = {
      brandIds: ['brand-a'],
      assetTypes: ['recommended'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'by-brand',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      includeProvenance: true,
      datasetVersion: 'test-1',
    }
    const result1 = buildPack(dataset, { ...config })
    const result2 = buildPack(dataset, { ...config })
    expect(result1.sha256).toBe(result2.sha256)
  })

  it('skips unknown brands', () => {
    const result = buildPack(dataset, {
      brandIds: ['nonexistent', 'brand-a'],
      assetTypes: ['recommended'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'none',
      folderLayout: 'flat',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      includeProvenance: false,
      datasetVersion: 'test-1',
    })
    expect(result.brands).toEqual(['brand-a'])
  })
})

describe('computePackKey', () => {
  it('produces a stable content hash', () => {
    const config = {
      brandIds: ['a', 'b'],
      assetTypes: ['symbol'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact' as const,
      folderLayout: 'flat' as const,
      filenameStrategy: 'stable-id' as const,
      includeHistorical: false,
      includeProvenance: true,
      datasetVersion: '1',
    }
    expect(computePackKey(config)).toBe(computePackKey({ ...config }))
  })

  it('differs for different brand sets', () => {
    const base = {
      assetTypes: ['symbol'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact' as const,
      folderLayout: 'flat' as const,
      filenameStrategy: 'stable-id' as const,
      includeHistorical: false,
      includeProvenance: true,
      datasetVersion: '1',
    }
    expect(computePackKey({ ...base, brandIds: ['a'] })).not.toBe(computePackKey({ ...base, brandIds: ['b'] }))
  })
})

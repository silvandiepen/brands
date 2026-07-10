import { describe, it, expect } from 'vitest'
import {
  validateBrandManifest,
  validateCategories,
  validatePackRequest,
} from '../validators.js'
import { validateCrossRecord } from '../cross-record.js'
import type { BrandManifest, CategoriesFile } from '../types.js'

const validBrand: BrandManifest = {
  $schema: '../../../packages/schema/json-schema/brand.schema.json',
  id: 'test-brand',
  name: 'Test Brand',
  aliases: ['TestBrand'],
  domains: ['testbrand.com'],
  status: 'active',
  categories: ['technology'],
  tags: ['test'],
  colors: [
    { id: 'primary', value: '#FF5733', role: 'primary', themes: ['light'], sourceIds: ['src-1'], reviewStatus: 'community-sourced' },
  ],
  assets: [
    { id: 'logo', file: 'assets/logo.svg', type: 'symbol', variant: 'color', themes: ['light', 'dark'], monochrome: false, current: true, sourceIds: ['src-1'], reviewStatus: 'community-sourced' },
  ],
  sources: [
    { id: 'src-1', type: 'official-website', url: 'https://testbrand.com', title: 'Official Site', accessedAt: '2026-07-10' },
  ],
  review: { status: 'partial', method: 'community-review' },
}

describe('validateBrandManifest', () => {
  it('accepts a valid brand manifest', () => {
    const result = validateBrandManifest(validBrand)
    expect(result.valid).toBe(true)
    expect(result.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0)
  })

  it('rejects missing required fields', () => {
    const result = validateBrandManifest({ id: 'test' })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid id format', () => {
    const result = validateBrandManifest({ ...validBrand, id: 'INVALID ID' })
    expect(result.valid).toBe(false)
  })

  it('rejects domains with protocol prefix', () => {
    const result = validateBrandManifest({ ...validBrand, domains: ['https://test.com'] })
    expect(result.valid).toBe(false)
  })

  it('rejects colors without sourceIds', () => {
    const bad = { ...validBrand, colors: [{ ...validBrand.colors[0]!, sourceIds: [] }] }
    const result = validateBrandManifest(bad)
    expect(result.valid).toBe(false)
  })

  it('rejects assets referencing unknown sources', () => {
    const bad = { ...validBrand, assets: [{ ...validBrand.assets[0]!, sourceIds: ['nonexistent'] }] }
    const result = validateBrandManifest(bad)
    expect(result.valid).toBe(false)
  })

  it('rejects bot self-verification in strict mode', () => {
    const result = validateBrandManifest(
      { ...validBrand, review: { status: 'verified', method: 'official-guidelines', reviewer: 'self' } },
      { strictBot: true },
    )
    expect(result.valid).toBe(false)
  })

  it('rejects invalid hex colors', () => {
    const bad = { ...validBrand, colors: [{ ...validBrand.colors[0]!, value: 'not-a-color' }] }
    const result = validateBrandManifest(bad)
    expect(result.valid).toBe(false)
  })
})

describe('validateCategories', () => {
  it('accepts valid categories', () => {
    const data: CategoriesFile = {
      categories: [
        { id: 'tech', label: 'Technology', parentId: null },
        { id: 'cloud', label: 'Cloud', parentId: 'tech' },
      ],
    }
    const result = validateCategories(data)
    expect(result.valid).toBe(true)
  })

  it('rejects unknown parent reference', () => {
    const data: CategoriesFile = {
      categories: [
        { id: 'cloud', label: 'Cloud', parentId: 'nonexistent' },
      ],
    }
    const result = validateCategories(data)
    expect(result.valid).toBe(false)
  })
})

describe('validatePackRequest', () => {
  it('accepts valid pack request with brandIds', () => {
    const result = validatePackRequest({
      brandIds: ['google', 'github'],
      assetTypes: ['symbol'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'flat',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      missingPolicy: 'skip',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects both brandIds and collectionId', () => {
    const result = validatePackRequest({
      brandIds: ['google'],
      collectionId: 'cloud',
      assetTypes: ['symbol'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'flat',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      missingPolicy: 'skip',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects more than 100 brands', () => {
    const brandIds = Array.from({ length: 101 }, (_, i) => `brand-${i}`)
    const result = validatePackRequest({
      brandIds,
      assetTypes: ['symbol'],
      themes: ['light'],
      formats: ['svg'],
      metadata: 'compact',
      folderLayout: 'flat',
      filenameStrategy: 'stable-id',
      includeHistorical: false,
      missingPolicy: 'skip',
    })
    expect(result.valid).toBe(false)
  })
})

describe('validateCrossRecord', () => {
  it('detects duplicate brand IDs', () => {
    const result = validateCrossRecord(
      [
        { id: 'dup', manifest: validBrand, filePath: 'a.json' },
        { id: 'dup', manifest: validBrand, filePath: 'b.json' },
      ],
      { validCategoryIds: new Set(['technology']), existingBrandIds: new Set() },
    )
    expect(result.valid).toBe(false)
  })

  it('detects alias collisions', () => {
    const brandA = { ...validBrand, id: 'brand-a' }
    const brandB = { ...validBrand, id: 'brand-b', aliases: ['TestBrand'] }
    const result = validateCrossRecord(
      [
        { id: 'brand-a', manifest: brandA, filePath: 'a.json' },
        { id: 'brand-b', manifest: brandB, filePath: 'b.json' },
      ],
      { validCategoryIds: new Set(['technology']), existingBrandIds: new Set() },
    )
    expect(result.valid).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { selectAsset, selectDefaultAsset, selectForTheme, getCurrentAssets } from '../asset-selection.js'
import type { BrandManifest } from '@open-brands/schema'

function makeManifest(overrides: Partial<BrandManifest> = {}): BrandManifest {
  return {
    id: 'test',
    name: 'Test',
    aliases: [],
    domains: [],
    status: 'active',
    categories: [],
    tags: [],
    colors: [],
    assets: [
      { id: 'symbol-color', file: 'assets/symbol-color.svg', type: 'symbol', variant: 'color', themes: ['light', 'dark'], monochrome: false, current: true, sourceIds: ['s1'], reviewStatus: 'community-sourced' },
      { id: 'logo-mono', file: 'assets/logo-mono.svg', type: 'logo', variant: 'monochrome', themes: ['dark'], monochrome: true, current: true, sourceIds: ['s1'], reviewStatus: 'community-sourced' },
      { id: 'old-logo', file: 'assets/old-logo.svg', type: 'symbol', variant: 'color', themes: ['light'], monochrome: false, current: false, sourceIds: ['s1'], reviewStatus: 'community-sourced' },
    ],
    sources: [{ id: 's1', type: 'official-website', url: 'https://example.com', title: 'Test', accessedAt: '2026-07-10' }],
    review: { status: 'partial', method: 'community-review' },
    ...overrides,
  }
}

describe('selectAsset', () => {
  it('returns a current asset by default', () => {
    const result = selectAsset(makeManifest())
    expect(result).not.toBeNull()
    expect(result!.asset.current).toBe(true)
  })

  it('prefers symbol type for recommended', () => {
    const result = selectAsset(makeManifest(), { type: 'recommended' })
    expect(result!.asset.type).toBe('symbol')
  })

  it('filters by specific type', () => {
    const result = selectAsset(makeManifest(), { type: 'logo' })
    expect(result!.asset.type).toBe('logo')
  })

  it('filters by theme', () => {
    const result = selectAsset(makeManifest(), { theme: 'dark' })
    expect(result!.asset.themes).toContain('dark')
  })

  it('excludes non-current when current=true', () => {
    const result = selectAsset(makeManifest(), { current: true })
    expect(result!.asset.current).toBe(true)
  })

  it('returns null for empty assets', () => {
    const result = selectAsset(makeManifest({ assets: [] }))
    expect(result).toBeNull()
  })
})

describe('selectDefaultAsset', () => {
  it('selects the recommended current asset', () => {
    const asset = selectDefaultAsset(makeManifest())
    expect(asset).not.toBeNull()
    expect(asset!.current).toBe(true)
  })
})

describe('selectForTheme', () => {
  it('selects a light-suitable asset', () => {
    const asset = selectForTheme(makeManifest(), 'light')
    expect(asset).not.toBeNull()
    expect(asset!.themes).toContain('light')
  })

  it('selects a dark-suitable asset', () => {
    const asset = selectForTheme(makeManifest(), 'dark')
    expect(asset).not.toBeNull()
    expect(asset!.themes).toContain('dark')
  })
})

describe('getCurrentAssets', () => {
  it('returns only current assets', () => {
    const current = getCurrentAssets(makeManifest())
    expect(current).toHaveLength(2)
    expect(current.every((a) => a.current)).toBe(true)
  })
})

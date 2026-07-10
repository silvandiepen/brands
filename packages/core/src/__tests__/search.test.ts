import { describe, it, expect } from 'vitest'
import { searchBrands } from '../search.js'
import { BrandRegistry, type BrandIndexEntry } from '../resolution.js'
import type { BrandManifest } from '@open-brands/schema'

function makeEntry(id: string, name: string, aliases: string[] = [], domains: string[] = [], categories: string[] = [], tags: string[] = []): BrandIndexEntry {
  const manifest = { id, name, aliases, domains, categories, tags, status: 'active' } as unknown as BrandManifest
  return { id, name, aliases, domains, categories, tags, status: 'active', manifest }
}

const entries = [
  makeEntry('google', 'Google', ['Google LLC'], ['google.com'], ['technology', 'cloud'], ['search']),
  makeEntry('github', 'GitHub', ['GitHub Inc'], ['github.com'], ['technology'], ['git']),
  makeEntry('microsoft', 'Microsoft', ['MS'], ['microsoft.com'], ['technology', 'cloud'], ['azure']),
  makeEntry('stripe', 'Stripe', [], ['stripe.com'], ['finance'], ['payments']),
  makeEntry('python', 'Python', ['Python Language'], ['python.org'], ['technology'], ['programming']),
]

describe('searchBrands', () => {
  it('finds exact name match', () => {
    const results = searchBrands('google', entries)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.entry.id).toBe('google')
  })

  it('finds by domain', () => {
    const results = searchBrands('github.com', entries)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.entry.id).toBe('github')
  })

  it('finds by alias', () => {
    const results = searchBrands('Google LLC', entries)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.entry.id).toBe('google')
  })

  it('finds by tag', () => {
    const results = searchBrands('payments', entries)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.entry.id).toBe('stripe')
  })

  it('returns empty for no matches', () => {
    const results = searchBrands('xyznonexistent', entries)
    expect(results).toHaveLength(0)
  })

  it('respects limit', () => {
    const results = searchBrands('a', entries, { limit: 2 })
    expect(results.length).toBeLessThanOrEqual(2)
  })
})

describe('BrandRegistry', () => {
  const registry = new BrandRegistry(entries)

  it('resolves by id', () => {
    const result = registry.resolve('google')
    expect(result.found).toBe(true)
    expect(result.matchType).toBe('id')
  })

  it('resolves by domain', () => {
    const result = registry.resolve('github.com')
    expect(result.found).toBe(true)
    expect(result.brand?.id).toBe('github')
  })

  it('resolves by alias (case-insensitive)', () => {
    const result = registry.resolve('MS')
    expect(result.found).toBe(true)
    expect(result.brand?.id).toBe('microsoft')
  })

  it('resolves by name when different from id', () => {
    const registry2 = new BrandRegistry([
      ...entries,
      makeEntry('acme', 'Acme Corporation', [], ['acme.com']),
    ])
    const result = registry2.resolve('Acme Corporation')
    expect(result.found).toBe(true)
    expect(result.matchType).toBe('name')
    expect(result.brand?.id).toBe('acme')
  })

  it('returns not found for unknown query', () => {
    const result = registry.resolve('nonexistent')
    expect(result.found).toBe(false)
  })

  it('filters by category', () => {
    const cloud = registry.filterByCategory('cloud')
    expect(cloud.length).toBe(2)
    expect(cloud.some((e) => e.id === 'google')).toBe(true)
    expect(cloud.some((e) => e.id === 'microsoft')).toBe(true)
  })
})

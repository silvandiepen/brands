import type { BrandManifest } from '@open-brands/schema'

export interface BrandIndexEntry {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  categories: string[]
  tags: string[]
  status: string
  manifest: BrandManifest
}

export interface ResolutionResult {
  found: boolean
  brand?: BrandIndexEntry
  matchType: 'id' | 'alias' | 'domain' | 'name' | 'none'
}

export class BrandRegistry {
  private byId = new Map<string, BrandIndexEntry>()
  private byAlias = new Map<string, BrandIndexEntry>()
  private byDomain = new Map<string, BrandIndexEntry>()
  private byName = new Map<string, BrandIndexEntry>()

  constructor(entries: BrandIndexEntry[] = []) {
    for (const entry of entries) this.add(entry)
  }

  add(entry: BrandIndexEntry): void {
    this.byId.set(entry.id, entry)
    this.byName.set(entry.name.toLowerCase(), entry)
    for (const alias of entry.aliases) {
      this.byAlias.set(alias.toLowerCase(), entry)
    }
    for (const domain of entry.domains) {
      this.byDomain.set(domain.toLowerCase(), entry)
    }
  }

  get(id: string): BrandIndexEntry | undefined {
    return this.byId.get(id)
  }

  resolve(query: string): ResolutionResult {
    const lk = query.trim().toLowerCase()

    const byId = this.byId.get(lk)
    if (byId) return { found: true, brand: byId, matchType: 'id' }

    const byDomain = this.byDomain.get(lk)
    if (byDomain) return { found: true, brand: byDomain, matchType: 'domain' }

    const byName = this.byName.get(lk)
    if (byName) return { found: true, brand: byName, matchType: 'name' }

    const byAlias = this.byAlias.get(lk)
    if (byAlias) return { found: true, brand: byAlias, matchType: 'alias' }

    const domainQuery = lk.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] ?? lk
    if (domainQuery !== lk) {
      const byDomain2 = this.byDomain.get(domainQuery)
      if (byDomain2) return { found: true, brand: byDomain2, matchType: 'domain' }
    }

    return { found: false, matchType: 'none' }
  }

  get all(): BrandIndexEntry[] {
    return [...this.byId.values()]
  }

  get count(): number {
    return this.byId.size
  }

  filterByCategory(categoryId: string): BrandIndexEntry[] {
    return this.all.filter((e) => e.categories.includes(categoryId))
  }

  filterByTag(tag: string): BrandIndexEntry[] {
    return this.all.filter((e) => e.tags.includes(tag))
  }
}

export function buildRegistry(manifests: Map<string, BrandManifest>): BrandRegistry {
  const entries: BrandIndexEntry[] = []
  for (const manifest of manifests.values()) {
    entries.push({
      id: manifest.id,
      name: manifest.name,
      aliases: manifest.aliases || [],
      domains: manifest.domains || [],
      categories: manifest.categories || [],
      tags: manifest.tags || [],
      status: manifest.status,
      manifest,
    })
  }
  return new BrandRegistry(entries)
}

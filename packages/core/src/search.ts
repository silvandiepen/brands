import type { BrandIndexEntry } from './resolution.js'

export interface SearchOptions {
  limit?: number
  threshold?: number
  categories?: string[]
}

export interface SearchResult {
  entry: BrandIndexEntry
  score: number
  matchedField: string
  matchedValue: string
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let j = 0; j <= n; j++) d[0]![j] = j
  for (let i = 1; i <= m; i++) d[i]![0] = i
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost)
    }
  }
  return d[m]![n]!
}

function subsequenceScore(query: string, target: string): number {
  let qi = 0
  let consecutive = 0
  let maxConsecutive = 0
  let lastMatch = -1
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    const tch = target[ti]
    const qch = query[qi]
    if (tch !== undefined && qch !== undefined && tch === qch) {
      consecutive = lastMatch === ti - 1 ? consecutive + 1 : 1
      maxConsecutive = Math.max(maxConsecutive, consecutive)
      qi++
      lastMatch = ti
    } else {
      consecutive = 0
    }
  }
  if (qi < query.length) return 0
  const coverage = qi / target.length
  const consecBonus = maxConsecutive / query.length
  return coverage * 0.5 + consecBonus * 0.5
}

function scoreMatch(query: string, candidate: string): number {
  const lk = candidate.toLowerCase()
  if (lk === query) return 1.0
  if (lk.startsWith(query)) return 0.9
  if (lk.includes(query)) return 0.75
  const sub = subsequenceScore(query, lk)
  if (sub > 0) return sub * 0.5
  const dist = levenshtein(query, lk)
  const maxLen = Math.max(query.length, lk.length)
  return maxLen > 0 ? Math.max(0, 1 - dist / maxLen) * 0.3 : 0
}

export function searchBrands(
  query: string,
  entries: BrandIndexEntry[],
  opts: SearchOptions = {},
): SearchResult[] {
  const { limit = 20, threshold = 0.15, categories } = opts
  const q = query.trim().toLowerCase()

  if (!q) return []

  const results: SearchResult[] = []

  for (const entry of entries) {
    if (categories && categories.length > 0) {
      const hasCat = entry.categories.some((c) => categories.includes(c))
      if (!hasCat) continue
    }

    let bestScore = 0
    let bestField = ''
    let bestValue = ''

    const nameScore = scoreMatch(q, entry.name)
    if (nameScore > bestScore) {
      bestScore = nameScore
      bestField = 'name'
      bestValue = entry.name
    }

    for (const alias of entry.aliases) {
      const s = scoreMatch(q, alias)
      if (s > bestScore) {
        bestScore = s
        bestField = 'alias'
        bestValue = alias
      }
    }

    for (const domain of entry.domains) {
      const s = scoreMatch(q, domain)
      if (s > bestScore) {
        bestScore = s
        bestField = 'domain'
        bestValue = domain
      }
    }

    const idScore = scoreMatch(q, entry.id)
    if (idScore > bestScore) {
      bestScore = idScore
      bestField = 'id'
      bestValue = entry.id
    }

    for (const tag of entry.tags) {
      const s = scoreMatch(q, tag)
      if (s > bestScore) {
        bestScore = s
        bestField = 'tag'
        bestValue = tag
      }
    }

    if (bestScore >= threshold) {
      results.push({ entry, score: bestScore, matchedField: bestField, matchedValue: bestValue })
    }
  }

  results.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
  return results.slice(0, limit)
}

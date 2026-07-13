#!/usr/bin/env node
// Local, offline data-quality audit over the full brand dataset. Makes no
// network calls and costs nothing to re-run — a worklist generator, not a fixer.
//
// Usage: pnpm audit  (writes packages/tooling/audit-report.json + prints a summary)

import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const root = process.cwd()
const { loadDataset } = await import('../src/validate.ts')

const dataset = loadDataset(root)

// Known non-social "source attribution" domains that have leaked into the
// `social` field instead of representing a real brand social/website link.
const KNOWN_SOURCE_LEAK_HOSTS = new Set([
  'github.com',
  'commons.wikimedia.org',
  'en.wikipedia.org',
  'apache.org',
  'jetbrains.com',
  'cloud.google.com',
  'partnermarketinghub.withgoogle.com',
  'developer.apple.com',
  'hashicorp.com',
  'w3.org',
])

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function normalizedPathHash(svgSource) {
  const paths = [...svgSource.matchAll(/\bd\s*=\s*["']([^"']+)["']/g)]
    .map((m) => m[1].replace(/\s+/g, ''))
    .sort()
    .join('|')
  if (!paths) return null
  return createHash('sha256').update(paths).digest('hex')
}

const findings = {
  duplicateAssets: [],
  defaultOnlyCategories: [],
  leakedSocialLinks: [],
  thinData: [],
}

for (const [id, brand] of dataset.brands) {
  const { manifest, assets } = brand

  // 1. Duplicate SVG content across differently-labeled assets within a brand
  const hashToAssetIds = new Map()
  for (const [assetId, asset] of assets) {
    const hash = normalizedPathHash(asset.source)
    if (!hash) continue
    if (!hashToAssetIds.has(hash)) hashToAssetIds.set(hash, [])
    hashToAssetIds.get(hash).push(assetId)
  }
  for (const [, assetIds] of hashToAssetIds) {
    if (assetIds.length > 1) {
      findings.duplicateAssets.push({ brandId: id, assetIds })
    }
  }

  // 2. Categories that are just the auto-import default, never actually reviewed
  const cats = manifest.categories ?? []
  const isDefaultOnly =
    (cats.length === 1 && cats[0] === 'technology') ||
    (cats.length === 2 && cats.includes('technology') && cats.includes('software'))
  if (isDefaultOnly) {
    findings.defaultOnlyCategories.push({ brandId: id, name: manifest.name, categories: cats })
  }

  // 3. "social" links that are really source-attribution leaks, not real brand links
  for (const link of manifest.social ?? []) {
    const host = hostOf(link.url)
    if (!host) continue
    const isOwnDomain = (manifest.domains ?? []).some((d) => host === d || host.endsWith(`.${d}`))
    if (!isOwnDomain && KNOWN_SOURCE_LEAK_HOSTS.has(host)) {
      findings.leakedSocialLinks.push({ brandId: id, name: manifest.name, url: link.url })
    }
  }

  // 4. Thin/missing enrichment data
  const thinReasons = []
  if (!manifest.description) thinReasons.push('no-description')
  if (!manifest.company) thinReasons.push('no-company-info')
  if (!manifest.domains || manifest.domains.length === 0) thinReasons.push('no-domains')
  if (!manifest.sources || manifest.sources.length === 0) thinReasons.push('no-sources')
  if (thinReasons.length > 0) {
    findings.thinData.push({ brandId: id, reasons: thinReasons })
  }
}

const summary = {
  totalBrands: dataset.brands.size,
  duplicateAssets: findings.duplicateAssets.length,
  defaultOnlyCategories: findings.defaultOnlyCategories.length,
  leakedSocialLinks: findings.leakedSocialLinks.length,
  thinData: findings.thinData.length,
}

const report = { generatedFrom: 'audit-brands.mjs', summary, findings }
const outPath = join(root, 'packages/tooling/audit-report.json')
writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n')

console.log(`Audited ${summary.totalBrands} brands.\n`)
console.log(`  Duplicate assets (same art, different label): ${summary.duplicateAssets}`)
console.log(`  Categories = auto-import default only:        ${summary.defaultOnlyCategories}`)
console.log(`  Leaked source-attribution "social" links:      ${summary.leakedSocialLinks}`)
console.log(`  Brands missing description/company/domains:    ${summary.thinData}`)
console.log(`\nFull report written to ${outPath}`)

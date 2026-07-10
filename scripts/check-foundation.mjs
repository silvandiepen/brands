#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'docs/AUDIT.md',
  'docs/PRODUCT.md',
  'docs/ARCHITECTURE.md',
  'docs/DATA_MODEL.md',
  'docs/API.md',
  'docs/WEBSITE.md',
  'docs/MIGRATION.md',
  'docs/LEGAL.md',
  'docs/TESTING.md',
  'docs/IMPLEMENTATION_PLAN.md',
  'schemas/brand.schema.json',
  'schemas/categories.schema.json',
  'data/categories.json',
  'data/legacy/open-brands.json',
  'data/legacy/brand-colors.json',
  'data/seed/brands.json',
  'legacy/reports/import-summary.json',
  'legacy/npm/open-brands-0.0.7/package.json',
  'legacy/npm/sil-brands-0.0.6/package.json',
]

const fail = (message) => {
  console.error(`Foundation check failed: ${message}`)
  process.exitCode = 1
}

const parseJson = (path) => {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'))
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`)
    return null
  }
}

const walk = (directory) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const path of requiredFiles) {
  const absolute = join(root, path)
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    fail(`required file is missing: ${path}`)
  }
}

const jsonFiles = [
  'schemas/brand.schema.json',
  'schemas/categories.schema.json',
  'data/categories.json',
  'data/legacy/open-brands.json',
  'data/legacy/brand-colors.json',
  'data/seed/brands.json',
  'legacy/reports/import-summary.json',
  'legacy/npm/open-brands-0.0.7/package.json',
  'legacy/npm/sil-brands-0.0.6/package.json',
]

const parsed = Object.fromEntries(jsonFiles.map((path) => [path, parseJson(path)]))
const summary = parsed['legacy/reports/import-summary.json']
const seed = parsed['data/seed/brands.json']

if (summary) {
  const expectedPackages = new Set(['open-brands@0.0.7', '@sil/brands@0.0.6'])
  const actualPackages = new Set(summary.sources?.map((source) => source.package) ?? [])

  for (const packageName of expectedPackages) {
    if (!actualPackages.has(packageName)) fail(`missing migration source ${packageName}`)
  }

  for (const source of summary.sources ?? []) {
    if (!Number.isInteger(source.brandCount) || source.brandCount <= 0) {
      fail(`${source.package} has an invalid brand count`)
    }
    if (!Number.isInteger(source.svgCount) || source.svgCount <= 0) {
      fail(`${source.package} has an invalid SVG count`)
    }
  }

  if (!Number.isInteger(summary.mergedBrandCount) || summary.mergedBrandCount <= 0) {
    fail('mergedBrandCount is invalid')
  }

  if (seed && seed.brands?.length !== summary.mergedBrandCount) {
    fail(`seed count ${seed.brands?.length ?? 0} does not equal merged count ${summary.mergedBrandCount}`)
  }
}

const svgRoots = [
  ['open-brands', join(root, 'data/assets/legacy/open-brands')],
  ['brand-colors', join(root, 'data/assets/legacy/brand-colors')],
]

for (const [key, directory] of svgRoots) {
  const count = walk(directory).filter((path) => path.toLowerCase().endsWith('.svg')).length
  const expected = summary?.sources?.find((source) => source.key === key)?.svgCount
  if (!expected || count !== expected) {
    fail(`${key} SVG count ${count} does not equal import summary ${expected ?? 'missing'}`)
  }
}

if (!process.exitCode) {
  console.log(`Foundation is valid: ${summary.mergedBrandCount} merged candidates from ${summary.sources.length} legacy sources.`)
}

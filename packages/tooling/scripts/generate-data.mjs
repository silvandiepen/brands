#!/usr/bin/env node

import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const outputDir = join(root, 'packages/data/generated')

const { validateDataset } = await import('../src/validate.ts')
const { loadDataset } = await import('../src/validate.ts')
const { generateRelease } = await import('../src/generate.ts')

console.log('Validating dataset...')
const result = validateDataset(root)

if (result.diagnostics.length > 0) {
  for (const d of result.diagnostics) {
    const prefix = d.severity === 'error' ? 'ERROR' : 'WARN'
    console.error(`[${prefix}] ${d.code}: ${d.message}${d.filePath ? ` (${d.filePath})` : ''}${d.fieldPath ? ` -> ${d.fieldPath}` : ''}`)
  }
}

if (!result.valid) {
  console.error(`\nDataset validation failed with ${result.diagnostics.filter((d) => d.severity === 'error').length} error(s).`)
  process.exit(1)
}

console.log('Dataset validation passed.')

console.log('Loading dataset...')
const dataset = loadDataset(root)
console.log(`Loaded ${dataset.brands.size} brands, ${dataset.categories.categories.length} categories, ${dataset.collectionIds.length} collections.`)

console.log('Generating release...')
rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const { release, writtenFiles } = generateRelease(dataset, outputDir)

console.log(`Generated release ${release.datasetVersion} with ${release.brandCount} brands, ${release.assetCount} assets.`)
console.log(`Wrote ${writtenFiles.length} files to packages/data/generated/`)

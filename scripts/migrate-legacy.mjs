#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative } from 'node:path'

const root = process.cwd()

const sources = [
  {
    key: 'open-brands',
    packageName: 'open-brands',
    version: '0.0.7',
    repository: 'silvandiepen/open-brands',
    commit: 'c65cd02e40501557266be9210df5bb98bd92eaf2',
    snapshotPath: 'legacy/npm/open-brands-0.0.7',
  },
  {
    key: 'brand-colors',
    packageName: '@sil/brands',
    version: '0.0.6',
    repository: 'silvandiepen/brand-colors',
    commit: '7e8d7fbbdc2b2377ec4a8c52433dc248625ef6e6',
    snapshotPath: 'legacy/npm/sil-brands-0.0.6',
  },
]

const ensureDir = (path) => mkdirSync(path, { recursive: true })

const remove = (path) => {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true })
}

const writeJson = (path, value) => {
  ensureDir(dirname(path))
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

const walkFiles = (directory) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? walkFiles(path) : [path]
    })
    .sort()
}

const readJson = (path) => {
  const content = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').trim()
  return JSON.parse(content)
}

const findBrandsJson = (packageRoot) => {
  const preferred = [
    join(packageRoot, 'lib', 'brands.json'),
    join(packageRoot, 'src', 'data', 'brands.json'),
  ]
  const found = preferred.find(existsSync)
  if (found) return found

  const candidates = walkFiles(packageRoot).filter(
    (path) => basename(path).toLowerCase() === 'brands.json',
  )
  if (candidates.length === 0) {
    throw new Error(`No brands.json found in ${packageRoot}`)
  }
  return candidates[0]
}

const normalizeId = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const normalizeColor = (value) => {
  const original = String(value ?? '')
  let normalized = original.trim().toUpperCase()
  const warnings = []

  if (/^#[0-9A-F]{3}$/.test(normalized)) {
    normalized = `#${normalized
      .slice(1)
      .split('')
      .map((part) => `${part}${part}`)
      .join('')}`
    warnings.push('expanded-shorthand-color')
  }

  if (!/^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(normalized)) {
    warnings.push('invalid-color')
  }
  if (original !== original.trim()) warnings.push('trimmed-color')

  return { original, value: normalized, warnings }
}

const copySvgFiles = (packageRoot, sourceKey) => {
  const targetRoot = join(root, 'data', 'assets', 'legacy', sourceKey)
  remove(targetRoot)
  ensureDir(targetRoot)

  const index = new Map()
  const files = walkFiles(packageRoot).filter((path) => path.toLowerCase().endsWith('.svg'))

  for (const file of files) {
    const packageRelative = relative(packageRoot, file)
    const target = join(targetRoot, packageRelative)
    ensureDir(dirname(target))
    cpSync(file, target)

    const fileName = basename(file)
    const paths = index.get(fileName) ?? []
    paths.push(relative(root, target).split('\\').join('/'))
    index.set(fileName, paths)
  }

  return { files, index }
}

const resolveAssetPath = (fileName, assetIndex, warnings) => {
  if (!fileName) return null
  const matches = assetIndex.get(basename(fileName)) ?? []
  if (matches.length === 0) {
    warnings.push(`missing-asset:${fileName}`)
    return null
  }
  if (matches.length > 1) warnings.push(`ambiguous-asset:${fileName}`)
  return matches[0]
}

const normalizePackageData = (source, raw, assetIndex) => {
  const brands = raw.brands && typeof raw.brands === 'object' ? raw.brands : raw
  if (!brands || Array.isArray(brands) || typeof brands !== 'object') {
    throw new Error(`${source.packageName}@${source.version} has no brand object`)
  }

  return Object.entries(brands)
    .map(([legacyId, value]) => {
      const record = value ?? {}
      const warnings = []
      const id = normalizeId(record.name || legacyId)
      const colors = (record.color ?? record.colors ?? []).map(normalizeColor)
      const urls = record.url ?? record.urls ?? {}
      const assets = []

      for (const variant of ['normal', 'icon', 'wordmark', 'default']) {
        const fileName = urls?.[variant]
        if (!fileName) continue
        const path = resolveAssetPath(fileName, assetIndex, warnings)
        assets.push({
          legacyVariant: variant,
          fileName,
          path,
        })
      }

      if (!record.category) warnings.push('missing-category')
      if (colors.length === 0) warnings.push('missing-colors')
      if (assets.length === 0) warnings.push('missing-assets')

      return {
        id,
        name: record.title || record.name || legacyId,
        status: 'needs-review',
        aliases: [],
        legacy: {
          id: legacyId,
          name: record.name ?? null,
          title: record.title ?? null,
          category: record.category ?? null,
          colors,
          assets,
        },
        provenance: {
          package: `${source.packageName}@${source.version}`,
          repository: source.repository,
          commit: source.commit,
        },
        warnings: [...new Set(warnings)].sort(),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

const packAndExtract = (source, temporaryRoot) => {
  const packDirectory = join(temporaryRoot, source.key, 'pack')
  const extractDirectory = join(temporaryRoot, source.key, 'extract')
  ensureDir(packDirectory)
  ensureDir(extractDirectory)

  const output = execFileSync(
    'npm',
    ['pack', `${source.packageName}@${source.version}`, '--pack-destination', packDirectory],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
  const tarballName = output.trim().split(/\r?\n/).filter(Boolean).at(-1)
  if (!tarballName) throw new Error(`npm pack produced no tarball for ${source.packageName}`)

  const tarball = join(packDirectory, tarballName)
  execFileSync('tar', ['-xzf', tarball, '-C', extractDirectory], { stdio: 'inherit' })

  const packageRoot = join(extractDirectory, 'package')
  if (!existsSync(packageRoot) || !statSync(packageRoot).isDirectory()) {
    throw new Error(`Extracted package root is missing for ${source.packageName}`)
  }
  return packageRoot
}

const mergeSeed = (datasets) => {
  const merged = new Map()
  const collisions = []

  for (const { source, records } of datasets) {
    for (const record of records) {
      const existing = merged.get(record.id)
      if (!existing) {
        merged.set(record.id, {
          id: record.id,
          name: record.name,
          aliases: [],
          status: 'needs-review',
          legacyCategories: record.legacy.category ? [record.legacy.category] : [],
          legacyColors: record.legacy.colors,
          legacyAssets: record.legacy.assets,
          provenance: [record.provenance],
          warnings: record.warnings,
        })
        continue
      }

      collisions.push({ id: record.id, sources: [existing.provenance[0].package, record.provenance.package] })
      if (source.key === 'open-brands') existing.name = record.name
      if (record.legacy.category && !existing.legacyCategories.includes(record.legacy.category)) {
        existing.legacyCategories.push(record.legacy.category)
      }
      for (const color of record.legacy.colors) {
        if (!existing.legacyColors.some((candidate) => candidate.value === color.value)) {
          existing.legacyColors.push(color)
        }
      }
      for (const asset of record.legacy.assets) {
        if (!existing.legacyAssets.some((candidate) => candidate.path === asset.path && candidate.legacyVariant === asset.legacyVariant)) {
          existing.legacyAssets.push(asset)
        }
      }
      existing.provenance.push(record.provenance)
      existing.warnings = [...new Set([...existing.warnings, ...record.warnings])].sort()
    }
  }

  return {
    brands: [...merged.values()].sort((a, b) => a.id.localeCompare(b.id)),
    collisions: collisions.sort((a, b) => a.id.localeCompare(b.id)),
  }
}

const main = () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-brands-migration-'))
  const datasets = []
  const reportSources = []

  try {
    for (const source of sources) {
      const packageRoot = packAndExtract(source, temporaryRoot)
      const snapshotTarget = join(root, source.snapshotPath)
      remove(snapshotTarget)
      ensureDir(dirname(snapshotTarget))
      cpSync(packageRoot, snapshotTarget, { recursive: true })

      const { files: svgFiles, index: assetIndex } = copySvgFiles(packageRoot, source.key)
      const brandsJson = findBrandsJson(packageRoot)
      const raw = readJson(brandsJson)
      const records = normalizePackageData(source, raw, assetIndex)

      const normalizedPath = join(root, 'data', 'legacy', `${source.key}.json`)
      writeJson(normalizedPath, {
        source: {
          package: `${source.packageName}@${source.version}`,
          repository: source.repository,
          commit: source.commit,
          brandsFile: relative(packageRoot, brandsJson).split('\\').join('/'),
        },
        brands: records,
      })

      datasets.push({ source, records })
      reportSources.push({
        key: source.key,
        package: `${source.packageName}@${source.version}`,
        brandCount: records.length,
        svgCount: svgFiles.length,
        warningCount: records.reduce((total, record) => total + record.warnings.length, 0),
      })
    }

    const seed = mergeSeed(datasets)
    writeJson(join(root, 'data', 'seed', 'brands.json'), {
      notice: 'Migration seed only. Do not publish or treat as canonical data.',
      brands: seed.brands,
    })
    writeJson(join(root, 'legacy', 'reports', 'import-summary.json'), {
      sources: reportSources,
      mergedBrandCount: seed.brands.length,
      collisions: seed.collisions,
    })

    console.log(`Imported ${seed.brands.length} merged legacy brand candidates.`)
  } finally {
    remove(temporaryRoot)
  }
}

main()

import { execFileSync } from 'node:child_process'
import { posix as path } from 'node:path'

const MAX_SVG_BYTES = 512 * 1024
const MAX_TOTAL_SVG_BYTES = 2 * 1024 * 1024
const MAX_BOT_FILES = 8
const MAX_BOT_SVGS = 5
const BRAND_PATH = /^data\/brands\/([a-z0-9]+(?:-[a-z0-9]+)*)\//
const BOT_PATH = /^data\/brands\/[a-z0-9]+(?:-[a-z0-9]+)*\/(brand\.json|assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.svg)$/
const ASSET_PATH = /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.svg$/
const SOURCE_TYPES = new Set([
  'official-guidelines',
  'official-download',
  'official-website',
  'trademark-registry',
  'repository',
  'community-reference',
])

const baseSha = process.env.BASE_SHA || process.argv[2]
const headSha = process.env.HEAD_SHA || process.argv[3] || 'HEAD'
const headRef = process.env.HEAD_REF || ''
const strictBotSubmission = headRef.startsWith('contrib/')

if (!baseSha) {
  console.error('BASE_SHA or the first CLI argument is required.')
  process.exit(2)
}

const errors = []
const addError = (message) => errors.push(message)

const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

const diffOutput = git('diff', '--name-status', '--find-renames', `${baseSha}...${headSha}`)
const changes = diffOutput
  ? diffOutput.split('\n').map((line) => {
      const fields = line.split('\t')
      const status = fields[0]
      const renamed = status.startsWith('R') || status.startsWith('C')
      return {
        status,
        oldPath: renamed ? fields[1] : status === 'D' ? fields[1] : null,
        filePath: renamed ? fields[2] : fields[1],
      }
    })
  : []

const canonicalChanges = changes.filter(({ filePath, oldPath }) =>
  [filePath, oldPath].some((value) => value?.startsWith('data/brands/')),
)

if (canonicalChanges.length === 0) {
  console.log('No canonical brand files changed.')
  process.exit(0)
}

const brandIdFromPath = (filePath) => filePath?.match(BRAND_PATH)?.[1] || null
const touchedBrandIds = new Set()

for (const { filePath, oldPath } of canonicalChanges) {
  for (const value of [filePath, oldPath]) {
    if (!value) continue
    const brandId = brandIdFromPath(value)
    if (!brandId) addError(`Invalid canonical brand path: ${value}`)
    else touchedBrandIds.add(brandId)
  }
}

if (strictBotSubmission) {
  if (changes.length > MAX_BOT_FILES) {
    addError(`Website contribution branches may change at most ${MAX_BOT_FILES} files; found ${changes.length}.`)
  }
  if (touchedBrandIds.size !== 1) {
    addError(`Website contribution branches must change exactly one brand directory; found ${touchedBrandIds.size}.`)
  }
  for (const { filePath, oldPath } of changes) {
    for (const value of [filePath, oldPath]) {
      if (value && !BOT_PATH.test(value)) addError(`Website contribution branch touched a forbidden path: ${value}`)
    }
  }
}

const headFileExists = (filePath) => {
  try {
    execFileSync('git', ['cat-file', '-e', `${headSha}:${filePath}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const readHeadFile = (filePath) => git('show', `${headSha}:${filePath}`)
const validateRegularFileMode = (filePath) => {
  const entry = git('ls-tree', headSha, '--', filePath)
  if (!entry) return
  const mode = entry.split(/\s+/)[0]
  if (mode !== '100644') addError(`${filePath} must be a regular non-executable file; git mode is ${mode}.`)
}

const svgSecurityChecks = [
  [/<!DOCTYPE/i, 'DOCTYPE declarations'],
  [/<!ENTITY/i, 'XML entities'],
  [/<\?(?!xml\b)/i, 'processing instructions'],
  [/<script\b/i, 'script elements'],
  [/<foreignObject\b/i, 'foreignObject elements'],
  [/<(?:iframe|object|embed|audio|video)\b/i, 'active or embedded media elements'],
  [/\son[a-z0-9_-]+\s*=/i, 'event-handler attributes'],
  [/javascript\s*:/i, 'JavaScript URLs'],
  [/(?:href|xlink:href)\s*=\s*["']data:/i, 'embedded data URLs'],
  [/@import\b/i, 'stylesheet imports'],
  [/expression\s*\(/i, 'CSS expressions'],
  [/(?:href|xlink:href)\s*=\s*["'](?!#)/i, 'non-fragment href references'],
  [/url\s*\(\s*(?!["']?#)/i, 'external CSS URL references'],
]

const validateSvg = (filePath, source) => {
  const bytes = Buffer.byteLength(source)
  if (bytes > MAX_SVG_BYTES) addError(`${filePath} is ${bytes} bytes; maximum is ${MAX_SVG_BYTES}.`)
  if (!/<svg\b/i.test(source) || !/<\/svg>\s*$/i.test(source)) {
    addError(`${filePath} is not a complete SVG document.`)
  }
  if (!/\bviewBox\s*=\s*["'][^"']+["']/i.test(source)) addError(`${filePath} must define a viewBox.`)
  if (/\b(?:NaN|Infinity|-Infinity)\b/.test(source)) addError(`${filePath} contains non-finite values.`)

  for (const [pattern, label] of svgSecurityChecks) {
    if (pattern.test(source)) addError(`${filePath} contains forbidden ${label}.`)
  }

  const elementCount = (source.match(/<[A-Za-z][^!?/\s>]*/g) || []).length
  const pathCount = (source.match(/<path\b/gi) || []).length
  const filterCount = (source.match(/<filter\b/gi) || []).length
  const gradientCount = (source.match(/<(?:linearGradient|radialGradient)\b/gi) || []).length

  if (elementCount > 5000) addError(`${filePath} contains ${elementCount} elements; maximum is 5000.`)
  if (pathCount > 2000) addError(`${filePath} contains ${pathCount} paths; maximum is 2000.`)
  if (filterCount > 50) addError(`${filePath} contains ${filterCount} filters; maximum is 50.`)
  if (gradientCount > 200) addError(`${filePath} contains ${gradientCount} gradients; maximum is 200.`)
}

const svgPaths = canonicalChanges
  .filter(({ status, filePath }) => status !== 'D' && filePath.endsWith('.svg'))
  .map(({ filePath }) => filePath)

if (strictBotSubmission && svgPaths.length > MAX_BOT_SVGS) {
  addError(`Website contribution branches may change at most ${MAX_BOT_SVGS} SVG files; found ${svgPaths.length}.`)
}

let totalSvgBytes = 0
for (const filePath of svgPaths) {
  if (!headFileExists(filePath)) continue
  validateRegularFileMode(filePath)
  const source = readHeadFile(filePath)
  totalSvgBytes += Buffer.byteLength(source)
  validateSvg(filePath, source)
}

if (strictBotSubmission && totalSvgBytes > MAX_TOTAL_SVG_BYTES) {
  addError(`SVG payload is ${totalSvgBytes} bytes; maximum is ${MAX_TOTAL_SVG_BYTES}.`)
}

const manifestPaths = canonicalChanges
  .filter(({ status, filePath }) => status !== 'D' && filePath.endsWith('/brand.json'))
  .map(({ filePath }) => filePath)

if (strictBotSubmission && manifestPaths.length !== 1) {
  addError(`Website contribution branches must include exactly one brand.json; found ${manifestPaths.length}.`)
}

for (const manifestPath of manifestPaths) {
  validateRegularFileMode(manifestPath)

  let manifest
  try {
    manifest = JSON.parse(readHeadFile(manifestPath))
  } catch (error) {
    addError(`${manifestPath} is not valid JSON: ${error.message}`)
    continue
  }

  const directoryBrandId = brandIdFromPath(manifestPath)
  if (manifest.id !== directoryBrandId) addError(`${manifestPath} has id '${manifest.id}', expected '${directoryBrandId}'.`)
  if (!manifest.name || typeof manifest.name !== 'string') addError(`${manifestPath} requires a name.`)
  if (manifest.$schema !== '../../../packages/schema/json-schema/brand.schema.json') {
    addError(`${manifestPath} must reference the canonical package-owned schema.`)
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) addError(`${manifestPath} requires sources.`)
  if (!Array.isArray(manifest.colors)) addError(`${manifestPath} colors must be an array.`)
  if (!Array.isArray(manifest.assets)) addError(`${manifestPath} assets must be an array.`)

  for (const [field, maximum] of [
    ['aliases', 50],
    ['domains', 20],
    ['categories', 10],
    ['tags', 50],
    ['colors', 30],
    ['assets', 10],
    ['sources', 20],
  ]) {
    if (Array.isArray(manifest[field]) && manifest[field].length > maximum) {
      addError(`${manifestPath} field '${field}' exceeds ${maximum} entries.`)
    }
  }

  if (strictBotSubmission) {
    if (manifest.review?.status === 'verified') addError(`${manifestPath} cannot set verified status.`)
    if (manifest.review?.reviewer) addError(`${manifestPath} cannot assign a reviewer.`)
    if (manifest.review?.verifiedAt) addError(`${manifestPath} cannot set verifiedAt.`)
  }

  const sourceIds = new Set()
  for (const source of manifest.sources || []) {
    if (!source?.id || typeof source.id !== 'string') {
      addError(`${manifestPath} contains a source without an id.`)
      continue
    }
    if (sourceIds.has(source.id)) addError(`${manifestPath} contains duplicate source id '${source.id}'.`)
    sourceIds.add(source.id)
    if (!SOURCE_TYPES.has(source.type)) addError(`${manifestPath} source '${source.id}' has unsupported type '${source.type}'.`)
    if (strictBotSubmission && (typeof source.url !== 'string' || !source.url.startsWith('https://'))) {
      addError(`${manifestPath} source '${source.id}' must use an HTTPS URL.`)
    }
  }

  const validateSourceReferences = (items, label) => {
    for (const item of items || []) {
      if (!item?.id) addError(`${manifestPath} contains a ${label} without an id.`)
      if (!Array.isArray(item?.sourceIds) || item.sourceIds.length === 0) {
        addError(`${manifestPath} ${label} '${item?.id || 'unknown'}' requires sourceIds.`)
        continue
      }
      for (const sourceId of item.sourceIds) {
        if (!sourceIds.has(sourceId)) addError(`${manifestPath} ${label} '${item.id}' references unknown source '${sourceId}'.`)
      }
    }
  }

  validateSourceReferences(manifest.colors, 'color')
  validateSourceReferences(manifest.assets, 'asset')

  const referencedAssetPaths = new Set()
  for (const asset of manifest.assets || []) {
    if (typeof asset.file !== 'string' || !ASSET_PATH.test(asset.file)) {
      addError(`${manifestPath} asset '${asset?.id || 'unknown'}' has an invalid file path.`)
      continue
    }
    const repositoryPath = path.join(path.dirname(manifestPath), asset.file)
    referencedAssetPaths.add(repositoryPath)
    if (!headFileExists(repositoryPath)) addError(`${manifestPath} asset '${asset.id}' references missing file '${repositoryPath}'.`)
  }

  if (strictBotSubmission) {
    for (const svgPath of svgPaths) {
      if (!referencedAssetPaths.has(svgPath)) addError(`${svgPath} is not referenced by ${manifestPath}.`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Contribution guard found ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Contribution guard passed for ${canonicalChanges.length} canonical change(s).`)

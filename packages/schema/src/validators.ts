import { DiagnosticCollector, type ValidationResult } from './diagnostics.js'
import {
  BRAND_ID_PATTERN,
  HEX_COLOR_PATTERN,
  DOMAIN_PATTERN,
  type BrandManifest,
  type BrandColor,
  type BrandAsset,
  type BrandSource,
  type CategoriesFile,
  type CategoryEntry,
  type PackRequest,
  type ContributionSubmission,
  type AssetType,
  type AssetVariant,
  type ColorRole,
  type ThemeSuitability,
  type ReviewStatus,
  type SourceType,
  type BrandStatus,
  type ReviewMethod,
  type OverallReviewStatus,
  type AssetOrientation,
} from './types.js'

const VALID_ASSET_TYPES: Set<AssetType> = new Set(['symbol', 'icon', 'wordmark', 'logo', 'lockup', 'badge', 'historical'])
const VALID_ASSET_VARIANTS: Set<AssetVariant> = new Set([
  'color', 'monochrome', 'black', 'white', 'positive', 'negative', 'outline', 'historical',
])
const VALID_COLOR_ROLES: Set<ColorRole> = new Set(['primary', 'secondary', 'accent', 'neutral', 'background', 'historical'])
const VALID_THEMES: Set<ThemeSuitability> = new Set(['light', 'dark', 'any', 'custom'])
const VALID_REVIEW_STATUSES: Set<ReviewStatus> = new Set(['verified', 'community-sourced', 'needs-review', 'disputed'])
const VALID_SOURCE_TYPES: Set<SourceType> = new Set([
  'official-guidelines', 'official-download', 'official-website', 'trademark-registry', 'repository', 'community-reference',
])
const VALID_BRAND_STATUSES: Set<BrandStatus> = new Set([
  'active', 'discontinued', 'historical', 'merged', 'needs-review', 'disputed',
])
const VALID_REVIEW_METHODS: Set<ReviewMethod> = new Set([
  'official-guidelines', 'official-download', 'official-website', 'cross-reference', 'community-review',
])
const VALID_OVERALL_STATUSES: Set<OverallReviewStatus> = new Set(['verified', 'partial', 'needs-review', 'disputed'])
const VALID_ORIENTATIONS: Set<AssetOrientation> = new Set(['square', 'horizontal', 'vertical', 'free'])

const FIELD_LIMITS = {
  aliases: 50,
  domains: 20,
  categories: 10,
  tags: 50,
  colors: 30,
  assets: 10,
  sources: 20,
} as const

const ASSET_FILE_PATTERN = /^assets\/[A-Za-z0-9._/-]+\.svg$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const COUNTRY_PATTERN = /^[A-Z]{2}$/

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function uniqueArray(arr: unknown[]): boolean {
  return new Set(arr).size === arr.length
}

export function validateBrandManifest(
  manifest: unknown,
  opts: { filePath?: string | undefined; strictBot?: boolean | undefined } = {},
): ValidationResult {
  const dc = new DiagnosticCollector()
  const { filePath, strictBot } = opts
  const fp = (p: string) => (filePath ? `${filePath}:${p}` : p)
  const m = manifest as Record<string, unknown>

  if (typeof m !== 'object' || m === null || Array.isArray(m)) {
    dc.error('INVALID_TYPE', 'Brand manifest must be an object.', { filePath })
    return { valid: false, diagnostics: dc.all }
  }

  const required = ['id', 'name', 'aliases', 'domains', 'status', 'categories', 'tags', 'colors', 'assets', 'sources', 'review']
  for (const key of required) {
    if (!(key in m)) dc.error('MISSING_FIELD', `Missing required field: ${key}`, { filePath, fieldPath: key })
  }

  for (const key of Object.keys(m)) {
    if (!['$schema', ...required, 'organization'].includes(key)) {
      dc.error('UNEXPECTED_FIELD', `Unexpected field: ${key}`, { filePath, fieldPath: key })
    }
  }

  if (!isString(m.id) || !BRAND_ID_PATTERN.test(m.id)) {
    dc.error('INVALID_ID', 'id must be kebab-case', { filePath, fieldPath: 'id' })
  }
  if (!isString(m.name) || m.name.length < 1) {
    dc.error('INVALID_NAME', 'name must be a non-empty string', { filePath, fieldPath: 'name' })
  }
  if (!isString(m.status) || !VALID_BRAND_STATUSES.has(m.status as BrandStatus)) {
    dc.error('INVALID_STATUS', `status must be one of: ${[...VALID_BRAND_STATUSES].join(', ')}`, { filePath, fieldPath: 'status' })
  }

  for (const field of ['aliases', 'domains', 'categories', 'tags', 'colors', 'assets', 'sources'] as const) {
    const val = m[field]
    if (!Array.isArray(val)) {
      dc.error('INVALID_ARRAY', `${field} must be an array`, { filePath, fieldPath: field })
    } else {
      if (val.length > FIELD_LIMITS[field]) {
        dc.error('FIELD_TOO_LARGE', `${field} exceeds ${FIELD_LIMITS[field]} entries`, { filePath, fieldPath: field })
      }
      if (!uniqueArray(val)) {
        dc.warning('DUPLICATE_ITEMS', `${field} contains duplicate items`, { filePath, fieldPath: field })
      }
    }
  }

  if (Array.isArray(m.aliases)) {
    m.aliases.forEach((a, i) => {
      if (!isString(a) || a.length < 1) dc.error('INVALID_ALIAS', `aliases[${i}] must be a non-empty string`, { filePath, fieldPath: `aliases[${i}]` })
    })
  }
  if (Array.isArray(m.domains)) {
    m.domains.forEach((d, i) => {
      if (!isString(d) || !DOMAIN_PATTERN.test(d)) dc.error('INVALID_DOMAIN', `domains[${i}] must be a domain without protocol/www`, { filePath, fieldPath: `domains[${i}]` })
    })
  }
  if (Array.isArray(m.categories)) {
    m.categories.forEach((c, i) => {
      if (!isString(c) || !BRAND_ID_PATTERN.test(c)) dc.error('INVALID_CATEGORY', `categories[${i}] must be kebab-case`, { filePath, fieldPath: `categories[${i}]` })
    })
  }
  if (Array.isArray(m.tags)) {
    m.tags.forEach((t, i) => {
      if (!isString(t) || !BRAND_ID_PATTERN.test(t)) dc.error('INVALID_TAG', `tags[${i}] must be kebab-case`, { filePath, fieldPath: `tags[${i}]` })
    })
  }

  const sourceIds = new Set<string>()
  if (Array.isArray(m.sources)) {
    if (m.sources.length === 0) dc.error('NO_SOURCES', 'At least one source is required', { filePath, fieldPath: 'sources' })
    ;(m.sources as unknown[]).forEach((src, i) => {
      const s = src as BrandSource
      if (typeof s !== 'object' || s === null) {
        dc.error('INVALID_SOURCE', `sources[${i}] must be an object`, { filePath, fieldPath: `sources[${i}]` })
        return
      }
      if (!isString(s.id) || !BRAND_ID_PATTERN.test(s.id)) dc.error('INVALID_SOURCE_ID', `sources[${i}].id must be kebab-case`, { filePath, fieldPath: `sources[${i}].id` })
      if (sourceIds.has(s.id)) dc.error('DUPLICATE_SOURCE_ID', `Duplicate source id: ${s.id}`, { filePath, fieldPath: `sources[${i}].id` })
      sourceIds.add(s.id)
      if (!isString(s.type) || !VALID_SOURCE_TYPES.has(s.type as SourceType)) dc.error('INVALID_SOURCE_TYPE', `sources[${i}].type is invalid`, { filePath, fieldPath: `sources[${i}].type` })
      if (!isString(s.url) || !s.url.startsWith('http')) dc.error('INVALID_SOURCE_URL', `sources[${i}].url must be a valid URL`, { filePath, fieldPath: `sources[${i}].url` })
      if (!isString(s.title) || s.title.length < 1) dc.error('INVALID_SOURCE_TITLE', `sources[${i}].title required`, { filePath, fieldPath: `sources[${i}].title` })
      if (!isString(s.accessedAt) || !DATE_PATTERN.test(s.accessedAt)) dc.error('INVALID_DATE', `sources[${i}].accessedAt must be a date`, { filePath, fieldPath: `sources[${i}].accessedAt` })
      if (strictBot && (!isString(s.url) || !s.url.startsWith('https://'))) {
        dc.error('INSECURE_SOURCE_URL', `sources[${i}].url must use HTTPS`, { filePath, fieldPath: `sources[${i}].url` })
      }
    })
  }

  if (Array.isArray(m.colors)) {
    (m.colors as unknown[]).forEach((col, i) => {
      const c = col as BrandColor
      if (typeof c !== 'object' || c === null) { dc.error('INVALID_COLOR', `colors[${i}] must be an object`, { filePath, fieldPath: `colors[${i}]` }); return }
      if (!isString(c.id) || !BRAND_ID_PATTERN.test(c.id)) dc.error('INVALID_COLOR_ID', `colors[${i}].id must be kebab-case`, { filePath, fieldPath: `colors[${i}].id` })
      if (!isString(c.value) || !HEX_COLOR_PATTERN.test(c.value)) dc.error('INVALID_COLOR_VALUE', `colors[${i}].value must be hex color`, { filePath, fieldPath: `colors[${i}].value` })
      if (!isString(c.role) || !VALID_COLOR_ROLES.has(c.role as ColorRole)) dc.error('INVALID_COLOR_ROLE', `colors[${i}].role is invalid`, { filePath, fieldPath: `colors[${i}].role` })
      if (!Array.isArray(c.themes) || c.themes.length < 1 || !c.themes.every((t) => VALID_THEMES.has(t as ThemeSuitability))) dc.error('INVALID_COLOR_THEMES', `colors[${i}].themes invalid`, { filePath, fieldPath: `colors[${i}].themes` })
      if (!Array.isArray(c.sourceIds) || c.sourceIds.length < 1) {
        dc.error('COLOR_MISSING_SOURCE', `colors[${i}] requires sourceIds`, { filePath, fieldPath: `colors[${i}].sourceIds` })
      } else {
        for (const sid of c.sourceIds) if (!sourceIds.has(sid)) dc.error('UNKNOWN_SOURCE_REF', `colors[${i}] references unknown source: ${sid}`, { filePath, fieldPath: `colors[${i}].sourceIds` })
      }
      if (!isString(c.reviewStatus) || !VALID_REVIEW_STATUSES.has(c.reviewStatus as ReviewStatus)) dc.error('INVALID_REVIEW_STATUS', `colors[${i}].reviewStatus invalid`, { filePath, fieldPath: `colors[${i}].reviewStatus` })
    })
  }

  if (Array.isArray(m.assets)) {
    if (m.assets.length === 0) dc.error('NO_ASSETS', 'At least one asset is required', { filePath, fieldPath: 'assets' })
    ;(m.assets as unknown[]).forEach((ast, i) => {
      const a = ast as BrandAsset
      if (typeof a !== 'object' || a === null) { dc.error('INVALID_ASSET', `assets[${i}] must be an object`, { filePath, fieldPath: `assets[${i}]` }); return }
      const req = ['id', 'file', 'type', 'variant', 'themes', 'monochrome', 'current', 'sourceIds', 'reviewStatus']
      for (const r of req) if (!(r in a)) dc.error('ASSET_MISSING_FIELD', `assets[${i}] missing: ${r}`, { filePath, fieldPath: `assets[${i}].${r}` })
      if (!isString(a.id) || !BRAND_ID_PATTERN.test(a.id)) dc.error('INVALID_ASSET_ID', `assets[${i}].id must be kebab-case`, { filePath, fieldPath: `assets[${i}].id` })
      if (!isString(a.file) || !ASSET_FILE_PATTERN.test(a.file)) dc.error('INVALID_ASSET_FILE', `assets[${i}].file must be assets/*.svg`, { filePath, fieldPath: `assets[${i}].file` })
      if (!isString(a.type) || !VALID_ASSET_TYPES.has(a.type as AssetType)) dc.error('INVALID_ASSET_TYPE', `assets[${i}].type invalid`, { filePath, fieldPath: `assets[${i}].type` })
      if (!isString(a.variant) || !VALID_ASSET_VARIANTS.has(a.variant as AssetVariant)) dc.error('INVALID_ASSET_VARIANT', `assets[${i}].variant invalid`, { filePath, fieldPath: `assets[${i}].variant` })
      if (!Array.isArray(a.themes) || a.themes.length < 1 || !a.themes.every((t) => VALID_THEMES.has(t as ThemeSuitability))) dc.error('INVALID_ASSET_THEMES', `assets[${i}].themes invalid`, { filePath, fieldPath: `assets[${i}].themes` })
      if (a.orientation !== undefined && (!isString(a.orientation) || !VALID_ORIENTATIONS.has(a.orientation as AssetOrientation))) dc.error('INVALID_ORIENTATION', `assets[${i}].orientation invalid`, { filePath, fieldPath: `assets[${i}].orientation` })
      if (!Array.isArray(a.sourceIds) || a.sourceIds.length < 1) {
        dc.error('ASSET_MISSING_SOURCE', `assets[${i}] requires sourceIds`, { filePath, fieldPath: `assets[${i}].sourceIds` })
      } else {
        for (const sid of a.sourceIds) if (!sourceIds.has(sid)) dc.error('UNKNOWN_SOURCE_REF', `assets[${i}] references unknown source: ${sid}`, { filePath, fieldPath: `assets[${i}].sourceIds` })
      }
      if (!isString(a.reviewStatus) || !VALID_REVIEW_STATUSES.has(a.reviewStatus as ReviewStatus)) dc.error('INVALID_REVIEW_STATUS', `assets[${i}].reviewStatus invalid`, { filePath, fieldPath: `assets[${i}].reviewStatus` })
    })
  }

  if (m.organization !== undefined && m.organization !== null) {
    const o = m.organization as Record<string, unknown>
    if (typeof o === 'object' && o !== null) {
      if (o.parentBrandId !== undefined && (!isString(o.parentBrandId) || !BRAND_ID_PATTERN.test(o.parentBrandId))) dc.error('INVALID_PARENT', 'organization.parentBrandId must be kebab-case', { filePath, fieldPath: 'organization.parentBrandId' })
      if (o.countryCode !== undefined && (!isString(o.countryCode) || !COUNTRY_PATTERN.test(o.countryCode))) dc.error('INVALID_COUNTRY', 'organization.countryCode must be ISO-3166 alpha-2', { filePath, fieldPath: 'organization.countryCode' })
    }
  }

  if (m.review !== undefined) {
    const r = m.review as Record<string, unknown>
    if (typeof r === 'object' && r !== null) {
      if (!isString(r.status) || !VALID_OVERALL_STATUSES.has(r.status as OverallReviewStatus)) dc.error('INVALID_REVIEW_STATUS_OVERALL', 'review.status invalid', { filePath, fieldPath: 'review.status' })
      if (!isString(r.method) || !VALID_REVIEW_METHODS.has(r.method as ReviewMethod)) dc.error('INVALID_REVIEW_METHOD', 'review.method invalid', { filePath, fieldPath: 'review.method' })
      if (strictBot) {
        if (r.status === 'verified') dc.error('BOT_SELF_VERIFY', 'Bot submissions cannot set verified status', { filePath, fieldPath: 'review.status' })
        if (r.reviewer !== undefined && r.reviewer !== null) dc.error('BOT_SELF_REVIEWER', 'Bot submissions cannot assign a reviewer', { filePath, fieldPath: 'review.reviewer' })
        if (r.verifiedAt !== undefined && r.verifiedAt !== null) dc.error('BOT_SELF_VERIFIED_AT', 'Bot submissions cannot set verifiedAt', { filePath, fieldPath: 'review.verifiedAt' })
      }
    }
  }

  if (m.$schema !== undefined && m.$schema !== '../../../packages/schema/json-schema/brand.schema.json') {
    dc.warning('SCHEMA_REF', '$schema should reference the canonical schema', { filePath, fieldPath: '$schema' })
  }

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

export function validateCategories(data: unknown, opts: { filePath?: string } = {}): ValidationResult {
  const dc = new DiagnosticCollector()
  const { filePath } = opts
  const d = data as Record<string, unknown>

  if (typeof d !== 'object' || d === null || Array.isArray(d)) {
    dc.error('INVALID_TYPE', 'Categories file must be an object', { filePath })
    return { valid: false, diagnostics: dc.all }
  }
  if (!Array.isArray(d.categories)) {
    dc.error('MISSING_FIELD', 'categories array is required', { filePath, fieldPath: 'categories' })
    return { valid: false, diagnostics: dc.all }
  }

  const ids = new Set<string>()
  ;(d.categories as unknown[]).forEach((entry, i) => {
    const c = entry as CategoryEntry
    if (typeof c !== 'object' || c === null) { dc.error('INVALID_CATEGORY_ENTRY', `categories[${i}] must be an object`, { filePath, fieldPath: `categories[${i}]` }); return }
    if (!isString(c.id) || !BRAND_ID_PATTERN.test(c.id)) dc.error('INVALID_CATEGORY_ID', `categories[${i}].id must be kebab-case`, { filePath, fieldPath: `categories[${i}].id` })
    if (ids.has(c.id)) dc.error('DUPLICATE_CATEGORY_ID', `Duplicate category id: ${c.id}`, { filePath })
    ids.add(c.id)
    if (!isString(c.label) || c.label.length < 1) dc.error('INVALID_CATEGORY_LABEL', `categories[${i}].label required`, { filePath, fieldPath: `categories[${i}].label` })
    if (c.parentId !== null && (!isString(c.parentId) || !BRAND_ID_PATTERN.test(c.parentId))) dc.error('INVALID_PARENT_ID', `categories[${i}].parentId invalid`, { filePath, fieldPath: `categories[${i}].parentId` })
    else if (isString(c.parentId) && !ids.has(c.parentId) && c.parentId !== null) {
      const later = (d.categories as unknown[]).some((e2) => (e2 as CategoryEntry).id === c.parentId)
      if (!later) dc.error('UNKNOWN_PARENT', `categories[${i}].parentId '${c.parentId}' does not exist`, { filePath, fieldPath: `categories[${i}].parentId` })
    }
  })

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

export function validatePackRequest(req: unknown): ValidationResult {
  const dc = new DiagnosticCollector()
  const r = req as Record<string, unknown>

  if (typeof r !== 'object' || r === null || Array.isArray(r)) {
    dc.error('INVALID_TYPE', 'Pack request must be an object')
    return { valid: false, diagnostics: dc.all }
  }

  const required = ['assetTypes', 'themes', 'formats', 'metadata', 'folderLayout', 'filenameStrategy', 'includeHistorical', 'missingPolicy']
  for (const key of required) if (!(key in r)) dc.error('MISSING_FIELD', `Missing: ${key}`, { fieldPath: key })

  const hasBrands = Array.isArray(r.brandIds) && r.brandIds.length > 0
  const hasCollection = isString(r.collectionId) && r.collectionId.length > 0
  if (hasBrands && hasCollection) dc.error('MUTUAL_EXCLUSION', 'Specify brandIds OR collectionId, not both')
  if (!hasBrands && !hasCollection) dc.error('MISSING_TARGET', 'Either brandIds or collectionId is required')

  if (Array.isArray(r.brandIds)) {
    if (r.brandIds.length > 100) dc.error('TOO_MANY_BRANDS', 'Maximum 100 brands', { fieldPath: 'brandIds' })
    r.brandIds.forEach((id: unknown, i: number) => {
      if (!isString(id) || !BRAND_ID_PATTERN.test(id)) dc.error('INVALID_BRAND_ID', `brandIds[${i}] must be kebab-case`, { fieldPath: `brandIds[${i}]` })
    })
    if (!uniqueArray(r.brandIds)) dc.error('DUPLICATE_BRANDS', 'brandIds contains duplicates', { fieldPath: 'brandIds' })
  }

  const validAssetTypes = new Set(['recommended', 'symbol', 'icon', 'wordmark', 'logo', 'lockup', 'badge', 'all-current'])
  const validThemes = new Set(['light', 'dark', 'any'])
  const validFormats = new Set(['svg', 'png', 'webp'])
  const validMetadata = new Set(['none', 'compact', 'complete'])
  const validFolder = new Set(['flat', 'by-brand'])
  const validFilename = new Set(['stable-id', 'descriptive'])
  const validMissing = new Set(['strict', 'recommended-fallback', 'skip'])

  if (Array.isArray(r.assetTypes)) {
    if (r.assetTypes.length < 1 || r.assetTypes.length > 8) dc.error('INVALID_ASSET_TYPES', '1-8 assetTypes required', { fieldPath: 'assetTypes' })
    r.assetTypes.forEach((t: unknown) => { if (!isString(t) || !validAssetTypes.has(t)) dc.error('INVALID_ASSET_TYPE', `Invalid asset type: ${t}`, { fieldPath: 'assetTypes' }) })
  }
  if (Array.isArray(r.themes)) {
    if (r.themes.length < 1 || r.themes.length > 3) dc.error('INVALID_THEMES', '1-3 themes required', { fieldPath: 'themes' })
    r.themes.forEach((t: unknown) => { if (!isString(t) || !validThemes.has(t)) dc.error('INVALID_THEME', `Invalid theme: ${t}`, { fieldPath: 'themes' }) })
  }
  if (Array.isArray(r.formats)) {
    if (r.formats.length < 1 || r.formats.length > 3) dc.error('INVALID_FORMATS', '1-3 formats required', { fieldPath: 'formats' })
    r.formats.forEach((f: unknown) => { if (!isString(f) || !validFormats.has(f)) dc.error('INVALID_FORMAT', `Invalid format: ${f}`, { fieldPath: 'formats' }) })
  }
  if (isString(r.metadata) && !validMetadata.has(r.metadata)) dc.error('INVALID_METADATA', 'metadata must be none|compact|complete', { fieldPath: 'metadata' })
  if (isString(r.folderLayout) && !validFolder.has(r.folderLayout)) dc.error('INVALID_FOLDER_LAYOUT', 'folderLayout must be flat|by-brand', { fieldPath: 'folderLayout' })
  if (isString(r.filenameStrategy) && !validFilename.has(r.filenameStrategy)) dc.error('INVALID_FILENAME_STRATEGY', 'filenameStrategy must be stable-id|descriptive', { fieldPath: 'filenameStrategy' })
  if (isString(r.missingPolicy) && !validMissing.has(r.missingPolicy)) dc.error('INVALID_MISSING_POLICY', 'missingPolicy must be strict|recommended-fallback|skip', { fieldPath: 'missingPolicy' })

  if (r.raster !== undefined && typeof r.raster === 'object' && r.raster !== null) {
    const ra = r.raster as Record<string, unknown>
    if (Array.isArray(ra.sizes)) {
      if (ra.sizes.length > 2) dc.error('TOO_MANY_SIZES', 'Maximum 2 raster sizes', { fieldPath: 'raster.sizes' })
      ra.sizes.forEach((s: unknown) => { if (typeof s !== 'number' || s < 16 || s > 2048) dc.error('INVALID_SIZE', 'Size must be 16-2048', { fieldPath: 'raster.sizes' }) })
    }
  }

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

export function validateContributionSubmission(sub: unknown, opts: { strictBot?: boolean } = {}): ValidationResult {
  const dc = new DiagnosticCollector()
  const s = sub as Record<string, unknown>
  const { strictBot } = opts

  if (typeof s !== 'object' || s === null) {
    dc.error('INVALID_TYPE', 'Submission must be an object')
    return { valid: false, diagnostics: dc.all }
  }

  const required = ['type', 'brandId', 'baseDatasetVersion', 'manifest', 'uploads', 'declarations']
  for (const key of required) if (!(key in s)) dc.error('MISSING_FIELD', `Missing: ${key}`, { fieldPath: key })

  const validTypes = new Set(['new-brand', 'edit-brand', 'add-asset', 'correct-colors', 'add-historical'])
  if (!isString(s.type) || !validTypes.has(s.type)) dc.error('INVALID_TYPE', 'Invalid contribution type', { fieldPath: 'type' })
  if (!isString(s.brandId) || !BRAND_ID_PATTERN.test(s.brandId)) dc.error('INVALID_BRAND_ID', 'brandId must be kebab-case', { fieldPath: 'brandId' })
  if (!isString(s.baseDatasetVersion) || s.baseDatasetVersion.length < 1) dc.error('INVALID_VERSION', 'baseDatasetVersion required', { fieldPath: 'baseDatasetVersion' })

  if (s.manifest !== undefined) {
    const manifestResult = validateBrandManifest(s.manifest, { strictBot })
    dc.merge(DiagnosticCollector.from(manifestResult.diagnostics))
  }

  if (Array.isArray(s.uploads)) {
    if (strictBot && s.uploads.length > 5) dc.error('TOO_MANY_UPLOADS', 'Maximum 5 SVG uploads', { fieldPath: 'uploads' })
    let totalSize = 0
    s.uploads.forEach((u: unknown, i: number) => {
      const up = u as Record<string, unknown>
      if (typeof up !== 'object' || up === null) { dc.error('INVALID_UPLOAD', `uploads[${i}] must be an object`, { fieldPath: `uploads[${i}]` }); return }
      if (typeof up.size !== 'number' || up.size > 524288) dc.error('UPLOAD_TOO_LARGE', `uploads[${i}].size exceeds 512KiB`, { fieldPath: `uploads[${i}].size` })
      totalSize += typeof up.size === 'number' ? up.size : 0
      if (typeof up.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(up.sha256)) dc.error('INVALID_SHA', `uploads[${i}].sha256 invalid`, { fieldPath: `uploads[${i}].sha256` })
    })
    if (strictBot && totalSize > 2097152) dc.error('TOTAL_TOO_LARGE', 'Total upload size exceeds 2MiB', { fieldPath: 'uploads' })
  }

  if (s.declarations !== undefined && typeof s.declarations === 'object' && s.declarations !== null) {
    const dec = s.declarations as Record<string, unknown>
    if (dec.sourcesPublic !== true) dc.error('DECLARATION_REQUIRED', 'sourcesPublic must be true', { fieldPath: 'declarations.sourcesPublic' })
    if (dec.noConfidentialMaterial !== true) dc.error('DECLARATION_REQUIRED', 'noConfidentialMaterial must be true', { fieldPath: 'declarations.noConfidentialMaterial' })
    if (dec.noOwnershipClaim !== true) dc.error('DECLARATION_REQUIRED', 'noOwnershipClaim must be true', { fieldPath: 'declarations.noOwnershipClaim' })
    if (!isString(dec.termsVersion) || dec.termsVersion.length < 1) dc.error('INVALID_TERMS_VERSION', 'termsVersion required', { fieldPath: 'declarations.termsVersion' })
  }

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

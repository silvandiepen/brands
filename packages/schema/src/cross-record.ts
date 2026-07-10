import { DiagnosticCollector, type ValidationResult } from './diagnostics.js'
import { BRAND_ID_PATTERN, type BrandManifest } from './types.js'

export interface CrossRecordContext {
  validCategoryIds: Set<string>
  existingBrandIds: Set<string>
}

export interface CrossRecordBrand {
  id: string
  manifest: BrandManifest
  filePath: string
}

export function validateCrossRecord(brands: CrossRecordBrand[], ctx: CrossRecordContext): ValidationResult {
  const dc = new DiagnosticCollector()

  const ids = new Map<string, string>()
  const aliases = new Map<string, string>()
  const domains = new Map<string, string>()

  for (const { manifest, filePath } of brands) {
    const id = manifest.id

    if (!BRAND_ID_PATTERN.test(id)) {
      dc.error('INVALID_ID', `Invalid brand id: ${id}`, { filePath, brandId: id })
      continue
    }

    if (ids.has(id)) {
      dc.error('DUPLICATE_ID', `Duplicate brand id '${id}' also in ${ids.get(id)}`, { filePath, brandId: id })
    } else {
      ids.set(id, filePath)
    }

    for (const alias of manifest.aliases || []) {
      const lk = alias.toLowerCase()
      if (aliases.has(lk) && aliases.get(lk) !== id) {
        dc.error('ALIAS_COLLISION', `Alias '${alias}' conflicts with brand '${aliases.get(lk)}'`, { filePath, brandId: id })
      } else {
        aliases.set(lk, id)
      }
    }

    for (const domain of manifest.domains || []) {
      const lk = domain.toLowerCase()
      if (domains.has(lk) && domains.get(lk) !== id) {
        dc.error('DOMAIN_COLLISION', `Domain '${domain}' conflicts with brand '${domains.get(lk)}'`, { filePath, brandId: id })
      } else {
        domains.set(lk, id)
      }
    }

    for (const cat of manifest.categories || []) {
      if (!ctx.validCategoryIds.has(cat)) {
        dc.error('UNKNOWN_CATEGORY', `Category '${cat}' not in taxonomy`, { filePath, brandId: id })
      }
    }

    if (manifest.organization?.parentBrandId) {
      const parentId = manifest.organization.parentBrandId
      if (parentId !== id && !brands.some((b) => b.id === parentId)) {
        dc.warning('UNKNOWN_PARENT', `Parent brand '${parentId}' not found in dataset`, { filePath, brandId: id })
      }
    }

    let hasCurrent = false
    let currentCount = 0
    for (const asset of manifest.assets || []) {
      if (asset.current) {
        hasCurrent = true
        currentCount++
      }
    }
    if (!hasCurrent && (manifest.assets || []).length > 0) {
      dc.warning('NO_CURRENT_ASSET', `No current asset declared`, { filePath, brandId: id })
    }
    if (currentCount > 1) {
      dc.warning('AMBIGUOUS_CURRENT', `${currentCount} current assets; selection may be ambiguous`, { filePath, brandId: id })
    }
  }

  return { valid: !dc.hasErrors, diagnostics: dc.all }
}

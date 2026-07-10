export {
  validateSvgSecurity,
  normalizeSvg,
  extractSvgMetadata,
  generatePreviewSvg,
} from './svg.js'
export type { SvgSecurityResult, SvgMetadata } from './svg.js'

export {
  loadDataset,
  loadCategories,
  loadCollectionIds,
  loadBrandDir,
  validateDataset,
} from './validate.js'
export type { LoadedBrand, LoadedDataset, DatasetValidationResult } from './validate.js'

export {
  generateCompactIndex,
  generateBrandDetail,
  generateRelease,
} from './generate.js'
export type {
  CompactBrand,
  CompactAsset,
  GeneratedBrand,
  GeneratedRelease,
} from './generate.js'

export { DiagnosticCollector } from './diagnostics.js'
export type { Diagnostic, DiagnosticSeverity, ValidationResult } from './diagnostics.js'

export * from './types.js'

export {
  validateBrandManifest,
  validateCategories,
  validatePackRequest,
  validateContributionSubmission,
} from './validators.js'

export { validateCrossRecord } from './cross-record.js'
export type { CrossRecordContext, CrossRecordBrand } from './cross-record.js'

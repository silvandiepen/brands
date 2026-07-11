export const BRAND_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/
export const DOMAIN_PATTERN = /^(?!https?:\/\/)(?!www\.)[a-z0-9.-]+\.[a-z]{2,}$/

export type BrandStatus = 'active' | 'discontinued' | 'historical' | 'merged' | 'needs-review' | 'disputed'
export type ColorRole = 'primary' | 'secondary' | 'accent' | 'neutral' | 'background' | 'historical'
export type ThemeSuitability = 'light' | 'dark' | 'any' | 'custom'
export type ReviewStatus = 'verified' | 'community-sourced' | 'needs-review' | 'disputed'
export type AssetType = 'symbol' | 'icon' | 'wordmark' | 'logo' | 'lockup' | 'badge' | 'historical'
export type AssetVariant =
  | 'color'
  | 'monochrome'
  | 'black'
  | 'white'
  | 'positive'
  | 'negative'
  | 'outline'
  | 'historical'
export type AssetOrientation = 'square' | 'horizontal' | 'vertical' | 'free'
export type SourceType =
  | 'official-guidelines'
  | 'official-download'
  | 'official-website'
  | 'trademark-registry'
  | 'repository'
  | 'community-reference'
export type ReviewMethod =
  | 'official-guidelines'
  | 'official-download'
  | 'official-website'
  | 'cross-reference'
  | 'community-review'
export type OverallReviewStatus = 'verified' | 'partial' | 'needs-review' | 'disputed'

export interface BrandColor {
  id: string
  name?: string | null
  value: string
  role: ColorRole
  themes: ThemeSuitability[]
  usage?: string[]
  sourceIds: string[]
  reviewStatus: ReviewStatus
}

export interface BrandAsset {
  id: string
  file: string
  type: AssetType
  variant: AssetVariant
  themes: ThemeSuitability[]
  orientation?: AssetOrientation
  monochrome: boolean
  transformable?: boolean
  current: boolean
  sourceIds: string[]
  reviewStatus: ReviewStatus
  usageNotes?: string | null
}

export interface BrandSource {
  id: string
  type: SourceType
  url: string
  title: string
  publisher?: string | null
  accessedAt: string
  notes?: string | null
}

export interface BrandOrganization {
  name?: string
  parentBrandId?: string
  ownerName?: string
  countryCode?: string
}

export interface BrandReview {
  status: OverallReviewStatus
  verifiedAt?: string | null
  method: ReviewMethod
  reviewer?: string | null
  notes?: string | null
}

export interface BrandSocialLink {
  type: 'twitter' | 'github' | 'linkedin' | 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'discord' | 'website'
  url: string
}

export interface BrandCompanyInfo {
  foundedYear?: number
  employees?: number
  kind?: 'PUBLIC_COMPANY' | 'PRIVATELY_HELD' | 'NON_PROFIT' | 'GOVERNMENT_AGENCY' | 'SELF_EMPLOYED' | 'PARTNERSHIP'
  countryCode?: string
  city?: string
  region?: string
  industries?: string[]
  ticker?: string
  isin?: string
}

export interface BrandFont {
  name: string
  type: 'title' | 'body'
  origin?: 'google' | 'custom' | 'system'
  weights?: number[]
}

export interface BrandManifest {
  $schema?: string
  id: string
  name: string
  aliases: string[]
  domains: string[]
  status: BrandStatus
  organization?: BrandOrganization | null
  categories: string[]
  tags: string[]
  colors: BrandColor[]
  assets: BrandAsset[]
  sources: BrandSource[]
  review: BrandReview
  social?: BrandSocialLink[]
  company?: BrandCompanyInfo
  fonts?: BrandFont[]
  description?: string
  qualityScore?: number
}

export interface CategoryEntry {
  id: string
  label: string
  parentId: string | null
  description?: string
}

export interface CategoriesFile {
  $schema?: string
  categories: CategoryEntry[]
}

export type PackAssetType = 'recommended' | 'symbol' | 'icon' | 'wordmark' | 'logo' | 'lockup' | 'badge' | 'all-current'
export type PackTheme = 'light' | 'dark' | 'any'
export type PackFormat = 'svg' | 'png' | 'webp'
export type PackMetadataLevel = 'none' | 'compact' | 'complete'
export type PackTokenFormat = 'css' | 'scss' | 'json' | 'dtcg'
export type PackSnippetFormat = 'html' | 'vue' | 'react' | 'markdown' | 'css-mask'
export type PackFolderLayout = 'flat' | 'by-brand'
export type PackFilenameStrategy = 'stable-id' | 'descriptive'
export type PackMissingPolicy = 'strict' | 'recommended-fallback' | 'skip'

export interface PackRasterConfig {
  sizes?: number[]
  padding?: number
  background?: string
}

export interface PackRequest {
  datasetVersion?: string
  brandIds?: string[]
  collectionId?: string
  assetTypes: PackAssetType[]
  themes: PackTheme[]
  formats: PackFormat[]
  raster?: PackRasterConfig
  metadata: PackMetadataLevel
  tokens?: PackTokenFormat[]
  snippets?: PackSnippetFormat[]
  folderLayout: PackFolderLayout
  filenameStrategy: PackFilenameStrategy
  includeHistorical: boolean
  includeProvenance?: boolean
  missingPolicy: PackMissingPolicy
}

export type ContributionType = 'new-brand' | 'edit-brand' | 'add-asset' | 'correct-colors' | 'add-historical'

export interface ContributionUpload {
  uploadId: string
  filename: string
  size: number
  sha256: string
  assetId: string
}

export interface ContributionDeclarations {
  sourcesPublic: true
  noConfidentialMaterial: true
  noOwnershipClaim: true
  termsVersion: string
}

export interface ContributionSubmission {
  type: ContributionType
  brandId: string
  baseDatasetVersion: string
  manifest: BrandManifest
  uploads: ContributionUpload[]
  summary?: string
  acknowledgedWarnings?: string[]
  declarations: ContributionDeclarations
}

export interface ReleaseManifest {
  datasetVersion: string
  createdAt: string
  brandCount: number
  assetCount: number
  checksum: string
  brands: Record<string, { name: string; checksum: string }>
}

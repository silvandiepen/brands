export interface GeneratedColor {
  id: string
  name: string | null
  value: string
  role: string
  themes: string[]
  sourceIds: string[]
  reviewStatus: string
  formats: {
    hex: string
    rgb: string
    hsl: string
    oklch: string
    luminance: number
    contrastOnWhite: number
    contrastOnBlack: number
    recommendedTextColor: string
  }
}

export interface GeneratedAsset {
  id: string
  file: string
  type: string
  variant: string
  themes: string[]
  orientation?: string | undefined
  monochrome: boolean
  transformable: boolean
  current: boolean
  sourceIds: string[]
  reviewStatus: string
  metadata: {
    sha256: string
    byteSize: number
    width: number
    height: number
    viewBox: { x: number; y: number; width: number; height: number } | null
    colors: string[]
    elementCount: number
  }
}

export interface GeneratedBrand {
  id: string
  name: string
  aliases: string[]
  domains: string[]
  status: string
  organization: Record<string, unknown> | null
  categories: string[]
  tags: string[]
  colors: GeneratedColor[]
  assets: GeneratedAsset[]
  sources: Array<{
    id: string
    type: string
    url: string
    title: string
    publisher?: string | null
    accessedAt: string
    notes?: string | null
  }>
  review: {
    status: string
    verifiedAt?: string | null
    method: string
    reviewer?: string | null
    notes?: string | null
  }
  social?: Array<{ type: string; url: string }>
  company?: Record<string, unknown> | null
  fonts?: Array<{ name: string; type: string; origin?: string }>
  description?: string | null
  qualityScore?: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
  requestId: string
}

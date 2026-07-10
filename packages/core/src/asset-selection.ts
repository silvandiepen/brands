import type { BrandManifest, BrandAsset, ThemeSuitability, AssetType, AssetVariant } from '@open-brands/schema'

export interface AssetSelectionCriteria {
  type?: AssetType | 'recommended'
  variant?: AssetVariant
  theme?: ThemeSuitability | 'any'
  orientation?: 'square' | 'horizontal' | 'vertical' | 'free'
  current?: boolean
}

export interface SelectedAsset {
  asset: BrandAsset
  reason: string
}

const TYPE_PRIORITY: AssetType[] = ['symbol', 'icon', 'logo', 'lockup', 'wordmark', 'badge']
const ORIENTATION_PRIORITY = ['square', 'horizontal', 'vertical', 'free'] as const

function themeMatch(assetThemes: ThemeSuitability[], requested: ThemeSuitability | 'any'): boolean {
  if (requested === 'any') return true
  if (assetThemes.includes('any')) return true
  return assetThemes.includes(requested)
}

export function selectAsset(
  manifest: BrandManifest,
  criteria: AssetSelectionCriteria = {},
): SelectedAsset | null {
  const assets = manifest.assets
  if (!assets || assets.length === 0) return null

  const { type = 'recommended', variant, theme = 'any', orientation, current = true } = criteria

  let candidates = assets.filter((a) => themeMatch(a.themes, theme))
  if (current) candidates = candidates.filter((a) => a.current)
  if (variant) candidates = candidates.filter((a) => a.variant === variant)
  if (orientation) candidates = candidates.filter((a) => a.orientation === orientation || !a.orientation)

  if (candidates.length === 0) {
    candidates = assets.filter((a) => a.current || !current)
    if (candidates.length === 0) candidates = assets
  }

  if (type !== 'recommended') {
    const typed = candidates.filter((a) => a.type === type)
    if (typed.length > 0) candidates = typed
  }

  candidates.sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1
    if (type !== 'recommended') {
      const at = TYPE_PRIORITY.indexOf(a.type)
      const bt = TYPE_PRIORITY.indexOf(b.type)
      if (at !== bt) return at - bt
    }
    if (a.variant === 'color' && b.variant !== 'color') return -1
    if (b.variant === 'color' && a.variant !== 'color') return 1
    const ao = a.orientation ? ORIENTATION_PRIORITY.indexOf(a.orientation) : 99
    const bo = b.orientation ? ORIENTATION_PRIORITY.indexOf(b.orientation) : 99
    if (ao !== bo) return ao - bo
    return 0
  })

  const selected = candidates[0]
  if (!selected) return null

  const reason = `${selected.type}/${selected.variant} ${selected.themes.join(',')} ${selected.current ? 'current' : 'non-current'}`
  return { asset: selected, reason }
}

export function getCurrentAssets(manifest: BrandManifest): BrandAsset[] {
  return (manifest.assets || []).filter((a) => a.current)
}

export function getHistoricalAssets(manifest: BrandManifest): BrandAsset[] {
  return (manifest.assets || []).filter((a) => !a.current || a.type === 'historical')
}

export function selectDefaultAsset(manifest: BrandManifest): BrandAsset | null {
  const result = selectAsset(manifest, { type: 'recommended', theme: 'any' })
  return result?.asset || null
}

export function selectForTheme(
  manifest: BrandManifest,
  theme: 'light' | 'dark',
): BrandAsset | null {
  const result = selectAsset(manifest, { type: 'recommended', theme })
  if (result) return result.asset
  return selectDefaultAsset(manifest)
}

import { describe, it, expect } from 'vitest'
import {
  immutableAssetUrl,
  friendlyAssetUrl,
  packUrl,
  releaseManifestUrl,
  brandPageUrl,
  apiBrandUrl,
  apiSearchUrl,
  DEFAULT_URL_CONFIG,
} from '../urls.js'

describe('immutableAssetUrl', () => {
  it('builds SVG URL with content hash', () => {
    const url = immutableAssetUrl('google', 'symbol-color', 'abc123def456', 'svg', '2026-01-01.1.1')
    expect(url).toContain('/releases/2026-01-01.1.1/brands/google/symbol-color.')
    expect(url).toContain('.svg')
    expect(url).toContain('abc123def456')
  })

  it('builds raster URL with width', () => {
    const url = immutableAssetUrl('google', 'symbol-color', 'abc123def456', 'png', 'v1', 512)
    expect(url).toContain('.512.png')
  })

  it('omits width for SVG', () => {
    const url = immutableAssetUrl('google', 'logo', 'abc123', 'svg', 'v1', 512)
    expect(url).not.toContain('.512.')
  })
})

describe('friendlyAssetUrl', () => {
  it('builds current asset URL', () => {
    const url = friendlyAssetUrl('google', 'assets/symbol-color.svg')
    expect(url).toBe('https://cdn.open-brands.org/current/brands/google/symbol-color.svg')
  })
})

describe('packUrl', () => {
  it('builds curated pack URL', () => {
    const url = packUrl('abc123', true, 'cloud', 'v1')
    expect(url).toContain('/packs/curated/cloud/v1/abc123.zip')
  })

  it('builds custom pack URL', () => {
    const url = packUrl('abc123', false, null, null)
    expect(url).toContain('/packs/custom/abc123.zip')
  })
})

describe('releaseManifestUrl', () => {
  it('builds versioned manifest URL', () => {
    expect(releaseManifestUrl('v1')).toContain('/releases/v1/manifest.json')
  })
})

describe('brandPageUrl', () => {
  it('builds website brand page URL', () => {
    expect(brandPageUrl('google')).toBe('https://open-brands.org/brands/google')
  })
})

describe('apiBrandUrl', () => {
  it('builds API brand URL', () => {
    expect(apiBrandUrl('google')).toBe('https://api.open-brands.org/v1/brands/google')
  })
})

describe('apiSearchUrl', () => {
  it('encodes query parameter', () => {
    expect(apiSearchUrl('github')).toContain('q=github')
    expect(apiSearchUrl('foo bar')).toContain('q=foo%20bar')
  })
})

describe('DEFAULT_URL_CONFIG', () => {
  it('has expected origins', () => {
    expect(DEFAULT_URL_CONFIG.cdnOrigin).toBe('https://cdn.open-brands.org')
    expect(DEFAULT_URL_CONFIG.apiOrigin).toBe('https://api.open-brands.org')
    expect(DEFAULT_URL_CONFIG.webOrigin).toBe('https://open-brands.org')
  })
})

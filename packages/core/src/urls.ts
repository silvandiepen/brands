export interface UrlConfig {
  cdnOrigin: string
  apiOrigin: string
  webOrigin: string
}

export const DEFAULT_URL_CONFIG: UrlConfig = {
  cdnOrigin: 'https://cdn.open-brands.org',
  apiOrigin: 'https://api.open-brands.org',
  webOrigin: 'https://open-brands.org',
}

export function immutableAssetUrl(
  brandId: string,
  assetId: string,
  sha256: string,
  extension: string,
  datasetVersion: string,
  width?: number,
  config: UrlConfig = DEFAULT_URL_CONFIG,
): string {
  const hash = sha256.slice(0, 16)
  const base = `${config.cdnOrigin}/releases/${datasetVersion}/brands/${brandId}/${assetId}.${hash}`
  if (width && extension !== 'svg') return `${base}.${width}.${extension}`
  return `${base}.${extension}`
}

export function friendlyAssetUrl(
  brandId: string,
  assetFile: string,
  config: UrlConfig = DEFAULT_URL_CONFIG,
): string {
  const file = assetFile.replace(/^assets\//, '')
  return `${config.cdnOrigin}/current/brands/${brandId}/${file}`
}

export function packUrl(
  packSha: string,
  curated: boolean,
  collectionId: string | null,
  datasetVersion: string | null,
  config: UrlConfig = DEFAULT_URL_CONFIG,
): string {
  if (curated && collectionId && datasetVersion) {
    return `${config.cdnOrigin}/packs/curated/${collectionId}/${datasetVersion}/${packSha}.zip`
  }
  return `${config.cdnOrigin}/packs/custom/${packSha}.zip`
}

export function releaseManifestUrl(
  datasetVersion: string,
  config: UrlConfig = DEFAULT_URL_CONFIG,
): string {
  return `${config.cdnOrigin}/releases/${datasetVersion}/manifest.json`
}

export function currentReleaseManifestUrl(config: UrlConfig = DEFAULT_URL_CONFIG): string {
  return `${config.cdnOrigin}/releases/current/manifest.json`
}

export function brandPageUrl(brandId: string, config: UrlConfig = DEFAULT_URL_CONFIG): string {
  return `${config.webOrigin}/brands/${brandId}`
}

export function apiBrandUrl(brandId: string, config: UrlConfig = DEFAULT_URL_CONFIG): string {
  return `${config.apiOrigin}/v1/brands/${brandId}`
}

export function apiSearchUrl(
  query: string,
  config: UrlConfig = DEFAULT_URL_CONFIG,
): string {
  return `${config.apiOrigin}/v1/search?q=${encodeURIComponent(query)}`
}

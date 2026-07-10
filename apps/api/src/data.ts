import indexData from '../../../packages/data/generated/index.json'
import manifestData from '../../../packages/data/generated/manifest.json'
import categoriesData from '../../../packages/data/generated/categories.json'
import collectionsData from '../../../packages/data/generated/collections-index.json'
import allBrandsData from '../../../packages/data/generated/all-brands.json'

import type { GeneratedBrand, GeneratedColor, GeneratedAsset } from './types.js'

const brandMap = new Map<string, GeneratedBrand>()
for (const brand of allBrandsData as unknown as GeneratedBrand[]) {
  brandMap.set(brand.id, brand)
}

export function getIndex() {
  return indexData as Record<string, {
    id: string
    name: string
    aliases: string[]
    domains: string[]
    categories: string[]
    tags: string[]
    status: string
    hasColors: boolean
    assetCount: number
    reviewStatus: string
  }>
}

export function getManifest() {
  return manifestData as {
    datasetVersion: string
    createdAt: string
    brandCount: number
    assetCount: number
    checksum: string
  }
}

export function getCategories() {
  return categoriesData as { categories: Array<{ id: string; label: string; parentId: string | null; description?: string }> }
}

export function getCollections() {
  return collectionsData as Record<string, { id: string; name: string; brandIds: string[] }>
}

export function getBrand(brandId: string): GeneratedBrand | null {
  return brandMap.get(brandId) ?? null
}

export function getAllBrands(): GeneratedBrand[] {
  return [...brandMap.values()]
}

export type { GeneratedBrand, GeneratedColor, GeneratedAsset }

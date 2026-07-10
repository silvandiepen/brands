import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BrandManifest } from '@open-brands/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

function readData<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function getBrandList() {
  const index = readData<Record<string, {
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
  }>>(join(__dirname, '..', '..', 'data', 'generated', 'index.json'))
  return Object.values(index)
}

export function getBrand(brandId: string) {
  try {
    return readData<BrandManifest>(join(__dirname, '..', '..', 'data', 'generated', 'brands', `${brandId}.json`))
  } catch {
    return null
  }
}

export function getCategories() {
  return readData<{ categories: Array<{ id: string; label: string; parentId: string | null }> }>(
    join(__dirname, '..', '..', 'data', 'generated', 'categories.json'),
  )
}

export function getCollections() {
  return readData<Record<string, { id: string; name: string; brandIds: string[] }>>(
    join(__dirname, '..', '..', 'data', 'generated', 'collections-index.json'),
  )
}

#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const brandsDir = join(root, 'data/brands')
const datasetVersion = 'current'

let uploaded = 0
let failed = 0

const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_API_TOKEN

if (!account || !token) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before running this script')
}

for (const brandId of readdirSync(brandsDir)) {
  if (brandId === 'README.md') continue
  const assetDir = join(brandsDir, brandId, 'assets')
  let files
  try { files = readdirSync(assetDir).filter(f => f.endsWith('.svg')) } catch { continue }

  for (const file of files) {
    const content = readFileSync(join(assetDir, file), 'utf8')
    const key = `releases/${datasetVersion}/brands/${brandId}/${file}`

    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/open-brands-public/objects/${encodeURIComponent(key)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
          body: content,
        },
      )
      if (res.ok) { uploaded++; if (uploaded % 50 === 0) console.log(`Uploaded ${uploaded}...`) }
      else { failed++; console.error(`Failed: ${brandId}/${file} (${res.status})`) }
    } catch (e) {
      failed++
      console.error(`Error: ${brandId}/${file}: ${e}`)
    }
  }
}

console.log(`Done: ${uploaded} uploaded, ${failed} failed`)

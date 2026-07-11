#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const brandsDir = join(root, 'data/brands')

const account = '8cef251b5fdcf6c6f63db98b7aa49f9a'
const token = '***REMOVED-CF-TOKEN***'

// Batch upload with concurrency
const allFiles = []
for (const brandId of readdirSync(brandsDir)) {
  if (brandId === 'README.md') continue
  const assetDir = join(brandsDir, brandId, 'assets')
  let files
  try { files = readdirSync(assetDir).filter(f => f.endsWith('.svg')) } catch { continue }
  for (const file of files) {
    allFiles.push({ brandId, file, path: join(assetDir, file) })
  }
}

console.log(`Uploading ${allFiles.length} SVGs to R2...`)

const BATCH = 20
let uploaded = 0
let failed = 0

for (let i = 0; i < allFiles.length; i += BATCH) {
  const batch = allFiles.slice(i, i + BATCH)
  await Promise.all(batch.map(async ({ brandId, file, path }) => {
    const content = readFileSync(path, 'utf8')
    const key = `releases/current/brands/${brandId}/${file}`
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
      if (res.ok) { uploaded++ }
      else if (res.status === 429) {
        // Rate limited, retry after delay
        await new Promise(r => setTimeout(r, 2000))
        const retry = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/open-brands-public/objects/${encodeURIComponent(key)}`,
          { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'image/svg+xml' }, body: content },
        )
        if (retry.ok) { uploaded++ } else { failed++ }
      }
      else { failed++ }
    } catch { failed++ }
  }))
  if ((i + BATCH) % 200 === 0 || i + BATCH >= allFiles.length) {
    console.log(`Progress: ${Math.min(i + BATCH, allFiles.length)}/${allFiles.length} (${uploaded} ok, ${failed} fail)`)
  }
  // Throttle: wait 300ms between batches
  await new Promise(r => setTimeout(r, 300))
}

console.log(`Done: ${uploaded} uploaded, ${failed} failed`)

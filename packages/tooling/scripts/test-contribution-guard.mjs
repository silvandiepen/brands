#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const guardPath = fileURLToPath(new URL('./check-contribution-pr.mjs', import.meta.url))

const run = (cwd, command, args = []) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

const writeJson = (filePath, value) => {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

const validManifest = () => ({
  $schema: '../../../packages/schema/json-schema/brand.schema.json',
  id: 'example',
  name: 'Example',
  aliases: [],
  domains: ['example.com'],
  status: 'needs-review',
  organization: null,
  categories: ['technology'],
  tags: ['example'],
  colors: [
    {
      id: 'primary',
      name: 'Example Blue',
      value: '#123456',
      role: 'primary',
      themes: ['any'],
      usage: ['brand'],
      sourceIds: ['official-site'],
      reviewStatus: 'community-sourced',
    },
  ],
  assets: [
    {
      id: 'symbol-color',
      file: 'assets/symbol-color.svg',
      type: 'symbol',
      variant: 'color',
      themes: ['any'],
      orientation: 'square',
      monochrome: false,
      transformable: false,
      current: true,
      sourceIds: ['official-site'],
      reviewStatus: 'community-sourced',
      usageNotes: null,
    },
  ],
  sources: [
    {
      id: 'official-site',
      type: 'official-website',
      url: 'https://example.com/brand',
      title: 'Example brand page',
      publisher: 'Example',
      accessedAt: '2026-07-10',
      notes: null,
    },
  ],
  review: {
    status: 'needs-review',
    verifiedAt: null,
    method: 'official-website',
    reviewer: null,
    notes: null,
  },
})

const buildCase = ({ name, mutate, expectedSuccess }) => {
  const directory = mkdtempSync(join(tmpdir(), `open-brands-guard-${name}-`))

  try {
    run(directory, 'git', ['init', '-b', 'main'])
    run(directory, 'git', ['config', 'user.name', 'Open Brands Test'])
    run(directory, 'git', ['config', 'user.email', 'test@example.com'])

    writeFileSync(join(directory, 'README.md'), '# Fixture\n')
    run(directory, 'git', ['add', '.'])
    run(directory, 'git', ['commit', '-m', 'chore: initialize fixture'])
    const baseSha = run(directory, 'git', ['rev-parse', 'HEAD'])

    const manifest = validManifest()
    const files = {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>\n',
    }

    mutate?.({ directory, manifest, files })

    const brandDirectory = join(directory, 'data/brands/example')
    mkdirSync(join(brandDirectory, 'assets'), { recursive: true })
    writeJson(join(brandDirectory, 'brand.json'), manifest)
    writeFileSync(join(brandDirectory, 'assets/symbol-color.svg'), files.svg)

    run(directory, 'git', ['add', '.'])
    run(directory, 'git', ['commit', '-m', `chore(data): ${name}`])
    const headSha = run(directory, 'git', ['rev-parse', 'HEAD'])

    const result = spawnSync(process.execPath, [guardPath], {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        BASE_SHA: baseSha,
        HEAD_SHA: headSha,
        HEAD_REF: 'contrib/123/submission',
      },
    })

    const succeeded = result.status === 0
    if (succeeded !== expectedSuccess) {
      throw new Error(
        `${name}: expected success=${expectedSuccess}, received status ${result.status}\n` +
          `${result.stdout || ''}${result.stderr || ''}`,
      )
    }

    console.log(`ok - ${name}`)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

buildCase({
  name: 'valid website contribution',
  expectedSuccess: true,
})

buildCase({
  name: 'reject script element',
  expectedSuccess: false,
  mutate: ({ files }) => {
    files.svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script></svg>\n'
  },
})

buildCase({
  name: 'reject self verification',
  expectedSuccess: false,
  mutate: ({ manifest }) => {
    manifest.review.status = 'verified'
    manifest.review.verifiedAt = '2026-07-10'
    manifest.review.reviewer = 'contributor'
  },
})

buildCase({
  name: 'reject forbidden repository path',
  expectedSuccess: false,
  mutate: ({ directory }) => {
    writeFileSync(join(directory, 'UNRELATED.md'), 'not allowed\n')
  },
})

buildCase({
  name: 'reject unreferenced svg',
  expectedSuccess: false,
  mutate: ({ directory }) => {
    const assets = join(directory, 'data/brands/example/assets')
    mkdirSync(assets, { recursive: true })
    writeFileSync(
      join(assets, 'unreferenced.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1H0z"/></svg>\n',
    )
  },
})

console.log('Contribution guard tests passed.')

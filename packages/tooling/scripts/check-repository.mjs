#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'README.md',
  'LICENSE',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/vite.config.ts',
  'packages/core/package.json',
  'packages/data/package.json',
  'packages/open-brands/package.json',
  'packages/schema/package.json',
  'packages/tooling/package.json',
  'packages/schema/json-schema/brand.schema.json',
  'packages/schema/json-schema/categories.schema.json',
  'packages/schema/json-schema/pack-request.schema.json',
  'packages/schema/json-schema/contribution-submission.schema.json',
  'data/categories.json',
  'docs/README.md',
  'docs/development/build-directive.md',
  'docs/development/agent-guide.md',
  '.github/workflows/ci.yml',
  '.github/workflows/validate-contribution.yml',
]

const errors = []
for (const file of required) {
  const absolute = join(root, file)
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    errors.push(`Missing required file: ${file}`)
  }
}

for (const file of [
  'package.json',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'packages/core/package.json',
  'packages/data/package.json',
  'packages/open-brands/package.json',
  'packages/schema/package.json',
  'packages/tooling/package.json',
  'packages/schema/json-schema/brand.schema.json',
  'packages/schema/json-schema/categories.schema.json',
  'packages/schema/json-schema/pack-request.schema.json',
  'packages/schema/json-schema/contribution-submission.schema.json',
  'data/categories.json',
]) {
  try {
    JSON.parse(readFileSync(join(root, file), 'utf8'))
  } catch (error) {
    errors.push(`${file} is not valid JSON: ${error.message}`)
  }
}

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)

const allowedRootFiles = new Set([
  '.editorconfig',
  '.gitignore',
  '.npmrc',
  'LICENSE',
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
])
const allowedTopLevelDirectories = new Set(['.github', 'apps', 'data', 'docs', 'packages'])
const allowedApps = new Set(['api', 'web'])
const allowedPackages = new Set(['core', 'data', 'open-brands', 'schema', 'tooling'])

for (const file of tracked) {
  const segments = file.split('/')

  if (segments.length === 1) {
    if (!allowedRootFiles.has(file)) errors.push(`Unexpected root file: ${file}`)
    continue
  }

  if (!allowedTopLevelDirectories.has(segments[0])) {
    errors.push(`Unexpected top-level directory: ${segments[0]} (${file})`)
    continue
  }

  if (segments[0] === 'apps' && !allowedApps.has(segments[1])) {
    errors.push(`Unexpected app workspace: ${segments[1]} (${file})`)
  }

  if (segments[0] === 'packages' && !allowedPackages.has(segments[1])) {
    errors.push(`Unexpected package workspace: ${segments[1]} (${file})`)
  }

  if (segments[0] === 'data') {
    const validDataPath =
      file === 'data/README.md' ||
      file === 'data/categories.json' ||
      file.startsWith('data/brands/') ||
      file.startsWith('data/collections/')
    if (!validDataPath) errors.push(`Unexpected canonical data path: ${file}`)
  }

  if (segments[0] === 'docs' && segments.length === 2 && file !== 'docs/README.md') {
    errors.push(`Documentation must be organized in a section directory: ${file}`)
  }
}

if (errors.length) {
  console.error(`Repository check found ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Repository structure is valid.')

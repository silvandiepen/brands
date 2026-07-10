# Architecture

## Overview

Open Brands is a git-backed data platform. Canonical manifests and original reviewed SVGs live in the repository. A deterministic build pipeline validates them and generates every public surface.

```text
canonical manifests + SVGs
          |
          v
 schema validation and asset sanitation
          |
          +--> normalized dataset and search index
          +--> open-brands npm package
          +--> REST API bundle
          +--> CDN assets and generated images
          +--> website static data and pre-rendered routes
          +--> quality reports
```

No public surface may maintain a separate copy of brand truth.

## Monorepo layout

```text
apps/
  api/
    Cloudflare Worker exposing the public API and transformation routes
  web/
    Vue 3 + Vite website deployed to Cloudflare Pages
packages/
  core/
    pure TypeScript querying, resolving, sorting, filtering, and selection logic
  data/
    generated compact and complete datasets plus search artifacts
  open-brands/
    source for the public npm package named open-brands
  schema/
    Zod schemas, JSON Schema, shared types, and validation error models
  tooling/
    importers, validators, SVG pipeline, generators, reports, and release helpers
data/
  brands/<brand-id>/
    brand.json
    assets/*.svg
  categories.json
  collections/*.json
  legacy/
    normalized imports retained for reconciliation
legacy/
  npm/open-brands-0.0.7/
  npm/sil-brands-0.0.6/
  reports/
docs/
```

## Technology choices

### Workspace

- pnpm workspaces;
- Node.js 22 or newer;
- TypeScript strict mode;
- Vitest for unit and contract tests;
- ESLint and Prettier or the current SIL formatting standard;
- conventional commits and automated releases.

A task runner such as Turborepo is optional. Add it only when workspace build ordering or caching becomes materially useful.

### Website

- Vue 3;
- Vite;
- Vue Router;
- static generation or route pre-rendering for crawlable brand pages;
- `@sil/ui` as the shared UI foundation;
- `@sil/ui/vite` for shared styles and generated theme variables;
- `bemm` for app-local classes;
- unscoped SCSS in stable component blocks;
- Open Icon for generic interface icons, never as a substitute for brand assets.

Do not port the old app-local button and form component system.

### API and hosting

- Cloudflare Worker for `api.open-brands.org`;
- Cloudflare Pages for `open-brands.org`;
- R2 for immutable original and generated asset files when repository-bundled assets become too large;
- Cache API and CDN headers for public responses;
- optional KV for a compact prebuilt search index or current release pointer;
- D1 is not canonical storage and should only be introduced for non-canonical operational data such as rate-limit accounting or contribution workflows.

The first API can bundle the validated compact dataset directly in the Worker. Move to R2/KV only when bundle size, update cadence, or transformation workloads justify it.

## Canonical versus generated files

### Canonical

- `data/brands/**/brand.json`;
- reviewed source SVGs beside their manifest;
- category and collection definitions;
- legal/source references;
- accepted documentation and ADRs.

### Generated

- aggregate JSON;
- TypeScript constants and declaration files;
- per-brand package exports;
- CSS variables and token files;
- search indexes;
- API OpenAPI output when generated from code;
- optimized SVGs;
- PNG/WebP derivatives;
- website route manifests;
- quality reports.

Generated output must be reproducible. Most generated output belongs in package `dist` directories, release artifacts, R2, or deployment bundles rather than git.

## Build pipeline

1. Load all canonical JSON and SVG files.
2. Validate JSON against the current schema.
3. Validate stable IDs, aliases, domains, categories, and cross-references.
4. Parse SVG as XML and reject unsafe constructs.
5. Normalize SVG metadata without altering protected visual geometry.
6. Calculate checksums, dimensions, and derived suitability metadata.
7. Verify referenced source IDs and review records.
8. Build compact and complete datasets.
9. Build alias, domain, category, color, and full-text indexes.
10. Generate package exports and token files.
11. Generate API bundle and OpenAPI contract.
12. Generate website data and pre-render route list.
13. Run unit, contract, accessibility, and visual tests.
14. Produce a deterministic quality report.

A clean build must leave the working tree unchanged.

## Package boundaries

### `packages/schema`

Owns the canonical structures and validation errors. It has no dependency on Vue, Cloudflare, or filesystem-specific code.

### `packages/core`

Consumes normalized data and provides pure functions such as:

- `getBrand`;
- `resolveBrand`;
- `searchBrands`;
- `getBrandColors`;
- `selectBrandAsset`;
- `createAssetUrl`;
- category and collection filtering.

It must work in Node.js, browsers, Workers, and test environments.

### `packages/data`

Contains generated data artifacts with explicit export sizes:

- compact metadata;
- complete metadata;
- aliases and domain index;
- categories and collections;
- optional per-brand JSON modules.

### `packages/open-brands`

Publishes the public `open-brands` package. It composes `core` and generated `data` and defines stable subpath exports. It must not expose workspace internals.

### `apps/api`

Owns HTTP concerns: routing, negotiation, caching, transformation authorization, rate limiting, and OpenAPI.

### `apps/web`

Owns product-specific presentation and navigation. Reusable neutral primitives stay in `@sil/ui`; Open Brands-specific cards, palette displays, asset previews, and API playgrounds stay local.

## Asset storage strategy

Canonical SVGs remain in git because review diffs matter. Release builds create immutable content-addressed assets:

```text
/<release>/<brand-id>/<asset-id>.<checksum>.svg
```

Friendly current URLs may redirect or proxy to the immutable URL. API responses should include both the stable logical URL and immutable version URL when available.

## Search architecture

The build produces normalized indexes for:

- ID;
- display name;
- aliases and historical names;
- domains;
- categories;
- tags;
- organization names;
- common abbreviations.

Exact ID/domain/alias resolution occurs before fuzzy search. Search scoring lives in `packages/core` so web, API, and package behavior remain aligned.

## Releases

- The npm package uses semantic versioning.
- Data releases have an independent dataset version or content hash exposed by the API.
- API `/v1` is not tied to npm major versions.
- Asset URLs are immutable per release/checksum.
- A release is blocked when validation or deterministic generation fails.

## Security boundary

Raw contributed SVG is never served directly. Only validated canonical or generated assets may enter public builds. Website rendering should prefer `<img>` or trusted compiled components over arbitrary `v-html`.

# Open Brands

Open Brands is an open, developer-focused platform for discovering and using brand logos, marks, wordmarks, colors, and related metadata.

This monorepo is the source of truth for:

- the `open-brands` npm package
- the website at `open-brands.org`
- the public Open Brands API
- canonical brand manifests and SVG assets
- validation, transformation, search, and release tooling

The previous `silvandiepen/open-brands` and `silvandiepen/brand-colors` repositories are migration sources only. Their APIs and internal structures will not be preserved.

## Status

The project is being rebuilt from a clean architecture. Start with [the documentation index](./docs/README.md) and [the agent implementation guide](./AGENTS.md).

## Intended workspace

```text
apps/
  api/          Cloudflare Worker API
  web/          Vue 3 website using @sil/ui and bemm
packages/
  core/         framework-neutral query and resolution logic
  data/         generated distributable datasets
  open-brands/  public npm package
  schema/       schemas, validators, and shared types
  tooling/      migration, SVG, search, and release tooling
data/
  brands/       canonical one-directory-per-brand source data
  legacy/       normalized legacy imports
legacy/
  npm/          immutable snapshots of the two published packages
docs/           product, architecture, API, migration, and execution docs
```

## Public identity

- Product: **Open Brands**
- npm: **`open-brands`**
- Website: **`open-brands.org`**
- Repository: **`silvandiepen/brands`**

## Principles

1. One canonical manifest per brand.
2. Every color and asset has provenance and review status.
3. Generated files are reproducible and are never edited by hand.
4. API, package, website, and CDN all consume the same validated dataset.
5. The website uses `@sil/ui` for reusable primitives and `bemm` for app-local BEM classes.
6. Logos remain trademarks of their owners; inclusion never implies affiliation or permission.

## Development

The implementation will use pnpm workspaces. The initial scripts are documentation and migration oriented; package-specific scripts will be added as the workspace is built.

```sh
pnpm install
pnpm migrate:legacy
```

See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for the build sequence.

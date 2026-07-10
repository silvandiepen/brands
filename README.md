# Open Brands

Open Brands is an open platform for reviewed brand logos, symbols, wordmarks, colors, metadata, and source information.

This monorepo contains:

- `apps/web` — the public website at `open-brands.org`;
- `apps/api` — the public API and contribution services;
- `packages/open-brands` — the npm package;
- `packages/core` — shared resolution, search, color, and asset selection logic;
- `packages/schema` — canonical schemas and runtime validation;
- `packages/data` — generated distributable data;
- `packages/tooling` — validation, asset, pack, and release tooling;
- `data` — reviewed canonical brand data.

## Principles

1. Git is the canonical source of brand data.
2. Every asset and color has provenance and review status.
3. The website, API, CDN, packs, and npm package use the same dataset release.
4. Approved public assets are delivered from immutable R2 objects.
5. User uploads are private until a pull request is reviewed, merged, and released.
6. Generated files are reproducible and are not edited by hand.

## Workspace

```text
apps/
  api/
  web/
packages/
  core/
  data/
  open-brands/
  schema/
  tooling/
data/
  brands/
  collections/
  categories.json
docs/
```

## Development

```sh
pnpm install
pnpm check
pnpm test
pnpm build
```

For autonomous end-to-end implementation, start with [`docs/development/build-directive.md`](./docs/development/build-directive.md). All other product and architecture documentation is indexed in [`docs/README.md`](./docs/README.md).

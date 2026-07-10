# Agent Guide

This repository is designed to be implemented by multiple agents without losing architectural consistency.

## Read first

Read these files in order before changing code or data:

1. `docs/PRODUCT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATA_MODEL.md`
4. `docs/API.md`
5. `docs/WEBSITE.md`
6. `docs/MIGRATION.md`
7. `docs/TESTING.md`
8. `docs/IMPLEMENTATION_PLAN.md`

`docs/decisions/` overrides older prose when an accepted decision conflicts with another document.

## Non-negotiable rules

- No backwards compatibility with either legacy repository is required.
- Keep the public package name `open-brands` and website `open-brands.org`.
- Canonical data lives only under `data/brands/`.
- Never hand-edit generated output.
- Do not treat AI-generated brand descriptions, colors, or history as verified facts.
- Every canonical asset and color requires provenance.
- Reject SVGs containing scripts, event handlers, remote references, embedded raster data, or unsafe foreign content.
- Use TypeScript with strict mode.
- Use conventional commits continuously, split by feature.
- Add tests and documentation with each feature.
- Do not commit build output unless a document explicitly marks it as a release artifact.

## Website rules

- Vue 3 with `<script setup lang="ts">`.
- Reuse stable primitives from `@sil/ui` through root imports.
- Configure the `@sil/ui/vite` plugin for shared styles and theme variables.
- Use `bemm` for app-local block, element, and modifier classes.
- Do not use `<style scoped>`.
- Use unscoped SCSS inside stable component blocks.
- Use CSS custom properties for public and internal variants.
- Keep product-specific sections in the app; do not add them to `@sil/ui`.
- Do not rebuild buttons, fields, popups, notices, badges, cards, or layout primitives that already exist in `@sil/ui`.
- Accessibility and keyboard behavior are acceptance criteria, not follow-up work.

## Data rules

- One brand directory per stable brand ID.
- Assets are stored beside the brand manifest and referenced relatively.
- Historical names are aliases unless they represent a genuinely separate brand identity.
- Categories come from a controlled taxonomy; free-form discovery terms belong in tags.
- Preserve raw legacy snapshots under `legacy/`; never promote them directly to canonical data.
- A migrated record begins as `needs-review`.
- Verification must record source URL, verification date, and method.

## Agent lanes

Agents may work in parallel when their ownership does not overlap:

- **Foundation:** workspace, CI, release tooling, shared config.
- **Migration:** snapshots, importers, deduplication reports, provenance extraction.
- **Schema:** JSON Schema/Zod, validators, type generation.
- **Assets:** SVG sanitation, normalization, checksums, previews, transformations.
- **SDK:** `open-brands` package and generated subpath exports.
- **API:** Worker routes, caching, OpenAPI, rate limits.
- **Web:** explorer, detail pages, search, playground, contribution UX.
- **QA:** fixtures, contract tests, accessibility, visual regression, release validation.

Do not have two agents modify the same package or canonical brand directory simultaneously.

## Required checks before completion

At minimum, the final workspace must expose commands equivalent to:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:data
pnpm validate:assets
pnpm build
```

A feature is not complete when its generated outputs differ after a clean rebuild.

## Decision policy

Make reasonable implementation decisions without blocking on questions. Record consequential choices as ADRs under `docs/decisions/`. Prefer the smallest architecture that preserves the product requirements and can be extended later.

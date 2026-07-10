# ADR 0001: Git-backed Open Brands monorepo

- Status: Accepted
- Date: 2026-07-10

## Context

Open Brands needs one reviewable source for canonical data, the npm package, the public API, the website, generated assets, and release tooling.

Brand metadata and SVG geometry benefit from normal code review, clear diffs, branch protection, and reproducible builds. A mutable database or object store would make review and release provenance harder to follow.

## Decision

Use `silvandiepen/brands` as a pnpm monorepo.

Canonical data is stored in git under:

```text
data/brands/<brand-id>/brand.json
data/brands/<brand-id>/assets/*.svg
```

Generate all distributable datasets, indexes, package exports, API bundles, CDN assets, website data, packs, and quality reports from that source.

Public identity remains:

- npm package: `open-brands`;
- website: `open-brands.org`;
- API: `api.open-brands.org`;
- CDN: `cdn.open-brands.org`.

The website uses Vue 3, Vite, `@sil/ui`, and `bemm`. Cloudflare Pages, Workers, R2, Queues, D1, and Durable Objects provide runtime infrastructure without becoming a competing canonical data store.

## Consequences

### Positive

- one source of truth;
- auditable changes and provenance;
- aligned package, API, CDN, packs, and website behavior;
- deterministic releases and rollback;
- clean package and application boundaries.

### Trade-offs

- asset changes require careful review;
- validation and generation tooling are substantial parts of the product;
- canonical releases follow repository changes rather than direct database edits.

## Revisit when

Revisit only if repository size or release frequency materially harms development and a replacement preserves reviewable diffs, provenance, deterministic builds, and a single canonical source.

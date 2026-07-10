# ADR 0001: Git-backed Open Brands monorepo

- Status: Accepted
- Date: 2026-07-10

## Context

The legacy projects split package generation and website behavior across two repositories while duplicating data and generated files. The new platform needs one source for package, API, website, and assets, with visible review history and contribution diffs.

## Decision

Use `silvandiepen/brands` as a pnpm monorepo with canonical one-directory-per-brand manifests and SVGs stored in git.

Generate all aggregate datasets, search indexes, package exports, API bundles, CDN artifacts, and website route data from the canonical source.

Use:

- `open-brands` as the public npm package;
- `open-brands.org` as the public product website;
- Vue 3/Vite with `@sil/ui` and `bemm` for the website;
- Cloudflare Pages/Workers for deployment;
- R2/KV only when generated asset or index scale requires them.

Preserve legacy packages under `legacy/` but do not preserve their APIs.

## Consequences

### Positive

- one reviewable source of truth;
- deterministic generation;
- aligned package/API/web behavior;
- easier contribution and provenance review;
- clean package size boundaries;
- no database required for canonical data.

### Negative

- large asset changes require careful git review;
- canonicalization is more work than blindly merging old JSON;
- build tooling must enforce source/generated separation;
- API deployment follows repository releases rather than direct database edits.

## Revisit when

- repository asset volume materially harms clone/review performance;
- release frequency requires independent data publication infrastructure;
- contribution volume justifies a moderated write service;
- a database provides clear value without becoming a competing source of truth.

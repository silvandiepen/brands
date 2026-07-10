# Autonomous build directive

## Objective

Build Open Brands into a complete, production-quality platform from this repository.

Do not stop at scaffolding, architecture, placeholder routes, mock screens, or partial package APIs. Implement the website, API, canonical data pipeline, public npm package, R2 release system, brand packs, contribution workflow, validation, CI/CD, documentation, tests, and operational tooling described in this repository.

## Authority

You are authorized to make implementation decisions without asking for approval when the repository already establishes the product direction.

Use this precedence when documents conflict:

1. accepted decisions in `docs/decisions/`;
2. architecture and product contracts;
3. this build directive;
4. roadmap and supporting guides.

Do not reopen accepted product decisions unless implementation proves them impossible or materially unsafe. Record consequential deviations as a new decision document.

Do not ask questions merely because several valid technical choices exist. Choose the smallest robust option that satisfies the documented contracts, implement it, test it, and document the decision.

## Read first

Before changing code, read:

1. `README.md`;
2. `docs/README.md`;
3. all accepted decisions in `docs/decisions/`;
4. `docs/architecture/`;
5. `docs/product/`;
6. `docs/operations/`;
7. `docs/policies/`;
8. `docs/development/testing.md`;
9. `docs/development/roadmap.md`;
10. `docs/development/agent-guide.md`.

## Working model

- Work directly on `main`.
- Make coherent conventional commits continuously as features become complete.
- Never put unrelated features into one large final commit.
- Keep the root clean and preserve the enforced monorepo boundaries.
- Use multiple agents or parallel workstreams when useful, but assign non-overlapping ownership.
- Do not leave generated output, temporary reports, downloaded archives, or discarded experiments in the repository.
- Do not weaken tests or validation to make a build pass.
- Do not replace documented functionality with a smaller demo.

Recommended workstreams:

- schema and canonical validation;
- SVG security, normalization, rendering, and derivative generation;
- canonical brand data and provenance;
- shared core search/resolution/selection logic;
- public `open-brands` package;
- Cloudflare API, R2, Queues, D1, Durable Objects, caching, and quotas;
- Vue website using `@sil/ui` and `bemm`;
- cart and deterministic downloadable packs;
- GitHub-authenticated guided contributions and bot-created pull requests;
- CI, releases, deployments, observability, documentation, and QA.

## Implementation order

Build in dependency order, but continue parallel work where package ownership does not overlap.

### 1. Make the workspace green

- Install all workspace dependencies.
- Make `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- Add linting and formatting checks.
- Replace placeholder exports and placeholder app routes with real package surfaces or explicitly tested initial implementations.
- Keep CI green after every coherent phase.

### 2. Implement schema and asset foundations

- Runtime schemas matching the checked-in JSON Schemas.
- Canonical loaders and cross-record validation.
- Structured diagnostics with file and field paths.
- Hardened XML parsing and SVG security checks.
- Deterministic sanitation and optimization.
- Geometry, checksum, complexity, color, and suitability metadata.
- Deterministic light, dark, and checkerboard preview rendering.
- Visual regression and malicious fixture coverage.

### 3. Create a real canonical dataset

- Add a useful production dataset under `data/brands/`; do not ship fixture-only or empty data.
- Prioritize common developer, cloud, payment, social, messaging, productivity, operating-system, browser, and integration brands.
- Every public color and asset must have provenance and review status.
- Prefer fewer defensible records over invented or opaque data.
- Never use AI-generated factual brand data as evidence.
- Never mark an item verified without qualifying sources.
- Build curated collections that make the initial dataset useful.

### 4. Implement shared packages

- `packages/schema`: runtime contracts and public types.
- `packages/core`: exact resolution, aliases, domains, fuzzy search, filtering, colors, asset selection, and URL creation.
- `packages/data`: deterministic compact, complete, per-brand, category, collection, and search artifacts.
- `packages/open-brands`: the publishable framework-neutral `open-brands` package with documented subpath exports, declarations, CSS, tokens, tree-shaking, and bundle-size tests.
- `packages/tooling`: canonical generation, validation, previews, packs, R2 release publication, and release tooling.

The website, API, and npm package must use the same generated dataset and shared behavior.

### 5. Implement the public API and asset delivery

- Implement all documented `/v1` routes and publish OpenAPI.
- Serve approved assets and generated derivatives through immutable R2 objects.
- Implement friendly current URLs that resolve to immutable release objects.
- Implement ETags, cache headers, CORS, pagination, structured errors, and documented quotas.
- Implement bounded image transformations only for supported assets.
- Implement deterministic asynchronous pack creation, Queue processing, status routes, R2 caching, lifecycle expiry, and manifests.
- Implement D1 operational state and Durable Object coordination without making them canonical data stores.
- Add local and preview configurations that do not require production credentials.

### 6. Implement the website

Build the complete `open-brands.org` product using Vue 3, Vite, `@sil/ui`, `@sil/ui/vite`, `bemm`, unscoped SCSS, and Open Icon for interface icons.

Implement:

- useful home search;
- brand browsing, filtering, sorting, and URL-synchronized state;
- pre-rendered brand pages;
- logo and theme previews;
- color formats and copy actions;
- single-file downloads;
- local favorites;
- collections;
- brand cart;
- deterministic pack configuration and download flow;
- API and package documentation;
- interactive API playground;
- quality and freshness information;
- contribution, correction, legal, and takedown flows;
- responsive, accessible, keyboard-complete light and dark interfaces.

Normal browsing must use generated static release data and immutable asset URLs rather than one public API call per view.

### 7. Implement guided contributions

- GitHub authentication for identity only.
- Secure same-origin sessions and CSRF protection.
- Turnstile and documented eligibility/quota rules.
- Private R2 quarantine uploads.
- Browser preliminary checks plus authoritative server validation.
- Exact semantic diff and proposed file-tree review.
- GitHub App branch and draft pull-request creation.
- Updating the same PR after requested changes.
- D1 state, audit trail, moderation flags, and idempotency.
- Strict path allowlists and no automatic publication or merging.
- Required no-secret pull-request CI that independently validates every contribution.

### 8. Implement release and deployment automation

- Deterministic dataset release versioning and checksums.
- R2 publication with atomic current-release pointer updates.
- Website and Worker preview deployments.
- Production Pages and Worker workflows.
- npm publication for `open-brands` with provenance.
- Smoke tests, rollback commands, operational documentation, and status visibility.
- Scheduled quality/freshness checks that create actionable reports without modifying canonical data automatically.

## Credentials and external infrastructure

Use real integrations when credentials and resource IDs are available.

When a production credential, domain, GitHub App, Cloudflare account resource, or secret is unavailable:

- fully implement and test the integration through adapters, local emulation, fixtures, and preview-safe modes;
- add exact environment variables, bindings, setup commands, and deployment documentation;
- add CI workflows that become operational once secrets are configured;
- never hard-code fake production IDs or secrets;
- do not use missing credentials as a reason to stop the rest of the build.

## Quality requirements

The implementation is not complete unless:

- the monorepo installs cleanly from a fresh checkout;
- all root checks pass;
- generated output is deterministic;
- a clean build leaves no tracked diff;
- public package exports install and bundle in fixture projects;
- API behavior matches OpenAPI and shared core behavior;
- website critical flows pass accessibility, keyboard, responsive, and visual tests;
- malicious SVG and contribution fixtures are rejected;
- pack output is deterministic and verified;
- the website remains usable when the dynamic API is unavailable;
- no unreviewed upload can reach public R2;
- no canonical write bypasses GitHub review;
- legal and provenance status are visible in API, website, packs, and package data;
- CI and release workflows are documented and usable;
- no critical feature is represented only by a TODO, placeholder, `501`, empty export, mock screen, or prose document.

## Definition of done

Open Brands is done when a fresh user can:

1. browse and search a real reviewed dataset on the website;
2. inspect brand variants, colors, sources, and review status;
3. download SVG/PNG/WebP assets;
4. add brands to a cart and download a deterministic pack;
5. query the public API and use its OpenAPI documentation;
6. install `open-brands` and use typed helpers and subpath exports;
7. authenticate with GitHub, prepare a valid brand contribution, validate it, inspect the diff, and create a bot-owned draft pull request;
8. see that unsafe or spammy contributions fail before publication;
9. deploy the website, API, data release, and npm package through documented automation once production secrets are configured.

Do not declare completion before these flows work end to end and all required checks pass.

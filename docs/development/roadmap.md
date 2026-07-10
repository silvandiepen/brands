# Roadmap

Implementation is committed directly to `main` in coherent conventional commits. Public brand submissions remain pull-request based.

Read `docs/product/competitive-brandfetch.md` and ADR 0008 before designing the catalog, search, profile, API, or ingestion systems.

## 1. Workspace and quality gates

- Make installation, structure checks, linting, typechecking, tests, and builds green.
- Add deterministic generation and package-boundary validation.
- Configure required GitHub checks and release-safe workflows.
- Remove all placeholders as their owning feature is implemented.

## 2. Reviewed registry foundation

- Implement runtime schemas matching JSON Schema.
- Add deterministic canonical loading and cross-record validation.
- Build hardened SVG parsing, sanitation, optimization, rendering, derivatives, previews, and visual diffs.
- Implement fonts, images, context, identifiers, history, trust tiers, and field-level provenance.
- Add a useful initial set of reviewed high-value brands.

## 3. Shared core and package

- Build exact and ambiguous identifier resolution.
- Add ranked local search, category filtering, asset selection, color conversion, history, and URL construction.
- Support domains, names, aliases, tickers, ISINs, crypto identifiers, social URLs, and verified package/application identifiers.
- Publish the typed `open-brands` package with reviewed-only offline data, per-brand exports, tokens, and local search.

## 4. Public CDN and APIs

- Publish immutable R2 asset releases and deterministic manifests.
- Implement Search, Resolve, Brand, Asset/Logo, Color, Context, Collection, Pack, History, Meta, and change-feed routes.
- Generate OpenAPI, clients, examples, cache contracts, quotas, and observability.
- Support field selection and typed identifiers without silent collisions.
- Publish measurable API/CDN latency and availability reports.

## 5. Website and downloadable packs

- Build the static-first explorer, local search, filters, profiles, palettes, fonts, images, provenance, history, collections, and quality dashboard.
- Add the brand cart, deterministic ZIP packs, metadata exports, tokens, snippets, and shareable manifests.
- Add API/package documentation, request playground, examples, changelog, service status, and release comparison.
- Use `@sil/ui`, `bemm`, unscoped SCSS, accessibility tests, and pre-rendered public routes.

## 6. Contributions and claimed profiles

- Implement GitHub authentication, private R2 uploads, browser checks, authoritative validation jobs, exact diff review, and bot-created PRs.
- Add simple unauthenticated correction reports.
- Add owner claims using DNS, domain-email, public-site token, or manual verification.
- Keep claim verification scoped: profile control does not automatically verify every field or redistribution right.
- Add moderation, takedown, dispute, audit, privacy, quota, and anti-spam controls.

## 7. Clear competitive superiority

- Publish field-level evidence, observation dates, verification dates, and trust tier everywhere.
- Add historical identity timelines, rebrand detection, redirects, mergers, acquisitions, and discontinued identities.
- Publish reviewed-only JSONL/Parquet snapshots, delta files, checksums, webhooks, and change feeds.
- Implement the Open Brands MCP server.
- Build the Figma/FigJam plugin and browser extension, followed by Zapier, Make, and n8n.
- Add source-backed brand context with first-party and inferred values strictly separated.
- Provide stable non-expiring immutable URLs, supported caching, local/offline use, and self-hostable open components.

## 8. Observed catalog and global scale

- Implement permitted public-source discovery, evidence capture, normalization, deduplication, confidence, freshness, and recheck scheduling.
- Store immutable partitioned observed catalog shards and source evidence in R2.
- Select a dedicated search engine through representative million-record benchmarks behind a provider-neutral adapter.
- Overlay reviewed, claimed, and observed tiers using ADR 0008 precedence.
- Reach measured milestones of 1 million, 10 million, and 50 million-plus resolved public domains without inflating counts or hiding nulls.
- Publish separate coverage metrics for reviewed brands, claimed profiles, observed domains, approved artwork, geography, category, and attribute density.

## 9. Advanced data products

- Add transaction and merchant descriptor enrichment after core entity resolution is stable.
- Add bulk S3-compatible delivery, secure downloads, data shares, and incremental updates.
- Add GraphQL only when benchmarks show material value beyond REST field selection.
- Add source-backed firmographics, financial identifiers, products/services, audiences, voice, style, and positioning.
- Expand integrations based on platform access and measured demand.

## 10. Production and operations

- Deploy Pages, Workers, R2, Queues, D1, Durable Objects, search infrastructure, domains, and observability.
- Configure GitHub App permissions, repository rules, required checks, secrets, feature flags, and incident controls.
- Publish npm releases with provenance and release notes.
- Add preview environments, smoke tests, rollback, restore, retention, abuse handling, and disaster recovery.
- Establish a security and availability program appropriate for enterprise adoption.

## Completion standard

The project is not complete when it merely renders logos or mirrors Brandfetch feature names. Completion requires:

- all documented public surfaces implemented;
- no placeholder package exports or routes;
- reviewed and observed catalog tiers functioning independently;
- website, API, package, CDN, packs, MCP, contributions, claims, and releases using compatible contracts;
- public quality, coverage, freshness, and performance methodology;
- all checks green from a clean clone;
- production deployments and rollback verified;
- no Brandfetch or other restricted competitor data used as an input.
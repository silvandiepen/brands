# Implementation plan

## Delivery strategy

Build Open Brands through focused pull requests with conventional commits. Multiple agents may work concurrently only when package and data ownership do not overlap.

The plan intentionally starts with preservation and validation before product UI. The website must not become another hand-maintained data layer.

## PR 1 — Foundation and documentation

Deliverables:

- monorepo identity and workspace skeleton;
- legacy audit;
- product, architecture, data, API, website, legal, testing, and migration specifications;
- agent guide;
- initial JSON Schema;
- reproducible legacy package import;
- initial taxonomy;
- ADR establishing the git-backed monorepo.

Acceptance:

- documentation is internally consistent;
- migration script is idempotent;
- both package snapshots can be copied from npm;
- no legacy API compatibility is promised.

## PR 2 — Workspace and shared quality tooling

Owner: foundation agent.

Deliverables:

- actual workspace package directories;
- shared TypeScript, ESLint, Vitest, and formatting config;
- CI workflow;
- Changesets or semantic-release decision and setup;
- root validation/build orchestration;
- package-boundary checks.

Acceptance:

- clean install;
- empty package builds/tests run through root commands;
- CI is green on Linux;
- no generated output is committed accidentally.

## PR 3 — Schema and canonical validator

Owner: schema agent.

Deliverables:

- `packages/schema`;
- Zod/runtime schema matching JSON Schema;
- canonical loader;
- cross-record validators;
- structured validation diagnostics;
- fixtures for valid and invalid records;
- category and collection schemas.

Acceptance:

- JSON Schema/runtime parity tests;
- useful file/path diagnostics;
- deterministic loading order;
- public generated TypeScript types.

## PR 4 — Legacy import and reconciliation reports

Owner: migration agent.

Deliverables:

- complete package snapshots committed;
- normalized legacy datasets;
- asset inventory;
- duplicate/collision report;
- category mapping report;
- malformed color report;
- candidate identity relationships;
- explicit unresolved queue.

Acceptance:

- every published legacy SVG and brand record is accounted for;
- repeated import has no diff;
- canonical data is untouched;
- report counts reconcile to snapshots.

## PR 5 — SVG pipeline

Owner: asset agent.

Deliverables:

- XML parser and security validator;
- deterministic normalization and optimization;
- checksum and geometry extraction;
- light/dark/checkerboard preview renderer;
- visual-diff test fixtures;
- supported transformation rules;
- asset quality report.

Acceptance:

- malicious SVG fixtures fail;
- valid complex fixtures pass;
- optimization is visually stable;
- generated output is deterministic.

## PR 6 — Initial canonical dataset

Owners: several data agents partitioned by non-overlapping brand ID ranges or categories. One data lead owns taxonomy and collision decisions.

Deliverables:

- canonical directories for the highest-value brands first;
- source-backed colors and assets;
- alias/domain resolution data;
- parent and historical relationships;
- legacy disposition tracking.

Suggested first coverage:

- developer platforms and cloud providers;
- social and messaging platforms;
- payment providers;
- major operating systems and browsers;
- commonly used integration brands.

Acceptance:

- each record passes schema and asset validation;
- every verified value has qualifying provenance;
- no two agents edit the same brand directory;
- review preview artifacts are attached to PRs.

Do not block package/API implementation on canonicalizing every legacy brand. Ship a high-quality useful subset and continue data expansion independently.

## PR 7 — Core query and selection library

Owner: core agent.

Deliverables:

- exact resolver;
- alias/domain resolver;
- fuzzy search;
- category/tag filtering;
- color helpers;
- theme-aware asset selection;
- asset URL builder;
- compact index generation.

Acceptance:

- browser/Node/Worker compatible;
- pure deterministic functions;
- shared fixtures with API and website;
- ambiguous matches never resolve silently.

## PR 8 — `open-brands` npm package

Owner: SDK agent.

Deliverables:

- public package named `open-brands`;
- root helpers;
- compact/full data subpaths;
- per-brand exports;
- CSS and token exports;
- package documentation;
- automated npm release with provenance.

Acceptance:

- fixture installs and bundles pass;
- root import remains small;
- one-brand import excludes unrelated assets;
- declarations and export map are complete;
- old package API is not carried forward accidentally.

## PR 9 — Public API

Owner: API agent.

Deliverables:

- Cloudflare Worker app;
- `/v1` routes;
- OpenAPI;
- cache and ETag handling;
- CORS;
- structured errors;
- supported SVG/PNG/WebP selection and transformation;
- local and preview deployment.

Acceptance:

- contract tests pass against Worker runtime;
- immutable asset URLs cache correctly;
- unsafe or unsupported transforms fail clearly;
- API and core resolver results match.

## PR 10 — Website foundation

Owner: web-foundation agent.

Deliverables:

- Vue/Vite app;
- `@sil/ui/vite` configuration;
- app theme and layout;
- router and static generation;
- shared Open Brands local components;
- API client using generated types;
- accessibility and visual test setup.

Acceptance:

- no duplicated general UI component library;
- `bemm` and unscoped SCSS conventions are followed;
- dark/light modes work;
- baseline performance and accessibility checks pass.

## PR 11 — Explorer and brand detail

Owner: web-product agent.

Deliverables:

- home search;
- browse/filter/sort;
- brand detail;
- variant previews;
- palette tools;
- code snippets;
- copy and download actions;
- favorites by stable ID;
- error/empty/loading states.

Acceptance:

- website selection matches package/API behavior;
- keyboard-only flows pass;
- no untrusted `v-html`;
- mobile and desktop visual tests pass.

## PR 12 — Documentation, playground, and contribution UX

Deliverables:

- API reference rendered from OpenAPI;
- package docs;
- interactive playground;
- contribution guide and templates;
- legal/takedown pages;
- quality dashboard;
- sitemap and metadata.

## PR 13 — Production deployment and releases

Owner: release agent.

Deliverables:

- Cloudflare Pages production deployment;
- Worker production deployment;
- R2/CDN release flow if needed;
- `open-brands.org` routing;
- API and CDN hostnames;
- npm publishing;
- smoke tests and rollback documentation;
- archived legacy repository notices.

## Parallel execution map

After PR 3 lands:

- migration reporting and SVG tooling can proceed in parallel;
- canonical data agents can begin once schema and asset tools stabilize;
- core library can use fixtures before broad data coverage;
- API and npm package can begin from the same core contracts;
- website foundation can start before API completion using generated fixture data;
- product pages should wait for stable core selection behavior.

## Continuous commit policy

Use conventional commits by coherent feature, for example:

```text
feat(schema): add canonical brand validator
feat(assets): reject external SVG references
feat(core): resolve brands by domain
feat(api): add brand asset endpoint
feat(web): add theme-aware asset preview
chore(data): verify cloudflare brand assets
docs(api): document image transformation limits
test(package): add one-brand tree-shaking fixture
```

Do not combine large data migrations, package architecture, and website UI into one commit.

## Final definition of done

- all retained legacy material is accounted for;
- canonical data has provenance and review state;
- npm package, API, CDN, and website consume one generated dataset;
- website uses `@sil/ui` and `bemm` correctly;
- builds are deterministic;
- security, accessibility, legal, and release checks are automated;
- `open-brands.org` and `open-brands` are the stable public identities.

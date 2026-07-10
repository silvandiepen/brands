# Testing and validation

## Required command surface

The completed workspace must provide root commands equivalent to:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:data
pnpm validate:assets
pnpm test:api
pnpm test:web
pnpm build
```

CI runs all relevant commands on pull requests. Data-only changes may use path-aware optimization, but never skip data and asset validation.

## Schema tests

Validate every canonical manifest against JSON Schema and the runtime schema.

Tests must cover:

- required fields;
- enum values;
- kebab-case IDs;
- date formats;
- color formats;
- source references;
- relative asset paths;
- category and parent-brand references;
- duplicate aliases and domains;
- deterministic serialization.

JSON Schema and runtime validators must agree on fixtures.

## Dataset integrity tests

- directory name equals brand ID;
- unique brand IDs;
- unique normalized domains;
- aliases do not conflict unexpectedly;
- all categories exist;
- all collection references exist;
- all parent relationships are acyclic;
- all asset files are referenced exactly as intended;
- no orphan canonical assets;
- verified records contain qualifying provenance;
- historical/disputed assets are never selected as current defaults;
- seed and legacy data cannot enter public output accidentally.

## Color tests

- parse and normalize all canonical values;
- reject malformed or whitespace-padded values;
- derive RGB, HSL, OKLCH, luminance, and contrast consistently;
- snapshot token output;
- test color sorting with neutral and low-saturation colors;
- test text-color suggestions as advisory output, not accessibility guarantees;
- prevent duplicate color IDs within a brand.

## SVG safety tests

Reject SVG containing:

- `<script>`;
- `on*` event attributes;
- external URLs or remote references;
- JavaScript/data URLs outside explicitly permitted safe cases;
- `<foreignObject>`;
- embedded HTML;
- external stylesheets;
- unsupported animation;
- embedded raster images unless an explicit future policy allows them;
- malformed XML;
- missing or invalid geometry metadata.

Sanitation tests use malicious fixtures as well as valid complex official SVGs.

## SVG visual tests

For each canonical asset:

- render a deterministic preview on light, dark, and checkerboard surfaces where applicable;
- compare against an approved visual snapshot with a perceptual threshold;
- verify aspect ratio and bounds;
- detect unexpectedly empty, clipped, or fully transparent output;
- compare pre/post optimization rendering;
- verify monochrome transforms only on assets marked transformable.

A human-readable PR artifact should show changed logo previews.

## Migration tests

- fixed package versions are imported;
- complete package snapshots are copied;
- all SVGs are accounted for;
- repeated imports are idempotent;
- source order does not cause nondeterministic output;
- duplicate IDs, filenames, categories, and colors produce reports;
- missing expected package data fails loudly;
- migration outputs never overwrite canonical brand directories.

## Core package tests

Test pure functions with fixtures:

- exact ID resolution;
- case-insensitive aliases;
- domain normalization;
- ambiguous aliases;
- fuzzy search ranking;
- category/tag filters;
- theme-aware asset selection;
- fallback order;
- historical and disputed exclusion;
- immutable URL generation.

## npm package tests

- package can be packed and installed into fixture projects;
- ESM imports work in Node;
- browser bundling works;
- Worker bundling works;
- declarations resolve;
- every documented subpath exists;
- importing one brand does not include all assets;
- root bundle stays under an agreed size budget;
- CSS/token exports are valid;
- package contains no workspace-only paths or source secrets.

## API contract tests

- OpenAPI document validates;
- every documented route has tests;
- implementation responses match schemas;
- cache headers and ETags behave correctly;
- CORS behavior is explicit;
- pagination cursors are stable and opaque;
- unsupported transformations return structured errors;
- rate-limit behavior is tested;
- SVG responses include safe content type and security headers;
- logical and immutable asset URLs resolve correctly.

Use local Worker integration tests rather than relying only on mocked route functions.

## Website tests

### Unit/component

- search and filter state;
- URL synchronization;
- copy/download actions;
- asset selection controls;
- color format switching;
- API request builder;
- local favorites storing IDs only.

### Accessibility

- automated checks with axe or equivalent;
- keyboard traversal;
- focus management in overlays;
- labels and descriptions;
- no color-only status communication;
- reduced-motion behavior;
- heading and landmark structure.

### End-to-end

- search and open a brand;
- switch theme previews;
- copy a color;
- download an asset;
- build an API request;
- browse a category and collection;
- navigate using keyboard only;
- render no-results and error states.

### Visual

Cover representative layouts:

- symbol-only brand;
- wordmark-only brand;
- multicolor palette;
- very wide lockup;
- light-only and dark-only assets;
- historical asset section;
- mobile and desktop breakpoints.

## Determinism tests

CI performs a clean generation twice and compares checksums. A successful build must not modify tracked files or produce order-dependent output.

## Release gates

A release is blocked by:

- schema or integrity failure;
- unsafe SVG;
- unexpected visual asset change;
- missing package export;
- API contract mismatch;
- accessibility regression in critical flows;
- nondeterministic output;
- missing provenance for a newly verified item.

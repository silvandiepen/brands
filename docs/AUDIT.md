# Legacy repository audit

## Scope

This audit covers:

- `silvandiepen/open-brands` at commit `c65cd02e40501557266be9210df5bb98bd92eaf2`
- `silvandiepen/brand-colors` at commit `7e8d7fbbdc2b2377ec4a8c52433dc248625ef6e6`
- npm package `open-brands@0.0.7`
- npm package `@sil/brands@0.0.6`

The two repositories are source material only. No code, schema, route, package export, component API, or file layout must remain compatible.

## `open-brands`

### What it contains

`open-brands` is primarily a TypeScript package generator and SVG collection.

Important parts:

- `build/brandList.ts`: hand-maintained names, categories, and colors.
- `src/svg/`: raw SVG assets using filename suffixes such as `_icon` and `_wordmark`.
- `build/data.ts`: combines the hand-maintained list with assets and generates TypeScript/JSON output.
- `src/data/brands.ts` and `src/data/brands.json`: generated aggregate datasets.
- `src/data/logo/`: generated per-brand modules containing inline SVG strings.
- `src/helpers/index.ts`: lookup and color helpers.
- `build/enrichBrands.ts`: an unfinished AI-based brand-history enrichment script.
- `Readme.md`: minimal package documentation.

The published package is named `open-brands`, version `0.0.7`, and points to `open-brands.org`.

### Useful material

- A substantial collection of SVGs.
- Existing distinction between icon, wordmark, normal, and default assets.
- A broad initial list of brands and basic categories.
- Simple lookup expectations such as finding a brand and its colors.
- An MIT-licensed implementation codebase.

### Problems

1. **Several competing sources of truth.** Brand information exists in the hand-maintained list, generated TypeScript, generated JSON, generated per-brand files, and raw filenames.
2. **Lossy identifiers.** The custom conversion removes spaces and punctuation rather than creating stable, readable IDs. Different names can collapse to the same key.
3. **Weak schema.** Colors are anonymous strings; categories are uncontrolled strings; assets lack licensing, provenance, checksums, themes, and review state.
4. **Inconsistent contract.** Documentation shows `urls`, implementation uses `url`; some interfaces require fields that are optional in generated output.
5. **Broken tree-shaking approach.** Runtime mutation through `exports[normalizedName]` is not a valid ESM export strategy.
6. **Duplicated payloads.** Inline SVG data and standalone SVG files are both shipped, making the package unnecessarily large.
7. **Unsafe enrichment.** The AI enrichment script creates factual brand history without source citation or deterministic structured output. This must not be used for canonical facts.
8. **Insufficient SVG sanitation.** Extracting the first `<svg>` block does not remove scripts, event attributes, external references, embedded raster content, or malicious markup.
9. **No provenance.** Colors and logos cannot be traced to official brand guidelines or another source.
10. **No verification lifecycle.** There is no way to tell whether an asset is current, historical, unverified, or disputed.
11. **Generated output is committed.** Source and build output drift easily.
12. **Category fragmentation.** Examples include `Beverage` versus `Beverages`, `Messaging` versus `Messaging App`, and overlapping technical categories.
13. **Questionable data quality.** Several values are outdated, malformed, incomplete, or appear chosen from a logo rather than an official palette.

## `brand-colors`

### What it contains

`brand-colors` combines a Vue 3/Vite website with an earlier package named `@sil/brands`.

Important parts:

- `src/data/brandList.ts`: an earlier form of the same brand/color list.
- `src/assets/brands/`: SVG assets.
- `build/data.ts`: merges filenames and brand metadata into generated datasets.
- `src/components/BrandList.vue` and `BrandTile.vue`: browsing, color selection, favorites, copy, and download behavior.
- `src/views/Detail.vue`: incomplete detail page.
- `src/state/useBrands.ts`: client-side loading, filtering, search, and color ordering.
- `src/components/Disclaimer.vue`: general trademark and accuracy disclaimer.
- a large app-local form and button component system.

### Useful material

- Proof that the dataset benefits from a visual explorer.
- Existing interaction ideas: copy a color, download SVG, search, filter, sort by color, favorites, and detail routes.
- A disclaimer and contribution intent.
- Existing use of Vue 3 and `bemm`.

### Problems

1. **The README is still the Vite starter README.** There is no usable product, package, contribution, or deployment documentation.
2. **The website is incomplete.** The detail view renders debug data and unresolved imports.
3. **The virtual list is fragile.** It depends on DOM measurement, index keys, mutable sorting, and mixed `ref`/`computed` handling.
4. **Unsafe inline SVG.** Assets are inserted with `v-html` without a trustworthy sanitation pipeline.
5. **Large app-local UI duplication.** Buttons and form controls should now come from `@sil/ui`.
6. **Package and website are coupled.** Build scripts, generated data, website state, and package output share one application directory.
7. **Compiled `lib` files are committed.** Build output is mixed with source.
8. **The data is duplicated by `open-brands`.** The later repository copied and extended the same basic list.
9. **Favorites persist entire derived brand state.** This creates stale local data rather than storing stable IDs.
10. **No API or stable asset delivery contract.** Consumers must install a heavy package or scrape app output.

## Combined conclusion

The repositories provide a useful seed collection and several product ideas, but neither is a safe canonical platform. The new system must:

- preserve both published package snapshots before transformation;
- import all available SVGs and records into a `needs-review` legacy layer;
- create one explicit canonical manifest per brand;
- add source, review, lifecycle, and legal metadata;
- sanitize and normalize every SVG through a deterministic pipeline;
- generate all package, API, website, search, and CDN artifacts from the same validated source;
- replace the old website rather than porting it component by component;
- use `@sil/ui` and `bemm` according to their current documented conventions.

## Explicitly discarded behavior

The following are not migration requirements:

- old package exports or helper signatures;
- `@sil/brands` as a maintained package;
- old IDs without separators;
- old routes or website styling;
- inline SVG data in the root package;
- committed generated `lib` directories;
- free-form categories;
- fallback to black for unknown brands;
- AI-generated descriptions without evidence.

# Legacy migration

## Objective

Preserve every published file from the two legacy packages, then create a normalized migration layer that can be reviewed into the new canonical structure.

There is no backwards-compatibility requirement. Migration preserves material, not APIs or architecture.

## Fixed source snapshots

| Source | Repository commit | Published package |
| --- | --- | --- |
| `silvandiepen/open-brands` | `c65cd02e40501557266be9210df5bb98bd92eaf2` | `open-brands@0.0.7` |
| `silvandiepen/brand-colors` | `7e8d7fbbdc2b2377ec4a8c52433dc248625ef6e6` | `@sil/brands@0.0.6` |

The npm snapshots are used for automated copying because they contain the published data and SVG payloads without requiring cross-repository credentials. Repository commits remain recorded for audit context and source-code inspection.

## Migration outputs

Running `pnpm migrate:legacy` creates:

```text
legacy/npm/open-brands-0.0.7/
legacy/npm/sil-brands-0.0.6/
legacy/reports/import-summary.json
data/assets/legacy/open-brands/**
data/assets/legacy/brand-colors/**
data/legacy/open-brands.json
data/legacy/brand-colors.json
data/seed/brands.json
```

### Immutable package snapshots

The complete extracted package contents are copied under `legacy/npm/`. They are evidence and must not be manually cleaned, optimized, or reformatted.

### Legacy asset copies

All published SVG files are copied while preserving their package-relative paths. These files remain untrusted until they pass the new asset pipeline.

### Normalized legacy records

Each old record is converted into a deterministic review record containing:

- normalized candidate ID;
- original ID and title;
- original category strings;
- normalized color strings plus import warnings;
- detected asset filenames and old variants;
- package and repository provenance;
- `needs-review` state.

### Seed union

`data/seed/brands.json` is a union of both normalized legacy datasets. It is not canonical data. It exists to drive reconciliation reports and agent work.

## Import precedence

When the same legacy ID exists in both sources:

1. Prefer the later `open-brands@0.0.7` display record.
2. Retain all unique source references.
3. Retain all distinct color values and asset candidates.
4. Record category differences rather than choosing silently.
5. Record collisions and missing files in the import report.

Precedence is not verification. A preferred legacy value still begins as unverified.

## Canonicalization process

For each seed record:

1. Determine the stable canonical brand ID.
2. Resolve duplicate, parent, product, historical, or renamed identities.
3. Map old category strings to controlled category IDs.
4. Locate official brand guidance or official downloadable assets.
5. Verify colors and assign semantic roles.
6. Classify asset types and variants.
7. Run SVG safety and normalization tools.
8. Add source records and review metadata.
9. Create `data/brands/<id>/brand.json` and reviewed assets.
10. Add alias redirects when a legacy ID differs.
11. Remove the item from the unresolved migration report only after canonical validation passes.

## Deduplication rules

Do not deduplicate only by normalized text. Review:

- legal owner versus consumer-facing brand;
- parent company versus product;
- current versus historical names;
- region-specific identities;
- separate marks under one organization;
- punctuation-only differences;
- old IDs that collapse because the legacy slugger removed separators.

Examples such as `Google` and `Google Cloud`, or `Adidas` and `Adidas Originals`, may need separate canonical records even when related.

## Category migration

Legacy categories are uncontrolled. Build an explicit mapping table and report unmapped values. Never make every old string a canonical category automatically.

Likely consolidations include:

- `Beverage`, `Beverages`, and `Food & Beverage`;
- `Messaging` and `Messaging App`;
- `Social Media` and `Social Network`;
- `Software`, `Web Development`, `Technology`, and more precise child categories;
- crypto categories under a controlled finance/blockchain hierarchy.

## Color migration

Legacy colors are evidence candidates only.

Validation must detect:

- invalid or whitespace-padded values;
- shorthand forms;
- duplicate case variants;
- transparent or non-color strings;
- colors sampled from a logo rather than documented brand colors;
- outdated palettes;
- missing semantic roles;
- white/black included only as rendering support rather than official brand colors.

Do not automatically label the first old color as official primary.

## Asset migration

Legacy filename suffixes are hints:

- `_icon` may become `icon` or `symbol`;
- `_wordmark` may become `wordmark` or `lockup`;
- unsuffixed files require visual classification;
- old `default` is a selection result, not a canonical asset type.

Every migrated SVG must be parsed, sanitized, checksummed, classified, previewed, and linked to a source before verification.

## AI enrichment

Do not migrate AI-generated brand history as factual data. If any files produced by the old enrichment script exist, preserve them only under an explicitly untrusted legacy folder and exclude them from package, API, and website builds.

## Completion criteria

Migration is complete when:

- both complete npm snapshots are preserved;
- every legacy record and SVG appears in an import report;
- all collisions and missing links are reported;
- every retained current brand has a canonical manifest;
- every canonical color and asset has provenance;
- unresolved and rejected legacy items have an explicit disposition;
- the old repositories can be archived without losing unique published material.

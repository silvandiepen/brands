# Contributing

## Brand contributions

Use the guided website editor or create a normal GitHub pull request.

A canonical brand contribution changes:

```text
data/brands/<brand-id>/brand.json
data/brands/<brand-id>/assets/<asset-id>.svg
```

Do not edit generated datasets, package output, release manifests, or CDN files.

## Evidence

Every changed color and asset must include a public source, publisher where known, access date, acquisition method, and relevant usage guidance.

## Validation

All brand pull requests run:

- changed-path checks;
- schema and cross-record validation;
- SVG security and complexity validation;
- deterministic sanitation;
- light, dark, and checkerboard rendering;
- provenance and review-state checks;
- a deterministic full build.

Passing CI establishes structural safety, not trademark permission or factual approval. Human review is always required for website-created brand changes.

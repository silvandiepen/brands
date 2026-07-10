# Tooling package brief

Own deterministic repository tooling:

- legacy import and reconciliation;
- canonical loaders;
- SVG security validation and normalization;
- checksums and derived metadata;
- asset preview and raster generation;
- aggregate dataset generation;
- search-index generation;
- package export generation;
- quality reports;
- release helpers.

Tooling may use Node filesystem APIs. Generated files must be stable across repeated runs and must not overwrite hand-authored canonical manifests.

# Data model

Each brand has one stable directory:

```text
data/brands/google/
  brand.json
  assets/
    symbol-color.svg
    wordmark-color.svg
```

The directory name equals the permanent brand ID.

## Brand manifest

A manifest contains:

- stable ID and current display name;
- aliases and domains;
- status and organization relationships;
- controlled categories and normalized tags;
- source-backed colors;
- source-backed assets;
- reusable source records;
- review status and date.

## Colors

Colors are objects with an ID, value, semantic role, supported themes, intended usage, source references, and review status. RGB, HSL, OKLCH, luminance, contrast, CSS, SCSS, and token output are generated.

## Assets

Assets record type, variant, theme suitability, orientation, current/historical state, transformability, source references, and review status.

Derived checksums, bounds, detected colors, optimized files, and raster derivatives are generated rather than hand-authored.

## Invariants

- IDs, aliases, and domains cannot conflict unexpectedly;
- referenced categories, parents, sources, and asset files must exist;
- every color and asset has at least one source;
- historical or disputed assets cannot become current defaults;
- public output is deterministic.

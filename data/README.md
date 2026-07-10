# Data directories

- `brands/`: canonical reviewed one-directory-per-brand source. This is the only public source of truth.
- `categories.json`: controlled taxonomy.
- `collections/`: curated brand collections.
- `legacy/`: normalized imports used for reconciliation only.
- `seed/`: merged migration candidates used for agent work only.
- `assets/legacy/`: untrusted SVG copies from the fixed legacy package snapshots.

Neither `legacy`, `seed`, nor `assets/legacy` may be included in public package/API/website output unless a test fixture explicitly requires them.

Generated aggregate data belongs in package build output, not here.

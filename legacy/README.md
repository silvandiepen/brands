# Legacy snapshots

This directory preserves immutable source material from the previous Open Brands projects.

Automated migration copies the complete published contents of:

- `open-brands@0.0.7` into `legacy/npm/open-brands-0.0.7/`
- `@sil/brands@0.0.6` into `legacy/npm/sil-brands-0.0.6/`

Related repository commits:

- `silvandiepen/open-brands@c65cd02e40501557266be9210df5bb98bd92eaf2`
- `silvandiepen/brand-colors@7e8d7fbbdc2b2377ec4a8c52433dc248625ef6e6`

Rules:

- Do not edit snapshot contents.
- Do not import snapshot modules into production code.
- Do not serve snapshot SVGs publicly.
- Do not treat snapshot colors or assets as verified.
- Use `data/legacy/` and generated reports for reconciliation.
- Move reviewed data into `data/brands/`; never turn a snapshot directory into canonical data in place.

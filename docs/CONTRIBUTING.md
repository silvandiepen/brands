# Contributing

## Contribution types

Open Brands accepts:

- new canonical brands;
- current logo or palette corrections;
- source and verification improvements;
- alias, domain, category, and relationship fixes;
- historical asset additions;
- schema, tooling, API, package, and website improvements;
- legal or takedown requests through the dedicated process.

## Brand contribution structure

A new brand contribution normally contains:

```text
data/brands/<brand-id>/
  brand.json
  assets/
    <asset-id>.svg
```

Do not modify aggregate JSON, generated TypeScript, search indexes, CDN output, or package `dist` files.

## Required evidence

For every new or changed color or asset, include:

- source URL;
- source type;
- publisher/owner where known;
- access date;
- whether the asset was downloaded, extracted from an official site, or reconstructed;
- usage restrictions or guidance discovered;
- explanation of why the change is current and correct.

Official guidelines and official downloads are preferred. Community references alone generally produce `community-sourced` or `needs-review`, not `verified`.

## Asset requirements

- SVG only for canonical source assets unless an accepted decision adds another source format.
- Preserve correct proportions and geometry.
- Do not recolor or combine official marks to create unofficial variants.
- Remove unsafe markup through project tooling, not manual search-and-replace alone.
- Use meaningful asset IDs based on type and variant.
- Record whether an asset is current, historical, monochrome, and transformable.
- Do not submit confidential, licensed-only, or access-controlled assets without redistribution permission.

## Data requirements

- Stable kebab-case ID.
- Correct display capitalization.
- Aliases only when they help resolution.
- Domains without protocol, path, or `www.`.
- Controlled category IDs.
- Source-backed color objects.
- Source-backed asset objects.
- Explicit review state.
- Parent or historical relationships where relevant.

## Local checks

The final toolchain will expose:

```sh
pnpm validate:data
pnpm validate:assets
pnpm test
pnpm build
```

Run the narrowest package tests while working and all required root checks before requesting review.

## Pull request expectations

- Use conventional commits.
- Keep unrelated brands and code features in separate commits or PRs.
- Include generated validation and preview artifacts when assets change.
- Explain unresolved uncertainty rather than guessing.
- Do not claim that inclusion grants trademark permission.
- Do not include AI-generated factual copy without reliable cited evidence and human review.

## Review levels

A contribution can be merged as `needs-review` or `partial` when it is useful but not fully verified, provided public defaults and UI clearly reflect that status. Only qualifying provenance and review can promote data to `verified`.

## Corrections and disputes

For an ordinary correction, open an issue or pull request with evidence. Brand-owner, legal, or urgent infringement requests should use the documented takedown channel once published. Credible disputes may temporarily remove an asset from defaults while review is pending.

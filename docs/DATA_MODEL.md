# Canonical data model

## Storage model

Each brand has one directory:

```text
data/brands/google/
  brand.json
  assets/
    symbol-color.svg
    wordmark-color.svg
    wordmark-mono.svg
```

The directory name equals the stable brand ID. IDs use lower-case ASCII kebab-case and do not change when a display name changes.

## Brand manifest

Illustrative structure:

```json
{
  "$schema": "../../../schemas/brand.schema.json",
  "id": "google",
  "name": "Google",
  "aliases": ["Google LLC"],
  "domains": ["google.com"],
  "status": "active",
  "organization": {
    "name": "Google LLC",
    "parentBrandId": "alphabet"
  },
  "categories": ["technology", "internet-services"],
  "tags": ["search", "cloud", "advertising"],
  "colors": [],
  "assets": [],
  "sources": [],
  "review": {
    "status": "verified",
    "verifiedAt": "2026-07-10",
    "method": "official-guidelines",
    "notes": null
  }
}
```

## Required brand fields

### `id`

Stable lower-case kebab-case identifier. It is not derived during each build. Renaming a brand does not rename its ID unless the existing ID is objectively wrong and a redirect alias is added.

### `name`

Current preferred display name with correct capitalization and punctuation.

### `aliases`

Alternative strings used for resolution, including:

- legal organization names;
- common abbreviations;
- former names;
- spacing and punctuation variants;
- localized names when useful.

Aliases are case-insensitive for uniqueness. An alias may map to only one current brand unless explicitly marked ambiguous in a future alias model.

### `domains`

Official domains used for deterministic resolution. Store hostnames without protocol, path, or `www.`. Sub-brands may use more specific domains.

### `status`

Allowed initial values:

- `active`;
- `discontinued`;
- `historical`;
- `merged`;
- `needs-review`;
- `disputed`.

### `categories`

IDs from `data/categories.json`. Categories are a controlled hierarchy. They describe what the brand is, not every product it offers.

### `tags`

Search-oriented free-form terms. Tags must still use normalized kebab-case.

## Organization relationship

The optional organization object may contain:

- `name`: legal or parent organization display name;
- `parentBrandId`: another canonical brand;
- `ownerName`: legal owner when no canonical parent exists;
- `countryCode`: ISO 3166-1 alpha-2 headquarters or origin context when verified.

Ownership and brand hierarchy are different concepts. A product brand may have a parent brand and a separate legal owner history.

## Colors

Each color is an object, not a bare hex string.

```json
{
  "id": "blue",
  "name": "Google Blue",
  "value": "#4285F4",
  "role": "primary",
  "themes": ["light", "dark"],
  "usage": ["brand", "symbol"],
  "sourceIds": ["google-brand-resource-center"],
  "reviewStatus": "verified"
}
```

### Color fields

- `id`: unique within the brand.
- `name`: official name when available; otherwise a neutral descriptive name.
- `value`: canonical six- or eight-digit uppercase hex.
- `role`: `primary`, `secondary`, `accent`, `neutral`, `background`, or `legacy`.
- `themes`: where the color is suitable.
- `usage`: optional semantic restrictions.
- `sourceIds`: provenance references.
- `reviewStatus`: `verified`, `community-sourced`, `legacy-import`, or `disputed`.

Derived RGB, HSL, OKLCH, luminance, contrast, and text-color suggestions are generated, not stored canonically.

## Assets

```json
{
  "id": "symbol-color",
  "file": "assets/symbol-color.svg",
  "type": "symbol",
  "variant": "color",
  "themes": ["light", "dark"],
  "orientation": "square",
  "monochrome": false,
  "current": true,
  "sourceIds": ["google-brand-resource-center"],
  "reviewStatus": "verified",
  "usageNotes": null
}
```

### Asset types

Initial controlled values:

- `symbol`: standalone recognizable mark;
- `icon`: mark prepared for compact UI use;
- `wordmark`: text-only brand name treatment;
- `logo`: combined mark without a more precise classification;
- `lockup`: symbol and wordmark arranged together;
- `badge`: enclosed or platform-specific badge;
- `legacy`: historical identity asset.

### Asset variants

Initial values:

- `color`;
- `monochrome`;
- `black`;
- `white`;
- `positive`;
- `negative`;
- `outline`;
- `legacy`.

Type and variant are separate. `icon` is not a color variant.

### Theme suitability

- `light`: intended for light backgrounds;
- `dark`: intended for dark backgrounds;
- `any`: works on both without transformation;
- `custom`: requires usage guidance.

Theme suitability is explicit and reviewed; it is not inferred only from file color.

### Generated asset metadata

The build derives:

- SHA-256 checksum;
- viewBox and intrinsic aspect ratio;
- path/element count;
- file size;
- detected colors;
- external-reference status;
- safe inline-rendering flag;
- immutable CDN path;
- PNG/WebP derivative paths.

Do not store derived values in the hand-authored manifest unless they are needed to validate a deliberate constraint.

## Sources

Each manifest defines reusable source records:

```json
{
  "id": "google-brand-resource-center",
  "type": "official-guidelines",
  "url": "https://example.com/brand",
  "title": "Official brand resource center",
  "publisher": "Google LLC",
  "accessedAt": "2026-07-10",
  "notes": null
}
```

Allowed initial source types:

- `official-guidelines`;
- `official-download`;
- `official-website`;
- `trademark-registry`;
- `repository`;
- `community-reference`;
- `legacy-repository`.

A source type describes evidence quality, not legal permission.

## Review record

The top-level review object describes the current confidence of the manifest:

- `status`: `verified`, `partial`, `needs-review`, or `disputed`;
- `verifiedAt`: date of most recent meaningful review;
- `method`: `official-guidelines`, `official-download`, `official-website`, `cross-reference`, or `legacy-import`;
- `reviewer`: optional GitHub handle;
- `notes`: concise unresolved issues.

Individual colors and assets retain their own review status because a brand can be partially verified.

## Legacy import fields

Legacy-only records under `data/legacy/` may include:

- original key and title;
- original free-form category;
- original colors;
- original asset filenames;
- source repository, package, version, and commit;
- import warnings;
- collision candidates.

Legacy fields must not leak into the public API without an explicit mapping.

## Categories

`data/categories.json` defines stable IDs, labels, descriptions, and optional parent IDs.

```json
{
  "id": "developer-tools",
  "label": "Developer tools",
  "parentId": "technology",
  "description": "Tools and platforms primarily used to build software."
}
```

The migration must map old categories rather than silently accepting each distinct string.

## Collections

Collections are curated lists or queries:

```json
{
  "id": "cloud-providers",
  "name": "Cloud providers",
  "description": "Major infrastructure and application cloud platforms.",
  "brandIds": ["aws", "azure", "google-cloud", "cloudflare"]
}
```

A collection references brand IDs and never duplicates brand metadata.

## Validation invariants

- Every brand ID and directory name match.
- IDs, aliases, and domains do not collide unexpectedly.
- Every category and parent brand exists.
- Every color parses and has at least one source.
- Every asset file exists and passes SVG validation.
- Every source ID reference resolves within the manifest.
- Exactly one default selection can be derived for each supported asset request.
- Historical assets cannot become default current assets.
- `verified` records cannot depend only on a legacy repository source.
- The full canonical dataset serializes deterministically.

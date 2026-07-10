# API, CDN, and package contract

## Principles

- Read-only public API first.
- Version routes explicitly under `/v1`.
- Use the same resolver and selector logic as the npm package and website.
- Return stable IDs and absolute asset URLs.
- Make responses cacheable and deterministic.
- Do not return unreviewed raw SVG markup by default.
- Unknown brands are errors, never silent black-color fallbacks.

## Base URLs

Recommended production endpoints:

```text
https://api.open-brands.org/v1
https://cdn.open-brands.org/<dataset-version>/...
https://open-brands.org/docs/api
```

The final hostnames may be adjusted during deployment, but route semantics must remain independent from the host.

## Core REST endpoints

### `GET /v1/brands`

List brands with compact metadata.

Query parameters:

- `q`: search term;
- `category`: category ID, repeatable;
- `tag`: tag ID, repeatable;
- `status`: lifecycle/review filter;
- `has`: `icon`, `wordmark`, `logo`, `color`, or another asset capability;
- `limit`: bounded page size;
- `cursor`: opaque pagination cursor;
- `sort`: `name`, `updated`, `verified`, or `color` where supported;
- `fields`: documented compact field selection.

### `GET /v1/brands/:id`

Return the complete public brand record. Alias or display-name resolution does not occur in this route; `:id` is canonical.

### `GET /v1/resolve/:query`

Resolve a canonical ID from:

- ID;
- display name;
- alias;
- domain;
- legal organization name.

The response includes the match kind and confidence. Ambiguous matches return candidates rather than choosing silently.

### `GET /v1/search?q=...`

Return ranked matches with highlighted match fields and capability summary.

### `GET /v1/brands/:id/colors`

Return canonical and generated color formats. Optional query parameters:

- `role`;
- `theme`;
- `format=hex|rgb|hsl|oklch|tokens`.

### `GET /v1/brands/:id/assets`

List available assets and metadata.

Filters:

- `type`;
- `variant`;
- `theme`;
- `orientation`;
- `current`.

### `GET /v1/brands/:id/assets/:assetId`

Return asset metadata and immutable URLs.

### `GET /v1/brands/:id/image`

Select and return or redirect to the best matching image.

Supported parameters:

- `type=symbol|icon|wordmark|logo|lockup`;
- `variant=color|monochrome|black|white|positive|negative`;
- `theme=light|dark|any`;
- `format=svg|png|webp`;
- `width` and/or `height` within documented limits;
- `padding` within documented limits;
- `background` for raster output only;
- `download=1` for content disposition.

Color replacement is allowed only for assets explicitly marked monochrome and transformable. Full-color brand assets must never be recolored automatically.

### `GET /v1/categories`

Return category hierarchy and counts.

### `GET /v1/categories/:id/brands`

Return brands within one category, using the same pagination contract as `/brands`.

### `GET /v1/collections`

Return public curated collections.

### `GET /v1/collections/:id`

Return collection metadata and ordered brand references.

### `GET /v1/meta`

Return API version, dataset version, generated-at timestamp, checksums, supported image formats, and package compatibility information.

## Response shape

Single resources:

```json
{
  "data": {},
  "meta": {
    "datasetVersion": "2026.7.0"
  }
}
```

Collections:

```json
{
  "data": [],
  "meta": {
    "datasetVersion": "2026.7.0",
    "nextCursor": null,
    "count": 20
  }
}
```

Errors:

```json
{
  "error": {
    "code": "BRAND_NOT_FOUND",
    "message": "Brand 'example' was not found.",
    "details": null,
    "requestId": "..."
  }
}
```

Initial error codes:

- `INVALID_REQUEST`;
- `BRAND_NOT_FOUND`;
- `ASSET_NOT_FOUND`;
- `AMBIGUOUS_BRAND`;
- `UNSUPPORTED_FORMAT`;
- `UNSUPPORTED_TRANSFORMATION`;
- `RATE_LIMITED`;
- `INTERNAL_ERROR`.

## HTTP behavior

- JSON uses UTF-8 and `application/json`.
- SVG uses `image/svg+xml` with restrictive security headers.
- API responses include `ETag` and `Cache-Control`.
- Immutable assets use long-lived immutable caching.
- Logical current URLs use shorter caching and revalidation.
- Public read routes support CORS.
- Invalid query values return `400`; missing resources return `404`; ambiguity returns `409` or a documented `300`-style payload. Choose one contract and lock it with tests.
- Rate-limit headers are returned when rate limits apply.

## API versioning

Breaking response or route changes require `/v2`. Adding optional fields, new enum values where consumers are expected to tolerate them, and new endpoints can remain in `/v1` after documentation and contract testing.

Dataset changes do not create a new API version. Responses expose a dataset version and checksum.

## OpenAPI

The API must publish an OpenAPI document generated from or validated against the implementation. CI compares route behavior to the document. The website API reference and request playground consume this document.

## CDN contract

Immutable paths include dataset version or content checksum. Friendly paths may exist:

```text
/current/google/symbol-color.svg
/current/google/icon.svg?theme=dark
```

The API should resolve friendly requests to immutable URLs. Consumers needing reproducible builds should store immutable URLs or dataset versions.

## npm package: `open-brands`

### Root surface

The root import provides typed helpers and a compact metadata index:

```ts
import {
  getBrand,
  resolveBrand,
  searchBrands,
  getBrandColors,
  selectBrandAsset,
  createBrandAssetUrl,
} from 'open-brands'
```

### Proposed subpath exports

```text
open-brands
open-brands/data
open-brands/data/compact
open-brands/brands/<brand-id>
open-brands/css
open-brands/tokens
open-brands/types
```

Only add `open-brands/vue` or another framework adapter when it provides material behavior beyond a normal `<img>` wrapper. The core package remains framework-neutral.

### Package requirements

- ESM first;
- generated declarations;
- documented browser, Node, and Worker support;
- `sideEffects: false` except explicit CSS subpaths;
- no dynamic mutation of CommonJS `exports`;
- no all-brand inline SVG object in the root bundle;
- deterministic generated exports;
- export-size tests;
- package provenance and automated release notes.

### Local versus remote assets

The default package returns metadata and CDN URLs. Per-brand subpaths may include local SVG imports for bundler users, but importing one brand must not include every brand.

## CSS and token output

`open-brands/css` may expose a generated stylesheet:

```css
:root {
  --brand-google-primary: #4285f4;
}
```

To avoid an unnecessarily large default stylesheet, support generated category/collection files or a documented build helper for selected brands.

## Authentication and write operations

Public reads require no account. Contribution and moderation write APIs are outside the initial `/v1` scope. GitHub pull requests remain the canonical contribution mechanism until a secure review workflow is designed.

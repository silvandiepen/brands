# API and CDN

## Public API

Read endpoints are public, cacheable, versioned under `/v1`, and CORS-enabled.

Core routes:

```text
GET /v1/brands
GET /v1/brands/:id
GET /v1/resolve/:query
GET /v1/search
GET /v1/brands/:id/colors
GET /v1/brands/:id/assets
GET /v1/brands/:id/image
GET /v1/categories
GET /v1/collections
GET /v1/meta
POST /v1/packs
GET /v1/packs/:id
```

The API returns structured errors, request IDs, dataset versions, ETags, and rate-limit headers.

## Asset delivery

Approved assets are published to immutable R2 keys:

```text
releases/<dataset-version>/brands/<brand-id>/<asset-id>.<sha256>.svg
```

Friendly current URLs redirect to immutable objects. Full-color assets are never recolored. Raster output is bounded and cached by its normalized parameters.

## Limits

Cached metadata and immutable assets have generous abuse thresholds. Search, raster transformations, pack generation, and contribution operations have stricter route-specific quotas.

Normal website browsing does not require a privileged API key; it uses generated static data.

## OpenAPI

The implementation and OpenAPI document share schemas and contract tests. A route is not complete until its success, error, caching, authentication, and quota behavior are documented.

# ADR 0002: R2 is the public asset delivery layer

- Status: Accepted
- Date: 2026-07-10

## Context

Open Brands needs to serve reviewed SVGs, generated PNG/WebP derivatives, previews, release manifests, and downloadable packs. Serving these files from the website bundle or API Worker would increase deploy size, couple assets to application releases, and make immutable caching harder.

At the same time, SVG review must remain transparent. Binary/object storage is not an acceptable canonical source because geometry, provenance, and metadata changes need normal git review.

## Decision

Canonical reviewed assets remain in git under `data/brands/<brand-id>/assets/`.

Every approved release publishes sanitized and generated public artifacts to Cloudflare R2 behind `cdn.open-brands.org`.

Use separate buckets:

- `open-brands-public`: approved immutable assets, release manifests, generated derivatives, curated packs, and cached custom packs;
- `open-brands-quarantine`: private unreviewed uploads and submission previews;
- an optional temporary build bucket may be used during atomic releases, but it is never public.

Public object keys are immutable and content-addressed:

```text
releases/<dataset-version>/brands/<brand-id>/<asset-id>.<sha256>.svg
releases/<dataset-version>/brands/<brand-id>/<asset-id>.<sha256>.<width>.png
releases/<dataset-version>/manifest.json
packs/curated/<collection-id>/<dataset-version>/<pack-sha>.zip
packs/custom/<pack-sha>.zip
```

Friendly URLs are resolved by the API/CDN layer and redirect to immutable objects:

```text
/current/brands/google/symbol-color.svg
/current/brands/google/wordmark.svg?theme=dark
```

The public website and API never serve files from the quarantine bucket. Quarantined files have a seven-day lifecycle by default and can only be fetched through short-lived, authenticated review URLs.

Custom pack objects use lifecycle deletion after 30 days unless the pack is curated or referenced by a release.

## Release behavior

1. Validate canonical manifests and source SVGs.
2. Sanitize and normalize assets deterministically.
3. Generate derivatives and checksums.
4. Upload into a versioned R2 release prefix.
5. Verify every uploaded checksum and manifest reference.
6. Atomically update the current-release pointer only after validation succeeds.
7. Purge only friendly pointer URLs; immutable objects are never purged or overwritten.

## Security

R2 never receives raw browser uploads in the public bucket. Uploads first enter the private quarantine bucket with a generated object key, strict content-length limits, and no user-controlled path.

Only the validation service may promote an object into a release build, and promotion always re-runs SVG parsing and safety validation.

## Consequences

- Git remains the auditable source of truth.
- R2 becomes the standard public asset store from the first production release, not a later optimization.
- The Worker remains small and mostly returns metadata, redirects, and bounded transformations.
- Public assets receive long-lived immutable caching.
- Release rollback means changing the current-release pointer, not rewriting files.

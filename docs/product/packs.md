# Brand packs

The Brand Cart lets users export only the brands and formats required by a project.

## Inputs

- up to 100 brands or one curated collection;
- recommended assets, selected asset types, or all current variants;
- light, dark, or any-theme assets;
- SVG, PNG, and WebP;
- compact or complete metadata;
- CSS, SCSS, JSON, and DTCG tokens;
- flat or per-brand folders.

Historical assets are excluded unless explicitly enabled.

## Output

Every ZIP contains:

```text
manifest.json
NOTICE.md
brands/<brand-id>/<asset-file>
```

The manifest records the dataset version, normalized request, checksums, source asset IDs, warnings, and immutable URLs.

## Generation

1. The API validates and normalizes the request.
2. A content hash identifies the pack.
3. Existing packs return immediately from R2.
4. New packs are queued and generated as a stream.
5. Completed custom packs expire after 30 days.

Packs may contain only approved Open Brands release assets. Arbitrary uploads and remote URLs are never accepted.

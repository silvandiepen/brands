# Architecture

Open Brands is a git-backed data platform.

```text
reviewed manifests and SVGs
            |
            v
schema, provenance, and SVG validation
            |
            v
 deterministic release build
            |
  +---------+---------+---------+---------+
  |                   |         |         |
  v                   v         v         v
npm package        API data   R2/CDN   web data
```

## Boundaries

- `data/` contains hand-reviewed canonical data;
- `packages/schema` owns schemas and diagnostics;
- `packages/core` owns pure resolution and selection logic;
- `packages/data` contains generated distributable data;
- `packages/open-brands` publishes the npm package;
- `packages/tooling` owns build-time validation and generation;
- `apps/api` owns HTTP, Cloudflare, quotas, jobs, and GitHub integration;
- `apps/web` owns presentation and user workflows.

## Storage

- Git: canonical manifests and reviewed SVGs;
- public R2: immutable approved assets, derivatives, and packs;
- private R2: short-lived contribution uploads and previews;
- D1: operational state only;
- Durable Objects: quotas, idempotency, and job locks;
- Queues: pack generation, validation, and release jobs.

D1 and R2 never become an editable competing source of brand truth.

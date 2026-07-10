# ADR 0003: The website is static-first and does not depend on per-view API calls

- Status: Accepted
- Date: 2026-07-10

## Context

The public website and API consume the same canonical dataset, but making every website page call the public API would add latency, increase failure modes, complicate pre-rendering, and require special rate-limit exceptions for first-party traffic.

## Decision

The normal website experience uses generated release artifacts produced from the same validated dataset as the API.

At build time, `apps/web` consumes:

- a compact brand/search index;
- category and collection indexes;
- per-brand public JSON modules;
- the current release manifest;
- immutable CDN URLs.

Brand pages are pre-rendered. Search and filtering run locally in a Web Worker using the shared `packages/core` scoring and selection logic.

Normal browsing therefore requires no runtime API request except an optional low-frequency request to `/v1/meta` to detect a newer release.

The website calls the API only for dynamic behavior:

- API playground requests;
- custom pack creation and status;
- contribution drafts, validation, and pull-request creation;
- bounded raster transformations not already present in R2;
- optional live freshness or operational status.

The API playground uses the same anonymous public limits as any external consumer. It does not receive a hidden unlimited browser token.

Contribution routes use an authenticated same-origin session and are not part of the anonymous public read surface.

## Shared behavior

Resolution, search scoring, asset selection, color conversion, and URL construction live in `packages/core`. The website, API, and npm package use shared fixtures and contract tests to prevent behavioral drift.

## Caching and updates

A website deployment pins one dataset version. All asset URLs on that deployment are immutable.

A new dataset release triggers:

1. package/data generation;
2. R2 release publication;
3. API current-release pointer update;
4. website rebuild and deployment.

A website deployment must continue working when the API is temporarily unavailable.

## Consequences

- There is no need for a privileged first-party read quota.
- Brand pages remain fast, crawlable, and resilient.
- API traffic represents actual API use rather than ordinary website rendering.
- Website releases are consistent snapshots instead of mixing data versions during navigation.

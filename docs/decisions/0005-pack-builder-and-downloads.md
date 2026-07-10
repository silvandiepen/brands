# ADR 0005: Brand cart and downloadable packs

- Status: Accepted
- Date: 2026-07-10

## Context

Users often need several brands for an integration directory, provider selector, presentation, design system, or documentation site. Downloading files one by one is inefficient, and shipping the complete logo dataset is unnecessarily large.

## Decision

The website provides a persistent local **Brand Cart**. Users can add brands from search results, detail pages, or curated collections, configure the desired output, review a manifest, and download one deterministic pack.

A pack may contain:

- selected current SVG assets;
- generated PNG or WebP derivatives;
- compact or complete JSON metadata;
- CSS custom properties;
- SCSS maps;
- Design Tokens Community Group-compatible JSON;
- attribution, provenance, trademark disclaimer, and pack manifest files;
- optional HTML, Vue, React, Markdown, or CSS-mask usage examples.

The default pack includes one recommended current asset per brand, not every historical or alternative variant.

## Pack options

- brands or one curated collection;
- asset type: recommended, symbol, icon, wordmark, logo, lockup, or all current variants;
- theme: light, dark, any, or both where available;
- format: SVG, PNG, WebP, or multiple formats;
- raster size and padding within public transformation limits;
- metadata level: none, compact, complete;
- token outputs;
- folder layout: flat or grouped by brand;
- filename strategy: stable IDs or descriptive asset IDs;
- whether to include historical assets, disabled by default and visibly warned;
- whether to include source/provenance files, enabled by default.

## Creation flow

1. The browser normalizes and previews the requested manifest.
2. `POST /v1/packs` validates the request and calculates a canonical SHA-256 pack key.
3. If `packs/custom/<pack-key>.zip` already exists in R2, the API returns it immediately.
4. Otherwise the Worker queues generation and returns `202` with a pack ID and status URL.
5. A queue consumer reads approved immutable R2 assets, performs bounded transformations, writes the ZIP to R2, and records the result.
6. The client polls with exponential backoff or receives completion through Server-Sent Events when implemented.
7. The completed response points to an immutable pack URL.

No pack request may include arbitrary uploaded content or arbitrary remote URLs.

## Curated packs

Collections may publish permanent release-bound packs such as:

- cloud providers;
- payment providers;
- social platforms;
- developer tools;
- integration starter pack.

Curated packs are built during release and do not require dynamic generation.

## Persistence

The cart is local-first and stores only brand IDs and options. It does not require an account.

A shareable cart URL may encode a compact bounded manifest or reference a server-side pack draft. Shared URLs must not contain SVG data.

Custom completed packs expire from R2 after 30 days. Re-creating the same pack regenerates or restores the same content-addressed result.

## Safety and limits

- maximum 100 brands;
- maximum 500 output files;
- maximum 25 MiB estimated uncompressed output;
- maximum two raster sizes per request;
- no arbitrary recoloring of full-color marks;
- only reviewed public assets may enter packs;
- disputed, quarantined, or removed assets are excluded;
- every pack includes `manifest.json` and `NOTICE.md`.

## Consequences

- Users can create project-specific SVG packs without installing or downloading the entire dataset.
- Identical requests are generated once and cached.
- The cart remains useful without authentication.
- Pack generation is a bounded public service rather than a general archive or image-processing endpoint.

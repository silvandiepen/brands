# Brandfetch competitive analysis

## Purpose

Open Brands is not intended to be a smaller clone of Brandfetch. The target is a broader and more useful brand infrastructure platform with a materially better developer experience, transparent provenance, reproducible releases, open contribution, and strong reviewed identity data.

This document records publicly documented Brandfetch capabilities as of July 2026 and converts the relevant gaps into Open Brands product requirements. Brandfetch data, assets, API output, and restricted pages are not an Open Brands data source.

## Brandfetch capability inventory

### Discovery and profiles

Brandfetch provides a searchable public catalog and claims coverage of more than 50 million brands. Public profiles combine logos, colors, fonts, descriptions, social links, images, and company information. Brands can claim profiles and display a verification badge.

### Developer products

Brandfetch separates its developer offering into several products:

- Logo API: CDN-based logo resolution with domain, stock/ETF ticker, ISIN, and crypto identifiers; icon, symbol, and logo types; light and dark themes; sizing; SVG, PNG, WebP, and fallback behavior.
- Brand Search API: name autocomplete resolving to domains and logo URLs.
- Brand API: structured identity and company data including assets, colors, fonts, images, descriptions, social links, firmographics, financial identifiers, and quality signals.
- Brand Context API: AI-oriented context such as mission, voice, positioning, audience, products, competitors, and style.
- Transaction API: merchant resolution from raw bank and card transaction descriptions.
- MCP server: tools for brand search, full brand lookup, context, merchant enrichment, and logo URL construction.

### Enterprise delivery

Brandfetch documents:

- REST and logo CDN delivery;
- GraphQL for enterprise use;
- bulk CSV/JSON data delivery;
- S3, SFTP, or secure download ingestion;
- webhooks and targeted API calls for incremental updates;
- custom datasets and data shares;
- enterprise support, SLAs, compliance review, and priority QA.

### Ecosystem

Publicly listed integrations include Figma, FigJam, Canva, Miro, Chrome, Zapier, Make, and n8n.

### Operational product

Brandfetch exposes a developer dashboard, API credentials, quotas, overage billing, a playground, documentation, changelog, service status, update requests, owner-managed profiles, and published coverage methodology.

## What Open Brands must match

The following are baseline competitive requirements, not optional ideas.

### Identifier resolution

Resolve brands by:

- canonical ID;
- domain and hostname;
- brand and organization name;
- alias and former name;
- stock and ETF ticker;
- ISIN and other supported financial identifiers;
- crypto symbol and chain-aware asset identifier;
- social profile URL;
- application/package identifiers where verified;
- merchant descriptor where transaction enrichment is available.

Identifiers must remain typed. Ambiguous untyped identifiers return candidates rather than silently selecting the wrong brand.

### Brand data

Support structured, independently reviewable fields for:

- names, aliases, domains, organizations, parent relationships, products, and lifecycle;
- logos, symbols, icons, wordmarks, lockups, badges, and historical variants;
- light, dark, monochrome, positive, negative, and custom-background suitability;
- colors with roles, themes, usage, and derived formats;
- fonts with role, source, family, weights, licensing notes, and fallback stack;
- banners, screenshots, social images, and brand photography where redistribution is appropriate;
- official descriptions, taglines, mission, values, positioning, audiences, voice, style, products, and services;
- official website and managed social links;
- industry, location, organization type, founded year, employee range, and financial identifiers;
- source, trust tier, review status, freshness, and history for every field.

Generated or inferred context is stored separately from first-party statements and is always labelled.

### API surfaces

Implement:

- fast autocomplete and ranked search;
- canonical brand lookup;
- identifier resolution;
- logo and asset CDN routes;
- complete and field-selected brand responses;
- brand context responses with first-party/inferred separation;
- change history and release metadata;
- bulk packs and dataset exports;
- webhooks or feeds for changed records;
- MCP tools;
- transaction enrichment after the core identity system is stable;
- GraphQL only when it materially improves enterprise field selection beyond REST `fields` support.

### Brand management

Provide:

- simple correction requests without authentication;
- GitHub-authenticated structured contributions;
- owner claims using domain or manual proof;
- owner-managed profile updates;
- clear verification badges that state what was verified;
- takedown and dispute handling;
- a public change trail without exposing private claim evidence.

### Integrations

Prioritize integrations in this order:

1. Figma and FigJam;
2. browser extension;
3. MCP;
4. Zapier, Make, and n8n;
5. Canva and Miro where platform APIs and review processes permit;
6. framework and design-tool plugins driven by demand.

All integrations consume public Open Brands APIs and packages rather than maintaining separate datasets.

## How Open Brands should be better

### Open and reproducible

Brandfetch generally requires live authenticated usage, hotlinking, or commercial delivery agreements. Open Brands should allow:

- immutable cacheable asset URLs;
- local SVG use from explicit package subpaths;
- reviewed data without network calls;
- downloadable selected-brand packs;
- public versioned dataset snapshots;
- deterministic release manifests and checksums;
- self-hosting of published open components where legally permitted.

### Provenance instead of opacity

Every field should expose where it came from, when it was observed or reviewed, and its trust tier. A single opaque quality score is not enough.

The website should let users inspect:

- evidence links;
- observation and verification dates;
- owner-claimed status;
- reviewer and review method where public;
- current versus historical values;
- unresolved disputes and missing evidence;
- before/after identity changes.

### Better asset handling

Open Brands should exceed simple icon/logo/symbol selection with:

- wordmarks and lockups as first-class types;
- explicit orientation and minimum-size metadata;
- clear-space and background restrictions;
- transformability rules;
- visual-diff and clipping checks;
- stable original and optimized forms;
- deterministic PNG/WebP derivatives;
- CSS masks and design-token output;
- project-specific ZIP packs;
- historical logo timelines.

Fallbacks must be explicit. A lettermark, domain icon, or placeholder must never be returned as though it were an official logo.

### Better developer experience

Open Brands should provide:

- anonymous public reads for ordinary metadata and CDN delivery;
- a compact typed `open-brands` package;
- browser, Node, Worker, and build-time support;
- generated TypeScript clients from OpenAPI;
- examples for HTML, CSS, Vue, React, Markdown, Swift, Kotlin, and common server runtimes;
- a request playground that generates code and explains cache behavior;
- predictable versioning and deprecation windows;
- stable non-expiring immutable URLs;
- exact rate-limit headers and no hidden quality degradation;
- local search over pinned release data;
- an MCP server that can return source-backed answers.

### Better contributor experience

A user should be able to upload SVGs, add evidence, see browser and server validation, inspect the exact repository diff, and create a reviewable PR without manually editing JSON. Brand owners should be able to prove control without gaining direct publication rights.

### Better freshness

Publish:

- field-level freshness dates;
- stale-record queues;
- rebrand detection;
- owner update subscriptions;
- webhook and Atom/JSON change feeds;
- release diffs;
- scheduled source rechecks;
- public coverage and freshness dashboards.

### Better history

Open Brands should treat rebrands, renamed companies, mergers, acquired products, discontinued identities, and historical marks as useful structured data. Current API defaults exclude obsolete assets, while historical endpoints and website timelines remain available.

### Better bulk use

Offer versioned JSONL and Parquet shards, reviewed-only exports, category and country partitions, delta files, checksums, and change feeds. Bulk access must not require consumers to repeatedly call a per-brand API.

## How Open Brands should be faster

Performance must be measured and published.

### Target service levels

- Local package lookup: p95 below 1 ms after data load.
- Browser local search: p95 below 16 ms for reviewed data and below 50 ms for a loaded observed shard.
- Edge-cached brand metadata: p95 below 100 ms globally.
- Edge logo redirect or immutable asset response: p95 below 75 ms globally.
- Search API: p95 below 150 ms for ordinary queries.
- Cached transformation: p95 below 150 ms.
- Uncached bounded transformation: p95 below 750 ms.
- Public API monthly availability target: 99.95% after production stabilization.

Targets are measured at the service boundary and published by region. A benchmark failure blocks performance claims, not normal correctness releases.

### Implementation principles

- static-first website;
- local reviewed search and prebuilt indexes;
- immutable R2 assets;
- edge caching and conditional requests;
- partitioned observed indexes;
- no API request for every website page;
- no runtime SVG parsing on ordinary asset delivery;
- pre-generated common raster sizes;
- content-addressed pack and transformation caching;
- dedicated search service selected through representative benchmarks.

## How Open Brands should be bigger

Do not inflate counts by aliases, subdomains, duplicate legal entities, or generated placeholders. Publish separate numbers for:

- reviewed brands;
- verified owner claims;
- observed domains;
- organizations resolved across multiple domains;
- brands with approved artwork;
- brands with current palette, fonts, context, and firmographics;
- long-tail versus core coverage;
- geographic and category coverage.

The observed catalog scale plan is defined in ADR 0008. The first objective is not to claim 50 million records immediately. It is to build a pipeline whose quality and throughput can credibly pass 50 million and then exceed competitor-reported coverage.

## Features Open Brands should not copy

- Forced hotlink-only access.
- Expiring image URLs for normal public assets.
- Restrictions that prevent legitimate local caching of published immutable assets.
- An opaque generated description presented without evidence.
- A universal quality score without field-level methodology.
- Silent replacement of missing official assets with generated fallbacks.
- Treating a claimed profile as proof that every field is correct.
- Making the website depend on a paid per-view API.
- Copying or ingesting Brandfetch data, API responses, CDN assets, or restricted content.

## Competitive execution priorities

### P0: credible product

- reviewed schema and SVG pipeline;
- useful initial reviewed registry;
- search, brand detail, colors, fonts, assets, sources, and history;
- Logo/Asset API, Brand API, Search API, package, playground, and packs;
- correction and contribution flow;
- R2 release and Cloudflare deployment;
- published quality and performance tests.

### P1: clear superiority

- field-level provenance everywhere;
- claimed profiles with scoped verification;
- historical identity timelines;
- immutable dataset and bulk exports;
- change feeds and webhooks;
- MCP server;
- Figma plugin and browser extension;
- source-backed brand context;
- reviewed-only offline package and local search.

### P2: breadth and enterprise

- observed catalog ingestion at million-domain scale;
- dedicated global search index;
- transaction/merchant enrichment;
- GraphQL and data shares where justified;
- S3-compatible bulk delivery and delta streams;
- advanced rebrand detection;
- enterprise support, regional performance reporting, and security program.

## Benchmarking

Create a public benchmark suite from independently sourced domain sets. Do not automate collection from Brandfetch.

Measure:

- exact brand/domain resolution;
- false-positive and ambiguity rates;
- approved logo and variant coverage;
- palette/font/context coverage;
- freshness after known rebrands;
- source and provenance completeness;
- API and CDN latency by region;
- package size and local lookup time;
- search relevance;
- update-to-release time;
- long-tail geographic coverage.

Publish methodology, sample composition, null handling, and raw aggregate results. Open Brands wins only when independently measured quality, speed, usefulness, or openness is better—not merely when its record counter is larger.

## Public references reviewed

- Brandfetch public website and developer product pages.
- Brandfetch Brand API, Logo API, Brand Search API, Brand Context API, Transaction API, MCP, coverage, delivery, GraphQL, pricing, plugin, owner profile, and update documentation.
- Brandfetch terms and public usage guidelines.

These references describe competitive capabilities only and are not approved data inputs.
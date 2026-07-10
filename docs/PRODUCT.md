# Product specification

## Product statement

Open Brands is a maintained, open developer platform for resolving a brand name to trustworthy visual identity resources: logo variants, marks, wordmarks, colors, metadata, and source information.

A consumer should be able to request a brand by ID, name, alias, historical name, or domain and receive a predictable result through the website, REST API, CDN, or `open-brands` package.

## Public identity

- Product name: **Open Brands**
- npm package: **`open-brands`**
- website: **`open-brands.org`**
- API documentation: hosted on `open-brands.org`
- recommended API hostname: `api.open-brands.org`
- recommended asset hostname: `cdn.open-brands.org`

The repository name `brands` is not a replacement public brand.

## Primary users

1. Developers adding provider logos, integration marks, payment brands, or social icons.
2. Designers checking current palette and logo variants.
3. Documentation and marketing systems that need predictable brand assets.
4. Design systems that need theme-aware marks and tokens.
5. Automated tools resolving names or domains to brand metadata.
6. Open-source maintainers who need a reviewed, contribution-friendly source.

## Core jobs

- Resolve `Google`, `google.com`, `Google LLC`, or a known alias to one brand ID.
- Get the primary or complete official palette with semantic roles.
- Get the best icon, symbol, wordmark, or lockup for light or dark backgrounds.
- Download clean SVG or generated PNG/WebP at a requested size.
- Copy an asset URL, SVG, CSS variable, JSON object, or framework snippet.
- Search and filter by category, status, country, tag, color, or asset availability.
- Understand where an asset or color came from and when it was reviewed.
- Contribute a correction with automated validation and preview evidence.

## Minimum viable platform

### Dataset

- stable brand IDs;
- display name and aliases;
- controlled categories and free-form tags;
- domain and official website references;
- color records with roles and source references;
- asset records for icon, symbol, wordmark, logo, and lockup variants;
- light, dark, neutral, and any-theme suitability;
- lifecycle and verification states;
- per-record provenance;
- legacy source references.

### Package

The `open-brands` package must provide:

- typed metadata and query helpers;
- local data access without network calls;
- optional asset URL construction;
- generated per-brand or grouped subpath exports;
- CSS variables as an explicit subpath;
- no mandatory framework dependency;
- no complete inline SVG payload in the root import.

### API

The API must provide:

- list, retrieve, search, resolve, category, color, and asset endpoints;
- deterministic responses versioned under `/v1`;
- cache headers and entity tags;
- CORS for public read endpoints;
- OpenAPI documentation;
- predictable errors;
- safe image transformation for supported assets.

### Website

The website must provide:

- fast brand search;
- browse and filter views;
- brand detail pages;
- logo variant and theme previews;
- color formats and accessibility information;
- copy/download actions;
- API and package examples;
- an interactive request builder;
- contribution, correction, and takedown guidance;
- dataset quality and freshness indicators.

## High-value follow-up features

### Collections

Curated groups such as:

- social platforms;
- payment providers;
- cloud platforms;
- developer tools;
- streaming services;
- automotive brands;
- regional banks;
- integration-provider starter packs.

Collections are data, not hard-coded website sections, and can be consumed by API and package users.

### Theme-aware resolution

Provide a resolver that chooses the best available asset based on:

- requested type;
- background theme or color;
- available horizontal space;
- monochrome/full-color preference;
- minimum size and safe-area requirements.

### Generated formats

From a validated SVG source, generate:

- PNG and WebP previews;
- square padded icons;
- favicons and app-icon source images where legally and visually appropriate;
- social preview cards;
- CSS masks for monochrome marks.

Generated formats must identify the source asset and transformation parameters.

### Design tokens

Expose brand palettes as:

- CSS custom properties;
- JSON design tokens;
- SCSS maps;
- Style Dictionary-compatible output;
- optional Tailwind-compatible objects without making Tailwind part of the core project.

### Embeds

Offer stable snippets for:

- plain HTML `<img>`;
- CSS mask usage;
- Vue;
- React;
- Markdown;
- Open Graph or integration directories.

### Change history

Track meaningful identity changes:

- renamed brands;
- replaced logos;
- deprecated marks;
- palette changes;
- mergers and acquisitions;
- discontinued brands.

Historical assets remain clearly marked and are not returned as default current assets.

### Quality dashboard

Publish aggregate metrics:

- verified brands;
- brands awaiting review;
- stale verification dates;
- missing asset variants;
- missing source links;
- SVG validation failures;
- duplicate aliases or domains;
- coverage by category.

### Contribution assistant

A local or website form may generate a ready-to-commit brand directory and validation report. It must never auto-approve factual data or legal status.

## Non-goals

- Claiming ownership of trademarks or implying endorsement.
- Guaranteeing that any use is legally permitted.
- Automatically scraping and publishing logos without review.
- Generating brand history or factual descriptions from an LLM without cited evidence.
- Becoming a general icon library; generic icons belong in Open Icon.
- Hosting user-uploaded arbitrary SVG at public URLs.
- Maintaining compatibility with either previous package.
- Requiring an account for normal public lookup and download use.

## Product quality principles

- Prefer fewer verified records over many opaque records.
- Keep the API boring, stable, and cacheable.
- Keep the package small by default.
- Make provenance visible rather than hidden in repository history.
- Treat accessibility, security, and legal clarity as product features.
- Use automation to detect problems, not to invent brand facts.

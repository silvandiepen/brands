# Website

The website is a professional lookup and download tool, not a marketing gallery.

## Technology

- Vue 3 and Vite;
- Vue Router and pre-rendered public routes;
- `@sil/ui` for shared primitives;
- `bemm` for app-specific classes;
- unscoped SCSS and CSS custom properties.

## Data flow

Normal browsing uses generated, release-pinned data and immutable CDN URLs. Search and filtering run locally with shared core logic. The website calls the API only for dynamic operations such as packs, contributions, the playground, and uncommon image transformations.

## Routes

- `/` — search and useful entry points;
- `/brands` — browse, filter, and sort;
- `/brands/:id` — assets, palettes, sources, snippets, and downloads;
- `/collections` — curated groups and release packs;
- `/cart` — selected-brand pack builder;
- `/docs` — package and API documentation;
- `/playground` — public API request builder;
- `/contribute` — guided additions and edits;
- `/quality` — dataset coverage and freshness;
- `/legal` — trademark and takedown information.

## Brand pages

A brand page shows identity, relationships, review status, current recommended assets, alternate variants, light/dark previews, palette formats, source records, historical material, and immutable download URLs.

Downloads always use approved CDN assets. The browser never serializes rendered DOM into an SVG file.

## Accessibility

All critical flows support keyboard navigation, visible focus, clear error summaries, reduced motion, non-color status labels, and accessible announcements for cart, job, and submission state changes.

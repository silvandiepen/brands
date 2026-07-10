# Website specification

## Purpose

`open-brands.org` is the visual explorer, documentation site, API playground, and contribution entry point for the canonical dataset. It is not a second data source.

## Frontend foundation

- Vue 3 and Vite;
- `<script setup lang="ts">`;
- Vue Router;
- route pre-rendering or static generation for public brand pages;
- `@sil/ui` through stable root imports;
- `@sil/ui/vite` for shared styles and theme variables;
- `bemm` for app-specific blocks;
- unscoped SCSS;
- CSS custom properties;
- generic interface icons from Open Icon.

Example Vite integration:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineTheme, ui } from '@sil/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      theme: defineTheme({
        colors: {
          dark: '#101114',
          light: '#ffffff',
          primary: '#2563eb',
        },
      }),
    }),
  ],
})
```

The final theme can change. The integration pattern may not be replaced by copied component CSS.

## Component ownership

### Use from `@sil/ui`

Where stable equivalents exist, use shared:

- buttons and icon buttons;
- fields, search, select, checkbox, switch, and form layout;
- cards and layout primitives;
- badges and status indicators;
- tooltips, popups, sheets, dialogs, and notifications;
- tabs, pagination, empty states, and loading states;
- header shells and navigation primitives.

### Keep local to Open Brands

- `BrandCard`;
- `BrandLogoPreview`;
- `BrandPalette`;
- `AssetVariantGrid`;
- `SourceList`;
- `VerificationStatus` wrapper;
- `BrandUsageSnippet`;
- `ApiRequestBuilder`;
- `DatasetQualityPanel`;
- collection-specific sections.

When a local component reveals a genuinely product-neutral primitive, improve `@sil/ui` in its own PR rather than silently duplicating it.

## BEMM rules

Each component owns one stable block:

```vue
<script setup lang="ts">
import { useBemm } from 'bemm'

const { bemm } = useBemm('brand-card')
</script>

<template>
  <article :class="bemm()">
    <div :class="bemm('preview')" />
    <div :class="bemm('meta')" />
  </article>
</template>

<style lang="scss">
.brand-card {
  &__preview {}
  &__meta {}
  &--compact {}
}
</style>
```

Do not use utility-class-heavy templates or `<style scoped>`.

## Information architecture

### Home `/`

- concise product explanation;
- primary search field;
- featured or recently verified brands;
- category and collection entry points;
- direct links to API and package usage;
- dataset coverage and freshness summary.

The homepage should demonstrate usefulness immediately, not lead with a long marketing hero.

### Browse `/brands`

- responsive brand grid/list toggle;
- instant search;
- category, tag, status, and asset filters;
- sorting by name, recently verified, and palette hue where useful;
- URL-synchronized filters;
- keyboard navigation;
- virtualized rendering only after profiling proves it necessary.

Do not recreate the old full-viewport scroll container.

### Brand detail `/brands/:id`

- display name, aliases, organization, categories, and status;
- current recommended logo preview;
- variant grid across light/dark preview surfaces;
- palette with hex, RGB, HSL, and OKLCH copy actions;
- contrast/luminance information with clear limitations;
- download actions for SVG and generated raster formats;
- code snippets and API URL builder;
- official source links and verification date;
- historical/deprecated assets in a separate section;
- correction and takedown links.

No raw debug object output.

### Collections `/collections` and `/collections/:id`

Curated useful sets with downloadable metadata or code snippets.

### API docs `/docs/api`

Rendered from OpenAPI plus practical examples.

### Package docs `/docs/package`

Installation, tree-shaking, subpath exports, local versus CDN assets, and examples.

### Playground `/playground`

Interactive request builder that shows:

- request URL;
- response status and headers;
- formatted JSON or image preview;
- copyable fetch/curl/TypeScript examples.

### Contribute `/contribute`

Explain manifest structure, asset requirements, local validation, PR flow, review statuses, and legal responsibilities.

### Legal `/legal`

Trademark disclaimer, code/data licensing distinction, source policy, and takedown process.

## Search behavior

- Search ID, name, alias, domain, organization, category, and tags.
- Exact matches appear before prefix and fuzzy matches.
- Show what matched when it was not the display name.
- Keep search results stable between website and API by using `packages/core`.
- Debounce network requests but not local input state.
- Provide a useful no-results state with contribution guidance.

## Asset preview behavior

- Render canonical SVG through `<img>` or a trusted generated component.
- Never insert untrusted contribution markup with `v-html`.
- Allow switching preview background without changing the asset.
- Explain when an asset is monochrome, full-color, historical, or requires a custom background.
- Preserve intrinsic aspect ratio and documented clear space.
- Do not force every mark into a square crop.

## Copy and download actions

Support copying:

- color values in multiple formats;
- logical and immutable asset URLs;
- HTML, Markdown, Vue, React, and CSS-mask snippets;
- compact JSON;
- brand ID.

Downloads must use API/CDN contracts rather than serializing arbitrary DOM output.

## Favorites

Favorites may be offered as a progressive local feature. Store only stable brand IDs and user preferences. Never persist the entire dataset or derived SVG strings.

## Accessibility

- semantic landmarks and headings;
- visible focus treatment;
- full keyboard support for search, filters, menus, tabs, and previews;
- accessible names for logo-only actions;
- color information never conveyed by color alone;
- contrast checking for Open Brands UI itself;
- reduced-motion support;
- meaningful alt text based on brand and asset type;
- no inaccessible hover-only controls.

## Performance

- compact initial dataset or server-rendered search results;
- lazy-load heavy asset previews;
- pre-render brand detail metadata;
- immutable CDN caching;
- avoid bundling all SVG strings;
- use responsive images for generated raster previews;
- measure before adding custom virtualization.

## SEO and sharing

- unique title and description per brand page;
- canonical URLs;
- structured metadata for the dataset and software project, without claiming affiliation with listed brands;
- generated social images using reviewed assets;
- sitemap generated from canonical brands and collections;
- robots rules that exclude internal preview and raw query routes.

## Visual direction

The site should be clean, dense enough for professional lookup, and visually led by the brands themselves. Avoid heavy decoration, generic dashboard styling, excessive gradients, and oversized marketing typography. Use calm neutral surfaces so logo and palette differences remain legible.

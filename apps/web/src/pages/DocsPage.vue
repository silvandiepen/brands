<script setup lang="ts">
import { useBemm } from 'bemm'

const bemm = useBemm('docs-page')
const apiOrigin = 'https://open-brands-api.vandipyan.workers.dev'
</script>

<template>
  <div :class="[bemm(), 'container']">
    <header :class="[bemm('head'), 'fade-up']">
      <h1 :class="bemm('title')">Documentation</h1>
      <p :class="bemm('sub')">Everything you need to use the Open Brands API and npm package.</p>
    </header>

    <section :class="[bemm('section'), 'reveal']">
      <h2 :class="bemm('heading')">Public API</h2>
      <p>The API is public, CORS-enabled, and requires no API key.</p>
      <table :class="bemm('table')">
        <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>GET</td><td><code>/v1/meta</code></td><td>Release metadata and dataset version</td></tr>
          <tr><td>GET</td><td><code>/v1/brands</code></td><td>List brands with pagination, filtering, and sorting</td></tr>
          <tr><td>GET</td><td><code>/v1/brands/:id</code></td><td>Brand detail with assets, colors, and sources</td></tr>
          <tr><td>GET</td><td><code>/v1/brands/:id/colors</code></td><td>Brand color palette with format conversions</td></tr>
          <tr><td>GET</td><td><code>/v1/brands/:id/assets</code></td><td>Brand assets filtered by theme and current status</td></tr>
          <tr><td>GET</td><td><code>/v1/brands/:id/image</code></td><td>Redirect to the brand's CDN image URL</td></tr>
          <tr><td>GET</td><td><code>/v1/resolve/:query</code></td><td>Resolve brand by name, alias, or domain</td></tr>
          <tr><td>GET</td><td><code>/v1/search?q=</code></td><td>Fuzzy search across brand names, aliases, and domains</td></tr>
          <tr><td>GET</td><td><code>/v1/categories</code></td><td>Full category taxonomy</td></tr>
          <tr><td>GET</td><td><code>/v1/collections</code></td><td>Curated brand collections</td></tr>
          <tr><td>POST</td><td><code>/v1/packs</code></td><td>Create a downloadable brand pack</td></tr>
          <tr><td>GET</td><td><code>/v1/packs/:id</code></td><td>Check pack generation status</td></tr>
        </tbody>
      </table>
      <p><a :href="`${apiOrigin}/openapi.json`" target="_blank">View OpenAPI spec</a></p>
    </section>

    <section :class="[bemm('section'), 'reveal']">
      <h2 :class="bemm('heading')">npm Package</h2>
      <pre class="code-block">npm install open-brands</pre>
      <pre class="code-block">import { searchBrands, getBrand, generateColorFormats } from 'open-brands'

// Search for brands
const results = searchBrands('goo')

// Get brand detail
const brand = getBrand('google')

// Color utilities
const formats = generateColorFormats('#4285F4')
console.log(formats.oklch) // oklch(0.6217 0.1875 249.21)</pre>
    </section>

    <section :class="[bemm('section'), 'reveal']">
      <h2 :class="bemm('heading')">Quick Examples</h2>
      <h3 :class="bemm('subheading')">Search</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/search?q=google"</pre>
      <h3 :class="bemm('subheading')">Brand Detail</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/brands/google"</pre>
      <h3 :class="bemm('subheading')">Resolve by Domain</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/resolve/github.com"</pre>
    </section>

    <section :class="[bemm('section'), 'reveal']">
      <h2 :class="bemm('heading')">Rate Limits</h2>
      <ul :class="bemm('list')">
        <li>Metadata reads: 600 req/min per IP</li>
        <li>Search and resolve: 120 req/min per IP</li>
        <li>CDN assets: long-lived immutable caching, edge abuse threshold 3000 req/min</li>
        <li>Pack generation: 5 attempts/min, 25 packs/day (anonymous)</li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss">
.docs-page {
  padding-top: var(--space);
  padding-bottom: var(--space-xl);
  max-width: 800px;

  &__head {
    padding-bottom: var(--space-l);
    margin-bottom: var(--space-l);
    border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__title {
    font-size: clamp(var(--font-size-xl), 4vw, var(--font-size-xxl));
    margin-bottom: var(--space-xs);
  }

  &__sub {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    max-width: 60ch;
  }

  &__section {
    margin-bottom: var(--space-l);
  }

  &__heading {
    font-size: var(--font-size-l);
    margin-bottom: var(--space-s);
  }

  &__subheading {
    font-size: var(--font-size);
    margin: var(--space) 0 var(--space-s);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space) 0;

    th,
    td {
      text-align: left;
      padding: var(--space-s);
      border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    }

    th {
      font-size: var(--font-size-s);
      color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    }

    code {
      font-size: var(--font-size-s);
    }
  }

  &__list {
    padding-left: var(--space-l);
    line-height: 2;
  }
}
</style>

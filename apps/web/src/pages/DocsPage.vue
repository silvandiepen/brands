<script setup lang="ts">
import { releaseManifest } from '../data/loader'
const apiOrigin = 'https://api.open-brands.org'
</script>

<template>
  <div class="container docs-page">
    <h1>Documentation</h1>

    <section class="section">
      <h2>Public API</h2>
      <p>The API is public, CORS-enabled, and requires no API key.</p>
      <table class="api-table">
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

    <section class="section">
      <h2>npm Package</h2>
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

    <section class="section">
      <h2>Quick Examples</h2>
      <h3>Search</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/search?q=google"</pre>
      <h3>Brand Detail</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/brands/google"</pre>
      <h3>Resolve by Domain</h3>
      <pre class="code-block">curl "{{ apiOrigin }}/v1/resolve/github.com"</pre>
    </section>

    <section class="section">
      <h2>Rate Limits</h2>
      <ul>
        <li>Metadata reads: 600 req/min per IP</li>
        <li>Search and resolve: 120 req/min per IP</li>
        <li>CDN assets: long-lived immutable caching, edge abuse threshold 3000 req/min</li>
        <li>Pack generation: 5 attempts/min, 25 packs/day (anonymous)</li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.docs-page { padding: 2rem 0 4rem; max-width: 800px; }
.section { margin-bottom: 2.5rem; }
h2 { font-size: 1.25rem; margin-bottom: 0.75rem; }
h3 { font-size: 1rem; margin: 1rem 0 0.5rem; }
.api-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--ob-border); }
  th { font-size: 0.875rem; color: var(--ob-text-muted); }
  code { font-size: 0.85rem; }
}
.code-block {
  background: var(--ob-bg-alt);
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  padding: 0.75rem;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}
ul { padding-left: 1.5rem; line-height: 2; }
</style>

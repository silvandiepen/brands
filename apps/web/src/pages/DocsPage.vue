<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { Button, InputSelect } from '@sil/ui'
import HeadingSection from '../components/HeadingSection.vue'

const bemm = useBemm('docs-page')
const apiOrigin = 'https://open-brands-api.vandipyan.workers.dev'

const method = ref('GET')
const endpoint = ref('/v1/search?q=google')
const response = ref<string>('')
const loading = ref(false)
const error = ref('')

const features = [
  {
    title: 'Search and resolve',
    copy: 'Find brands by name, alias, or domain without shipping the full dataset to the client.',
  },
  {
    title: 'Brand metadata',
    copy: 'Read categories, tags, domains, source references, review state, colors, and asset metadata.',
  },
  {
    title: 'Logo assets',
    copy: 'Resolve immutable CDN URLs for current SVG assets and use long-lived browser or CI caches.',
  },
]

const useCases = [
  'Development tooling, docs, and small build-time checks.',
  'CI jobs that verify a few known brand identifiers or download a small icon set.',
  'Internal demos, prototypes, and dashboards that need accurate brand metadata.',
]

const avoidCases = [
  'Serving thousands of production user-facing logos directly from the public API.',
  'Bulk scraping or mirroring CDN assets without using the npm package or a controlled cache.',
  'Runtime logo lookups on every page view in a high-traffic product.',
]

const endpoints = [
  ['GET', '/v1/meta', 'Release metadata and dataset version'],
  ['GET', '/v1/brands', 'List brands with pagination, filtering, and sorting'],
  ['GET', '/v1/brands/:id', 'Brand detail with assets, colors, and sources'],
  ['GET', '/v1/brands/:id/colors', 'Brand color palette with format conversions'],
  ['GET', '/v1/brands/:id/assets', 'Brand assets filtered by theme and current status'],
  ['GET', '/v1/brands/:id/image', 'Redirect to the brand CDN image URL'],
  ['GET', '/v1/resolve/:query', 'Resolve brand by name, alias, or domain'],
  ['GET', '/v1/search?q=', 'Fuzzy search across names, aliases, and domains'],
  ['GET', '/v1/categories', 'Full category taxonomy'],
  ['GET', '/v1/collections', 'Curated brand collections'],
  ['POST', '/v1/packs', 'Create a downloadable brand pack'],
  ['GET', '/v1/packs/:id', 'Check pack generation status'],
]

const examples = [
  'GET /v1/meta',
  'GET /v1/brands',
  'GET /v1/search?q=python',
  'GET /v1/brands/github',
  'GET /v1/resolve/netflix.com',
  'GET /v1/categories',
  'GET /v1/collections',
]

function applyExample(ex: string) {
  const parts = ex.split(' ')
  method.value = parts[0] ?? 'GET'
  endpoint.value = parts[1] ?? '/'
}

async function sendRequest() {
  loading.value = true
  error.value = ''
  response.value = ''
  try {
    const res = await fetch(`${apiOrigin}${endpoint.value}`, { method: method.value })
    const data = await res.json()
    response.value = JSON.stringify(data, null, 2)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="bemm()">
    <HeadingSection
      eyebrow="Open Brands API"
      title="API"
      description="Search brands, resolve domains, inspect colors, fetch metadata, and generate small asset packs from a public, CORS-enabled API."
      tone="dark"
    >
      <div :class="bemm('hero-actions')">
        <a :href="`${apiOrigin}/openapi.json`" target="_blank">OpenAPI spec</a>
        <a href="#playground">Try the playground</a>
      </div>
    </HeadingSection>

    <section :class="[bemm('band'), 'reveal']">
      <div :class="[bemm('section-inner'), 'container']">
        <p class="eyebrow">What it gives you</p>
        <div :class="bemm('feature-grid')">
          <article v-for="item in features" :key="item.title" :class="bemm('feature')">
            <h2>{{ item.title }}</h2>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section :class="[bemm('band'), bemm('band', 'split'), 'reveal']">
      <div :class="[bemm('section-inner'), 'container']">
        <div :class="bemm('usage')">
          <div>
            <p class="eyebrow">Good use cases</p>
            <h2>Use the API for development, CI, and small integrations.</h2>
            <ul>
              <li v-for="item in useCases" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <p class="eyebrow">Do not use it for</p>
            <h2>Production bulk logo serving should use your own cache.</h2>
            <ul>
              <li v-for="item in avoidCases" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="playground" :class="[bemm('playground'), 'container', 'reveal']">
      <div :class="bemm('playground-copy')">
        <p class="eyebrow">Playground</p>
        <h2>Try a request</h2>
        <p>Runs against the public API with the same anonymous limits external consumers get.</p>
      </div>

      <div :class="bemm('console')">
        <div :class="bemm('request-row')">
          <div :class="bemm('method')">
            <InputSelect v-model="method" :options="['GET', 'POST']" />
          </div>
          <input v-model="endpoint" :class="bemm('endpoint')" placeholder="/v1/..." @keydown.enter="sendRequest" />
          <Button variant="primary" :loading="loading" @click="sendRequest">Send</Button>
        </div>
        <div :class="bemm('examples')">
          <Button v-for="ex in examples" :key="ex" size="small" variant="outline" @click="applyExample(ex)">
            {{ ex }}
          </Button>
        </div>
        <p v-if="error" :class="bemm('error')">{{ error }}</p>
        <pre v-if="response" :class="bemm('response')">{{ response }}</pre>
      </div>
    </section>

    <section :class="[bemm('band'), 'reveal']">
      <div :class="[bemm('section-inner'), 'container']">
        <div :class="bemm('two-column')">
          <div>
            <p class="eyebrow">npm package</p>
            <h2>Use local data when you need bulk or production-safe reads.</h2>
            <p>The package is the right choice for build pipelines, repeat lookups, and apps that need predictable production behavior.</p>
          </div>
          <pre class="code-block">npm install open-brands</pre>
        </div>
        <pre class="code-block">import { searchBrands, getBrand, generateColorFormats } from 'open-brands'

const results = searchBrands('goo')
const brand = getBrand('google')
const formats = generateColorFormats('#4285F4')</pre>
      </div>
    </section>

    <section :class="[bemm('endpoints'), 'container', 'reveal']">
      <div>
        <p class="eyebrow">Reference</p>
        <h2>Endpoints</h2>
      </div>
      <table :class="bemm('table')">
        <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr v-for="row in endpoints" :key="row[1]">
            <td>{{ row[0] }}</td>
            <td><code>{{ row[1] }}</code></td>
            <td>{{ row[2] }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section :class="[bemm('limits'), 'container', 'reveal']">
      <p class="eyebrow">Rate limits</p>
      <h2>Anonymous access is intentionally small.</h2>
      <p>
        The public API is for development, CI checks, demos, and small build-time integrations.
        Higher limits and relaxed limits for Open Brands properties require server-side identification.
      </p>
      <ul>
        <li>Metadata reads: 60 req/min per IP</li>
        <li>Search and resolve: 30 req/min per IP</li>
        <li>Brand detail, colors, and asset metadata: 60 req/min per IP</li>
        <li>Logo redirects and CDN assets: long-lived immutable caching, public edge abuse threshold 300 req/min per IP</li>
        <li>Pack generation: 2 attempts/min, 5 packs/day anonymous</li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss">
.docs-page {
  padding-bottom: var(--space-xl);

  &__hero-actions {
    display: flex;
    gap: var(--space);
    flex-wrap: wrap;

    a {
      color: #4d8dff;
      font-weight: 800;
      text-decoration: none;
    }
  }

  &__band {
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 92%);
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 3%);

    &--split {
      background: color-mix(in srgb, var(--color-primary), var(--color-background) 94%);
    }
  }

  &__section-inner,
  &__playground,
  &__endpoints,
  &__limits {
    padding-top: clamp(var(--space-l), 6vw, var(--space-xl));
    padding-bottom: clamp(var(--space-l), 6vw, var(--space-xl));
  }

  &__feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-l);

    @media (max-width: 820px) {
      grid-template-columns: 1fr;
    }
  }

  &__feature {
    h2 {
      margin-bottom: var(--space-s);
      font-size: var(--font-size-l);
    }

    p {
      color: color-mix(in srgb, var(--color-foreground), transparent 34%);
      line-height: 1.65;
    }
  }

  &__usage,
  &__two-column,
  &__playground {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(var(--space-l), 6vw, var(--space-xl));

    @media (max-width: 820px) {
      grid-template-columns: 1fr;
    }
  }

  &__usage {
    h2 {
      max-width: 14ch;
      margin-bottom: var(--space);
      font-size: clamp(var(--font-size-l), 3vw, var(--font-size-xl));
      line-height: 1.08;
    }

    ul {
      display: grid;
      gap: var(--space-s);
      padding-left: 1.1rem;
      color: color-mix(in srgb, var(--color-foreground), transparent 30%);
      line-height: 1.55;
    }
  }

  &__playground-copy {
    h2 {
      margin-bottom: var(--space-s);
      font-size: clamp(var(--font-size-xl), 4vw, var(--font-size-xxl));
    }

    p:not(.eyebrow) {
      color: color-mix(in srgb, var(--color-foreground), transparent 34%);
      line-height: 1.6;
    }
  }

  &__console {
    display: grid;
    gap: var(--space);
    min-width: 0;
  }

  &__request-row {
    display: flex;
    gap: var(--space-s);
    align-items: stretch;

    @media (max-width: 620px) {
      flex-direction: column;
    }
  }

  &__method {
    width: 120px;
    flex-shrink: 0;
  }

  &__endpoint {
    flex: 1;
    min-width: 0;
    padding: var(--space-s) var(--space);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 82%);
    border-radius: var(--border-radius-m);
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-s);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary), transparent 88%);
    }
  }

  &__examples {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__error {
    color: var(--color-error);
  }

  &__response {
    max-height: 520px;
    overflow: auto;
    padding: var(--space);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-m);
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 4%);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-xs);
    white-space: pre-wrap;
  }

  &__two-column {
    align-items: start;
    margin-bottom: var(--space);

    h2 {
      margin-bottom: var(--space-s);
      font-size: var(--font-size-xl);
      line-height: 1.12;
    }

    p {
      color: color-mix(in srgb, var(--color-foreground), transparent 34%);
      line-height: 1.6;
    }
  }

  &__endpoints {
    display: grid;
    gap: var(--space);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      text-align: left;
      padding: var(--space-s);
      border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
      vertical-align: top;
    }

    th {
      font-size: var(--font-size-s);
      color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    }

    code {
      font-size: var(--font-size-s);
    }
  }

  &__limits {
    max-width: 900px;

    h2 {
      margin-bottom: var(--space-s);
      font-size: var(--font-size-xl);
    }

    p,
    li {
      color: color-mix(in srgb, var(--color-foreground), transparent 30%);
      line-height: 1.65;
    }

    ul {
      margin-top: var(--space);
      padding-left: 1.1rem;
    }
  }
}
</style>

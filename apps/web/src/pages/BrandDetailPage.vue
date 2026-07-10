<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loadBrandDetail, getCategoryLabel, type BrandDetail } from '../data/loader'

const route = useRoute()
const brand = ref<BrandDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedColor = ref<string | null>(null)

const svgModules = import.meta.glob('../../../../data/brands/*/assets/*.svg', { query: '?raw', import: 'default' })

async function loadBrand() {
  loading.value = true
  error.value = ''
  const id = route.params.id as string
  const detail = await loadBrandDetail(id)
  if (detail) {
    brand.value = detail
  } else {
    error.value = `Brand '${id}' not found`
  }
  loading.value = false
}

watch(() => route.params.id, loadBrand, { immediate: true })

const currentAssets = computed(() => brand.value?.assets.filter((a) => a.current) ?? [])
const historicalAssets = computed(() => brand.value?.assets.filter((a) => !a.current) ?? [])

async function getSvgContent(assetFile: string): Promise<string> {
  const brandId = brand.value?.id
  if (!brandId) return ''
  const fileName = assetFile.replace(/^assets\//, '')
  const key = `../../../../data/brands/${brandId}/assets/${fileName}`
  const loader = svgModules[key]
  if (loader) {
    const mod = await loader()
    return mod as string
  }
  return ''
}

const svgCache = ref<Record<string, string>>({})
watch(currentAssets, async (assets) => {
  for (const asset of assets) {
    const svg = await getSvgContent(asset.file)
    if (svg) svgCache.value[asset.id] = svg
  }
}, { immediate: true })

function copyColor(value: string) {
  navigator.clipboard.writeText(value)
  copiedColor.value = value
  setTimeout(() => { copiedColor.value = null }, 2000)
}

function addToCart(brandId: string) {
  const cart = JSON.parse(localStorage.getItem('ob-cart') ?? '[]') as string[]
  if (!cart.includes(brandId)) {
    cart.push(brandId)
    localStorage.setItem('ob-cart', JSON.stringify(cart))
    alert(`${brand.value?.name} added to cart`)
  } else {
    alert(`${brand.value?.name} is already in your cart`)
  }
}
</script>

<template>
  <div class="container brand-detail">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else-if="brand">
      <header class="brand-header">
        <div>
          <h1>{{ brand.name }}</h1>
          <p v-if="brand.aliases.length" class="aliases">{{ brand.aliases.join(', ') }}</p>
          <div class="brand-meta">
            <span class="badge">{{ brand.status }}</span>
            <span class="badge">{{ brand.review.status }}</span>
            <a v-for="domain in brand.domains" :key="domain" :href="`https://${domain}`" class="domain-link">{{ domain }}</a>
          </div>
        </div>
        <button class="btn btn--primary" @click="addToCart(brand.id)">Add to Cart</button>
      </header>

      <section v-if="currentAssets.length" class="section">
        <h2>Assets</h2>
        <div class="grid asset-grid">
          <div v-for="asset in currentAssets" :key="asset.id" class="card asset-card">
            <div class="asset-preview" v-html="svgCache[asset.id] ?? ''"></div>
            <div class="asset-info">
              <span class="asset-type">{{ asset.type }} / {{ asset.variant }}</span>
              <div class="asset-themes">
                <span v-for="t in asset.themes" :key="t" class="badge">{{ t }}</span>
              </div>
              <a
                v-if="brand"
                :href="`https://cdn.open-brands.org/current/brands/${brand.id}/${asset.file.replace('assets/', '')}`"
                class="btn"
              >
                Download SVG
              </a>
            </div>
          </div>
        </div>
      </section>

      <section v-if="brand.colors.length" class="section">
        <h2>Colors</h2>
        <div class="grid grid--colors">
          <div
            v-for="color in brand.colors"
            :key="color.id"
            class="card color-card"
            :style="{ background: color.value, color: color.formats.recommendedTextColor }"
            @click="copyColor(color.value)"
          >
            <span class="color-name">{{ color.name ?? color.id }}</span>
            <span class="color-value">{{ color.value.toUpperCase() }}</span>
            <div class="color-formats">
              <span>{{ color.formats.rgb }}</span>
              <span>{{ color.formats.hsl }}</span>
            </div>
            <span v-if="copiedColor === color.value" class="copied">Copied!</span>
          </div>
        </div>
      </section>

      <section v-if="brand.sources.length" class="section">
        <h2>Sources</h2>
        <div class="sources">
          <div v-for="source in brand.sources" :key="source.id" class="source-item card">
            <a :href="source.url" target="_blank" rel="noopener">{{ source.title }}</a>
            <span class="badge">{{ source.type }}</span>
            <span class="source-date">Accessed {{ source.accessedAt }}</span>
          </div>
        </div>
      </section>

      <section v-if="brand.categories.length || brand.tags.length" class="section">
        <h2>Categories & Tags</h2>
        <div class="tags-list">
          <RouterLink
            v-for="cat in brand.categories"
            :key="cat"
            :to="{ path: '/brands', query: { category: cat } }"
            class="badge"
          >
            {{ getCategoryLabel(cat) }}
          </RouterLink>
          <span v-for="tag in brand.tags" :key="tag" class="badge">{{ tag }}</span>
        </div>
      </section>

      <section class="section">
        <h2>Review Status</h2>
        <div class="card">
          <p><strong>Status:</strong> {{ brand.review.status }}</p>
          <p><strong>Method:</strong> {{ brand.review.method }}</p>
          <p v-if="brand.review.notes"><strong>Notes:</strong> {{ brand.review.notes }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.brand-detail { padding: 2rem 0 4rem; }
.loading, .error { padding: 4rem 0; text-align: center; color: var(--ob-text-muted); }
.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}
h1 { margin-bottom: 0.25rem; }
.aliases { color: var(--ob-text-muted); margin-bottom: 0.5rem; }
.brand-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.domain-link { font-size: 0.875rem; }
.section { margin-bottom: 2.5rem; }
h2 { font-size: 1.25rem; margin-bottom: 1rem; }
.asset-grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
.asset-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.asset-preview {
  background: var(--ob-bg);
  border-radius: var(--ob-radius);
  padding: 1rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  :deep(svg) { max-width: 100%; max-height: 80px; }
}
.asset-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.asset-type { font-weight: 600; font-size: 0.875rem; }
.asset-themes { display: flex; gap: 0.25rem; }
.color-card {
  cursor: pointer;
  position: relative;
  transition: transform 0.15s;
  &:hover { transform: scale(1.02); }
}
.color-name { display: block; font-weight: 600; margin-bottom: 0.25rem; }
.color-value { font-family: monospace; font-size: 0.875rem; }
.color-formats {
  display: flex;
  flex-direction: column;
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}
.copied {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.sources { display: flex; flex-direction: column; gap: 0.5rem; }
.source-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.source-date { font-size: 0.75rem; color: var(--ob-text-muted); margin-left: auto; }
.tags-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
</style>

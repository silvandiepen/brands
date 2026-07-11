<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCategoryLabel, type BrandDetail } from '../data/loader'
import { useBrandApi } from '../stores/api'
import { inkOn } from '../utils'

defineOptions({ name: 'BrandDetailPage' })

const route = useRoute()
const { fetchBrand, logoUrl } = useBrandApi()

const brand = ref<BrandDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedColor = ref<string | null>(null)

const primaryColor = ref('#ffffff')

async function load() {
  loading.value = true
  error.value = ''
  brand.value = null
  const id = route.params.id as string
  const data = await fetchBrand(id)
  if (data) {
    brand.value = data
    primaryColor.value = data.colors?.[0]?.value ?? '#ffffff'
  } else {
    error.value = `Brand '${id}' not found`
  }
  loading.value = false
}

watch(() => route.params.id, load, { immediate: true })

function copyColor(value: string) {
  navigator.clipboard.writeText(value)
  copiedColor.value = value
  setTimeout(() => { copiedColor.value = null }, 1500)
}

function addToCart(brandId: string) {
  const cart = JSON.parse(localStorage.getItem('ob-cart') ?? '[]') as string[]
  if (!cart.includes(brandId)) {
    cart.push(brandId)
    localStorage.setItem('ob-cart', JSON.stringify(cart))
  }
}
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <template v-else-if="brand">
    <div class="brand-hero" :style="{ background: primaryColor }">
      <div class="brand-hero-content" :style="{ color: inkOn(primaryColor) }">
        <img :src="logoUrl(brand.id, { theme: 'mono' })" :alt="brand.name" class="hero-logo" />
        <h1>{{ brand.name }}</h1>
        <div class="hero-meta">
          <span v-for="d in brand.domains" :key="d">{{ d }}</span>
          <span v-if="brand.qualityScore">Quality: {{ Math.round((brand.qualityScore ?? 0) * 100) }}%</span>
        </div>
      </div>
      <button class="cart-btn" @click="addToCart(brand.id)" :style="{ color: inkOn(primaryColor) }">+ Cart</button>
    </div>

    <div class="brand-body">
      <section v-if="brand.colors.length" class="section">
        <h2>Colors</h2>
        <div class="color-strip">
          <div v-for="c in brand.colors" :key="c.id" class="color-block"
            :style="{ background: c.value, color: inkOn(c.value) }"
            @click="copyColor(c.value)" :title="`Copy ${c.value}`">
            <span class="color-hex">{{ c.value.toUpperCase() }}</span>
            <span class="color-role">{{ c.role }}</span>
            <span v-if="copiedColor === c.value" class="copied">Copied!</span>
          </div>
        </div>
      </section>

      <section v-if="brand.assets.length" class="section">
        <h2>Assets</h2>
        <div class="asset-grid">
          <div v-for="a in brand.assets" :key="a.id" class="asset-card" :class="{ current: a.current }">
            <div class="asset-row">
              <div class="asset-bg light"><img :src="logoUrl(brand.id, { type: a.type })" :alt="a.type" loading="lazy" /></div>
              <div class="asset-bg mono-light"><img :src="logoUrl(brand.id, { type: a.type, theme: 'mono' })" :alt="a.type" loading="lazy" /></div>
              <div class="asset-bg mono-dark"><img :src="logoUrl(brand.id, { type: a.type, theme: 'mono' })" :alt="a.type" loading="lazy" /></div>
            </div>
            <div class="asset-label">{{ a.type }} / {{ a.variant }} <span v-if="a.current" class="badge">current</span></div>
          </div>
        </div>
      </section>

      <section v-if="brand.social?.length" class="section">
        <h2>Links</h2>
        <div class="social-links">
          <a v-for="s in brand.social" :key="s.url" :href="s.url" target="_blank" rel="noopener" class="social-link">{{ s.type }}</a>
        </div>
      </section>

      <section class="section">
        <h2>Quality</h2>
        <div class="quality-bar"><div class="quality-fill" :style="{ width: `${(brand.qualityScore ?? 0.5) * 100}%` }"></div></div>
        <div class="review-info"><span class="badge">{{ brand.review.status }}</span></div>
      </section>

      <section v-if="brand.categories.length" class="section">
        <h2>Categories</h2>
        <div class="cat-list">
          <RouterLink v-for="c in brand.categories" :key="c" :to="{ path: '/brands', query: { category: c } }" class="badge">{{ getCategoryLabel(c) }}</RouterLink>
        </div>
      </section>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.loading, .error { padding: 4rem; text-align: center; color: var(--ob-text-muted); }
.brand-hero { position: relative; padding: 3rem 2rem; border-radius: 0 0 24px 24px; }
.brand-hero-content { text-align: center; .hero-logo { width: 80px; height: 80px; margin-bottom: 1rem; } h1 { font-size: 2rem; } }
.hero-meta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; font-size: 0.875rem; opacity: 0.8; }
.cart-btn { position: absolute; top: 1.5rem; right: 1.5rem; padding: 0.5rem 1rem; border: 1px solid; border-radius: 8px; background: transparent; cursor: pointer; font-size: 0.875rem; }
.brand-body { padding: 2rem; max-width: 900px; margin: 0 auto; }
.section { margin-bottom: 2.5rem; }
h2 { font-size: 1.1rem; margin-bottom: 1rem; }
.color-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.color-block { border-radius: 12px; padding: 1.5rem 1rem; cursor: pointer; position: relative; transition: transform 0.1s; &:hover { transform: scale(1.03); } }
.color-hex { font-family: monospace; font-size: 0.875rem; display: block; }
.color-role { font-size: 0.7rem; opacity: 0.7; }
.copied { position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.7rem; font-weight: 700; }
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.asset-card { border: 1px solid var(--ob-border); border-radius: 12px; overflow: hidden; &.current { border-color: var(--ob-primary); border-width: 2px; } }
.asset-row { display: flex; }
.asset-bg { flex: 1; display: flex; align-items: center; justify-content: center; padding: 1.5rem; min-height: 80px; img { max-width: 60px; max-height: 60px; object-fit: contain; } }
.asset-bg.light { background: #fff; }
.asset-bg.mono-light { background: #fff; filter: brightness(0); }
.asset-bg.mono-dark { background: #1a1a2e; filter: invert(1) brightness(2); }
.asset-label { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.75rem; }
.social-links { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.social-link { padding: 0.5rem 1rem; border: 1px solid var(--ob-border); border-radius: 8px; font-size: 0.85rem; color: var(--ob-text); &:hover { border-color: var(--ob-primary); text-decoration: none; } }
.quality-bar { height: 8px; background: var(--ob-bg-alt); border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; }
.quality-fill { height: 100%; background: var(--ob-primary); border-radius: 4px; }
.review-info { display: flex; gap: 0.5rem; }
.cat-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; background: var(--ob-bg-alt); border: 1px solid var(--ob-border); }
</style>

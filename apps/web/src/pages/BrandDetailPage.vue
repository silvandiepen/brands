<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { loadBrandDetail, getCategoryLabel, type BrandDetail } from '../data/loader'
import allSvgs from '../../../../packages/data/generated/all-svgs.json'
import allMonoSvgs from '../../../../packages/data/generated/all-mono-svgs.json'

const route = useRoute()
const brand = ref<BrandDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedColor = ref<string | null>(null)

const svgs = allSvgs as Record<string, string>
const monoSvgs = allMonoSvgs as Record<string, string>

function getSvg(brandId: string, assetId: string): string {
  return svgs[`${brandId}/${assetId}`] ?? ''
}

function getMonoSvg(brandId: string, assetId: string): string {
  return monoSvgs[`${brandId}/${assetId}`] ?? ''
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function inkColor(hex: string): string {
  return luminance(hex) > 0.4 ? '#000' : '#fff'
}

async function loadBrand() {
  loading.value = true
  error.value = ''
  const id = route.params.id as string
  const detail = await loadBrandDetail(id)
  if (detail) brand.value = detail
  else error.value = `Brand '${id}' not found`
  loading.value = false
}

watch(() => route.params.id, loadBrand, { immediate: true })

const primaryColor = computed(() => brand.value?.colors?.[0]?.value ?? '#ffffff')

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

const socialIcons: Record<string, string> = {
  twitter: '𝕏', github: 'GH', linkedin: 'in', instagram: 'IG', youtube: 'YT', facebook: 'FB', tiktok: 'TT', discord: 'DC', website: '🔗',
}
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <template v-else-if="brand">
    <!-- Hero with brand color background + logo -->
    <div class="brand-hero" :style="{ background: primaryColor }">
      <div class="brand-hero-content" :style="{ color: inkColor(primaryColor) }">
        <div class="hero-logo" :style="{ color: inkColor(primaryColor) }" v-html="getMonoSvg(brand.id, brand.assets.find(a => a.current)?.id ?? brand.assets[0]?.id ?? '')"></div>
        <h1>{{ brand.name }}</h1>
        <div class="hero-meta">
          <span v-for="domain in brand.domains" :key="domain" class="hero-domain">{{ domain }}</span>
          <span v-if="brand.qualityScore" class="hero-quality">Quality: {{ Math.round((brand.qualityScore ?? 0) * 100) }}%</span>
        </div>
      </div>
      <button class="cart-btn" @click="addToCart(brand.id)" :style="{ color: inkColor(primaryColor), borderColor: inkColor(primaryColor) + '40' }">+ Cart</button>
    </div>

    <div class="brand-body">
      <!-- Colors -->
      <section v-if="brand.colors.length" class="section">
        <h2>Colors</h2>
        <div class="color-strip">
          <div
            v-for="color in brand.colors"
            :key="color.id"
            class="color-block"
            :style="{ background: color.value, color: inkColor(color.value) }"
            @click="copyColor(color.value)"
            :title="`Copy ${color.value}`"
          >
            <span class="color-hex">{{ color.value.toUpperCase() }}</span>
            <span class="color-role">{{ color.role }}</span>
            <span v-if="copiedColor === color.value" class="copied">Copied!</span>
          </div>
        </div>
      </section>

      <!-- All logos -->
      <section v-if="brand.assets.length" class="section">
        <h2>Assets ({{ brand.assets.length }})</h2>
        <div class="asset-grid">
          <div v-for="asset in brand.assets" :key="asset.id" class="asset-card" :class="{ current: asset.current }">
            <div class="asset-preview light" v-html="getSvg(brand.id, asset.id)"></div>
            <div class="asset-preview mono-light" :style="{ color: '#000' }" v-html="getMonoSvg(brand.id, asset.id)"></div>
            <div class="asset-preview mono-dark" :style="{ color: '#fff' }" v-html="getMonoSvg(brand.id, asset.id)"></div>
            <div class="asset-label">
              <span>{{ asset.type }}</span>
              <span class="asset-variant">{{ asset.variant }}</span>
              <span v-if="asset.current" class="current-badge">current</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Social links -->
      <section v-if="brand.social?.length" class="section">
        <h2>Links</h2>
        <div class="social-links">
          <a v-for="link in brand.social" :key="link.url" :href="link.url" target="_blank" rel="noopener" class="social-link">
            <span class="social-icon">{{ socialIcons[link.type] ?? '🔗' }}</span>
            <span>{{ link.type }}</span>
          </a>
        </div>
      </section>

      <!-- Sources -->
      <section v-if="brand.sources?.length" class="section">
        <h2>Sources</h2>
        <div class="source-list">
          <a v-for="source in brand.sources" :key="source.id" :href="source.url" target="_blank" rel="noopener" class="source-link">
            <span class="source-title">{{ source.title }}</span>
            <span class="source-type badge">{{ source.type }}</span>
          </a>
        </div>
      </section>

      <!-- Review + quality -->
      <section class="section">
        <h2>Quality &amp; Review</h2>
        <div class="quality-bar">
          <div class="quality-fill" :style="{ width: `${(brand.qualityScore ?? 0.5) * 100}%` }"></div>
        </div>
        <div class="review-info">
          <span class="badge">{{ brand.review.status }}</span>
          <span class="badge">{{ brand.review.method }}</span>
        </div>
      </section>

      <!-- Categories -->
      <section v-if="brand.categories.length" class="section">
        <h2>Categories</h2>
        <div class="cat-list">
          <RouterLink v-for="cat in brand.categories" :key="cat" :to="{ path: '/brands', query: { category: cat } }" class="badge">{{ getCategoryLabel(cat) }}</RouterLink>
        </div>
      </section>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.loading, .error { padding: 4rem; text-align: center; color: var(--ob-text-muted); }

.brand-hero {
  position: relative;
  padding: 3rem 2rem;
  border-radius: 0 0 24px 24px;
}
.brand-hero-content {
  text-align: center;
  .hero-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
    :deep(svg) { width: 80px; height: 80px; }
  }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
}
.hero-meta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 0.875rem;
  opacity: 0.8;
}
.cart-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  &:hover { background: rgba(0,0,0,0.05); }
}

.brand-body { padding: 2rem; max-width: 900px; margin: 0 auto; }
.section { margin-bottom: 2.5rem; }
h2 { font-size: 1.1rem; margin-bottom: 1rem; font-weight: 600; }

.color-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.color-block {
  border-radius: 12px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;
  &:hover { transform: scale(1.03); }
}
.color-hex { font-family: monospace; font-size: 0.875rem; display: block; }
.color-role { font-size: 0.7rem; opacity: 0.7; }
.copied { position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.7rem; font-weight: 700; }

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.asset-card {
  border: 1px solid var(--ob-border);
  border-radius: 12px;
  overflow: hidden;
  &.current { border-color: var(--ob-primary); border-width: 2px; }
}
.asset-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  min-height: 80px;
  :deep(svg) { max-width: 100%; max-height: 60px; }
  &.light { background: #fff; }
  &.mono-light { background: #fff; }
  &.mono-dark { background: #1a1a2e; }
}
.asset-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}
.asset-variant { color: var(--ob-text-muted); }
.current-badge {
  margin-left: auto;
  background: var(--ob-primary);
  color: #fff;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
}

.social-links { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.social-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--ob-border);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--ob-text);
  &:hover { border-color: var(--ob-primary); text-decoration: none; }
}
.social-icon { font-weight: 700; font-size: 0.8rem; }

.source-list { display: flex; flex-direction: column; gap: 0.5rem; }
.source-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ob-border);
  border-radius: 8px;
  color: var(--ob-text);
  &:hover { border-color: var(--ob-primary); text-decoration: none; }
}
.source-title { flex: 1; }

.quality-bar {
  height: 8px;
  background: var(--ob-bg-alt);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.quality-fill { height: 100%; background: var(--ob-primary); border-radius: 4px; transition: width 0.3s; }
.review-info { display: flex; gap: 0.5rem; }

.cat-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--ob-bg-alt);
  border: 1px solid var(--ob-border);
  color: var(--ob-text);
}
</style>

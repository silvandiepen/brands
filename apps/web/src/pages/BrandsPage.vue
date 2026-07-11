<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allBrands } from '../data/loader'
import allSvgs from '../../../../packages/data/generated/all-svgs.json'
import allBrandsData from '../../../../packages/data/generated/all-brands.json'

const route = useRoute()
const router = useRouter()
const svgs = allSvgs as Record<string, string>

const brandColorMap = {} as Record<string, string[]>
for (const b of allBrandsData as Array<{ id: string; colors: Array<{ value: string }> }>) {
  brandColorMap[b.id] = (b.colors || []).map(c => c.value)
}

const searchQuery = ref((route.query.q as string) ?? '')
const selectedCategory = ref((route.query.category as string) ?? '')

watch(() => route.query, (q) => {
  searchQuery.value = (q.q as string) ?? ''
  selectedCategory.value = (q.category as string) ?? ''
}, { immediate: true })

function getLogo(brandId: string): string {
  return svgs[`${brandId}/symbol`] ?? svgs[`${brandId}/icon`] ?? svgs[`${brandId}/wordmark`] ?? ''
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

function inkColor(brandId: string): string {
  const bg = brandColorMap[brandId]?.[0]
  if (!bg) return '#000'
  return luminance(bg) > 0.4 ? '#000' : '#fff'
}

function brandBg(brandId: string): string {
  return brandColorMap[brandId]?.[0] ?? '#ffffff'
}

function recolorSvg(svg: string, color: string): string {
  if (!svg) return ''
  return svg.replace(/fill\s*=\s*"(?!none|url\()[^"]*"/gi, `fill="${color}"`)
}

const filtered = computed(() => {
  let result = allBrands
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((b) =>
      b.name.toLowerCase().includes(q) || b.id.includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q)) || b.domains.some((d) => d.includes(q)),
    )
  }
  if (selectedCategory.value) {
    result = result.filter((b) => b.categories.includes(selectedCategory.value))
  }
  return result
})

const visibleCount = ref(48)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function loadMore() {
  if (visibleCount.value < filtered.value.length) {
    visibleCount.value = Math.min(visibleCount.value + 48, filtered.value.length)
  }
}

watch(filtered, () => { visibleCount.value = 48 })

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadMore()
  }, { rootMargin: '300px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())

function updateUrl() {
  router.replace({
    path: '/brands',
    query: {
      ...(searchQuery.value ? { q: searchQuery.value } : {}),
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
    },
  })
}
</script>

<template>
  <div class="container brands-page">
    <div class="controls">
      <input v-model="searchQuery" @input="updateUrl" type="search" class="search-input" placeholder="Search..." aria-label="Search" />
      <select v-model="selectedCategory" @change="updateUrl" class="filter-select" aria-label="Category">
        <option value="">All</option>
        <option value="technology">Technology</option>
        <option value="finance">Finance</option>
        <option value="retail">Retail</option>
        <option value="media-entertainment">Media</option>
        <option value="automotive">Automotive</option>
        <option value="healthcare">Healthcare</option>
        <option value="consumer-goods">Consumer Goods</option>
      </select>
      <span class="count">{{ filtered.length }}</span>
    </div>

    <div class="logo-wall">
      <RouterLink
        v-for="brand in filtered.slice(0, visibleCount)"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="logo-tile"
        :style="{ background: brandBg(brand.id) }"
        :title="brand.name"
      >
        <span class="logo-svg" v-html="recolorSvg(getLogo(brand.id), inkColor(brand.id))"></span>
      </RouterLink>
    </div>

    <div ref="sentinel" class="sentinel">
      <span v-if="visibleCount < filtered.length">Loading more...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.brands-page { padding: 1rem 0 4rem; }
.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.count { color: var(--ob-text-muted); font-size: 0.85rem; }
.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--ob-border);
  border-radius: 8px;
  background: var(--ob-bg);
  color: var(--ob-text);
}
.logo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.logo-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: scale(1.04);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 1;
  }
}
.logo-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  :deep(svg) { max-width: 100%; max-height: 100%; }
}
.sentinel { text-align: center; padding: 2rem; color: var(--ob-text-muted); font-size: 0.875rem; }
</style>

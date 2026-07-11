<script setup lang="ts">
defineOptions({ name: 'BrandsPage' })
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allBrands, categories } from '../data/loader'
import allMonoSvgs from '../../../../packages/data/generated/all-mono-svgs.json'
import allBrandsData from '../../../../packages/data/generated/all-brands.json'
import { inkOn } from '../utils'

const route = useRoute()
const router = useRouter()
const svgs = allMonoSvgs as Record<string, string>

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

const topLevelCategories = categories.categories.filter(c => c.parentId === null)

function getLogo(brandId: string): string {
  return svgs[`${brandId}/icon`] ?? svgs[`${brandId}/symbol`] ?? svgs[`${brandId}/wordmark`] ?? ''
}
function brandBg(brandId: string): string {
  return brandColorMap[brandId]?.[0] ?? '#f5f5f5'
}

const filtered = computed(() => {
  let result = allBrands
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b =>
      b.name.toLowerCase().includes(q) || b.id.includes(q) ||
      b.aliases.some(a => a.toLowerCase().includes(q)) || b.domains.some(d => d.includes(q)),
    )
  }
  if (selectedCategory.value) result = result.filter(b => b.categories.includes(selectedCategory.value))
  return result
})

const visibleCount = ref(48)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
function loadMore() {
  if (visibleCount.value < filtered.value.length)
    visibleCount.value = Math.min(visibleCount.value + 48, filtered.value.length)
}
watch(filtered, () => { visibleCount.value = 48 })
onMounted(() => {
  observer = new IntersectionObserver(e => { if (e[0]?.isIntersecting) loadMore() }, { rootMargin: '300px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())

function updateUrl() {
  router.replace({ path: '/brands', query: {
    ...(searchQuery.value ? { q: searchQuery.value } : {}),
    ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
  } })
}
</script>

<template>
  <div class="container brands-page">
    <div class="controls">
      <input v-model="searchQuery" @input="updateUrl" type="search" class="search-input" placeholder="Search..." />
      <select v-model="selectedCategory" @change="updateUrl" class="filter-select">
        <option value="">All</option>
        <option v-for="cat in topLevelCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
      </select>
      <span class="count">{{ filtered.length }}</span>
    </div>

    <div class="logo-wall">
      <RouterLink
        v-for="brand in filtered.slice(0, visibleCount)"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="logo-tile"
        :style="{ background: brandBg(brand.id), '--ink': inkOn(brandBg(brand.id)) }"
        :title="brand.name"
      >
        <span class="logo-svg" v-html="getLogo(brand.id)"></span>
        <span class="logo-name">{{ brand.name }}</span>
      </RouterLink>
    </div>

    <div ref="sentinel" class="sentinel">
      <span v-if="visibleCount < filtered.length">Loading...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.brands-page { padding: 1rem 0 4rem; }
.controls { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; flex-wrap: wrap; }
.count { color: var(--ob-text-muted); font-size: 0.85rem; }
.filter-select { padding: 0.5rem; border: 1px solid var(--ob-border); border-radius: 8px; background: var(--ob-bg); color: var(--ob-text); }
.logo-wall { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px; }
.logo-tile {
  aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 1.5rem; border-radius: 12px; overflow: hidden; transition: transform 0.15s;
  &:hover { transform: scale(1.05); z-index: 1; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
}
.logo-svg {
  flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;
  color: var(--ink, #000);
  :deep(svg) { max-width: 100%; max-height: 60px; }
}
.logo-name { font-size: 0.7rem; font-weight: 600; color: var(--ink, #000); opacity: 0.8; }
.sentinel { text-align: center; padding: 2rem; color: var(--ob-text-muted); }
</style>

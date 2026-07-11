<script setup lang="ts">
defineOptions({ name: 'HomePage' })
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { allBrands, releaseManifest, categories } from '../data/loader'
import allBrandsData from '../../../../packages/data/generated/all-brands.json'
import { inkOn, shuffle } from '../utils'

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref('')
const svgData = ref<Record<string, string>>({})
const svgsLoading = ref(true)

const brandColorMap = {} as Record<string, string[]>
for (const b of allBrandsData as Array<{ id: string; colors: Array<{ value: string }> }>) {
  brandColorMap[b.id] = (b.colors || []).map(c => c.value)
}

const topLevelCategories = categories.categories.filter(c => c.parentId === null)

onMounted(async () => {
  try {
    const mod = await import('../../../../packages/data/generated/all-mono-svgs.json')
    svgData.value = (mod as { default: Record<string, string> }).default
  } catch { /* noop */ }
  svgsLoading.value = false
})

function getLogo(brandId: string): string {
  return svgData.value[`${brandId}/icon`] ?? svgData.value[`${brandId}/symbol`] ?? svgData.value[`${brandId}/wordmark`] ?? ''
}

function brandBg(brandId: string): string {
  return brandColorMap[brandId]?.[0] ?? '#f5f5f5'
}

const displayBrands = ref<typeof allBrands>([])
function reshuffle() {
  let brands = allBrands
  if (selectedCategory.value) brands = brands.filter(b => b.categories.includes(selectedCategory.value))
  displayBrands.value = shuffle(brands)
}
onMounted(reshuffle)
watch(selectedCategory, reshuffle)

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return displayBrands.value
  const q = searchQuery.value.toLowerCase()
  return displayBrands.value.filter(b =>
    b.name.toLowerCase().includes(q) || b.id.includes(q) ||
    b.aliases.some(a => a.toLowerCase().includes(q)),
  )
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
  observer = new IntersectionObserver(entries => {
    if (entries[0]?.isIntersecting) loadMore()
  }, { rootMargin: '300px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())

function submitSearch() {
  if (searchQuery.value.trim())
    router.push({ path: '/brands', query: { q: searchQuery.value } })
}
</script>

<template>
  <div class="container home">
    <section class="hero">
      <h1>Open Brands</h1>
      <p class="hero-tagline">{{ releaseManifest.brandCount }} brand logos &amp; colors</p>
      <form @submit.prevent="submitSearch" class="search-form">
        <input v-model="searchQuery" type="search" class="search-input" placeholder="Search brands..." aria-label="Search" />
      </form>
      <div class="category-pills">
        <button
          v-for="cat in topLevelCategories"
          :key="cat.id"
          class="pill"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = selectedCategory === cat.id ? '' : cat.id"
        >{{ cat.label }}</button>
      </div>
    </section>

    <div class="logo-wall">
      <RouterLink
        v-for="brand in filtered.slice(0, visibleCount)"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="logo-tile"
        :style="{ background: brandBg(brand.id), '--ink': inkOn(brandBg(brand.id)) }"
        :title="brand.name"
      >
        <span v-if="svgsLoading" class="logo-placeholder"></span>
        <span v-else class="logo-svg" v-html="getLogo(brand.id)"></span>
        <span class="logo-name">{{ brand.name }}</span>
      </RouterLink>
    </div>

    <div ref="sentinel" class="sentinel">
      <span v-if="visibleCount < filtered.length">Loading more...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home { padding: 1rem 0 4rem; }
.hero { text-align: center; padding: 2rem 0 1.5rem; h1 { font-size: 2.5rem; } }
.hero-tagline { font-size: 1.1rem; color: var(--ob-text-muted); margin-bottom: 1rem; }
.search-form { max-width: 500px; margin: 0 auto 1rem; }
.category-pills { display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap; }
.pill {
  padding: 0.3rem 0.8rem; border: 1px solid var(--ob-border); border-radius: 999px;
  background: var(--ob-bg); color: var(--ob-text-muted); cursor: pointer; font-size: 0.8rem;
  transition: all 0.15s;
  &:hover { border-color: var(--ob-primary); color: var(--ob-primary); }
  &.active { background: var(--ob-primary); color: #fff; border-color: var(--ob-primary); }
}
.logo-wall { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px; }
.logo-tile {
  aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 1.5rem; border-radius: 12px; overflow: hidden; transition: transform 0.15s;
  &:hover { transform: scale(1.05); z-index: 1; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
}
.logo-svg, .logo-placeholder {
  flex: 1; display: flex; align-items: center; justify-content: center; width: 100%;
  color: var(--ink, #000);
}
.logo-placeholder { opacity: 0.2; }
.logo-svg { :deep(svg) { max-width: 100%; max-height: 60px; } }
.logo-name {
  font-size: 0.7rem; font-weight: 600; color: var(--ink, #000); opacity: 0.8;
  text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%;
}
.sentinel { text-align: center; padding: 2rem; color: var(--ob-text-muted); }
</style>

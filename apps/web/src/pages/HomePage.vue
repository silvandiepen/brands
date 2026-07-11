<script setup lang="ts">
defineOptions({ name: 'HomePage' })
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { allBrands, releaseManifest, categories, brandIndex } from '../data/loader'
import { inkOn, shuffle } from '../utils'
import LogoInline from '../components/LogoInline.vue'

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref('')

const topLevelCategories = categories.categories.filter(c => c.parentId === null)

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

const displayBrands = ref<typeof allBrands>([])
function reshuffle() {
  let brands = allBrands.filter(b => b.assetCount > 0)
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
      >
        <LogoInline :brand-id="brand.id" :alt="brand.name" class="logo-svg" />
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
  &:hover { border-color: var(--ob-primary); color: var(--ob-primary); }
  &.active { background: var(--ob-primary); color: #fff; border-color: var(--ob-primary); }
}
.logo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.logo-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: scale(1.05);
    z-index: 1;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
}
.logo-svg {
  width: 50%;
  height: 50%;
  color: var(--ink, #000);
}
.logo-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink, #000);
  background: linear-gradient(transparent, rgba(0,0,0,0.1));
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.logo-tile:hover .logo-name { opacity: 0.9; }
.sentinel { text-align: center; padding: 2rem; color: var(--ob-text-muted); }
</style>

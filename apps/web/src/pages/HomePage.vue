<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { allBrands, releaseManifest } from '../data/loader'
import allSvgs from '../../../../packages/data/generated/all-svgs.json'

const router = useRouter()
const searchQuery = ref('')

const svgs = allSvgs as Record<string, string>

function getLogo(brandId: string): string {
  const symbolKey = `${brandId}/symbol`
  const iconKey = `${brandId}/icon`
  const wordmarkKey = `${brandId}/wordmark`
  return svgs[symbolKey] ?? svgs[iconKey] ?? svgs[wordmarkKey] ?? ''
}

function bgColor(brand: { hasColors: boolean }): string {
  return 'transparent'
}

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return allBrands
  const q = searchQuery.value.toLowerCase()
  return allBrands.filter((b) =>
    b.name.toLowerCase().includes(q) ||
    b.id.includes(q) ||
    b.aliases.some((a) => a.toLowerCase().includes(q)),
  )
})

const visibleBrands = computed(() => filtered.value.slice(0, 60))

function submitSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/brands', query: { q: searchQuery.value } })
  }
}
</script>

<template>
  <div class="container home">
    <section class="hero">
      <h1>Open Brands</h1>
      <p class="hero-tagline">{{ releaseManifest.brandCount }} brand logos, colors, and metadata.</p>
      <form @submit.prevent="submitSearch" class="search-form">
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search brands..."
          aria-label="Search brands"
        />
      </form>
    </section>

    <div class="logo-wall">
      <RouterLink
        v-for="brand in visibleBrands"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="logo-tile"
        :title="brand.name"
      >
        <span class="logo-svg" v-html="getLogo(brand.id)"></span>
      </RouterLink>
    </div>

    <div v-if="visibleBrands.length < filtered.length" class="show-more">
      <button class="btn btn--primary" @click="() => { }">
        Showing 60 of {{ filtered.length }} — <RouterLink to="/brands">view all</RouterLink>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home { padding: 1rem 0 4rem; }
.hero {
  text-align: center;
  padding: 2rem 0 2rem;
  h1 { font-size: 2.5rem; margin-bottom: 0.25rem; }
}
.hero-tagline { font-size: 1.1rem; color: var(--ob-text-muted); margin-bottom: 1.5rem; }
.search-form {
  max-width: 500px;
  margin: 0 auto 2rem;
}
.logo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 1px;
  background: var(--ob-border);
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  overflow: hidden;
}
.logo-tile {
  background: var(--ob-bg-alt);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  transition: background 0.15s, transform 0.1s;
  &:hover {
    background: var(--ob-bg);
    transform: scale(1.03);
    z-index: 1;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
}
.logo-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  :deep(svg) {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
}
.show-more {
  text-align: center;
  margin-top: 1.5rem;
  a { color: var(--ob-primary); }
}
</style>

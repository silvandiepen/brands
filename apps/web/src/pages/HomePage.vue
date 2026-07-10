<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { searchBrandsLocal, allBrands, categories, releaseManifest, getCategoryLabel } from '../data/loader'

const router = useRouter()
const searchQuery = ref('')

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  return searchBrandsLocal(searchQuery.value, 8)
})

function submitSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/brands', query: { q: searchQuery.value } })
  }
}

const featuredCategories = categories.categories.filter((c) => c.parentId === null).slice(0, 6)
</script>

<template>
  <div class="container home">
    <section class="hero">
      <h1>Open Brands</h1>
      <p class="hero-tagline">Reviewed brand logos, colors, metadata, and sources.</p>
      <form @submit.prevent="submitSearch" class="search-form">
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search brands, domains, or aliases..."
          aria-label="Search brands"
        />
        <button type="submit" class="btn btn--primary">Search</button>
      </form>
      <div v-if="searchResults.length" class="search-preview">
        <RouterLink
          v-for="brand in searchResults"
          :key="brand.id"
          :to="`/brands/${brand.id}`"
          class="search-result-item"
        >
          <span class="brand-name">{{ brand.name }}</span>
          <span v-if="brand.domains.length" class="brand-domain">{{ brand.domains[0] }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="stats">
      <div class="card stat">
        <span class="stat-value">{{ releaseManifest.brandCount }}</span>
        <span class="stat-label">Brands</span>
      </div>
      <div class="card stat">
        <span class="stat-value">{{ releaseManifest.assetCount }}</span>
        <span class="stat-label">Assets</span>
      </div>
      <div class="card stat">
        <span class="stat-value">{{ categories.categories.length }}</span>
        <span class="stat-label">Categories</span>
      </div>
    </section>

    <section>
      <h2>Browse by category</h2>
      <div class="grid grid--brands">
        <RouterLink
          v-for="cat in featuredCategories"
          :key="cat.id"
          :to="{ path: '/brands', query: { category: cat.id } }"
          class="card category-card"
        >
          <span class="category-label">{{ cat.label }}</span>
          <span class="category-count">{{ allBrands.filter((b) => b.categories.includes(cat.id)).length }} brands</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home { padding: 2rem 0 4rem; }
.hero {
  text-align: center;
  padding: 4rem 0 3rem;
  h1 { font-size: 3rem; margin-bottom: 0.5rem; }
}
.hero-tagline { font-size: 1.25rem; color: var(--ob-text-muted); margin-bottom: 2rem; }
.search-form {
  display: flex;
  gap: 0.5rem;
  max-width: 600px;
  margin: 0 auto;
}
.search-preview {
  max-width: 600px;
  margin: 1rem auto 0;
  text-align: left;
}
.search-result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  margin-bottom: 0.5rem;
  color: var(--ob-text);
  &:hover { background: var(--ob-bg-alt); text-decoration: none; }
}
.brand-domain { color: var(--ob-text-muted); font-size: 0.875rem; }
.stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0 3rem;
}
.stat {
  text-align: center;
  min-width: 120px;
  &-value { display: block; font-size: 2rem; font-weight: 700; color: var(--ob-primary); }
  &-label { font-size: 0.875rem; color: var(--ob-text-muted); }
}
.category-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--ob-text);
  &:hover { border-color: var(--ob-primary); text-decoration: none; }
}
.category-label { font-weight: 600; }
.category-count { font-size: 0.75rem; color: var(--ob-text-muted); }
h2 { margin-bottom: 1rem; font-size: 1.5rem; }
</style>

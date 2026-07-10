<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allBrands, categories, getCategoryLabel, type CompactBrand } from '../data/loader'

const route = useRoute()
const router = useRouter()

const searchQuery = ref((route.query.q as string) ?? '')
const selectedCategory = ref((route.query.category as string) ?? '')
const sortBy = ref((route.query.sort as string) ?? 'name')

watch(() => route.query, (q) => {
  searchQuery.value = (q.q as string) ?? ''
  selectedCategory.value = (q.category as string) ?? ''
}, { immediate: true })

const filteredBrands = computed(() => {
  let result: CompactBrand[] = [...allBrands]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.id.includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q)) ||
      b.domains.some((d) => d.toLowerCase().includes(q)) ||
      b.tags.some((t) => t.includes(q)),
    )
  }

  if (selectedCategory.value) {
    result = result.filter((b) => b.categories.includes(selectedCategory.value))
  }

  if (sortBy.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sortBy.value === 'id') result.sort((a, b) => a.id.localeCompare(b.id))

  return result
})

const topLevelCategories = categories.categories.filter((c) => c.parentId === null)

function updateUrl() {
  router.replace({
    path: '/brands',
    query: {
      ...(searchQuery.value ? { q: searchQuery.value } : {}),
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
      ...(sortBy.value !== 'name' ? { sort: sortBy.value } : {}),
    },
  })
}
</script>

<template>
  <div class="container brands-page">
    <h1>Browse Brands</h1>

    <div class="filters">
      <input
        v-model="searchQuery"
        @input="updateUrl"
        type="search"
        class="search-input"
        placeholder="Filter brands..."
        aria-label="Filter brands"
      />
      <select v-model="selectedCategory" @change="updateUrl" class="filter-select" aria-label="Filter by category">
        <option value="">All categories</option>
        <option v-for="cat in topLevelCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
      </select>
      <select v-model="sortBy" @change="updateUrl" class="filter-select" aria-label="Sort">
        <option value="name">Sort by name</option>
        <option value="id">Sort by ID</option>
      </select>
    </div>

    <p class="result-count">{{ filteredBrands.length }} brand(s)</p>

    <div class="grid grid--brands">
      <RouterLink
        v-for="brand in filteredBrands"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="card brand-card"
      >
        <div class="brand-card-header">
          <span class="brand-card-name">{{ brand.name }}</span>
          <span v-if="brand.status !== 'active'" class="badge">{{ brand.status }}</span>
        </div>
        <div v-if="brand.domains.length" class="brand-card-domain">{{ brand.domains[0] }}</div>
        <div class="brand-card-tags">
          <span v-for="cat in brand.categories.slice(0, 3)" :key="cat" class="badge">{{ getCategoryLabel(cat) }}</span>
        </div>
        <div class="brand-card-meta">
          <span>{{ brand.assetCount }} asset{{ brand.assetCount !== 1 ? 's' : '' }}</span>
          <span v-if="brand.hasColors">colors</span>
        </div>
      </RouterLink>
    </div>

    <div v-if="filteredBrands.length === 0" class="empty-state">
      <p>No brands found. Try adjusting your filters.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.brands-page { padding: 2rem 0 4rem; }
h1 { margin-bottom: 1.5rem; }
.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  color: var(--ob-text);
}
.result-count { color: var(--ob-text-muted); margin-bottom: 1rem; font-size: 0.875rem; }
.brand-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--ob-text);
  &:hover { border-color: var(--ob-primary); text-decoration: none; }
}
.brand-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand-card-name { font-weight: 600; font-size: 1.1rem; }
.brand-card-domain { font-size: 0.8rem; color: var(--ob-text-muted); }
.brand-card-tags { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.brand-card-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--ob-text-muted);
}
.empty-state { text-align: center; padding: 4rem 0; color: var(--ob-text-muted); }
</style>

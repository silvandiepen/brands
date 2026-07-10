<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allBrands } from '../data/loader'
import allSvgs from '../../../../packages/data/generated/all-svgs.json'

const route = useRoute()
const router = useRouter()
const svgs = allSvgs as Record<string, string>

const searchQuery = ref((route.query.q as string) ?? '')
const selectedCategory = ref((route.query.category as string) ?? '')

watch(() => route.query, (q) => {
  searchQuery.value = (q.q as string) ?? ''
  selectedCategory.value = (q.category as string) ?? ''
}, { immediate: true })

function getLogo(brandId: string): string {
  return svgs[`${brandId}/symbol`] ?? svgs[`${brandId}/icon`] ?? svgs[`${brandId}/wordmark`] ?? ''
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
        v-for="brand in filtered"
        :key="brand.id"
        :to="`/brands/${brand.id}`"
        class="logo-tile"
        :title="brand.name"
      >
        <span class="logo-svg" v-html="getLogo(brand.id)"></span>
      </RouterLink>
    </div>

    <div v-if="filtered.length === 0" class="empty">No brands found.</div>
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
.count {
  color: var(--ob-text-muted);
  font-size: 0.85rem;
}
.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  color: var(--ob-text);
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
  :deep(svg) { max-width: 100%; max-height: 100%; }
}
.empty { text-align: center; padding: 3rem; color: var(--ob-text-muted); }
</style>

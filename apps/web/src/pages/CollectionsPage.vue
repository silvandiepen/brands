<script setup lang="ts">
import { computed } from 'vue'
import { collectionsIndex, brandIndex } from '../data/loader'
import { inkOn } from '../utils'

const API = 'https://open-brands-api.vandipyan.workers.dev'
function brandBg(brandId: string): string { return brandIndex[brandId]?.primaryColor ?? '#f5f5f5' }
function logoUrl(brandId: string): string { return `${API}/logo/${brandId}.svg` }

const collections = computed(() => Object.values(collectionsIndex))
</script>

<template>
  <div class="container collections-page">
    <h1>Collections</h1>
    <div class="collection-list">
      <div v-for="col in collections" :key="col.id" class="collection-card">
        <RouterLink :to="{ path: '/brands', query: { category: col.brandIds[0] } }" class="collection-name">
          <h2>{{ col.name }}</h2>
          <span class="collection-count">{{ col.brandIds.length }} brands</span>
        </RouterLink>
        <div class="collection-logos">
          <RouterLink
            v-for="id in col.brandIds.slice(0, 12)" :key="id"
            :to="`/brands/${id}`" class="mini-tile"
            :style="{ background: brandBg(id), '--ink': inkOn(brandBg(id)) }"
            :title="brandIndex[id]?.name ?? id"
          >
            <img :src="logoUrl(id)" :alt="brandIndex[id]?.name ?? id" class="mini-img" loading="lazy" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.collections-page { padding: 1rem 0 4rem; }
h1 { margin-bottom: 1.5rem; }
.collection-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
.collection-card { border: 1px solid var(--ob-border); border-radius: 16px; overflow: hidden; }
.collection-name {
  display: flex; align-items: baseline; gap: 0.75rem; padding: 1rem 1.25rem;
  color: var(--ob-text); &:hover { text-decoration: none; background: var(--ob-bg-alt); }
  h2 { font-size: 1.1rem; }
}
.collection-count { font-size: 0.8rem; color: var(--ob-text-muted); }
.collection-logos { display: grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 2px; padding: 2px; }
.mini-tile {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  padding: 0.75rem; border-radius: 8px; overflow: hidden; transition: transform 0.1s;
  &:hover { transform: scale(1.08); z-index: 1; }
}
.mini-img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style>

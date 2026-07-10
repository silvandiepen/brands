<script setup lang="ts">
import { collectionsIndex, brandIndex } from '../data/loader'
</script>

<template>
  <div class="container collections-page">
    <h1>Collections</h1>
    <p class="subtitle">Curated groups of brands for common use cases.</p>
    <div class="grid grid--brands">
      <RouterLink
        v-for="col in Object.values(collectionsIndex)"
        :key="col.id"
        :to="{ path: '/brands' }"
        class="card collection-card"
      >
        <h2>{{ col.name }}</h2>
        <p>{{ col.brandIds.length }} brands</p>
        <div class="collection-brands">
          <span v-for="id in col.brandIds.slice(0, 5)" :key="id" class="badge">
            {{ brandIndex[id]?.name ?? id }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.collections-page { padding: 2rem 0 4rem; }
.subtitle { color: var(--ob-text-muted); margin-bottom: 2rem; }
.collection-card {
  color: var(--ob-text);
  &:hover { border-color: var(--ob-primary); text-decoration: none; }
  h2 { font-size: 1.1rem; margin-bottom: 0.25rem; }
  p { font-size: 0.875rem; color: var(--ob-text-muted); margin-bottom: 0.5rem; }
}
.collection-brands {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
</style>

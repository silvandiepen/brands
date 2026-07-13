<script setup lang="ts">
import { releaseManifest, allBrands, categories } from '../data/loader'
import HeadingSection from '../components/HeadingSection.vue'

const reviewStatusCounts = allBrands.reduce((acc, b) => {
  acc[b.reviewStatus] = (acc[b.reviewStatus] ?? 0) + 1
  return acc
}, {} as Record<string, number>)

const categoryCounts = categories.categories
  .filter((c) => c.parentId === null)
  .map((c) => ({ ...c, count: allBrands.filter((b) => b.categories.includes(c.id)).length }))
  .sort((a, b) => b.count - a.count)
</script>

<template>
  <div class="quality-page">
    <HeadingSection
      eyebrow="Dataset health"
      title="Dataset Quality"
      description="Coverage and freshness information for the current dataset release."
    />

    <div class="container quality-page__body">
    <section class="stats-grid">
      <div class="card stat">
        <span class="stat-value">{{ releaseManifest.brandCount }}</span>
        <span class="stat-label">Brands</span>
      </div>
      <div class="card stat">
        <span class="stat-value">{{ releaseManifest.assetCount }}</span>
        <span class="stat-label">Assets</span>
      </div>
      <div class="card stat">
        <span class="stat-value">{{ releaseManifest.datasetVersion }}</span>
        <span class="stat-label">Dataset version</span>
      </div>
    </section>

    <section class="section">
      <h2>Review Status Distribution</h2>
      <div class="status-list">
        <div v-for="(count, status) in reviewStatusCounts" :key="status" class="status-item">
          <span class="badge">{{ status }}</span>
          <span>{{ count }} brand(s)</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Category Coverage</h2>
      <div class="category-coverage">
        <div v-for="cat in categoryCounts" :key="cat.id" class="coverage-item">
          <span class="coverage-label">{{ cat.label }}</span>
          <div class="coverage-bar">
            <div class="coverage-fill" :style="{ width: `${Math.min(100, cat.count * 10)}%` }"></div>
          </div>
          <span class="coverage-count">{{ cat.count }}</span>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quality-page { padding-bottom: 4rem; }
.quality-page__body { max-width: 800px; }
.stats-grid { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
.stat {
  text-align: center;
  min-width: 140px;
  &-value { display: block; font-size: 1.5rem; font-weight: 700; color: var(--ob-primary); }
  &-label { font-size: 0.75rem; color: var(--ob-text-muted); }
}
.section { margin-bottom: 2rem; }
h2 { font-size: 1.1rem; margin-bottom: 1rem; }
.status-list { display: flex; flex-direction: column; gap: 0.5rem; }
.status-item { display: flex; gap: 1rem; align-items: center; }
.category-coverage { display: flex; flex-direction: column; gap: 0.5rem; }
.coverage-item { display: flex; align-items: center; gap: 0.75rem; }
.coverage-label { width: 140px; font-size: 0.875rem; }
.coverage-bar {
  flex: 1;
  height: 8px;
  background: var(--ob-bg-alt);
  border-radius: 4px;
  overflow: hidden;
}
.coverage-fill { height: 100%; background: var(--ob-primary); border-radius: 4px; }
.coverage-count { font-size: 0.75rem; color: var(--ob-text-muted); width: 30px; }
</style>

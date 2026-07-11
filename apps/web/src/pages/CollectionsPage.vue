<script setup lang="ts">
import { computed } from 'vue'
import { collectionsIndex, brandIndex } from '../data/loader'
import allMonoSvgs from '../../../../packages/data/generated/all-mono-svgs.json'
import allBrandsData from '../../../../packages/data/generated/all-brands.json'

const svgs = allMonoSvgs as Record<string, string>
const brandColorMap = {} as Record<string, string[]>
for (const b of allBrandsData as Array<{ id: string; colors: Array<{ value: string }> }>) {
  brandColorMap[b.id] = (b.colors || []).map(c => c.value)
}

function getLogo(brandId: string): string {
  return svgs[`${brandId}/symbol`] ?? svgs[`${brandId}/icon`] ?? svgs[`${brandId}/wordmark`] ?? ''
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function inkColor(brandId: string): string {
  const bg = brandColorMap[brandId]?.[0]
  if (!bg) return '#000'
  return luminance(bg) > 0.4 ? '#000' : '#fff'
}

function brandBg(brandId: string): string {
  return brandColorMap[brandId]?.[0] ?? '#ffffff'
}

function recolorSvg(svg: string, _color: string): string {
  return svg
}

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
            v-for="id in col.brandIds.slice(0, 12)"
            :key="id"
            :to="`/brands/${id}`"
            class="mini-tile"
            :style="{ background: brandBg(id), '--ink': inkColor(id) }"
            :title="brandIndex[id]?.name ?? id"
          >
            <span class="mini-logo" v-html="getLogo(id)"></span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.collections-page { padding: 1rem 0 4rem; }
h1 { margin-bottom: 1.5rem; }
.collection-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}
.collection-card {
  border: 1px solid var(--ob-border);
  border-radius: 16px;
  overflow: hidden;
}
.collection-name {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  color: var(--ob-text);
  &:hover { text-decoration: none; background: var(--ob-bg-alt); }
  h2 { font-size: 1.1rem; }
}
.collection-count { font-size: 0.8rem; color: var(--ob-text-muted); }
.collection-logos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 2px;
  padding: 2px;
}
.mini-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.1s;
  &:hover { transform: scale(1.08); z-index: 1; }
}
.mini-logo {
  color: var(--ink, #000);
  :deep(svg) { max-width: 100%; max-height: 100%; }
}
</style>

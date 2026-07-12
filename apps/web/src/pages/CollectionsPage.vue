<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { collectionsIndex, brandIndex } from '../data/loader'
import { inkOn } from '../utils'
import { useBrandApi } from '../stores/api'

const bemm = useBemm('collections-page')
const { logoUrl } = useBrandApi()

function brandBg(brandId: string): string { return brandIndex[brandId]?.primaryColor ?? '#f5f5f5' }

const collections = computed(() => Object.values(collectionsIndex))
</script>

<template>
  <div :class="[bemm(), 'container']">
    <header :class="[bemm('head'), 'fade-up']">
      <h1 :class="bemm('title')">Collections</h1>
      <p :class="bemm('sub')">Curated sets of brands, grouped by industry and theme.</p>
    </header>

    <div :class="bemm('list')">
      <div v-for="col in collections" :key="col.id" :class="[bemm('card'), 'reveal']">
        <RouterLink :to="{ path: '/brands', query: { category: col.brandIds[0] } }" :class="bemm('name')">
          <h2 :class="bemm('name-title')">{{ col.name }}</h2>
          <span :class="bemm('count')">{{ col.brandIds.length }} brands</span>
        </RouterLink>
        <div :class="bemm('logos')">
          <RouterLink
            v-for="id in col.brandIds.slice(0, 12)" :key="id"
            :to="`/brands/${id}`" :class="bemm('tile')"
            :style="{
              '--collections-page-tile-background': brandBg(id),
              '--collections-page-tile-ink': inkOn(brandBg(id)),
              '--collections-page-tile-logo': `url('${logoUrl(id)}')`,
            }"
            :title="brandIndex[id]?.name ?? id"
          >
            <span :class="bemm('tile-logo')" role="img" :aria-label="brandIndex[id]?.name ?? id" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.collections-page {
  padding-top: var(--space);
  padding-bottom: var(--space-xl);

  &__head {
    padding-bottom: var(--space-l);
    margin-bottom: var(--space-l);
    border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__title {
    font-size: clamp(var(--font-size-xl), 4vw, var(--font-size-xxl));
    margin-bottom: var(--space-xs);
  }

  &__sub {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    max-width: 60ch;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: var(--space);

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-xxl);
    overflow: hidden;
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 2%);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      border-color: color-mix(in srgb, var(--color-foreground), transparent 76%);
      box-shadow: var(--shadow-s);
    }
  }

  &__name {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-s);
    padding: var(--space) var(--space-l);
    color: var(--color-foreground);

    &:hover {
      text-decoration: none;

      .collections-page__name-title {
        color: var(--color-primary);
      }
    }
  }

  &__name-title {
    font-size: var(--font-size-l);
    transition: color var(--transition-fast);
  }

  &__count {
    font-size: var(--font-size-xs);
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    white-space: nowrap;
  }

  &__logos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: var(--space-xs);
    padding: 0 var(--space-xs) var(--space-xs);
  }

  &__tile {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-s);
    border-radius: var(--border-radius-l);
    background: var(--collections-page-tile-background, var(--color-accent));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 93%);
    overflow: hidden;
    transition: transform var(--transition-fast);

    &:hover {
      transform: scale(1.08);
      z-index: 1;
    }
  }

  &__tile-logo {
    width: 100%;
    height: 100%;
    background-color: var(--collections-page-tile-ink, var(--color-foreground));
    mask: var(--collections-page-tile-logo) no-repeat center / contain;
  }
}
</style>

<script setup lang="ts">
defineOptions({ name: 'BrandsPage' })
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { InputSearch, InputSelect } from '@sil/ui'
import { allBrands, categories, brandIndex } from '../data/loader'
import { inkOn } from '../utils'
import { useBrandApi } from '../stores/api'
import BrandTile from '../components/BrandTile.vue'

const bemm = useBemm('brands-page')
const route = useRoute()
const router = useRouter()
const { logoUrl } = useBrandApi()

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

// 'all' sentinel instead of '' — InputSelect normalizes falsy option values to the label
const ALL_CATEGORIES = 'all'

const searchQuery = ref((route.query.q as string) ?? '')
const selectedCategory = ref((route.query.category as string) || ALL_CATEGORIES)

watch(() => route.query, (q) => {
  searchQuery.value = (q.q as string) ?? ''
  selectedCategory.value = (q.category as string) || ALL_CATEGORIES
}, { immediate: true })

const categoryOptions = [
  { label: 'All categories', value: ALL_CATEGORIES },
  ...categories.categories
    .filter(c => c.parentId === null)
    .map(c => ({ label: c.label, value: c.id })),
]

const filtered = computed(() => {
  let result = allBrands
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b =>
      b.name.toLowerCase().includes(q) || b.id.includes(q) ||
      b.aliases.some(a => a.toLowerCase().includes(q)) || b.domains.some(d => d.includes(q)),
    )
  }
  if (selectedCategory.value !== ALL_CATEGORIES)
    result = result.filter(b => b.categories.includes(selectedCategory.value))
  return result
})

const countLabel = computed(() => new Intl.NumberFormat('en-US').format(filtered.value.length))

const visibleCount = ref(48)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
function loadMore() {
  if (visibleCount.value < filtered.value.length)
    visibleCount.value = Math.min(visibleCount.value + 48, filtered.value.length)
}
watch(filtered, () => { visibleCount.value = 48 })
onMounted(() => {
  observer = new IntersectionObserver(e => { if (e[0]?.isIntersecting) loadMore() }, { rootMargin: '300px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())

watch([searchQuery, selectedCategory], () => {
  router.replace({ path: '/brands', query: {
    ...(searchQuery.value ? { q: searchQuery.value } : {}),
    ...(selectedCategory.value !== ALL_CATEGORIES ? { category: selectedCategory.value } : {}),
  } })
})
</script>

<template>
  <div :class="[bemm(), 'container']">
    <div :class="bemm('controls')">
      <div :class="bemm('search')">
        <InputSearch v-model="searchQuery" placeholder="Search brands, aliases, domains…" block :search-on-enter="false" />
      </div>
      <div :class="bemm('filter')">
        <InputSelect v-model="selectedCategory" :options="categoryOptions" />
      </div>
      <span :class="bemm('count')">{{ countLabel }} brands</span>
    </div>

    <div :class="bemm('wall')">
      <BrandTile
        v-for="brand in filtered.slice(0, visibleCount)"
        :key="brand.id"
        :brand-id="brand.id"
        :name="brand.name"
        :bg="brandBg(brand.id)"
        :ink="inkOn(brandBg(brand.id))"
        :logo-url="logoUrl(brand.id)"
        show-name
      />
    </div>

    <p v-if="!filtered.length" :class="bemm('empty')">No brands match your search.</p>

    <div ref="sentinel" :class="bemm('sentinel')">
      <span v-if="visibleCount < filtered.length">Loading…</span>
    </div>
  </div>
</template>

<style lang="scss">
.brands-page {
  padding-top: var(--space);
  padding-bottom: var(--space-xl);

  &__controls {
    display: flex;
    gap: var(--space-s);
    padding-bottom: var(--space);
    margin-bottom: var(--space-l);
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__search {
    flex: 1;
    min-width: 220px;
    max-width: 420px;
  }

  &__count {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    font-size: var(--font-size-s);
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  &__wall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-s);
  }

  &__empty {
    text-align: center;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    padding: var(--space-xl) 0;
  }

  &__sentinel {
    text-align: center;
    padding: var(--space-l);
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    font-size: var(--font-size-s);
  }
}
</style>

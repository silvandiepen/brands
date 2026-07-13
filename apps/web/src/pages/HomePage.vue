<script setup lang="ts">
defineOptions({ name: 'HomePage' })
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { InputSearch, Button } from '@sil/ui'
import { allBrands, releaseManifest, categories, brandIndex } from '../data/loader'
import { inkOn, shuffle } from '../utils'
import { useBrandApi } from '../stores/api'
import BrandTile from '../components/BrandTile.vue'

const bemm = useBemm('home')
const router = useRouter()
const { logoUrl } = useBrandApi()
const searchQuery = ref('')
const selectedCategory = ref('')

const topLevelCategories = categories.categories.filter(c => c.parentId === null)

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

const displayBrands = ref<typeof allBrands>([])
function reshuffle() {
  let brands = allBrands.filter(b => b.assetCount > 0)
  if (selectedCategory.value) brands = brands.filter(b => b.categories.includes(selectedCategory.value))
  displayBrands.value = shuffle(brands)
}
onMounted(reshuffle)
watch(selectedCategory, reshuffle)

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return displayBrands.value
  const q = searchQuery.value.toLowerCase()
  return displayBrands.value.filter(b =>
    b.name.toLowerCase().includes(q) || b.id.includes(q) ||
    b.aliases.some(a => a.toLowerCase().includes(q)),
  )
})

const visibleCount = ref(48)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function loadMore() {
  if (visibleCount.value < filtered.value.length)
    visibleCount.value = Math.min(visibleCount.value + 48, filtered.value.length)
}
watch(filtered, () => { visibleCount.value = 48 })

onMounted(() => {
  observer = new IntersectionObserver(entries => {
    if (entries[0]?.isIntersecting) loadMore()
  }, { rootMargin: '300px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())

function submitSearch() {
  if (searchQuery.value.trim())
    router.push({ path: '/brands', query: { q: searchQuery.value } })
}

const brandCountLabel = new Intl.NumberFormat('en-US').format(releaseManifest.brandCount)
</script>

<template>
  <div :class="[bemm(), 'container']">
    <section :class="bemm('hero')">
      <h1 :class="[bemm('title'), 'fade-up']">The open source<br /><span :class="bemm('title-accent')">brand asset</span> library</h1>
      <p :class="[bemm('tagline'), 'fade-up']" style="animation-delay: 80ms">{{ brandCountLabel }} brand logos and color palettes. Free, versioned, and one API call away.</p>

      <div :class="[bemm('search'), 'fade-up']" style="animation-delay: 160ms">
        <InputSearch
          v-model="searchQuery"
          placeholder="Search brands, aliases, domains…"
          block
          @search="submitSearch"
        />
      </div>

      <div :class="[bemm('categories'), 'fade-up']" style="animation-delay: 240ms">
        <Button
          v-for="cat in topLevelCategories"
          :key="cat.id"
          size="small"
          :variant="selectedCategory === cat.id ? 'primary' : 'outline'"
          @click="selectedCategory = selectedCategory === cat.id ? '' : cat.id"
        >{{ cat.label }}</Button>
      </div>
    </section>

    <div :class="bemm('wall')">
      <BrandTile
        v-for="brand in filtered.slice(0, visibleCount)"
        :key="brand.id"
        :brand-id="brand.id"
        :name="brand.name"
        :bg="brandBg(brand.id)"
        :ink="inkOn(brandBg(brand.id))"
        :logo-url="logoUrl(brand.id)"
      />
    </div>

    <div ref="sentinel" :class="bemm('sentinel')">
      <span v-if="visibleCount < filtered.length">Loading more…</span>
    </div>
  </div>
</template>

<style lang="scss">
.home {
  padding-bottom: var(--space-xl);

  &__hero {
    text-align: center;
    padding: calc(var(--app-header-height) + var(--space-l)) 0 var(--space-l);
    max-width: 720px;
    margin: 0 auto;
  }

  &__title {
    font-size: clamp(var(--font-size-xxl), 5.5vw, calc(var(--font-size) * 3.5));
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin-bottom: var(--space);
  }

  &__title-accent {
    color: var(--color-primary);
  }

  &__tagline {
    font-size: var(--font-size-l);
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    margin: 0 auto var(--space-l);
    max-width: 46ch;
  }

  &__search {
    max-width: 520px;
    margin: 0 auto var(--space);
  }

  &__categories {
    display: flex;
    gap: var(--space-xs);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__wall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
    gap: var(--space-s);
  }

  &__sentinel {
    text-align: center;
    padding: var(--space-l);
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    font-size: var(--font-size-s);
  }
}
</style>

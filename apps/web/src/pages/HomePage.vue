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
import LogoCanvasField from '../components/LogoCanvasField.vue'

const bemm = useBemm('home')
const router = useRouter()
const { logoUrl } = useBrandApi()
const searchQuery = ref('')
const selectedCategory = ref('')

const topLevelCategories = categories.categories.filter(c => c.parentId === null)

function canvasRank(id: string) {
  let value = 0
  for (let i = 0; i < id.length; i++) value = (value * 33 + id.charCodeAt(i)) >>> 0
  return value
}

const canvasBrands = computed(() =>
  allBrands
    .filter(b => b.assetCount > 0 && b.primaryColor)
    .sort((a, b) => canvasRank(a.id) - canvasRank(b.id))
    .slice(0, 42)
    .map(b => ({
      id: b.id,
      name: b.name,
      color: b.primaryColor ?? '#f5f5f5',
      logoUrl: logoUrl(b.id),
    })),
)

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
  <div :class="bemm()">
    <section :class="bemm('hero')">
      <LogoCanvasField :items="canvasBrands" :class="bemm('canvas')" />
      <div :class="[bemm('hero-copy'), 'container']">
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
      </div>
    </section>

    <div :class="[bemm('wall'), 'container']">
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

    <div ref="sentinel" :class="[bemm('sentinel'), 'container']">
      <span v-if="visibleCount < filtered.length">Loading more…</span>
    </div>
  </div>
</template>

<style lang="scss">
.home {
  padding-bottom: var(--space-xl);

  &__hero {
    position: relative;
    overflow: clip;
    text-align: center;
    min-height: min(78vh, 760px);
    display: grid;
    place-items: center;
    padding: calc(var(--app-header-height) + var(--space-xl)) 0 clamp(var(--space-xl), 8vw, 7rem);
    isolation: isolate;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--color-background), transparent 8%) 0%, color-mix(in srgb, var(--color-background), transparent 24%) 28%, transparent 58%),
        linear-gradient(180deg, color-mix(in srgb, var(--color-background), transparent 0%) 0%, transparent 24%, transparent 72%, var(--color-background) 100%);
    }
  }

  &__canvas {
    z-index: 0;
  }

  &__hero-copy {
    position: relative;
    z-index: 2;
    max-width: 780px;
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

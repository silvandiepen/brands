<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icon, Icons, InputSearch } from '@sil/ui'
import { allBrands, categories, brandIndex, collectionsIndex, type CompactBrand } from '../data/loader'
import { inkOn } from '../utils'
import { useBrandApi } from '../stores/api'
import BrandTile from '../components/BrandTile.vue'
import HeadingSection from '../components/HeadingSection.vue'

defineOptions({ name: 'BrandsPage' })

const bemm = useBemm('brands-page')
const route = useRoute()
const router = useRouter()
const { logoUrl } = useBrandApi()

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

// 'all' sentinel instead of '' — InputSelect normalizes falsy option values to the label
const ALL_CATEGORIES = 'all'
const ALL_COLLECTIONS = 'all'
const ALL_COLORS = 'all'
const DEFAULT_SORT = 'name'

const searchQuery = ref((route.query.q as string) ?? '')
const selectedCategory = ref((route.query.category as string) || ALL_CATEGORIES)
const selectedCollection = ref((route.query.collection as string) || ALL_COLLECTIONS)
const selectedColor = ref((route.query.color as string) || ALL_COLORS)
const sortOrder = ref((route.query.sort as string) || DEFAULT_SORT)
const openMenu = ref<'category' | 'collection' | 'color' | 'sort' | null>(null)

watch(() => route.query, (q) => {
  if (route.name !== 'brands') return
  searchQuery.value = (q.q as string) ?? ''
  selectedCategory.value = (q.category as string) || ALL_CATEGORIES
  selectedCollection.value = (q.collection as string) || ALL_COLLECTIONS
  selectedColor.value = (q.color as string) || ALL_COLORS
  sortOrder.value = (q.sort as string) || DEFAULT_SORT
}, { immediate: true })

type MenuKind = 'category' | 'collection' | 'color' | 'sort'
type FilterOption = {
  label: string
  value: string
  icon?: string
  swatch?: string
  description?: string
  count?: number
}

const categoryIcons: Record<string, string> = {
  [ALL_CATEGORIES]: Icons.UI_DASHBOARD,
  technology: Icons.MEDIA_LAPTOP,
  finance: Icons.SPECIAL_CHARACTERS_DOLLAR,
  retail: Icons.PRODUCT_SHOPPING_BAG,
  'consumer-goods': Icons.UI_BOX,
  'media-entertainment': Icons.MEDIA_PLAYBACK_PLAY,
  automotive: Icons.WAYFINDING_CAR,
  'travel-hospitality': Icons.WAYFINDING_AIRPLANE,
  healthcare: Icons.WAYFINDING_PLASTER,
  energy: Icons.WEATHER_LIGHTNING_FLASH,
  industrial: Icons.MISC_FACTORY,
  education: Icons.UI_BOOK,
  nonprofit: Icons.UI_HEART_M,
}

const colorSwatches: Record<string, string> = {
  [ALL_COLORS]: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 18%, #eab308 32%, #22c55e 48%, #06b6d4 64%, #3b82f6 78%, #a855f7 100%)',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  grayscale: 'linear-gradient(135deg, #111827, #f3f4f6)',
}

const categoryOptions = computed<FilterOption[]>(() => [
  { label: 'All industries', value: ALL_CATEGORIES, icon: categoryIcons[ALL_CATEGORIES] ?? 'layout-dashboard', count: allBrands.length },
  ...categories.categories
    .filter(c => c.parentId === null)
    .map(c => ({
      label: c.label,
      value: c.id,
      icon: categoryIcons[c.id] ?? 'folder',
      count: allBrands.filter(b => b.categories.includes(c.id)).length,
    })),
])

const collectionOptions = computed<FilterOption[]>(() => [
  { label: 'All curated sets', value: ALL_COLLECTIONS, icon: Icons.UI_FOLDER, count: allBrands.length },
  ...Object.values(collectionsIndex).map(c => ({
    label: c.name,
    value: c.id,
    icon: Icons.UI_STAR_M,
    description: 'Curated set',
    count: c.brandIds.length,
  })),
])

const colorOptions = computed<FilterOption[]>(() => [
  { label: 'All colors', value: ALL_COLORS, swatch: colorSwatches[ALL_COLORS] ?? '', count: allBrands.length },
  ...['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'grayscale'].map(value => ({
    label: value === 'grayscale' ? 'Grayscale' : value[0]!.toUpperCase() + value.slice(1),
    value,
    swatch: colorSwatches[value] ?? '',
    count: allBrands.filter(b => colorFamily(b.primaryColor) === value).length,
  })),
])

const sortOptions: FilterOption[] = [
  { label: 'Name', value: DEFAULT_SORT, icon: Icons.UI_TEXT_BOLD, description: 'Alphabetical' },
  { label: 'Color hue', value: 'color', icon: Icons.MEDIA_COLOR_SWATCHES, description: 'Rainbow order' },
  { label: 'Light to dark', value: 'lightness-desc', icon: Icons.WEATHER_SUN, description: 'Brightest first' },
  { label: 'Dark to light', value: 'lightness-asc', icon: Icons.WEATHER_MOON, description: 'Deepest first' },
]

function colorMetrics(hex: string | null): { hue: number; saturation: number; lightness: number } | null {
  if (!hex) return null
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized
  if (!/^[\da-f]{6}$/i.test(value)) return null

  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min
  if (delta === 0) return { hue: 0, saturation: 0, lightness }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === r) hue = 60 * (((g - b) / delta) % 6)
  else if (max === g) hue = 60 * ((b - r) / delta + 2)
  else hue = 60 * ((r - g) / delta + 4)
  if (hue < 0) hue += 360
  return { hue, saturation, lightness }
}

function colorFamily(hex: string | null): string {
  const metrics = colorMetrics(hex)
  if (!metrics) return 'unknown'
  if (metrics.saturation < 0.14) return 'grayscale'
  if (metrics.hue >= 345 || metrics.hue < 15) return 'red'
  if (metrics.hue < 45) return 'orange'
  if (metrics.hue < 70) return 'yellow'
  if (metrics.hue < 165) return 'green'
  if (metrics.hue < 195) return 'cyan'
  if (metrics.hue < 255) return 'blue'
  if (metrics.hue < 290) return 'purple'
  return 'pink'
}

function compareByName(a: CompactBrand, b: CompactBrand) {
  return a.name.localeCompare(b.name)
}

function compareByColor(a: CompactBrand, b: CompactBrand) {
  const aMetrics = colorMetrics(a.primaryColor)
  const bMetrics = colorMetrics(b.primaryColor)
  if (!aMetrics && !bMetrics) return compareByName(a, b)
  if (!aMetrics) return 1
  if (!bMetrics) return -1
  return aMetrics.hue - bMetrics.hue || bMetrics.saturation - aMetrics.saturation || compareByName(a, b)
}

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
  if (selectedCollection.value !== ALL_COLLECTIONS) {
    const collectionBrandIds = new Set(collectionsIndex[selectedCollection.value]?.brandIds ?? [])
    result = result.filter(b => collectionBrandIds.has(b.id))
  }
  if (selectedColor.value !== ALL_COLORS)
    result = result.filter(b => colorFamily(b.primaryColor) === selectedColor.value)

  const sorted = [...result]
  if (sortOrder.value === 'color') sorted.sort(compareByColor)
  else if (sortOrder.value === 'lightness-desc') {
    sorted.sort((a, b) =>
      (colorMetrics(b.primaryColor)?.lightness ?? -1) - (colorMetrics(a.primaryColor)?.lightness ?? -1) || compareByName(a, b),
    )
  } else if (sortOrder.value === 'lightness-asc') {
    sorted.sort((a, b) =>
      (colorMetrics(a.primaryColor)?.lightness ?? 2) - (colorMetrics(b.primaryColor)?.lightness ?? 2) || compareByName(a, b),
    )
  } else {
    sorted.sort(compareByName)
  }

  return sorted
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
  document.addEventListener('click', closeOpenMenu)
})
onUnmounted(() => {
  observer?.disconnect()
  document.removeEventListener('click', closeOpenMenu)
})

function closeOpenMenu() {
  openMenu.value = null
}

function toggleMenu(kind: MenuKind) {
  openMenu.value = openMenu.value === kind ? null : kind
}

function selectMenuValue(kind: MenuKind, value: string) {
  if (kind === 'category') selectedCategory.value = value
  else if (kind === 'collection') selectedCollection.value = value
  else if (kind === 'color') selectedColor.value = value
  else sortOrder.value = value
  openMenu.value = null
}

function selectedOption(options: FilterOption[], value: string): FilterOption {
  return options.find(option => option.value === value) ?? options[0]!
}

const hasActiveFilters = computed(() =>
  Boolean(searchQuery.value)
  || selectedCategory.value !== ALL_CATEGORIES
  || selectedCollection.value !== ALL_COLLECTIONS
  || selectedColor.value !== ALL_COLORS
  || sortOrder.value !== DEFAULT_SORT,
)

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = ALL_CATEGORIES
  selectedCollection.value = ALL_COLLECTIONS
  selectedColor.value = ALL_COLORS
  sortOrder.value = DEFAULT_SORT
  openMenu.value = null
}

watch([searchQuery, selectedCategory, selectedCollection, selectedColor, sortOrder], () => {
  if (route.name !== 'brands') return
  router.replace({ name: 'brands', query: {
    ...(searchQuery.value ? { q: searchQuery.value } : {}),
    ...(selectedCategory.value !== ALL_CATEGORIES ? { category: selectedCategory.value } : {}),
    ...(selectedCollection.value !== ALL_COLLECTIONS ? { collection: selectedCollection.value } : {}),
    ...(selectedColor.value !== ALL_COLORS ? { color: selectedColor.value } : {}),
    ...(sortOrder.value !== DEFAULT_SORT ? { sort: sortOrder.value } : {}),
  } })
})
</script>

<template>
  <div :class="bemm()">
    <HeadingSection
      eyebrow="Brand library"
      title="Browse brands"
      description="Search, filter, and sort the full Open Brands catalog by industry, curated set, color, and name."
    />

    <div class="container">
    <div :class="bemm('controls')">
      <div :class="bemm('search')">
        <InputSearch v-model="searchQuery" placeholder="Search brands, aliases, domains…" block :search-on-enter="false" />
      </div>
      <div
        v-for="menu in [
          { kind: 'category' as const, label: 'Industry', value: selectedCategory, options: categoryOptions },
          { kind: 'collection' as const, label: 'Curated set', value: selectedCollection, options: collectionOptions },
          { kind: 'color' as const, label: 'Color', value: selectedColor, options: colorOptions },
          { kind: 'sort' as const, label: 'Order', value: sortOrder, options: sortOptions },
        ]"
        :key="menu.kind"
        :class="[bemm('menu'), openMenu === menu.kind ? bemm('menu', 'open') : '']"
        @click.stop
      >
        <button
          type="button"
          :class="bemm('menu-trigger')"
          :aria-expanded="openMenu === menu.kind"
          aria-haspopup="menu"
          @click="toggleMenu(menu.kind)"
        >
          <span :class="bemm('menu-copy')">
            <span :class="bemm('menu-label')">{{ menu.label }}</span>
            <span :class="bemm('menu-value')">
              <span
                v-if="selectedOption(menu.options, menu.value).swatch"
                :class="bemm('swatch')"
                :style="{ '--brands-page-swatch': selectedOption(menu.options, menu.value).swatch }"
                aria-hidden="true"
              />
              <Icon
                v-else-if="selectedOption(menu.options, menu.value).icon"
                :name="selectedOption(menu.options, menu.value).icon ?? ''"
                :class="bemm('menu-icon')"
              />
              {{ selectedOption(menu.options, menu.value).label }}
            </span>
          </span>
          <Icon :name="Icons.ARROWS_CHEVRON_DOWN" :class="bemm('chevron')" />
        </button>

        <div v-if="openMenu === menu.kind" :class="bemm('menu-panel')" role="menu">
          <button
            v-for="option in menu.options"
            :key="option.value"
            type="button"
            :class="[bemm('menu-item'), option.value === menu.value ? bemm('menu-item', 'selected') : '']"
            role="menuitemradio"
            :aria-checked="option.value === menu.value"
            @click="selectMenuValue(menu.kind, option.value)"
          >
            <span
              v-if="option.swatch"
              :class="bemm('swatch')"
              :style="{ '--brands-page-swatch': option.swatch }"
              aria-hidden="true"
            />
            <Icon v-else-if="option.icon" :name="option.icon ?? ''" :class="bemm('item-icon')" />
            <span :class="bemm('item-copy')">
              <span :class="bemm('item-label')">{{ option.label }}</span>
              <span v-if="option.description" :class="bemm('item-description')">{{ option.description }}</span>
            </span>
            <span v-if="option.count !== undefined" :class="bemm('item-count')">{{ option.count }}</span>
            <Icon v-if="option.value === menu.value" :name="Icons.UI_CHECK_L" :class="bemm('check')" />
          </button>
        </div>
      </div>
      <button
        type="button"
        :class="bemm('reset')"
        :disabled="!hasActiveFilters"
        @click="resetFilters"
      >
        Reset
      </button>
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
      />
    </div>

    <p v-if="!filtered.length" :class="bemm('empty')">No brands match your search.</p>

    <div ref="sentinel" :class="bemm('sentinel')">
      <span v-if="visibleCount < filtered.length">Loading…</span>
    </div>
    </div>
  </div>
</template>

<style lang="scss">
.brands-page {
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

  &__menu {
    position: relative;
  }

  &__menu-trigger {
    min-height: 3rem;
    display: inline-flex;
    align-items: center;
    gap: var(--space-s);
    padding: 0.4rem 0.55rem 0.4rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 84%);
    border-radius: var(--border-radius-l);
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 3%);
    color: var(--color-foreground);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);

    &:hover,
    &:focus-visible {
      border-color: color-mix(in srgb, var(--color-primary), transparent 35%);
      background: color-mix(in srgb, var(--color-background), var(--color-primary) 7%);
      outline: none;
    }
  }

  &__menu-copy {
    display: grid;
    gap: 0.05rem;
    text-align: left;
  }

  &__menu-label {
    font-size: 0.63rem;
    line-height: 1;
    color: color-mix(in srgb, var(--color-foreground), transparent 44%);
  }

  &__menu-value {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
    max-width: 12rem;
    font-size: var(--font-size-s);
    font-weight: 650;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__menu-icon,
  &__item-icon,
  &__chevron,
  &__check {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  &__chevron {
    color: color-mix(in srgb, var(--color-foreground), transparent 42%);
    transition: transform var(--transition-fast);
  }

  &__menu--open &__chevron {
    transform: rotate(180deg);
  }

  &__swatch {
    --brands-page-swatch: var(--color-primary);
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
    border-radius: var(--border-radius-s);
    background: var(--brands-page-swatch);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 84%);
  }

  &__menu-panel {
    position: absolute;
    top: calc(100% + 0.45rem);
    left: 0;
    z-index: 20;
    width: min(22rem, calc(100vw - 2rem));
    max-height: min(28rem, calc(100vh - 10rem));
    overflow: auto;
    padding: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 86%);
    border-radius: var(--border-radius-l);
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 2%);
    box-shadow: 0 12px 28px color-mix(in srgb, var(--color-dark), transparent 88%);
  }

  &__menu-item {
    width: 100%;
    min-height: 2.6rem;
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: 0.45rem 0.55rem;
    border: 0;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--color-foreground);
    text-align: left;
    cursor: pointer;

    &:hover,
    &:focus-visible,
    &--selected {
      background: color-mix(in srgb, var(--color-primary), transparent 90%);
      outline: none;
    }
  }

  &__item-copy {
    min-width: 0;
    display: grid;
    gap: 0.1rem;
    flex: 1;
  }

  &__item-label {
    font-size: var(--font-size-s);
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-description,
  &__item-count {
    font-size: var(--font-size-xs);
    color: color-mix(in srgb, var(--color-foreground), transparent 45%);
  }

  &__item-count {
    font-variant-numeric: tabular-nums;
  }

  &__check {
    color: var(--color-primary);
  }

  &__reset {
    min-height: 3rem;
    padding: 0 0.85rem;
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 84%);
    border-radius: var(--border-radius-l);
    background: transparent;
    color: var(--color-foreground);
    font-size: var(--font-size-s);
    font-weight: 650;
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast), opacity var(--transition-fast);

    &:hover:not(:disabled),
    &:focus-visible {
      border-color: color-mix(in srgb, var(--color-primary), transparent 35%);
      background: color-mix(in srgb, var(--color-primary), transparent 92%);
      outline: none;
    }

    &:disabled {
      cursor: default;
      opacity: 0.38;
    }
  }

  &__count {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    font-size: var(--font-size-s);
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  &__wall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
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

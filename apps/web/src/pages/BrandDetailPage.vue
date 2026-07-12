<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { Button } from '@sil/ui'
import { getCategoryLabel, type BrandDetail } from '../data/loader'
import { useBrandApi } from '../stores/api'
import { inkOn } from '../utils'

defineOptions({ name: 'BrandDetailPage' })

const bemm = useBemm('brand-detail', { return: 'string', includeBaseClass: true })
const route = useRoute()
const { fetchBrand, logoUrl } = useBrandApi()

const brand = ref<BrandDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedColor = ref<string | null>(null)
const addedToCart = ref(false)

const primaryColor = ref('#ffffff')

async function load() {
  loading.value = true
  error.value = ''
  brand.value = null
  addedToCart.value = false
  const id = route.params.id as string
  const data = await fetchBrand(id)
  if (data) {
    brand.value = data
    primaryColor.value = data.colors?.[0]?.value ?? '#ffffff'
  } else {
    error.value = `Brand '${id}' not found`
  }
  loading.value = false
}

watch(() => route.params.id, load, { immediate: true })

function copyColor(value: string) {
  navigator.clipboard.writeText(value)
  copiedColor.value = value
  setTimeout(() => { copiedColor.value = null }, 1500)
}

function addToCart(brandId: string) {
  const cart = JSON.parse(localStorage.getItem('ob-cart') ?? '[]') as string[]
  if (!cart.includes(brandId)) {
    cart.push(brandId)
    localStorage.setItem('ob-cart', JSON.stringify(cart))
  }
  addedToCart.value = true
}
</script>

<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('status')">Loading…</div>
    <div v-else-if="error" :class="bemm('status')">{{ error }}</div>
    <template v-else-if="brand">
      <div class="container">
        <div :class="bemm('hero')" :style="{ '--brand-detail-color': primaryColor, '--brand-detail-ink': inkOn(primaryColor) }">
          <!-- masked so the logo always renders in the ink color against the brand background -->
          <span
            :class="[bemm('hero-logo'), 'fade-up']"
            role="img"
            :aria-label="brand.name"
            :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id)}')` }"
          />
          <h1 :class="[bemm('hero-title'), 'fade-up']" style="animation-delay: 60ms">{{ brand.name }}</h1>
          <div :class="[bemm('hero-meta'), 'fade-up']" style="animation-delay: 120ms">
            <a v-for="d in brand.domains" :key="d" :href="`https://${d}`" target="_blank" rel="noopener" :class="bemm('hero-chip')">{{ d }}</a>
            <span v-if="brand.qualityScore" :class="bemm('hero-chip', 'static')">
              Quality {{ Math.round((brand.qualityScore ?? 0) * 100) }}%
            </span>
          </div>
          <button :class="[bemm('cart'), 'fade-up']" style="animation-delay: 180ms" type="button" @click="addToCart(brand.id)">
            {{ addedToCart ? '✓ In cart' : '+ Add to cart' }}
          </button>
        </div>
      </div>

      <div :class="[bemm('body'), 'container']">
        <section v-if="brand.colors.length" :class="[bemm('section'), 'reveal']">
          <h2 :class="[bemm('heading'), 'section-title']">Colors</h2>
          <div :class="bemm('colors')">
            <button v-for="c in brand.colors" :key="c.id" type="button"
              :class="bemm('color')"
              :style="{ background: c.value, color: inkOn(c.value) }"
              @click="copyColor(c.value)" :title="`Copy ${c.value}`">
              <span :class="bemm('color-hex')">{{ c.value.toUpperCase() }}</span>
              <span :class="bemm('color-role')">{{ c.role }}</span>
              <span :class="bemm('color-copy')">{{ copiedColor === c.value ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
        </section>

        <section v-if="brand.assets.length" :class="[bemm('section'), 'reveal']">
          <h2 :class="[bemm('heading'), 'section-title']">Assets</h2>
          <div :class="bemm('assets')">
            <div v-for="a in brand.assets" :key="a.id" :class="bemm('asset', { current: a.current })">
              <div :class="bemm('asset-row')">
                <div :class="bemm('asset-swatch', 'light')">
                  <img :src="logoUrl(brand.id, { type: a.type })" :alt="`${a.type} on light`" loading="lazy" />
                </div>
                <div :class="bemm('asset-swatch', 'light')">
                  <span :class="bemm('asset-mono', 'dark')" :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id, { type: a.type, theme: 'mono' })}')` }" />
                </div>
                <div :class="bemm('asset-swatch', 'dark')">
                  <span :class="bemm('asset-mono', 'light')" :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id, { type: a.type, theme: 'mono' })}')` }" />
                </div>
              </div>
              <div :class="bemm('asset-label')">
                <span :class="bemm('asset-type')">{{ a.type }} / {{ a.variant }}</span>
                <span v-if="a.current" :class="bemm('asset-badge')">current</span>
              </div>
            </div>
          </div>
        </section>

        <div :class="[bemm('columns'), 'reveal']">
          <section v-if="brand.social?.length" :class="bemm('section')">
            <h2 :class="bemm('heading')">Links</h2>
            <div :class="bemm('links')">
              <Button v-for="s in brand.social" :key="s.url" :href="s.url" target="_blank" rel="noopener" variant="outline" size="small">{{ s.type }}</Button>
            </div>
          </section>

          <section :class="bemm('section')">
            <h2 :class="bemm('heading')">Quality</h2>
            <div :class="bemm('quality')">
              <div :class="bemm('quality-fill')" :style="{ width: `${(brand.qualityScore ?? 0.5) * 100}%` }"></div>
            </div>
            <span class="badge">{{ brand.review.status }}</span>
          </section>

          <section v-if="brand.categories.length" :class="bemm('section')">
            <h2 :class="bemm('heading')">Categories</h2>
            <div :class="bemm('categories')">
              <RouterLink v-for="c in brand.categories" :key="c" :to="{ path: '/brands', query: { category: c } }" class="badge">{{ getCategoryLabel(c) }}</RouterLink>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.brand-detail {
  --brand-detail-color: var(--color-accent);
  --brand-detail-ink: var(--color-foreground);

  &__status {
    padding: var(--space-xl) 0;
    text-align: center;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__hero {
    position: relative;
    padding: var(--space-xl) var(--space-l);
    border-radius: var(--border-radius-xxl);
    background: var(--brand-detail-color);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 92%);
    text-align: center;
    color: var(--brand-detail-ink);
  }

  &__hero-logo {
    display: block;
    width: 88px;
    height: 88px;
    margin: 0 auto var(--space);
    background-color: var(--brand-detail-ink);
    mask: var(--brand-detail-logo) no-repeat center / contain;
  }

  &__hero-title {
    font-size: clamp(var(--font-size-xl), 4vw, calc(var(--font-size) * 2.5));
    margin-bottom: var(--space);
  }

  &__hero-meta {
    display: flex;
    gap: var(--space-s);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__hero-chip {
    display: inline-flex;
    align-items: center;
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius-xxl);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--brand-detail-ink);
    background: color-mix(in srgb, var(--brand-detail-ink), transparent 90%);

    // only domain chips are links; the quality chip is a span
    &:is(a):hover {
      background: color-mix(in srgb, var(--brand-detail-ink), transparent 80%);
      text-decoration: none;
    }
  }

  &__cart {
    position: absolute;
    top: var(--space);
    right: var(--space);
    padding: var(--space-s) var(--space);
    border: none;
    border-radius: var(--border-radius-xxl);
    background: color-mix(in srgb, var(--brand-detail-ink), transparent 88%);
    color: var(--brand-detail-ink);
    cursor: pointer;
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family);
    transition: background var(--transition-fast);

    &:hover {
      background: color-mix(in srgb, var(--brand-detail-ink), transparent 78%);
    }
  }

  &__body {
    padding-top: var(--space-l);
    padding-bottom: var(--space-xl);
    max-width: 960px;
  }

  &__section {
    margin-bottom: var(--space-l);
  }

  &__columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0 var(--space-l);

    .brand-detail__section {
      padding-top: var(--space);
      border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
    }
  }

  &__heading {
    font-size: var(--font-size-s);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    margin-bottom: var(--space);

    &.section-title {
      text-transform: none;
      letter-spacing: -0.01em;
      margin-bottom: var(--space);
    }
  }

  &__colors {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-s);
  }

  &__color {
    border: none;
    border-radius: var(--border-radius-xl);
    padding: var(--space-l) var(--space) var(--space);
    cursor: pointer;
    position: relative;
    text-align: left;
    font-family: var(--font-family);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 92%);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 92%),
        var(--shadow-s);

      .brand-detail__color-copy {
        opacity: 0.9;
      }
    }
  }

  &__color-hex {
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-s);
    font-weight: var(--font-weight-semibold);
    display: block;
  }

  &__color-role {
    font-size: var(--font-size-xs);
    opacity: 0.75;
  }

  &__color-copy {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &__assets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-s);
  }

  &__asset {
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 2%);

    &--current {
      border-color: var(--color-primary);
    }
  }

  &__asset-row {
    display: flex;
  }

  &__asset-swatch {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-l) var(--space);
    min-height: 96px;

    img {
      max-width: 56px;
      max-height: 56px;
      object-fit: contain;
    }

    &--light {
      background: var(--color-light);
    }

    &--dark {
      background: var(--color-dark);
    }
  }

  // mono variants rendered via mask so we control the fill color exactly
  &__asset-mono {
    width: 56px;
    height: 56px;
    mask: var(--brand-detail-logo) no-repeat center / contain;

    &--dark {
      background-color: var(--color-dark);
    }

    &--light {
      background-color: var(--color-light);
    }
  }

  &__asset-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-s);
    padding: var(--space-s) var(--space);
    font-size: var(--font-size-xs);
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
  }

  &__asset-type {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    font-weight: var(--font-weight-medium);
  }

  &__asset-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius-xxl);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    color: var(--color-primary);
  }

  &__links {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__quality {
    height: 8px;
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 6%);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin-bottom: var(--space-s);
  }

  &__quality-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--border-radius);
  }

  &__categories {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'
import { Button } from '@sil/ui'
import { getCategoryLabel, type BrandDetail } from '../data/loader'
import { useBrandApi } from '../stores/api'
import { useCart } from '../stores/cart'
import { inkOn } from '../utils'

defineOptions({ name: 'BrandDetailPage' })

const bemm = useBemm('brand-detail', { return: 'string', includeBaseClass: true })
const route = useRoute()
const { fetchBrand, logoUrl } = useBrandApi()
const { add: addCartItem } = useCart()

const brand = ref<BrandDetail | null>(null)
const loading = ref(true)
const error = ref('')
const copiedColor = ref<string | null>(null)
const addedToCart = ref(false)
const primaryColor = ref('#ffffff')

const qualityPercent = computed(() => Math.round((brand.value?.qualityScore ?? 0.5) * 100))
const currentAssets = computed(() => brand.value?.assets.filter(asset => asset.current) ?? [])
const sourceCount = computed(() => brand.value?.sources.length ?? 0)
const metadataRows = computed(() => {
  if (!brand.value) return []
  return [
    { label: 'Brand ID', value: brand.value.id },
    { label: 'Status', value: brand.value.status },
    { label: 'Review', value: brand.value.review.status },
    { label: 'Review method', value: brand.value.review.method },
    { label: 'Assets', value: String(brand.value.assets.length) },
    { label: 'Sources', value: String(brand.value.sources.length) },
  ]
})

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
  addCartItem(brandId)
  addedToCart.value = true
}

function assetUrl(asset: BrandDetail['assets'][number], opts: { theme?: 'mono' | 'color' } = {}) {
  return logoUrl(brand.value?.id ?? '', {
    type: asset.type,
    ...(opts.theme ? { theme: opts.theme } : {}),
  })
}
</script>

<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('status')">Loading…</div>
    <div v-else-if="error" :class="bemm('status')">{{ error }}</div>

    <template v-else-if="brand">
      <section :class="bemm('hero')" :style="{ '--brand-detail-color': primaryColor, '--brand-detail-ink': inkOn(primaryColor) }">
        <div :class="[bemm('hero-inner'), 'container']">
          <div :class="bemm('hero-copy')">
            <RouterLink to="/brands" :class="bemm('back')">Browse brands</RouterLink>
            <p class="eyebrow">Brand identity</p>
            <h1 :class="[bemm('hero-title'), 'fade-up']">{{ brand.name }}</h1>
            <p v-if="brand.description" :class="bemm('description')">{{ brand.description }}</p>
            <div :class="[bemm('hero-meta'), 'fade-up']" style="animation-delay: 80ms">
              <a v-for="d in brand.domains" :key="d" :href="`https://${d}`" target="_blank" rel="noopener" :class="bemm('hero-chip')">{{ d }}</a>
              <span :class="bemm('hero-chip', 'static')">{{ brand.status }}</span>
              <span :class="bemm('hero-chip', 'static')">Quality {{ qualityPercent }}%</span>
            </div>
            <button :class="[bemm('cart'), 'fade-up']" style="animation-delay: 140ms" type="button" @click="addToCart(brand.id)">
              {{ addedToCart ? 'In cart' : 'Add to pack' }}
            </button>
          </div>

          <div :class="[bemm('identity-board'), 'fade-up']" style="animation-delay: 120ms">
            <div :class="bemm('logo-stage', 'brand')" :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id)}')` }">
              <span :class="bemm('stage-logo')" role="img" :aria-label="brand.name" />
            </div>
            <div :class="bemm('logo-stage', 'light')" :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id, { theme: 'mono' })}')` }">
              <span :class="bemm('stage-logo')" role="img" :aria-label="`${brand.name} on light`" />
            </div>
            <div :class="bemm('logo-stage', 'dark')" :style="{ '--brand-detail-logo': `url('${logoUrl(brand.id, { theme: 'mono' })}')` }">
              <span :class="bemm('stage-logo')" role="img" :aria-label="`${brand.name} on dark`" />
            </div>
          </div>
        </div>
      </section>

      <div :class="[bemm('body'), 'container']">
        <section :class="[bemm('quick'), 'reveal']" aria-label="Brand summary">
          <div :class="bemm('quick-item')">
            <span :class="bemm('quick-label')">Assets</span>
            <strong>{{ brand.assets.length }}</strong>
          </div>
          <div :class="bemm('quick-item')">
            <span :class="bemm('quick-label')">Current assets</span>
            <strong>{{ currentAssets.length }}</strong>
          </div>
          <div :class="bemm('quick-item')">
            <span :class="bemm('quick-label')">Colors</span>
            <strong>{{ brand.colors.length }}</strong>
          </div>
          <div :class="bemm('quick-item')">
            <span :class="bemm('quick-label')">Sources</span>
            <strong>{{ sourceCount }}</strong>
          </div>
        </section>

        <section v-if="brand.assets.length" :class="[bemm('section'), 'reveal']">
          <div :class="bemm('section-head')">
            <div>
              <p class="eyebrow">Logo system</p>
              <h2 :class="bemm('section-title')">Assets</h2>
            </div>
            <span :class="bemm('section-note')">{{ currentAssets.length }} current</span>
          </div>
          <div :class="bemm('assets')">
            <article v-for="a in brand.assets" :key="a.id" :class="bemm('asset', { current: a.current })">
              <div :class="bemm('asset-preview-grid')">
                <div :class="bemm('asset-swatch', 'light')">
                  <img :src="assetUrl(a)" :alt="`${a.type} color asset`" loading="lazy" />
                </div>
                <div :class="bemm('asset-swatch', 'mono')">
                  <span :class="bemm('asset-mono', 'dark')" :style="{ '--brand-detail-logo': `url('${assetUrl(a, { theme: 'mono' })}')` }" />
                </div>
                <div :class="bemm('asset-swatch', 'dark')">
                  <span :class="bemm('asset-mono', 'light')" :style="{ '--brand-detail-logo': `url('${assetUrl(a, { theme: 'mono' })}')` }" />
                </div>
              </div>
              <div :class="bemm('asset-label')">
                <div>
                  <strong>{{ a.type }}</strong>
                  <span>{{ a.variant }} · {{ a.themes.join(', ') }}</span>
                </div>
                <span v-if="a.current" :class="bemm('asset-badge')">current</span>
              </div>
            </article>
          </div>
        </section>

        <section v-if="brand.colors.length" :class="[bemm('section'), 'reveal']">
          <div :class="bemm('section-head')">
            <div>
              <p class="eyebrow">Palette</p>
              <h2 :class="bemm('section-title')">Colors</h2>
            </div>
          </div>
          <div :class="bemm('colors')">
            <button
              v-for="c in brand.colors"
              :key="c.id"
              type="button"
              :class="bemm('color')"
              :style="{ background: c.value, color: inkOn(c.value) }"
              :title="`Copy ${c.value}`"
              @click="copyColor(c.value)"
            >
              <span :class="bemm('color-hex')">{{ c.value.toUpperCase() }}</span>
              <span :class="bemm('color-role')">{{ c.name || c.role }}</span>
              <span v-if="c.formats?.recommendedTextColor" :class="bemm('color-role')">
                Text {{ c.formats.recommendedTextColor }}
              </span>
              <span :class="bemm('color-copy')">{{ copiedColor === c.value ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
        </section>

        <div :class="[bemm('info-layout'), 'reveal']">
          <section :class="bemm('panel')">
            <h2 :class="bemm('panel-title')">Metadata</h2>
            <dl :class="bemm('metadata')">
              <div v-for="row in metadataRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
            <div v-if="brand.aliases.length" :class="bemm('chip-group')">
              <h3>Aliases</h3>
              <span v-for="alias in brand.aliases" :key="alias" class="badge">{{ alias }}</span>
            </div>
            <div v-if="brand.tags.length" :class="bemm('chip-group')">
              <h3>Tags</h3>
              <span v-for="tag in brand.tags" :key="tag" class="badge">{{ tag }}</span>
            </div>
          </section>

          <section :class="bemm('panel')">
            <h2 :class="bemm('panel-title')">Review</h2>
            <div :class="bemm('quality')">
              <div :class="bemm('quality-fill')" :style="{ width: `${qualityPercent}%` }"></div>
            </div>
            <p :class="bemm('quality-copy')">
              {{ qualityPercent }}% quality score · {{ brand.review.status }} via {{ brand.review.method }}.
            </p>
            <div :class="bemm('categories')">
              <RouterLink v-for="c in brand.categories" :key="c" :to="{ path: '/brands', query: { category: c } }" class="badge">{{ getCategoryLabel(c) }}</RouterLink>
            </div>
            <div v-if="brand.social?.length" :class="bemm('links')">
              <Button v-for="s in brand.social" :key="s.url" :href="s.url" target="_blank" rel="noopener" variant="outline" size="small">{{ s.type }}</Button>
            </div>
          </section>
        </div>

        <section v-if="brand.sources.length" :class="[bemm('section'), 'reveal']">
          <div :class="bemm('section-head')">
            <div>
              <p class="eyebrow">Verification</p>
              <h2 :class="bemm('section-title')">Sources</h2>
            </div>
          </div>
          <div :class="bemm('sources')">
            <a v-for="source in brand.sources" :key="source.id" :href="source.url" target="_blank" rel="noopener" :class="bemm('source')">
              <span>{{ source.type }}</span>
              <strong>{{ source.title || source.url }}</strong>
              <small>{{ source.accessedAt }}</small>
            </a>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.brand-detail {
  --brand-detail-color: var(--color-accent);
  --brand-detail-ink: var(--color-foreground);

  &__status {
    padding: calc(var(--app-header-height) + var(--space-xl)) 0 var(--space-xl);
    text-align: center;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__hero {
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--brand-detail-color), var(--color-background) 32%),
        color-mix(in srgb, var(--brand-detail-color), var(--color-background) 72%)
      );
    color: var(--brand-detail-ink);
    border-bottom: 1px solid color-mix(in srgb, var(--brand-detail-color), var(--color-foreground) 12%);
  }

  &__hero-inner {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
    gap: clamp(var(--space-l), 6vw, var(--space-xl));
    align-items: center;
    min-height: min(72vh, 680px);
    padding-top: calc(var(--app-header-height) + clamp(var(--space-xl), 8vw, 7rem));
    padding-bottom: clamp(var(--space-xl), 8vw, 7rem);
  }

  &__hero-copy {
    display: grid;
    gap: var(--space);
  }

  &__back {
    width: fit-content;
    color: color-mix(in srgb, var(--brand-detail-ink), transparent 18%);
    font-size: var(--font-size-s);
    font-weight: 700;
  }

  &__hero-title {
    max-width: 10ch;
    font-size: clamp(3rem, 10vw, 8rem);
    line-height: 0.88;
  }

  &__description {
    max-width: 54ch;
    color: color-mix(in srgb, var(--brand-detail-ink), transparent 20%);
    font-size: var(--font-size-l);
    line-height: 1.45;
  }

  &__hero-meta,
  &__categories,
  &__links {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__hero-chip {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0 var(--space-s);
    border-radius: var(--border-radius-l);
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--brand-detail-ink);
    background: color-mix(in srgb, var(--brand-detail-ink), transparent 90%);

    &:is(a):hover {
      background: color-mix(in srgb, var(--brand-detail-ink), transparent 80%);
      text-decoration: none;
    }
  }

  &__cart {
    width: fit-content;
    min-height: 2.75rem;
    padding: 0 var(--space);
    border: none;
    border-radius: var(--border-radius-l);
    background: var(--brand-detail-ink);
    color: var(--brand-detail-color);
    cursor: pointer;
    font-size: var(--font-size-s);
    font-weight: 800;
    font-family: var(--font-family);
    transition: transform var(--transition-fast), opacity var(--transition-fast);

    &:hover {
      transform: translateY(-1px);
      opacity: 0.88;
    }
  }

  &__identity-board {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: var(--space-s);
  }

  &__logo-stage {
    min-height: 180px;
    display: grid;
    place-items: center;
    border-radius: var(--border-radius-xl);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 90%);

    &--brand {
      grid-row: span 2;
      min-height: 380px;
      background: var(--brand-detail-color);
      color: var(--brand-detail-ink);
    }

    &--light {
      background: var(--color-light);
      color: var(--color-dark);
    }

    &--dark {
      background: var(--color-dark);
      color: var(--color-light);
    }
  }

  &__stage-logo {
    width: 54%;
    height: 54%;
    background-color: currentColor;
    mask: var(--brand-detail-logo) no-repeat center / contain;
  }

  &__body {
    padding-top: var(--space-l);
    padding-bottom: var(--space-xl);
  }

  &__quick {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-s);
    margin-bottom: var(--space-xl);
  }

  &__quick-item,
  &__panel,
  &__source {
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-l);
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 2%);
  }

  &__quick-item {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space);

    strong {
      font-size: var(--font-size-xl);
      line-height: 1;
    }
  }

  &__quick-label,
  &__section-note,
  &__quality-copy {
    color: color-mix(in srgb, var(--color-foreground), transparent 42%);
    font-size: var(--font-size-s);
  }

  &__section {
    margin-bottom: var(--space-xl);
  }

  &__section-head {
    display: flex;
    justify-content: space-between;
    gap: var(--space);
    align-items: end;
    margin-bottom: var(--space);
  }

  &__section-title {
    font-size: clamp(var(--font-size-xl), 5vw, calc(var(--font-size) * 3.4));
    line-height: 1;
  }

  &__assets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--space);
  }

  &__asset {
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    background: var(--color-background);

    &--current {
      border-color: color-mix(in srgb, var(--color-primary), transparent 30%);
    }
  }

  &__asset-preview-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr;
  }

  &__asset-swatch {
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space);

    img {
      max-width: 68%;
      max-height: 88px;
      object-fit: contain;
    }

    &--light,
    &--mono {
      background: var(--color-light);
    }

    &--dark {
      background: var(--color-dark);
    }
  }

  &__asset-mono {
    width: 68%;
    height: 88px;
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
    justify-content: space-between;
    gap: var(--space);
    padding: var(--space);
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);

    div {
      display: grid;
      gap: 0.2rem;
    }

    strong {
      text-transform: capitalize;
    }

    span {
      color: color-mix(in srgb, var(--color-foreground), transparent 42%);
      font-size: var(--font-size-xs);
    }
  }

  &__asset-badge {
    height: fit-content;
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius-l);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    color: var(--color-primary) !important;
    font-weight: 800;
  }

  &__colors {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: var(--space-s);
  }

  &__color {
    min-height: 150px;
    border: none;
    border-radius: var(--border-radius-l);
    padding: var(--space);
    cursor: pointer;
    position: relative;
    text-align: left;
    font-family: var(--font-family);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 90%);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 90%),
        var(--shadow-s);

      .brand-detail__color-copy {
        opacity: 0.9;
      }
    }
  }

  &__color-hex {
    display: block;
    margin-bottom: var(--space-xs);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size);
    font-weight: 800;
  }

  &__color-role {
    display: block;
    font-size: var(--font-size-xs);
    opacity: 0.78;
  }

  &__color-copy {
    position: absolute;
    right: var(--space-s);
    bottom: var(--space-s);
    font-size: var(--font-size-xs);
    font-weight: 800;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &__info-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space);
    margin-bottom: var(--space-xl);
  }

  &__panel {
    padding: var(--space-l);
  }

  &__panel-title {
    font-size: var(--font-size-l);
    margin-bottom: var(--space);
  }

  &__metadata {
    display: grid;
    gap: var(--space-s);
    margin: 0;

    div {
      display: flex;
      justify-content: space-between;
      gap: var(--space);
      padding-bottom: var(--space-s);
      border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
    }

    dt {
      color: color-mix(in srgb, var(--color-foreground), transparent 44%);
      font-size: var(--font-size-s);
    }

    dd {
      margin: 0;
      font-weight: 700;
      text-align: right;
    }
  }

  &__chip-group {
    margin-top: var(--space);

    h3 {
      margin-bottom: var(--space-s);
      font-size: var(--font-size-s);
      color: color-mix(in srgb, var(--color-foreground), transparent 44%);
    }
  }

  &__quality {
    height: 0.65rem;
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 7%);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    margin-bottom: var(--space-s);
  }

  &__quality-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--border-radius-l);
  }

  &__categories,
  &__links {
    margin-top: var(--space);
  }

  &__sources {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-s);
  }

  &__source {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space);
    color: var(--color-foreground);
    text-decoration: none;

    &:hover {
      border-color: var(--color-primary);
      text-decoration: none;
    }

    span,
    small {
      color: color-mix(in srgb, var(--color-foreground), transparent 44%);
      font-size: var(--font-size-xs);
    }
  }

  @media (max-width: 860px) {
    &__hero-inner,
    &__info-layout {
      grid-template-columns: 1fr;
    }

    &__identity-board {
      grid-template-columns: 1fr 1fr;
    }

    &__logo-stage--brand {
      grid-column: span 2;
      min-height: 260px;
    }

    &__quick {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    &__identity-board,
    &__asset-preview-grid,
    &__quick {
      grid-template-columns: 1fr;
    }

    &__logo-stage--brand {
      grid-column: auto;
    }
  }
}
</style>

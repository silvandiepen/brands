<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { Button, Icon, Badge, Card, InputSelect, InputCheckbox, EmptyState } from '@sil/ui'
import { brandIndex } from '../data/loader'
import { useCart } from '../stores/cart'
import { useBrandApi } from '../stores/api'
import { inkOn } from '../utils'
import BrandTile from '../components/BrandTile.vue'

defineOptions({ name: 'CartPage' })

const bemm = useBemm('cart-page', { return: 'string', includeBaseClass: true })
const { cart, remove, clear } = useCart()
const { logoUrl } = useBrandApi()

const cartBrands = computed(() =>
  cart.value
    .map((id) => brandIndex[id])
    .filter((b): b is NonNullable<typeof b> => b !== undefined),
)

const totalAssets = computed(() =>
  cartBrands.value.reduce((sum, b) => sum + b.assetCount, 0),
)

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

const packConfig = ref({
  formats: ['svg'] as string[],
  themes: ['any'] as string[],
  metadata: 'compact' as string,
  folderLayout: 'by-brand' as string,
})

const metadataOptions = [
  { label: 'None', value: 'none' },
  { label: 'Compact', value: 'compact' },
  { label: 'Complete', value: 'complete' },
]

const folderLayoutOptions = [
  { label: 'Flat', value: 'flat' },
  { label: 'Grouped by brand', value: 'by-brand' },
]

const formatOptions: { label: string; value: string }[] = [
  { label: 'SVG', value: 'svg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' },
]

function toggleFormat(value: string, checked: boolean) {
  if (checked) {
    if (!packConfig.value.formats.includes(value)) packConfig.value.formats.push(value)
  } else {
    packConfig.value.formats = packConfig.value.formats.filter((f) => f !== value)
  }
}

const packManifest = computed(() => {
  return JSON.stringify({
    brandIds: cart.value,
    assetTypes: ['recommended'],
    themes: packConfig.value.themes,
    formats: packConfig.value.formats,
    metadata: packConfig.value.metadata,
    folderLayout: packConfig.value.folderLayout,
    filenameStrategy: 'stable-id',
    includeHistorical: false,
    missingPolicy: 'recommended-fallback',
  }, null, 2)
})

const creating = ref(false)

async function createPack() {
  creating.value = true
  await new Promise((r) => setTimeout(r, 400))
  creating.value = false
  alert('Pack creation requires the API to be running. In production, this would queue a pack build.')
}
</script>

<template>
  <div :class="bemm()" class="container">
    <header :class="bemm('header')">
      <h1>Brand Cart</h1>
      <p v-if="cartBrands.length" :class="bemm('summary')">
        {{ cartBrands.length }} {{ cartBrands.length === 1 ? 'brand' : 'brands' }} · {{ totalAssets }} assets
      </p>
    </header>

    <EmptyState
      v-if="!cartBrands.length"
      :class="bemm('empty')"
      icon="cart"
      title="Your cart is empty"
      description="Browse brands and add the ones you need to build a download pack."
      :action="{ label: 'Browse brands', action: () => $router.push('/brands') }"
    />

    <template v-else>
      <div :class="bemm('layout')">
        <div :class="bemm('items')">
          <TransitionGroup name="cart-item" tag="div" :class="bemm('list')">
            <div v-for="brand in cartBrands" :key="brand.id" :class="bemm('item')">
              <RouterLink :to="`/brands/${brand.id}`" :class="bemm('item-thumb')">
                <BrandTile
                  :brand-id="brand.id"
                  :name="brand.name"
                  :bg="brandBg(brand.id)"
                  :ink="inkOn(brandBg(brand.id))"
                  :logo-url="logoUrl(brand.id)"
                />
              </RouterLink>
              <RouterLink :to="`/brands/${brand.id}`" :class="bemm('item-name')">{{ brand.name }}</RouterLink>
              <Badge variant="outline" size="small">{{ brand.assetCount }} assets</Badge>
              <Button
                variant="ghost"
                size="small"
                :aria-label="`Remove ${brand.name} from cart`"
                @click="remove(brand.id)"
              >
                <Icon name="trash" size="small" />
              </Button>
            </div>
          </TransitionGroup>
          <Button variant="ghost" size="small" :class="bemm('clear')" @click="clear">
            Clear cart
          </Button>
        </div>

        <Card :class="bemm('config')" title="Pack configuration">
          <div :class="bemm('config-group')">
            <label :class="bemm('config-label')">Formats</label>
            <div :class="bemm('checkbox-group')">
              <InputCheckbox
                v-for="format in formatOptions"
                :key="format.value"
                :label="format.label"
                :model-value="packConfig.formats.includes(format.value)"
                @update:model-value="(v) => toggleFormat(format.value, Boolean(v))"
              />
            </div>
          </div>

          <InputSelect
            v-model="packConfig.metadata"
            label="Metadata"
            :options="metadataOptions"
            :class="bemm('config-group')"
          />

          <InputSelect
            v-model="packConfig.folderLayout"
            label="Folder layout"
            :options="folderLayoutOptions"
            :class="bemm('config-group')"
          />

          <details :class="bemm('manifest')">
            <summary>Pack manifest</summary>
            <pre>{{ packManifest }}</pre>
          </details>

          <Button
            variant="primary"
            block
            :disabled="!cartBrands.length || creating"
            @click="createPack"
          >
            {{ creating ? 'Preparing…' : `Create pack (${cartBrands.length} brands)` }}
          </Button>
        </Card>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.cart-page {
  padding: var(--space-l) 0 var(--space-xl);

  &__header {
    display: flex;
    align-items: baseline;
    gap: var(--space);
    margin-bottom: var(--space-l);
    flex-wrap: wrap;
  }

  &__summary {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__empty {
    margin: var(--space-xl) 0;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: var(--space-l);

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-s);
    border-radius: var(--border-radius);
    background: var(--color-background-alt);
    transition: background var(--transition-fast);

    &:hover {
      background: color-mix(in srgb, var(--color-background-alt), var(--color-foreground) 4%);
    }
  }

  &__item-thumb {
    display: block;
    width: 48px;
    height: 48px;
    flex: 0 0 48px;

    .brand-tile {
      width: 100%;
      height: 100%;
      padding: var(--space-xs);
      border-radius: var(--border-radius-s);
    }

    // name label is redundant next to the row label, hide the tile's own
    .brand-tile__name {
      display: none;
    }
  }

  &__item-name {
    flex: 1;
    font-weight: var(--font-weight-semibold);
    color: var(--color-foreground);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__clear {
    align-self: flex-start;
    margin-top: var(--space-s);
  }

  &__config-group {
    margin-bottom: var(--space);
  }

  &__config-label {
    display: block;
    margin-bottom: var(--space-xs);
    font-size: var(--font-size-s);
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__checkbox-group {
    display: flex;
    gap: var(--space);
    flex-wrap: wrap;
  }

  &__manifest {
    margin: var(--space) 0;

    pre {
      font-size: var(--font-size-xs);
      background: var(--color-background-alt);
      padding: var(--space-s);
      border-radius: var(--border-radius);
      overflow-x: auto;
      max-height: 200px;
    }
  }
}

.cart-item-move,
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 200ms ease;
}

.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.cart-item-leave-active {
  position: absolute;
}

@media (prefers-reduced-motion: reduce) {
  .cart-item-move,
  .cart-item-enter-active,
  .cart-item-leave-active {
    transition: none;
  }
}
</style>

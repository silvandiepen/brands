<script setup lang="ts">
import { ref, computed } from 'vue'
import { brandIndex } from '../data/loader'
import { useCart } from '../stores/cart'

const { cart, remove, clear } = useCart()

const cartBrands = computed(() =>
  cart.value
    .map((id) => brandIndex[id])
    .filter((b): b is NonNullable<typeof b> => b !== undefined),
)

function removeFromCart(id: string) {
  remove(id)
}

function clearCart() {
  clear()
}

const packConfig = ref({
  formats: ['svg'] as string[],
  themes: ['any'] as string[],
  metadata: 'compact' as string,
  folderLayout: 'by-brand' as string,
})

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

async function createPack() {
  alert('Pack creation requires the API to be running. In production, this would queue a pack build.')
}
</script>

<template>
  <div class="container cart-page">
    <h1>Brand Cart</h1>
    <p v-if="!cartBrands.length" class="empty">Your cart is empty. <RouterLink to="/brands">Browse brands</RouterLink> to add some.</p>

    <template v-if="cartBrands.length">
      <div class="cart-layout">
        <div class="cart-items">
          <div v-for="brand in cartBrands" :key="brand.id" class="card cart-item">
            <RouterLink :to="`/brands/${brand.id}`" class="cart-item-name">{{ brand.name }}</RouterLink>
            <span class="badge">{{ brand.assetCount }} assets</span>
            <button class="btn" @click="removeFromCart(brand.id)">Remove</button>
          </div>
          <button class="btn" @click="clearCart">Clear cart</button>
        </div>

        <div class="cart-config">
          <h2>Pack Configuration</h2>
          <div class="config-group">
            <label>Formats</label>
            <div class="checkbox-group">
              <label><input type="checkbox" value="svg" v-model="packConfig.formats" /> SVG</label>
              <label><input type="checkbox" value="png" v-model="packConfig.formats" /> PNG</label>
              <label><input type="checkbox" value="webp" v-model="packConfig.formats" /> WebP</label>
            </div>
          </div>
          <div class="config-group">
            <label>Metadata</label>
            <select v-model="packConfig.metadata" class="filter-select">
              <option value="none">None</option>
              <option value="compact">Compact</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div class="config-group">
            <label>Folder layout</label>
            <select v-model="packConfig.folderLayout" class="filter-select">
              <option value="flat">Flat</option>
              <option value="by-brand">Grouped by brand</option>
            </select>
          </div>
          <details class="manifest-preview">
            <summary>Pack manifest</summary>
            <pre>{{ packManifest }}</pre>
          </details>
          <button class="btn btn--primary" :disabled="!cartBrands.length" @click="createPack">
            Create Pack ({{ cartBrands.length }} brands)
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.cart-page { padding: 2rem 0 4rem; }
.empty { padding: 3rem 0; text-align: center; color: var(--ob-text-muted); }
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}
.cart-items { display: flex; flex-direction: column; gap: 0.5rem; }
.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.cart-item-name { font-weight: 600; flex: 1; }
.cart-config {
  h2 { font-size: 1.1rem; margin-bottom: 1rem; }
}
.config-group {
  margin-bottom: 1rem;
  label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--ob-text-muted); }
}
.checkbox-group {
  display: flex;
  gap: 1rem;
  label { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
}
.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  color: var(--ob-text);
  width: 100%;
}
.manifest-preview {
  margin: 1rem 0;
  pre {
    font-size: 0.75rem;
    background: var(--ob-bg-alt);
    padding: 0.75rem;
    border-radius: var(--ob-radius);
    overflow-x: auto;
    max-height: 200px;
  }
}
</style>

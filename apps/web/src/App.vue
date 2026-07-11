<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PillHeader, PlatformFooter, type PillHeaderNavItem, type PillHeaderAction } from '@sil/ui'

const route = useRoute()
const router = useRouter()
const theme = ref<'light' | 'dark'>('light')

const cartCount = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('ob-cart') ?? '[]').length
  } catch {
    return 0
  }
})

const navItems: PillHeaderNavItem[] = [
  { label: 'Browse', to: '/brands' },
  { label: 'Collections', to: '/collections' },
  { label: 'Docs', to: '/docs' },
  { label: 'Playground', to: '/playground' },
  { label: 'Contribute', to: '/contribute' },
]

const actions = computed<PillHeaderAction[]>(() => {
  const list: PillHeaderAction[] = []
  if (cartCount.value > 0) {
    list.push({
      label: `Cart (${cartCount.value})`,
      handler: () => router.push('/cart'),
    })
  }
  list.push({
    label: theme.value === 'light' ? 'Dark' : 'Light',
    iconOnly: true,
    handler: () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      document.documentElement.dataset.theme = theme.value
    },
  })
  return list
})

const currentPath = computed(() => route.path)
const year = new Date().getFullYear()
</script>

<template>
  <div class="app" :data-theme="theme">
    <PillHeader
      brand-to="/"
      brand-aria-label="Open Brands"
      :color-mode="theme"
      :actions="actions"
      :nav-items="navItems"
      :current-path="currentPath"
    >
      <template #default>
        <span class="app__brand"><strong>Open</strong>Brands</span>
      </template>
    </PillHeader>

    <main class="app__main">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="['HomePage', 'BrandsPage']">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <PlatformFooter max-width="1200px" :color-mode="theme">
      <template #brand>
        <strong>Open</strong>Brands
      </template>
      <template #nav>
        <nav aria-label="Footer">
          <RouterLink to="/brands">Browse</RouterLink>
          <RouterLink to="/collections">Collections</RouterLink>
          <RouterLink to="/docs">Docs</RouterLink>
          <RouterLink to="/contribute">Contribute</RouterLink>
          <RouterLink to="/legal">Legal</RouterLink>
        </nav>
      </template>
      <template #meta>
        <p>&copy; {{ year }} Open Brands — MIT licensed. Logos remain property of their owners.</p>
      </template>
    </PlatformFooter>
  </div>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  &__main { flex: 1; }
  &__brand { font-size: 1.1rem; strong { color: var(--color-primary, #2563eb); } }
}
</style>

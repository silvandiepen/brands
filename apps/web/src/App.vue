<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { PillHeader, PlatformFooter, Icons, type PillHeaderNavItem, type PillHeaderAction } from '@sil/ui'
import { useCart } from './stores/cart'

const bemm = useBemm('app')
const route = useRoute()
const router = useRouter()
const theme = ref<'light' | 'dark'>('light')
const { count: cartCount } = useCart()

onMounted(() => {
  const saved = localStorage.getItem('ob-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  theme.value = saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
})

const navItems: PillHeaderNavItem[] = [
  { label: 'Browse', to: '/brands' },
  { label: 'Collections', to: '/collections' },
  { label: 'API', to: '/docs' },
  { label: 'Contribute', to: '/contribute' },
]

const actions = computed<PillHeaderAction[]>(() => {
  const list: PillHeaderAction[] = []
  if (cartCount.value > 0) {
    list.push({
      label: String(cartCount.value),
      icon: Icons.PRODUCT_SHOPPING_BAG,
      iconOnly: true,
      handler: () => router.push('/cart'),
    })
  }
  list.push({
    label: 'theme',
    icon: theme.value === 'light' ? Icons.WEATHER_MOON_DARK_MODE : Icons.WEATHER_SUN_LIGHT_MODE,
    iconOnly: true,
    handler: () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      document.documentElement.dataset.theme = theme.value
      localStorage.setItem('ob-theme', theme.value)
    },
  })
  return list
})

const currentPath = computed(() => route.path)
const year = new Date().getFullYear()
</script>

<template>
  <div :class="bemm()" :data-theme="theme">
    <PillHeader
      brand-to="/"
      brand-aria-label="Open Brands"
      brand-suffix="Open Brands"
      :color-mode="theme === 'light' ? 'dark' : 'light'"
      :actions="actions"
      :nav-items="navItems"
      :current-path="currentPath"
    />

    <main :class="bemm('main')">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="['HomePage', 'BrandsPage']">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <PlatformFooter max-width="1200px" :color-mode="theme">
      <template #brand><strong>Open</strong>Brands</template>
      <template #nav>
        <nav aria-label="Footer" :class="bemm('footer-nav')">
          <RouterLink to="/brands">Browse</RouterLink>
          <RouterLink to="/collections">Collections</RouterLink>
          <RouterLink to="/docs">API</RouterLink>
          <RouterLink to="/contribute">Contribute</RouterLink>
          <RouterLink to="/legal">Legal</RouterLink>
        </nav>
      </template>
      <template #meta>
        <p :class="bemm('footer-meta')">&copy; {{ year }} Open Brands — MIT. Logos remain property of their owners.</p>
      </template>
    </PlatformFooter>
  </div>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
  }

  .pill-header__brand {
    white-space: nowrap;
    text-transform: none;
    letter-spacing: 0;
    font-size: var(--font-size-s);
  }

  &__footer-nav {
    display: flex;
    gap: var(--space);
    flex-wrap: wrap;

    a {
      color: inherit;

      &:hover {
        color: var(--color-primary);
        text-decoration: none;
      }
    }
  }

  &__footer-meta {
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: color-mix(in srgb, currentColor, transparent 22%);
  }
}
</style>

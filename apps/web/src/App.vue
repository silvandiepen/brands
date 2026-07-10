<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBemm } from 'bemm'

const { bemm } = useBemm('app')
const route = useRoute()
const theme = ref<'light' | 'dark'>('light')

const navItems = [
  { to: '/brands', label: 'Browse' },
  { to: '/collections', label: 'Collections' },
  { to: '/cart', label: 'Cart' },
  { to: '/docs', label: 'Docs' },
  { to: '/playground', label: 'Playground' },
  { to: '/contribute', label: 'Contribute' },
]

const currentPath = computed(() => route.path)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
}
</script>

<template>
  <div :class="bemm()" :data-theme="theme">
    <header :class="bemm('header')">
      <div class="container" :class="bemm('header-inner')">
        <RouterLink to="/" :class="bemm('logo')">
          <strong>Open</strong> Brands
        </RouterLink>
        <nav :class="bemm('nav')">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="['nav-link', { active: currentPath.startsWith(item.to) }]"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <button class="btn" @click="toggleTheme" aria-label="Toggle theme">
          {{ theme === 'light' ? 'Dark' : 'Light' }}
        </button>
      </div>
    </header>

    <main :class="bemm('main')">
      <RouterView />
    </main>

    <footer :class="bemm('footer')">
      <div class="container">
        <p>
          <RouterLink to="/">Open Brands</RouterLink>
          &mdash; Reviewed brand logos, colors, and metadata.
          <RouterLink to="/legal">Legal</RouterLink>
          &middot;
          <RouterLink to="/quality">Quality</RouterLink>
        </p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__header {
    border-bottom: 1px solid var(--ob-border);
    background: var(--ob-bg);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  &__header-inner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.5rem;
  }

  &__logo {
    font-size: 1.25rem;
    color: var(--ob-text);
    &:hover { text-decoration: none; }
    strong { color: var(--ob-primary); }
  }

  &__nav {
    display: flex;
    gap: 0.25rem;
    flex: 1;
  }

  &__main {
    flex: 1;
  }

  &__footer {
    border-top: 1px solid var(--ob-border);
    padding: 1.5rem 0;
    text-align: center;
    font-size: 0.875rem;
    color: var(--ob-text-muted);
  }
}

.nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: var(--ob-radius);
  color: var(--ob-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  &:hover { background: var(--ob-bg-alt); color: var(--ob-text); text-decoration: none; }
  &.active { color: var(--ob-primary); background: var(--ob-bg-alt); }
}
</style>

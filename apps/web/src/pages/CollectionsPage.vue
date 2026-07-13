<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { collectionsIndex, brandIndex } from '../data/loader'
import { inkOn } from '../utils'
import { useBrandApi } from '../stores/api'
import HeadingSection from '../components/HeadingSection.vue'

const bemm = useBemm('collections-page')
const { logoUrl } = useBrandApi()

const collectionDescriptions: Record<string, string> = {
  automotive: 'Vehicle makers, mobility platforms, automation tools, and brands connected to transport culture.',
  cloud: 'Infrastructure, hosting, storage, deployment, and cloud-native platforms for modern software teams.',
  cryptocurrency: 'Coins, exchanges, wallets, protocols, and identity systems from the crypto and Web3 ecosystem.',
  'developer-tools': 'Frameworks, editors, runtimes, databases, and utilities that developers reach for every day.',
  fashion: 'Apparel, sportswear, luxury houses, beauty, and retail brands with highly recognizable visual systems.',
  finance: 'Banks, payment networks, fintech products, exchanges, and financial infrastructure brands.',
  food: 'Restaurants, packaged goods, drinks, coffee, snacks, and food delivery brands.',
  gaming: 'Studios, platforms, engines, communities, and services around games and interactive entertainment.',
  hardware: 'Electronics, cameras, components, instruments, and physical technology manufacturers.',
  'media-streaming': 'Music, video, creator, streaming, and entertainment platforms built around audience attention.',
  messaging: 'Chat apps, collaboration tools, social messaging networks, and real-time communication products.',
  pharma: 'Healthcare and pharmaceutical brands with regulated, high-trust identity systems.',
  retail: 'Stores, marketplaces, commerce platforms, food chains, and consumer buying destinations.',
  'social-media': 'Social networks and publishing platforms where identity, sharing, and public presence matter.',
  software: 'Software companies, apps, operating systems, productivity tools, and digital product brands.',
  technology: 'A broad technology collection spanning software, services, electronics, platforms, and tools.',
}

function brandBg(brandId: string): string {
  return brandIndex[brandId]?.primaryColor ?? '#f5f5f5'
}

function sectionColor(brandIds: string[]): string {
  return brandIds.map(id => brandIndex[id]?.primaryColor).find(Boolean) ?? '#f5f5f5'
}

function featuredNames(brandIds: string[]): string {
  return brandIds
    .slice(0, 4)
    .map(id => brandIndex[id]?.name)
    .filter((name): name is string => Boolean(name))
    .join(', ')
}

const collections = computed(() =>
  Object.values(collectionsIndex).map((collection) => {
    const accent = sectionColor(collection.brandIds)
    return {
      ...collection,
      accent,
      ink: inkOn(accent),
      description: collectionDescriptions[collection.id] ?? 'A curated group of brands selected for discovery and practical browsing.',
      featured: featuredNames(collection.brandIds),
    }
  }),
)
</script>

<template>
  <div :class="bemm()">
    <HeadingSection
      eyebrow="Curated sets"
      title="Collections"
      description="Hand-picked groups for browsing by workflow, market, and visual language. Categories classify every brand; collections are editorial shortcuts into the library."
    />

    <div :class="bemm('sections')">
      <section
        v-for="(col, index) in collections"
        :key="col.id"
        :class="[bemm('section'), index % 2 ? bemm('section', 'reverse') : '', 'reveal']"
        :style="{
          '--collections-page-accent': col.accent,
          '--collections-page-ink': col.ink,
        }"
      >
        <div :class="[bemm('inner'), 'container']">
          <div :class="bemm('copy')">
            <span :class="bemm('index')">{{ String(index + 1).padStart(2, '0') }}</span>
            <h2 :class="bemm('section-title')">{{ col.name }}</h2>
            <p :class="bemm('description')">{{ col.description }}</p>
            <p v-if="col.featured" :class="bemm('featured')">
              <span>Featuring</span>
              {{ col.featured }}
            </p>
            <div :class="bemm('meta')">
              <span :class="bemm('count')">{{ col.brandIds.length }} brands</span>
              <RouterLink :to="{ path: '/brands', query: { collection: col.id } }" :class="bemm('link')">
                Browse collection
              </RouterLink>
            </div>
          </div>

          <div :class="bemm('logo-field')" aria-label="Collection logos">
            <RouterLink
              v-for="id in col.brandIds"
              :key="id"
              :to="`/brands/${id}`"
              :class="bemm('tile')"
              :style="{
                '--collections-page-tile-background': brandBg(id),
                '--collections-page-tile-ink': inkOn(brandBg(id)),
                '--collections-page-tile-logo': `url('${logoUrl(id)}')`,
              }"
              :title="brandIndex[id]?.name ?? id"
            >
              <span :class="bemm('tile-logo')" role="img" :aria-label="brandIndex[id]?.name ?? id" />
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss">
.collections-page {
  padding-bottom: var(--space-xl);

  &__sections {
    display: grid;
    gap: 0;
  }

  &__section {
    --collections-page-accent: var(--color-primary);
    --collections-page-ink: var(--color-foreground);

    position: relative;
    overflow: clip;
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--collections-page-accent), var(--color-background) 78%),
        color-mix(in srgb, var(--collections-page-accent), var(--color-background) 92%)
      );
  }

  &__inner {
    display: grid;
    grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr);
    gap: clamp(var(--space-l), 5vw, var(--space-xl));
    align-items: center;
    min-height: min(78vh, 760px);
    padding-top: clamp(var(--space-xl), 7vw, 7rem);
    padding-bottom: clamp(var(--space-xl), 7vw, 7rem);
  }

  &__section--reverse &__inner {
    grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  }

  &__section--reverse &__copy {
    order: 2;
  }

  &__copy {
    display: grid;
    gap: var(--space);
    max-width: 560px;
  }

  &__index {
    width: fit-content;
    padding: 0.35rem 0.55rem;
    border-radius: var(--border-radius-m);
    background: color-mix(in srgb, var(--collections-page-accent), var(--color-background) 55%);
    color: var(--collections-page-ink);
    font-size: var(--font-size-xs);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  &__section-title {
    font-size: clamp(2.25rem, 7vw, 5.8rem);
    line-height: 0.92;
    max-width: 9ch;
  }

  &__description {
    max-width: 48ch;
    color: color-mix(in srgb, var(--color-foreground), transparent 24%);
    font-size: clamp(var(--font-size), 1.6vw, var(--font-size-l));
    line-height: 1.5;
  }

  &__featured {
    display: grid;
    gap: 0.25rem;
    max-width: 48ch;
    color: color-mix(in srgb, var(--color-foreground), transparent 24%);
    font-size: var(--font-size-s);

    span {
      color: color-mix(in srgb, var(--color-foreground), transparent 52%);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    flex-wrap: wrap;
  }

  &__count,
  &__link {
    min-height: 2.5rem;
    display: inline-flex;
    align-items: center;
    border-radius: var(--border-radius-l);
    font-size: var(--font-size-s);
    font-weight: 700;
  }

  &__count {
    padding: 0 0.8rem;
    background: color-mix(in srgb, var(--color-background), transparent 18%);
    color: color-mix(in srgb, var(--color-foreground), transparent 18%);
  }

  &__link {
    padding: 0 1rem;
    background: var(--color-foreground);
    color: var(--color-background);
    text-decoration: none;

    &:hover {
      text-decoration: none;
      background: color-mix(in srgb, var(--color-foreground), transparent 12%);
    }
  }

  &__logo-field {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: clamp(0.45rem, 1vw, 0.8rem);
    align-content: center;
  }

  &__tile {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0.55rem, 1.2vw, 1rem);
    border-radius: var(--border-radius-l);
    background: var(--collections-page-tile-background, var(--color-accent));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 90%);
    overflow: hidden;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      transform: translateY(-3px);
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 90%),
        0 10px 26px color-mix(in srgb, var(--color-dark), transparent 88%);
      z-index: 1;
    }
  }

  &__tile-logo {
    width: 100%;
    height: 100%;
    background-color: var(--collections-page-tile-ink, var(--color-foreground));
    mask: var(--collections-page-tile-logo) no-repeat center / contain;
  }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: view()) {
      &__logo-field {
        animation: collections-page-logo-drift linear both;
        animation-timeline: view();
        animation-range: entry 0% cover 45%;
      }
    }
  }

  @media (max-width: 820px) {
    &__inner,
    &__section--reverse &__inner {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    &__section--reverse &__copy {
      order: 0;
    }

    &__section-title {
      max-width: 12ch;
    }

    &__logo-field {
      grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
    }
  }
}

@keyframes collections-page-logo-drift {
  from {
    opacity: 0.65;
    transform: translateY(22px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

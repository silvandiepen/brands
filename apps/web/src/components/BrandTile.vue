<script setup lang="ts">
import { useBemm } from 'bemm'

defineProps<{
  brandId: string
  name: string
  bg: string
  ink: string
  logoUrl: string
  /** show the name below the logo at all times instead of on hover */
  showName?: boolean
}>()

const bemm = useBemm('brand-tile', { return: 'string', includeBaseClass: true })
</script>

<template>
  <RouterLink
    :to="`/brands/${brandId}`"
    :class="[bemm('', { named: showName }), 'reveal']"
    :style="{
      '--brand-tile-background': bg,
      '--brand-tile-ink': ink,
      '--brand-tile-logo': `url('${logoUrl}')`,
    }"
    :title="name"
  >
    <span :class="bemm('logo')" role="img" :aria-label="name" />
    <span :class="bemm('name')">{{ name }}</span>
  </RouterLink>
</template>

<style lang="scss">
.brand-tile {
  --brand-tile-background: var(--color-accent);
  --brand-tile-ink: var(--color-foreground);
  --brand-tile-radius: var(--border-radius-xl);

  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
  padding: var(--space);
  border-radius: var(--brand-tile-radius);
  background: var(--brand-tile-background);
  // keeps near-white tiles from melting into the page background
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 92%);
  position: relative;
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--color-dark), transparent 92%),
      var(--shadow-l);
    z-index: 1;
    text-decoration: none;
  }

  // logo drawn as a mask so it always renders in the ink color,
  // guaranteeing contrast against the brand-colored tile
  &__logo {
    width: 50%;
    flex: 0 0 50%;
    background-color: var(--brand-tile-ink);
    mask: var(--brand-tile-logo) no-repeat center / contain;
    transition: transform var(--transition);
  }

  &:hover &__logo {
    transform: scale(1.06);
  }

  &__name {
    position: absolute;
    bottom: var(--space-s);
    left: var(--space-s);
    right: var(--space-s);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--brand-tile-ink);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity var(--transition-fast), transform var(--transition-fast);
    pointer-events: none;
  }

  &:hover &__name {
    opacity: 0.85;
    transform: translateY(0);
  }

  &--named {
    .brand-tile__logo {
      width: 46%;
      flex: 0 0 46%;
    }

    .brand-tile__name {
      position: static;
      opacity: 0.75;
      transform: none;
      max-width: 100%;
    }
  }
}
</style>

<script setup lang="ts">
import { useBemm } from 'bemm'

withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'dark'
}>(), {
  eyebrow: '',
  description: '',
  align: 'left',
  tone: 'default',
})

const bemm = useBemm('heading-section', { return: 'string', includeBaseClass: true })
</script>

<template>
  <header
    :class="[
      bemm(),
      bemm('', align),
      bemm('', tone),
      'fade-up',
    ]"
  >
    <div :class="[bemm('inner'), 'container']">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1 :class="bemm('title')">{{ title }}</h1>
      <p v-if="description" :class="bemm('description')">{{ description }}</p>
      <slot />
    </div>
  </header>
</template>

<style lang="scss">
.heading-section {
  padding-top: calc(var(--app-header-height) + clamp(var(--space-l), 6vw, var(--space-xl)));
  padding-bottom: clamp(var(--space-l), 6vw, var(--space-xl));

  &--dark {
    color: #f7f9ff;
    background:
      radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--color-primary), transparent 82%), transparent 24rem),
      linear-gradient(180deg, #070b12 0%, #0b111a 100%);
  }

  &--center {
    text-align: center;
  }

  &__inner {
    display: grid;
    gap: var(--space);
  }

  &--center &__inner {
    justify-items: center;
  }

  &__title {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(var(--font-size-xl), 5vw, var(--font-size-xxl));
    line-height: 0.98;
    letter-spacing: 0;
  }

  &--center &__title {
    max-width: 16ch;
  }

  &__description {
    max-width: 68ch;
    color: color-mix(in srgb, currentColor, transparent 34%);
    font-size: var(--font-size-l);
    line-height: 1.5;
  }
}
</style>

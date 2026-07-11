<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  brandId: string
  alt?: string
  apiBase?: string
}>()

const API = props.apiBase ?? 'https://open-brands-api.vandipyan.workers.dev'
const svgContent = ref('')
const loaded = ref(false)
const cache = new Map<string, string>()

async function load() {
  if (cache.has(props.brandId)) {
    svgContent.value = cache.get(props.brandId)!
    loaded.value = true
    return
  }
  try {
    const res = await fetch(`${API}/logo/${props.brandId}.svg`)
    const text = await res.text()
    cache.set(props.brandId, text)
    svgContent.value = text
    loaded.value = true
  } catch {
    loaded.value = true
  }
}

watch(() => props.brandId, load, { immediate: true })
</script>

<template>
  <span class="logo-inline" :aria-label="alt" v-html="svgContent" />
</template>

<style scoped>
.logo-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.logo-inline :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
</style>

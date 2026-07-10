<script setup lang="ts">
import { useBemm } from 'bemm'

const { bemm } = useBemm('app')
</script>

<template>
  <main :class="bemm()">
    <h1>Open Brands</h1>
  </main>
</template>

<style lang="scss">
.app {
  min-height: 100vh;
}
</style>

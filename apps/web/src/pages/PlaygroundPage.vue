<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { Button, InputSelect } from '@sil/ui'

const bemm = useBemm('playground-page')
const method = ref('GET')
const endpoint = ref('/v1/search?q=google')
const apiOrigin = 'https://open-brands-api.vandipyan.workers.dev'
const response = ref<string>('')
const loading = ref(false)
const error = ref('')

async function sendRequest() {
  loading.value = true
  error.value = ''
  response.value = ''
  try {
    const res = await fetch(`${apiOrigin}${endpoint.value}`, { method: method.value })
    const data = await res.json()
    response.value = JSON.stringify(data, null, 2)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    loading.value = false
  }
}

const examples = [
  'GET /v1/meta',
  'GET /v1/brands',
  'GET /v1/search?q=python',
  'GET /v1/brands/github',
  'GET /v1/resolve/netflix.com',
  'GET /v1/categories',
  'GET /v1/collections',
]

function applyExample(ex: string) {
  const parts = ex.split(' ')
  method.value = parts[0] ?? 'GET'
  endpoint.value = parts[1] ?? '/'
}
</script>

<template>
  <div :class="[bemm(), 'container']">
    <header :class="[bemm('head'), 'fade-up']">
      <h1 :class="bemm('title')">API Playground</h1>
      <p :class="bemm('sub')">Try the Open Brands API using the same anonymous public limits as any consumer.</p>
    </header>

    <div :class="[bemm('form'), 'fade-up']" style="animation-delay: 80ms">
      <div :class="bemm('row')">
        <div :class="bemm('method')">
          <InputSelect v-model="method" :options="['GET', 'POST']" />
        </div>
        <input v-model="endpoint" :class="bemm('endpoint')" placeholder="/v1/…" @keydown.enter="sendRequest" />
        <Button variant="primary" :loading="loading" @click="sendRequest">Send</Button>
      </div>
      <div :class="bemm('examples')">
        <Button v-for="ex in examples" :key="ex" size="small" variant="outline" @click="applyExample(ex)">
          {{ ex }}
        </Button>
      </div>
    </div>

    <div v-if="error" :class="bemm('error')">{{ error }}</div>
    <div v-if="response" :class="[bemm('result'), 'fade-up']">
      <h2 :class="bemm('heading')">Response</h2>
      <pre :class="bemm('response')">{{ response }}</pre>
    </div>
  </div>
</template>

<style lang="scss">
.playground-page {
  padding-top: var(--space);
  padding-bottom: var(--space-xl);

  &__head {
    padding-bottom: var(--space-l);
    margin-bottom: var(--space-l);
    border-bottom: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }

  &__title {
    font-size: clamp(var(--font-size-xl), 4vw, var(--font-size-xxl));
    margin-bottom: var(--space-xs);
  }

  &__sub {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    max-width: 60ch;
  }

  &__row {
    display: flex;
    gap: var(--space-s);
    margin-bottom: var(--space);
    align-items: stretch;
  }

  &__method {
    width: 120px;
    flex-shrink: 0;
  }

  &__endpoint {
    flex: 1;
    padding: var(--space-s) var(--space);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 80%);
    border-radius: var(--border-radius-xl);
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-s);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary), transparent 88%);
    }
  }

  &__examples {
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;
    margin-bottom: var(--space-l);
  }

  &__error {
    color: var(--color-error);
    margin-bottom: var(--space);
  }

  &__heading {
    font-size: var(--font-size);
    margin-bottom: var(--space-s);
  }

  &__response {
    background: color-mix(in srgb, var(--color-background), var(--color-foreground) 4%);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
    border-radius: var(--border-radius-xl);
    padding: var(--space);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-xs);
    overflow-x: auto;
    max-height: 500px;
    white-space: pre-wrap;
  }
}
</style>

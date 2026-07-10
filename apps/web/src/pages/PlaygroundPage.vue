<script setup lang="ts">
import { ref, computed } from 'vue'

const method = ref('GET')
const endpoint = ref('/v1/search?q=google')
const apiOrigin = 'https://api.open-brands.org'
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
</script>

<template>
  <div class="container playground-page">
    <h1>API Playground</h1>
    <p class="subtitle">Try the Open Brands API using the same anonymous public limits as any consumer.</p>

    <div class="playground-layout">
      <div class="playground-form">
        <div class="form-row">
          <select v-model="method" class="filter-select method-select">
            <option>GET</option>
            <option>POST</option>
          </select>
          <input v-model="endpoint" class="search-input" placeholder="/v1/..." @keydown.enter="sendRequest" />
          <button class="btn btn--primary" @click="sendRequest" :disabled="loading">Send</button>
        </div>
        <div class="examples">
          <button v-for="ex in examples" :key="ex" class="btn example-btn" @click="() => { const parts = ex.split(' '); method = parts[0] ?? 'GET'; endpoint = parts[1] ?? '/' }">
            {{ ex }}
          </button>
        </div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="response" class="response-container">
        <h2>Response</h2>
        <pre class="response">{{ response }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.playground-page { padding: 2rem 0 4rem; }
.subtitle { color: var(--ob-text-muted); margin-bottom: 2rem; }
.form-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.method-select { width: 80px; }
.filter-select, .search-input {
  padding: 0.5rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  color: var(--ob-text);
}
.examples {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.example-btn { font-size: 0.75rem; }
.error { color: red; margin-bottom: 1rem; }
.response-container h2 { font-size: 1rem; margin-bottom: 0.5rem; }
.response {
  background: var(--ob-bg-alt);
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  padding: 1rem;
  font-family: monospace;
  font-size: 0.8rem;
  overflow-x: auto;
  max-height: 500px;
  white-space: pre-wrap;
}
</style>

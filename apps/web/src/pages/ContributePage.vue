<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useBemm } from 'bemm'

const { bemm } = useBemm('contribute')
const apiBase = 'https://open-brands-api.vandipyan.workers.dev'

const user = ref<{ id: number; login: string } | null>(null)
const authUrl = ref('')
const step = ref(0)
const submitting = ref(false)
const result = ref<{ prUrl?: string; error?: string } | null>(null)

const form = reactive({
  type: 'new-brand' as 'new-brand' | 'edit-brand' | 'add-asset' | 'correct-colors',
  brandId: '',
  name: '',
  aliases: '',
  domains: '',
  categories: '',
  tags: '',
  status: 'active',
  colors: [] as Array<{ id: string; value: string; role: string; name: string }>,
  assets: [] as Array<{ file: File; assetId: string; type: string; variant: string; content: string }>,
  sourceUrl: '',
  sourceTitle: '',
  sourceType: 'official-website',
  declarations: {
    sourcesPublic: false,
    noConfidentialMaterial: false,
    noOwnershipClaim: false,
  },
})

const steps = ['GitHub', 'Brand', 'Colors', 'SVG Assets', 'Sources', 'Review']

const contributionTypes = [
  {
    icon: '+',
    title: 'Add a new brand',
    copy: 'Submit a brand profile with names, domains, categories, tags, colors, and public source links.',
  },
  {
    icon: '✎',
    title: 'Improve an existing brand',
    copy: 'Correct names, domains, aliases, categories, status, sources, and metadata that help search and filtering.',
  },
  {
    icon: '⇧',
    title: 'Add or replace assets',
    copy: 'Upload official SVG logos, icons, wordmarks, symbols, or lockups with clear asset type and variant labels.',
  },
  {
    icon: '#',
    title: 'Correct colors',
    copy: 'Add brand palettes, fix inaccurate hex values, and mark roles such as primary, secondary, accent, or neutral.',
  },
]

const sourceRequirements = [
  {
    icon: '◎',
    title: 'Official sources',
    copy: 'Link to public, verifiable sources. Official references matter more than perfect completeness.',
  },
  {
    icon: 'A',
    title: 'Clean SVGs',
    copy: 'Upload optimized SVGs with accurate names, clear asset types, and no embedded raster images.',
  },
  {
    icon: '◇',
    title: 'Public and respectful',
    copy: 'No private, internal, scraped paid, or confidential assets. Logos remain owned by their owners.',
  },
]

const workflow = [
  {
    title: 'Sign in',
    copy: 'Use GitHub to securely authenticate and attribute the submission.',
  },
  {
    title: 'Submit details',
    copy: 'Add brand metadata, domains, categories, tags, and optional colors.',
  },
  {
    title: 'Upload assets',
    copy: 'Attach and classify each official SVG asset.',
  },
  {
    title: 'Review',
    copy: 'A pull request or contribution record is created for maintainer review.',
  },
]

async function signIn() {
  try {
    const res = await fetch(`${apiBase}/api/contributions/login`)
    const data = await res.json()
    authUrl.value = data.authUrl
    if (data.mode === 'emulation') {
      const cb = await fetch(`${apiBase}/api/contributions/callback?code=local-emulation`)
      const cbData = await cb.json()
      user.value = cbData.user
      step.value = 1
    } else {
      window.location.href = data.authUrl
    }
  } catch {
    user.value = { id: 1001, login: 'local-contributor' }
    step.value = 1
  }
}

function addColor() {
  form.colors.push({ id: `color-${form.colors.length + 1}`, value: '#000000', role: 'primary', name: '' })
}
function removeColor(i: number) {
  form.colors.splice(i, 1)
}

function onFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  for (const file of Array.from(input.files)) {
    if (file.size > 524288) { alert(`${file.name} exceeds 512 KiB`); continue }
    if (!file.name.endsWith('.svg')) { alert(`${file.name} is not an SVG`); continue }
    const reader = new FileReader()
    reader.onload = () => {
      form.assets.push({
        file,
        assetId: file.name.replace(/\.svg$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        type: 'symbol',
        variant: 'color',
        content: reader.result as string,
      })
    }
    reader.readAsText(file)
  }
}
function removeAsset(i: number) {
  form.assets.splice(i, 1)
}

const canProceed = computed(() => {
  switch (step.value) {
    case 0: return !!user.value
    case 1: return form.brandId && form.name
    case 2: return true
    case 3: return form.assets.length > 0
    case 4: return form.sourceUrl && form.sourceTitle
    case 5: return form.declarations.sourcesPublic && form.declarations.noConfidentialMaterial && form.declarations.noOwnershipClaim
    default: return true
  }
})

function next() { if (canProceed.value && step.value < 5) step.value++ }
function back() { if (step.value > 0) step.value-- }

const manifestPreview = computed(() => {
  return JSON.stringify(buildManifest(), null, 2)
})

function buildManifest() {
  return {
    $schema: '../../../packages/schema/json-schema/brand.schema.json',
    id: form.brandId,
    name: form.name,
    aliases: form.aliases.split(',').map(s => s.trim()).filter(Boolean),
    domains: form.domains.split(',').map(s => s.trim()).filter(Boolean),
    status: form.status,
    categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
    tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    colors: form.colors.map(c => ({
      id: c.id, name: c.name || null, value: c.value, role: c.role,
      themes: ['light'], sourceIds: ['src-1'], reviewStatus: 'community-sourced',
    })),
    assets: form.assets.map(a => ({
      id: a.assetId, file: `assets/${a.file.name}`,
      type: a.type, variant: a.variant,
      themes: ['light', 'dark'], monochrome: false, current: true,
      sourceIds: ['src-1'], reviewStatus: 'community-sourced',
    })),
    sources: [{
      id: 'src-1', type: form.sourceType, url: form.sourceUrl,
      title: form.sourceTitle, accessedAt: new Date().toISOString().slice(0, 10),
    }],
    review: { status: 'partial', method: 'community-review' },
  }
}

async function submit() {
  submitting.value = true
  result.value = null
  try {
    const files = form.assets.map(a => ({
      path: `data/brands/${form.brandId}/assets/${a.file.name}`,
      content: a.content,
    }))

    const res = await fetch(`${apiBase}/api/contributions/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value?.id,
        userLogin: user.value?.login,
        brandId: form.brandId,
        manifest: buildManifest(),
        files,
      }),
    })
    const data = await res.json()
    if (res.ok && data.prUrl) {
      result.value = { prUrl: data.prUrl }
    } else if (res.ok && data.submissionId) {
      result.value = { prUrl: data.prUrl ?? `Submission ${data.submissionId} created` }
    } else {
      result.value = { error: data.error?.message ?? 'Submission failed' }
    }
  } catch (e) {
    result.value = { error: e instanceof Error ? e.message : 'Network error' }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div :class="bemm()">
    <header :class="[bemm('hero'), 'fade-up']">
      <div :class="bemm('hero-copy')">
        <p class="eyebrow">Community contributions</p>
        <h1>Contribute a Brand</h1>
        <p :class="bemm('intro')">
          Help keep Open Brands accurate and complete for everyone. Add missing brands,
          improve metadata, and attach official SVG assets with public source references.
        </p>
        <div :class="bemm('hero-actions')">
          <button class="btn btn--primary" @click="signIn">
            <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Sign in with GitHub
          </button>
          <a href="#contribution-form">Learn how it works</a>
        </div>
      </div>
      <div :class="bemm('hero-art')" aria-hidden="true">
        <div class="art-grid"></div>
        <div class="art-card art-card--main">
          <span class="art-logo">A</span>
        </div>
        <div class="art-card art-card--tag">◆</div>
        <div class="art-card art-card--link">⌁</div>
        <div class="art-card art-card--image">▣</div>
        <div class="art-card art-card--color">●</div>
      </div>
    </header>

    <section :class="[bemm('section'), bemm('section', 'ways'), 'reveal']" aria-label="Contribution options">
      <div :class="bemm('section-inner')">
        <p class="eyebrow">Ways to contribute</p>
        <div :class="bemm('info-grid')">
          <article v-for="item in contributionTypes" :key="item.title" :class="bemm('info-card')">
            <span :class="bemm('info-icon')">{{ item.icon }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section :class="[bemm('section'), bemm('section', 'quality'), 'reveal']">
      <div :class="bemm('section-inner')">
        <p class="eyebrow">What makes a good contribution</p>
        <div :class="bemm('requirements')">
          <article v-for="item in sourceRequirements" :key="item.title" :class="bemm('requirement')">
            <span :class="bemm('info-icon')">{{ item.icon }}</span>
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.copy }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <main id="contribution-form" class="container" :class="bemm('form-shell')">
      <section :class="[bemm('workflow'), 'reveal']" aria-label="Contribution workflow">
        <p class="eyebrow">How it works</p>
        <ol>
          <li v-for="(item, index) in workflow" :key="item.title">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.copy }}</p>
          </li>
        </ol>
      </section>

      <section v-if="step === 0" :class="[bemm('signin-panel'), 'reveal']">
        <div :class="bemm('github-mark')" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="56" height="56" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        </div>
        <div>
          <h2>Ready to contribute?</h2>
          <p>Sign in with GitHub to start contributing brand data, assets, and source references to Open Brands.</p>
        </div>
        <button class="btn btn--primary" @click="signIn">
          <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          Sign in with GitHub
        </button>
      </section>

    <div :class="bemm('progress')" v-if="step > 0">
      <button v-for="(label, i) in steps" :key="i"
        :class="['progress-step', { active: step === i, done: step > i }]"
        @click="step = i" :disabled="i > step">
        <span class="step-num">{{ i + 1 }}</span>
        <span class="step-label">{{ label }}</span>
      </button>
    </div>

    <!-- Step 1: Brand details -->
    <div v-if="step === 1" class="card step-card">
      <h2>Brand details</h2>
      <p class="step-help">
        Use stable, searchable identifiers. Categories describe the brand’s industry; tags describe useful search terms,
        product areas, or technology names.
      </p>
      <p v-if="user" class="signed-in">Signed in as @{{ user.login }}</p>
      <div class="form-grid">
        <div class="field">
          <label>Brand ID *</label>
          <input v-model="form.brandId" placeholder="e.g. my-brand" class="input" />
          <small>kebab-case, permanent identifier</small>
        </div>
        <div class="field">
          <label>Display name *</label>
          <input v-model="form.name" placeholder="e.g. My Brand" class="input" />
        </div>
        <div class="field">
          <label>Aliases</label>
          <input v-model="form.aliases" placeholder="comma, separated" class="input" />
        </div>
        <div class="field">
          <label>Domains</label>
          <input v-model="form.domains" placeholder="mybrand.com, app.mybrand.com" class="input" />
        </div>
        <div class="field">
          <label>Categories</label>
          <input v-model="form.categories" placeholder="technology, developer-tools" class="input" />
        </div>
        <div class="field">
          <label>Tags</label>
          <input v-model="form.tags" placeholder="search, ai, platform" class="input" />
        </div>
      </div>
    </div>

    <!-- Step 2: Colors -->
    <div v-if="step === 2" class="card step-card">
      <h2>Colors</h2>
      <p class="step-help">
        Add colors only when you have a reliable source. Use roles to explain how each color is used in the identity.
      </p>
      <div v-if="form.colors.length === 0" class="empty-inline">
        <p>No colors added yet. Brand colors are optional but recommended.</p>
      </div>
      <div v-for="(color, i) in form.colors" :key="i" class="color-row">
        <input type="color" v-model="color.value" class="color-picker" />
        <input v-model="color.name" placeholder="Color name" class="input" />
        <select v-model="color.role" class="input select">
          <option value="primary">primary</option>
          <option value="secondary">secondary</option>
          <option value="accent">accent</option>
          <option value="neutral">neutral</option>
          <option value="background">background</option>
        </select>
        <button class="btn btn-remove" @click="removeColor(i)">Remove</button>
      </div>
      <button class="btn" @click="addColor">+ Add color</button>
    </div>

    <!-- Step 3: SVG upload -->
    <div v-if="step === 3" class="card step-card">
      <h2>SVG Assets</h2>
      <p>
        Upload up to 5 SVG files. Max 512 KiB each. Prefer current official assets with simple, scalable vector paths.
      </p>
      <label class="upload-zone">
        <input type="file" accept=".svg,image/svg+xml" multiple @change="onFileUpload" />
        <span>Click to select SVG files</span>
      </label>
      <div v-if="form.assets.length" class="asset-list">
        <div v-for="(asset, i) in form.assets" :key="i" class="asset-row">
          <div class="asset-preview" v-html="asset.content"></div>
          <div class="asset-fields">
            <input v-model="asset.assetId" placeholder="asset-id" class="input" />
            <select v-model="asset.type" class="input select">
              <option value="symbol">symbol</option>
              <option value="icon">icon</option>
              <option value="logo">logo</option>
              <option value="wordmark">wordmark</option>
              <option value="lockup">lockup</option>
            </select>
            <select v-model="asset.variant" class="input select">
              <option value="color">color</option>
              <option value="monochrome">monochrome</option>
              <option value="white">white</option>
              <option value="black">black</option>
            </select>
            <span class="file-size">{{ (asset.file.size / 1024).toFixed(1) }} KB</span>
          </div>
          <button class="btn btn-remove" @click="removeAsset(i)">Remove</button>
        </div>
      </div>
    </div>

    <!-- Step 4: Sources -->
    <div v-if="step === 4" class="card step-card">
      <h2>Sources</h2>
      <p>
        Every asset must reference a public source. Preferred sources are official brand guidelines, press kits,
        media kits, or public repositories controlled by the brand owner.
      </p>
      <div class="form-grid">
        <div class="field">
          <label>Source URL *</label>
          <input v-model="form.sourceUrl" placeholder="https://brand.example.com/logo" class="input" />
        </div>
        <div class="field">
          <label>Source title *</label>
          <input v-model="form.sourceTitle" placeholder="Official Brand Guidelines" class="input" />
        </div>
        <div class="field">
          <label>Source type</label>
          <select v-model="form.sourceType" class="input select">
            <option value="official-guidelines">Official guidelines</option>
            <option value="official-download">Official download</option>
            <option value="official-website">Official website</option>
            <option value="trademark-registry">Trademark registry</option>
            <option value="repository">Repository</option>
            <option value="community-reference">Community reference</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Step 5: Review -->
    <div v-if="step === 5" class="card step-card">
      <h2>Review &amp; Submit</h2>
      <p class="step-help">
        Review the generated manifest before submitting. A maintainer still checks source quality, naming,
        asset type, and trademark-sensitive details before merging.
      </p>
      <div class="review-summary">
        <p><strong>Brand:</strong> {{ form.name }} ({{ form.brandId }})</p>
        <p><strong>Assets:</strong> {{ form.assets.length }} SVG file(s)</p>
        <p><strong>Colors:</strong> {{ form.colors.length }}</p>
        <p><strong>Source:</strong> {{ form.sourceTitle }}</p>
      </div>

      <div class="declarations">
        <label class="checkbox">
          <input type="checkbox" v-model="form.declarations.sourcesPublic" />
          All sources are publicly accessible
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="form.declarations.noConfidentialMaterial" />
          No confidential or proprietary material is included
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="form.declarations.noOwnershipClaim" />
          I do not claim ownership of the trademarks
        </label>
      </div>

      <details class="manifest-preview">
        <summary>Preview brand.json</summary>
        <pre>{{ manifestPreview }}</pre>
      </details>

      <div v-if="result" class="result" :class="{ success: result.prUrl, error: result.error }">
        <template v-if="result.prUrl">
          <p>Pull request created!</p>
          <a :href="result.prUrl" target="_blank" class="btn btn--primary">{{ result.prUrl }}</a>
        </template>
        <template v-if="result.error">
          <p>{{ result.error }}</p>
        </template>
      </div>

      <button class="btn btn--primary" @click="submit" :disabled="submitting || !canProceed">
        {{ submitting ? 'Submitting...' : 'Submit contribution' }}
      </button>
    </div>

    <!-- Navigation -->
    <div class="step-nav" v-if="step > 0 && step < 5">
      <button class="btn" @click="back">Back</button>
      <button class="btn btn--primary" @click="next" :disabled="!canProceed">Next</button>
    </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.contribute {
  min-height: 100vh;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--color-primary), transparent 82%), transparent 24rem),
    linear-gradient(180deg, #070b12 0%, #0b111a 44%, color-mix(in srgb, var(--color-background), #0b111a 18%) 100%);
}
h1 {
  margin: var(--space-xs) 0 var(--space);
  font-size: clamp(var(--font-size-xl), 5vw, var(--font-size-xxl));
  letter-spacing: 0;
}
h2 { margin-bottom: 1rem; }
.contribute__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
  gap: var(--space-xl);
  align-items: center;
  max-width: 1180px;
  min-height: 520px;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 8rem) var(--space-l) clamp(4rem, 8vw, 6rem);
  color: #f7f9ff;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: var(--space-xl);
  }
}
.contribute__hero-copy {
  max-width: 620px;
  position: relative;
  z-index: 1;
}
.contribute__intro {
  max-width: 560px;
  color: color-mix(in srgb, #f7f9ff, transparent 28%);
  font-size: var(--font-size-l);
  line-height: 1.45;
}
.contribute__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--space);
  margin-top: var(--space-l);
  flex-wrap: wrap;

  a {
    color: #4d8dff;
    font-weight: 700;
    text-decoration: none;

    &::after {
      content: ' ->';
    }
  }
}
.contribute__hero-art {
  position: relative;
  min-height: 330px;

  @media (max-width: 840px) {
    min-height: 260px;
  }
}
.art-grid {
  position: absolute;
  inset: 0;
  opacity: 0.34;
  background-image: radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.5px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at 50% 50%, black 0%, transparent 72%);
}
.art-card {
  position: absolute;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035));
  color: #3f82ff;
  font-weight: 900;
  box-shadow: 0 24px 80px rgba(0,0,0,0.24);
}
.art-card--main {
  top: 76px;
  left: 28%;
  width: 190px;
  height: 190px;
  color: #fff;
}
.art-logo {
  display: grid;
  place-items: center;
  width: 110px;
  height: 110px;
  border: 1px solid rgba(255,255,255,0.22);
  font-size: 4rem;
  line-height: 1;
}
.art-card--tag {
  top: 68px;
  left: 5%;
  width: 82px;
  height: 82px;
  font-size: 2rem;
}
.art-card--link {
  top: 38px;
  right: 4%;
  width: 76px;
  height: 76px;
  font-size: 2.1rem;
}
.art-card--image {
  right: 1%;
  bottom: 54px;
  width: 82px;
  height: 82px;
  font-size: 2rem;
}
.art-card--color {
  left: 18%;
  bottom: 52px;
  width: 66px;
  height: 66px;
  font-size: 1.7rem;
}
.contribute__section {
  border-top: 1px solid rgba(255,255,255,0.045);
  background: rgba(255,255,255,0.035);
  color: #f7f9ff;
}
.contribute__section--quality {
  background: rgba(255,255,255,0.06);
}
.contribute__section-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5rem) var(--space-l);
}
.contribute__info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(var(--space), 4vw, var(--space-xl));

  @media (max-width: 960px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
}
.contribute__info-card {
  padding: var(--space-s) 0 0;
  background: transparent;

  h2 {
    margin: var(--space) 0 var(--space-xs);
    font-size: var(--font-size-l);
    margin-bottom: var(--space-s);
  }

  p {
    max-width: 330px;
    color: color-mix(in srgb, #f7f9ff, transparent 34%);
    line-height: 1.7;
  }
}
.contribute__info-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid #3f82ff;
  border-radius: 10px;
  color: #4d8dff;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}
.contribute__requirements {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(var(--space), 4vw, var(--space-xl));

  @media (max-width: 820px) { grid-template-columns: 1fr; }
}
.contribute__requirement {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space);
  align-items: start;

  h2 {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size);
  }

  p {
    color: color-mix(in srgb, #f7f9ff, transparent 34%);
    line-height: 1.55;
  }
}
.contribute__form-shell {
  padding-top: clamp(3rem, 7vw, 5rem);
  padding-bottom: var(--space-xl);
}
.contribute__workflow {
  margin-bottom: var(--space-l);

  ol {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-l);
    padding: 0;
    list-style: none;

    @media (max-width: 900px) { grid-template-columns: 1fr 1fr; }
    @media (max-width: 560px) { grid-template-columns: 1fr; }
  }

  li {
    position: relative;
    padding-right: var(--space);
    color: color-mix(in srgb, var(--color-foreground), transparent 28%);
    line-height: 1.45;

    &:not(:last-child)::after {
      content: '->';
      position: absolute;
      top: 1.35rem;
      right: 0;
      color: color-mix(in srgb, var(--color-foreground), transparent 64%);

      @media (max-width: 560px) {
        display: none;
      }
    }

    span {
      display: block;
      margin-bottom: var(--space-s);
      color: var(--color-primary);
      font-size: var(--font-size-l);
      font-weight: 800;
    }

    h2 {
      margin: 0 0 var(--space-xs);
      font-size: var(--font-size);
    }
  }
}
.contribute__signin-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-l);
  align-items: center;
  margin-bottom: var(--space-l);
  padding: var(--space-l);
  border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 88%);
  border-radius: 12px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-foreground), transparent 94%), transparent),
    color-mix(in srgb, var(--color-background), var(--color-foreground) 4%);

  h2 {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size-xl);
  }

  p {
    color: color-mix(in srgb, var(--color-foreground), transparent 34%);
    line-height: 1.55;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}
.contribute__github-mark {
  display: grid;
  place-items: center;
  width: 108px;
  height: 108px;
  border-right: 1px solid color-mix(in srgb, var(--color-foreground), transparent 84%);
  padding-right: var(--space-l);
  color: var(--color-foreground);

  @media (max-width: 760px) {
    width: 72px;
    height: 72px;
    border-right: 0;
    padding-right: 0;
  }
}
.step-card {
  max-width: 760px;
  margin-bottom: 1rem;
}
.step-help {
  margin-bottom: var(--space);
  color: color-mix(in srgb, var(--color-foreground), transparent 34%);
  line-height: 1.5;
}
.signed-in { color: var(--ob-primary); font-weight: 600; margin-bottom: 1rem; }
.progress {
  max-width: 900px;
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.progress-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--ob-text-muted);
  &.active { border-color: var(--ob-primary); color: var(--ob-primary); }
  &.done { opacity: 0.6; }
  &:disabled { cursor: default; }
}
.step-num {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700;
  background: var(--ob-bg-alt);
  .active & { background: var(--ob-primary); color: #fff; }
}
.step-label { white-space: nowrap; }
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  label { font-size: 0.85rem; font-weight: 500; }
  small { font-size: 0.75rem; color: var(--ob-text-muted); }
}
.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg);
  color: var(--ob-text);
  font-size: 0.9rem;
  &:focus { outline: 2px solid var(--ob-primary); }
}
.select { cursor: pointer; }
.empty-inline { margin-bottom: 1rem; color: var(--ob-text-muted); }
.color-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.color-picker {
  width: 44px; height: 36px;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  cursor: pointer;
  background: none;
}
.btn-remove { font-size: 0.75rem; color: #e01e5a; border-color: #e01e5a; }
.upload-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--ob-border);
  border-radius: var(--ob-radius);
  padding: 2rem;
  cursor: pointer;
  color: var(--ob-text-muted);
  &:hover { border-color: var(--ob-primary); }
  input { display: none; }
}
.asset-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.asset-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--ob-border);
  border-radius: var(--ob-radius);
  background: var(--ob-bg-alt);
}
.asset-preview {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  :deep(svg) { max-width: 100%; max-height: 100%; }
}
.asset-fields {
  display: flex; gap: 0.5rem; flex: 1; flex-wrap: wrap;
  .input { width: auto; min-width: 100px; }
}
.file-size { font-size: 0.75rem; color: var(--ob-text-muted); }
.review-summary {
  margin-bottom: 1.5rem;
  p { margin-bottom: 0.25rem; }
}
.declarations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.manifest-preview {
  margin-bottom: 1.5rem;
  pre {
    font-size: 0.7rem;
    background: var(--ob-bg-alt);
    padding: 0.75rem;
    border-radius: var(--ob-radius);
    overflow-x: auto;
    max-height: 250px;
  }
}
.result {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: var(--ob-radius);
  &.success { background: rgba(46, 182, 125, 0.1); border: 1px solid #2eb67d; }
  &.error { background: rgba(224, 30, 90, 0.1); border: 1px solid #e01e5a; }
  p { margin-bottom: 0.5rem; }
  a { word-break: break-all; }
}
.step-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
</style>

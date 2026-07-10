<script setup lang="ts">
const steps = [
  { title: 'Sign in with GitHub', desc: 'We use GitHub for identity only. You do not need to install an app or grant repository access.' },
  { title: 'Choose contribution type', desc: 'Add a new brand, suggest an edit, add an asset, correct colors, or add historical material.' },
  { title: 'Enter brand metadata', desc: 'Provide structured identity, categories, colors, sources, and usage notes.' },
  { title: 'Upload SVG assets', desc: 'SVG files go to private R2 quarantine. They are never public until reviewed and merged.' },
  { title: 'Run validation', desc: 'Browser checks give immediate feedback. Server validation re-checks independently.' },
  { title: 'Review the diff', desc: 'See the exact file tree and semantic changes before submitting.' },
  { title: 'Submit', desc: 'The Open Brands GitHub App creates a bot-owned draft pull request.' },
  { title: 'CI and review', desc: 'Required CI validates independently. A maintainer reviews before merge. Nothing is auto-merged.' },
]

const restrictions = [
  'SVG only, maximum 5 files',
  'Maximum 512 KiB per SVG, 2 MiB total',
  'No remote URLs, ZIPs, raster files, or scripts',
  'Every color and asset must reference a source',
  'One brand directory per pull request',
  'No self-assigned verification status',
  'No automatic merge',
]
</script>

<template>
  <div class="container contribute-page">
    <h1>Contribute a Brand</h1>
    <p class="subtitle">Help expand the Open Brands dataset through a guided pull-request workflow.</p>

    <section class="section">
      <h2>How it works</h2>
      <ol class="steps">
        <li v-for="(step, i) in steps" :key="i" class="step">
          <span class="step-num">{{ i + 1 }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.desc }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="section">
      <h2>Restrictions</h2>
      <ul class="restrictions">
        <li v-for="r in restrictions" :key="r">{{ r }}</li>
      </ul>
    </section>

    <div class="cta">
      <a href="/api/contributions/login" class="btn btn--primary">Sign in with GitHub to start</a>
      <p class="muted">The contribution flow requires authentication and is not yet active in this deployment.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contribute-page { padding: 2rem 0 4rem; max-width: 700px; }
.subtitle { color: var(--ob-text-muted); margin-bottom: 2rem; }
.section { margin-bottom: 2.5rem; }
h2 { font-size: 1.25rem; margin-bottom: 1rem; }
.steps { list-style: none; padding: 0; }
.step {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  strong { display: block; }
  p { color: var(--ob-text-muted); font-size: 0.875rem; }
}
.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ob-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}
.restrictions { padding-left: 1.5rem; line-height: 2; }
.cta { text-align: center; padding: 2rem 0; }
.muted { color: var(--ob-text-muted); font-size: 0.8rem; margin-top: 0.5rem; }
</style>

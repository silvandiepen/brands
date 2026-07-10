<script setup lang="ts">
</script>

<template>
  <div class="container legal-page">
    <h1>Legal and Trademarks</h1>

    <section class="section">
      <h2>License</h2>
      <p>Project-authored code is licensed under the <a href="https://opensource.org/licenses/MIT">MIT License</a>.</p>
      <p>Third-party logos, names, marks, and identity material remain the property of their respective owners and are not relicensed by Open Brands.</p>
    </section>

    <section class="section">
      <h2>Inclusion Does Not Imply Permission</h2>
      <p>Inclusion in Open Brands does not imply ownership, endorsement, affiliation, permission to modify, or permission for every downstream use.</p>
    </section>

    <section class="section">
      <h2>Sources and Provenance</h2>
      <p>Every public color and asset records its source. Preferred evidence is an official guideline, official download, or official website. Community references are clearly marked and do not produce verified status by themselves.</p>
    </section>

    <section class="section">
      <h2>Modifications</h2>
      <p>Allowed technical processing is limited to deterministic cleanup, safety removal, metadata cleanup, and serialization changes that preserve visual geometry.</p>
      <p>Open Brands does not automatically redraw, simplify, recolor full-color assets, remove trademark symbols, or create unofficial lockups.</p>
    </section>

    <section class="section">
      <h2>Corrections and Takedowns</h2>
      <p>Brand owners can request removal, replacement, source correction, historical classification, or usage notes through a private process. Credible urgent disputes can disable public delivery while review continues.</p>
      <p>To request a correction or takedown, please open an issue on the <a href="https://github.com/silvandiepen/brands/issues">GitHub repository</a>.</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.legal-page { padding: 2rem 0 4rem; max-width: 700px; }
.section { margin-bottom: 2rem; }
h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
p { margin-bottom: 0.75rem; color: var(--ob-text); }
</style>

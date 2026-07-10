# `open-brands` package brief

This workspace publishes the public npm package named `open-brands`.

It composes generated data with `packages/core` and exposes only stable documented surfaces. The root import stays compact and framework-neutral. Per-brand asset imports use generated subpath exports so one brand does not bundle the complete collection.

Do not preserve legacy helper signatures or runtime `exports` mutation. Add package installation fixtures, bundle-size checks, declaration tests, and npm provenance.

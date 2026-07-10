# Web application brief

Build the public `open-brands.org` website described in `docs/WEBSITE.md`.

Constraints:

- Vue 3 + Vite + Vue Router;
- TypeScript strict mode;
- `@sil/ui` root imports and Vite plugin;
- `bemm` app-local classes;
- unscoped SCSS;
- no copied legacy component library;
- no untrusted `v-html`;
- API/core-generated types;
- static generation or pre-rendering for brand routes;
- accessibility, performance, and visual tests from the start.

The app owns Open Brands-specific components and content. Product-neutral primitives remain in `@sil/ui`.

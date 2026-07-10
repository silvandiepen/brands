# Agent guide

Read [`build-directive.md`](./build-directive.md) before beginning autonomous implementation. It defines the execution authority, implementation order, quality bar, and definition of done for a full build.

Also read `docs/README.md` and all accepted decisions before changing architecture or public contracts.

## Rules

- commit implementation work directly to `main` unless instructed otherwise;
- use coherent conventional commits continuously;
- do not stop at scaffolding, placeholders, mocks, or documentation-only implementations;
- do not edit generated output;
- keep canonical data only under `data/brands`;
- keep app, package, and tooling responsibilities separate;
- use `@sil/ui` and `bemm` in the website;
- require provenance for every public color and asset;
- never publish or inline untrusted SVG;
- add tests and documentation with each feature;
- avoid overlapping ownership when multiple agents work concurrently;
- make reasonable implementation decisions without requesting approval when the repository already defines the product direction.

## Work areas

- `apps/api`: HTTP, Cloudflare, authentication, jobs, quotas;
- `apps/web`: product UI and static data consumption;
- `packages/core`: pure runtime behavior;
- `packages/data`: generated data;
- `packages/open-brands`: public package;
- `packages/schema`: validation contracts;
- `packages/tooling`: build-time tooling;
- `data/brands`: one assigned brand directory at a time.

Website-created contributions always use pull requests and never write directly to `main`.

# Documentation

This directory is the implementation contract for Open Brands.

## Core documents

- [Audit](./AUDIT.md): what exists in the two legacy repositories and what must change.
- [Product](./PRODUCT.md): product goals, users, scope, and feature set.
- [Architecture](./ARCHITECTURE.md): monorepo boundaries, runtime architecture, and build flow.
- [Data model](./DATA_MODEL.md): canonical brand, color, asset, provenance, and taxonomy structures.
- [API](./API.md): REST, CDN, SDK, caching, and error contracts.
- [Website](./WEBSITE.md): information architecture and frontend implementation rules.
- [Migration](./MIGRATION.md): preservation and normalization of both legacy projects.
- [Legal and provenance](./LEGAL.md): trademark, licensing, sourcing, and takedown requirements.
- [Testing](./TESTING.md): data, asset, API, package, web, and release validation.
- [Contributing](./CONTRIBUTING.md): contribution structure and review requirements.
- [Implementation plan](./IMPLEMENTATION_PLAN.md): phased agent execution and PR sequence.

## Decisions

Accepted architectural decisions live under `docs/decisions/`. Add an ADR when changing a public contract, canonical data structure, deployment boundary, or package surface.

## Source priority

When documents conflict, use this order:

1. accepted ADR
2. data model and API contracts
3. architecture
4. implementation plan
5. audit and historical migration notes

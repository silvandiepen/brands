# API application brief

Build the Cloudflare Worker described in `docs/API.md`.

Constraints:

- `/v1` versioned routes;
- generated OpenAPI contract;
- shared `packages/core` resolution and selection logic;
- structured errors;
- ETags, cache headers, and CORS;
- immutable asset URLs;
- bounded safe image transformations;
- no direct serving of unvalidated legacy SVG;
- Worker integration tests.

Canonical data remains in git and enters the Worker only through validated generated artifacts.

# Testing

## Required checks

```sh
pnpm check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Coverage

- schema and runtime-schema parity;
- cross-record IDs, aliases, domains, categories, and relationships;
- color conversion and token snapshots;
- malicious and complex-valid SVG fixtures;
- pre/post sanitation render comparison;
- core resolver and asset selector parity across browser, Node, and Worker;
- package exports and tree-shaking;
- API/OpenAPI contracts, caching, CORS, and quotas;
- deterministic R2 release publication;
- deterministic pack ZIPs and manifests;
- contribution authentication, upload, validation, idempotency, and spam controls;
- website accessibility, keyboard flows, end-to-end behavior, and visual regression.

A clean build must leave the working tree unchanged and produce the same checksums on repeated runs.

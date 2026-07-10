# Runtime and deployment

## Cloudflare services

- Pages hosts the pre-rendered website;
- Workers expose the public API and authenticated dynamic routes;
- R2 stores approved public assets and private contribution uploads in separate buckets;
- Queues run pack, validation, and release jobs;
- D1 stores submissions, sessions, jobs, moderation, and audit events;
- Durable Objects coordinate quotas and idempotency;
- Turnstile protects contribution and suspicious generation actions.

## Environments

- local: local Worker and storage fixtures;
- preview: isolated resources and a dry-run or test GitHub adapter;
- production: public domains and the canonical GitHub App installation.

Preview and local environments do not write to the production repository.

## Release

1. Validate canonical data.
2. Build package, API, website data, assets, and packs.
3. Upload a versioned R2 release.
4. Verify all checksums.
5. Atomically update the current-release pointer.
6. Deploy API and website pinned to that release.

A failed publication leaves the previous release active.

## Failure behavior

Static website browsing and immutable assets continue to work when dynamic API services are unavailable. Pack and contribution jobs expose status and retryable errors rather than holding long requests.

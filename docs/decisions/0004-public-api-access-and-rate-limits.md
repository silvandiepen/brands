# ADR 0004: Public API access, quotas, and abuse controls

- Status: Accepted
- Date: 2026-07-10

## Decision

Open Brands read APIs are public and require no account or API key.

CORS is enabled for public `GET` and `HEAD` routes. Consumers may use the API from browsers, servers, Workers, CI, and local tools.

Rate limits protect transformation and generation work, not ordinary cached asset delivery. Limits are applied after CDN/cache hits where Cloudflare supports that distinction.

## Initial limits

These values are initial production defaults and may be tuned from observed traffic without changing the API version.

### Immutable CDN assets

- No application-level daily quota.
- Edge abuse threshold: 3,000 requests per minute per IP.
- Responses use long-lived immutable caching.

### Cached metadata reads

Examples: brand detail, categories, collections, `/meta`.

- 600 requests per minute per IP.
- Burst allowance: 120 requests in 10 seconds.
- No daily quota.

### Search and resolve

- 120 requests per minute per IP.
- Burst allowance: 30 requests in 10 seconds.
- Query length, result count, and fuzzy-search work are bounded.

### Raster transformations

- Anonymous: 30 requests per minute and 500 successful transformations per day per IP.
- GitHub-authenticated: 60 requests per minute and 2,000 per day per user.
- Output is limited to 4 megapixels, documented dimensions, and approved transformable assets.
- Identical transformations are content-addressed and cached in R2.

### Custom pack generation

- Anonymous: 5 creation attempts per minute and 25 completed packs per day per IP.
- GitHub-authenticated: 20 attempts per minute and 200 completed packs per day per user.
- Maximum 100 brands, 500 files, and 25 MiB uncompressed estimated output per custom pack.
- Cached identical packs do not consume a completed-pack quota, but abusive repeated polling is still limited.

### Contribution operations

Contribution quotas are defined in ADR 0007 and are based primarily on authenticated GitHub user ID rather than IP.

## API keys

API keys are optional and are not required for the initial public release. Add them only when legitimate server-side consumers need higher predictable quotas, usage analytics, or support commitments.

An API key must never grant write access to canonical data. Higher limits remain bounded and revocable.

## First-party website

The website does not receive an unlimited read key. Normal browsing uses generated static data and immutable R2 assets. Playground calls use public anonymous limits. Authenticated contribution calls use their separate session and quotas.

## Enforcement layers

- Cloudflare CDN/WAF rate limiting for coarse IP and route controls;
- Worker validation for dimensions, query complexity, pack size, and endpoint-specific quotas;
- a Durable Object quota coordinator for precise per-user, per-key, and concurrent-job limits when dynamic services launch;
- D1 for persistent abuse flags, submission state, and audit records;
- Turnstile for pack or contribution actions when traffic is suspicious or anonymous generation is requested.

## Response behavior

Rate-limited responses return `429`, `Retry-After`, and standard rate-limit metadata:

```text
RateLimit-Limit
RateLimit-Remaining
RateLimit-Reset
```

The response body uses the documented `RATE_LIMITED` error code. Limits must not silently degrade data or return a lower-quality asset.

## Abuse handling

The service may temporarily block clients that evade quotas, enumerate at machine speed, submit malformed payloads repeatedly, or use transformations as a generic image-processing service.

Blocks are operational controls, not permanent account moderation, and must be auditable and reversible.

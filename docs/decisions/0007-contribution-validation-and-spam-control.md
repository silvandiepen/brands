# ADR 0007: Contribution validation, quotas, and spam control

- Status: Accepted
- Date: 2026-07-10

## Principle

No browser check, authenticated identity, or bot-generated pull request is trusted by itself. The same restrictions are enforced independently in the frontend, submission service, and required GitHub Actions checks.

## Eligibility

Creating a bot-owned pull request requires:

- authenticated GitHub identity;
- GitHub account at least seven days old;
- successful Turnstile challenge at submission time;
- accepted contribution and trademark declarations;
- no active abuse suspension;
- authoritative server validation with no blocking errors.

An ineligible user may still prepare and export a proposed contribution for manual submission, but the bot does not create a PR.

## Quotas

Initial defaults:

- first-time contributors: one open bot PR and three submission attempts per day;
- contributors with at least one merged Open Brands PR: three open bot PRs and ten submission attempts per day;
- maximum 20 server validation runs per user per day;
- maximum five SVG files per submission;
- maximum 512 KiB per SVG and 2 MiB total upload size;
- maximum one brand directory per website-created PR;
- one active submission for the same brand and contribution type per user;
- global concurrency limits protect the validation queue and GitHub App installation token.

Closed-as-spam or abusive submissions trigger escalating cooldowns. Moderators can restore access.

## Duplicate and risk checks

Before PR creation, check:

- canonical brand ID, aliases, domains, and organization names;
- open submission and open PR collisions;
- exact SVG checksum matches;
- normalized geometry or perceptual render similarity where available;
- repeated source URLs and copied submission payloads;
- suspiciously high edit or validation frequency;
- unsupported category or source claims;
- attempts to mark website submissions as `verified`.

Website submissions default to `needs-review` or `partial`. Only maintainers may promote them to `verified` during review.

## SVG restrictions

Reject SVG containing or exceeding any of the following:

- XML `DOCTYPE`, entities, processing instructions, or entity expansion;
- scripts, event-handler attributes, `foreignObject`, iframe, object, embed, audio, or video;
- external URLs, remote fonts, external stylesheets, imports, or network references;
- data URLs or embedded raster images;
- JavaScript URLs;
- unsupported animation;
- malformed XML, missing/invalid viewBox, non-finite values, or extreme coordinates;
- excessive nesting, elements, paths, points, filters, gradients, or file size;
- user-controlled IDs or references that escape deterministic normalization;
- symlinks or non-regular files.

The frontend may flag these immediately, but the server and CI parse the original upload again.

## Required pull-request CI

Every contribution PR must pass all required checks:

1. **Changed-path policy** — website bot branches may change only one `data/brands/<id>/` directory.
2. **Schema validation** — JSON Schema and runtime schema agree.
3. **Cross-record validation** — no ID, alias, domain, category, relationship, source, or asset collisions.
4. **SVG security validation** — parse and reject unsafe constructs independently from the submission service.
5. **Asset limits** — file count, size, complexity, dimensions, and regular-file checks.
6. **Deterministic sanitation** — normalized SVG output is stable on repeat.
7. **Render validation** — assets render non-empty on light, dark, and checkerboard surfaces.
8. **Visual change report** — edits produce before/after and diff previews.
9. **Default selection validation** — current asset requests resolve unambiguously.
10. **Provenance validation** — every color and asset references an existing source.
11. **Review-state policy** — bot submissions cannot self-assign verified status or reviewer identity.
12. **Generated-output policy** — aggregate or build output is not committed.
13. **Secret and binary scan** — no credentials, opaque archives, raster payloads, or unexpected binaries.
14. **Full dataset build** — package/API/web generation remains deterministic.

Source URL reachability is checked before PR creation and periodically, but transient network failures do not make required CI nondeterministic. Required CI validates URL structure, source type, and evidence references.

## Human review

Passing CI means the contribution is structurally safe and internally valid. It does not establish trademark permission, official status, or factual correctness.

At least one maintainer review is required for metadata-only changes and at least one designated asset/data reviewer for any logo or color change. No website-created brand contribution is auto-merged.

## Operational storage

- Private R2 quarantine stores original uploads and generated previews with short lifecycle rules.
- D1 stores submission state, contributor ID, quota events, declarations, moderation state, and audit history.
- A Durable Object coordinates per-user quotas and concurrent jobs.
- Public PRs contain no private session, IP, Turnstile, moderation, or claimant data.

## Incident response

The service can disable PR creation while keeping draft/export functionality available. A compromised GitHub App token is revoked and rotated; its narrow permissions prevent workflow or administration changes.

# Contributions

The website turns structured user input into a reviewable GitHub pull request. It never publishes brand data directly.

## Flow

1. Sign in with GitHub.
2. Add a brand or choose an existing brand to edit.
3. Enter identity, categories, colors, assets, sources, and usage notes.
4. Upload SVG files to private R2 quarantine.
5. Run browser checks and authoritative server validation.
6. Review previews and the exact repository diff.
7. Submit the proposal.
8. The Open Brands GitHub App creates a bot-owned draft pull request.
9. Required CI and human review decide whether it can merge.

Users do not create forks or grant access to their own repositories.

## Restrictions

- SVG only, maximum five files;
- maximum 512 KiB per SVG and 2 MiB total;
- no remote asset ingestion, ZIP files, raster files, scripts, embedded content, or external references;
- no arbitrary JSON, repository paths, or patches;
- no self-assigned verification status or reviewer;
- every color and asset must reference a source;
- one brand directory per website-created pull request;
- no automatic merge.

Frontend checks improve feedback. Server validation and CI repeat the restrictions independently.

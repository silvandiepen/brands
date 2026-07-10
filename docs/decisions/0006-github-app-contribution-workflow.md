# ADR 0006: Website contributions create bot-owned pull requests

- Status: Accepted
- Date: 2026-07-10

## Context

Open Brands should make adding or correcting a brand accessible to people who do not want to edit JSON and SVG files manually. Direct publication is unacceptable because brand assets require provenance, security validation, legal review, and human approval.

Automatically creating a fork for every contributor adds repository-installation friction, exposes implementation details, and requires broader user permissions than necessary.

## Decision

The contribution website uses GitHub authentication for identity. An Open Brands GitHub App, installed only on `silvandiepen/brands`, creates and updates bot-owned branches in the canonical repository and opens pull requests.

Contributors do not install the app, grant access to their repositories, or create forks.

The GitHub App receives only:

- repository metadata: read;
- repository contents: read/write;
- pull requests: read/write;
- checks/status metadata required to display validation state.

It receives no administration, secrets, workflow-write, organization, or user-repository permissions.

## User flow

1. Sign in with GitHub.
2. Choose **Add a brand**, **Suggest an edit**, **Add an asset**, **Correct colors**, or **Add historical material**.
3. Enter structured metadata, sources, usage notes, and declarations.
4. Upload one or more SVG files to private R2 quarantine.
5. Run browser checks for immediate feedback.
6. Run authoritative server validation and generate previews.
7. Review the exact proposed canonical file tree and semantic diff.
8. Confirm submission.
9. The GitHub App creates `contrib/<github-user-id>/<submission-id>` from current `main`.
10. It writes only the approved canonical files and opens a draft pull request.
11. Required CI runs. When CI passes, the PR becomes ready for human review; it is never auto-merged.
12. Requested changes can be addressed through the website, which updates the same branch and PR.

## Pull request contents

A contribution PR contains only files that would legitimately exist in the canonical repository, normally:

```text
data/brands/<brand-id>/brand.json
data/brands/<brand-id>/assets/<asset-id>.svg
```

Generated previews and validation reports are attached as workflow artifacts and summarized in a bot comment. They are not committed as canonical data.

The PR body records:

- GitHub contributor identity;
- submission ID;
- contribution type;
- source URLs and evidence summary;
- contributor declarations;
- server validation summary;
- unresolved warnings;
- generated preview links;
- whether the brand is new or edited.

## Identity and attribution

The PR is opened by the Open Brands bot but visibly attributes the authenticated GitHub user. The contributor's numeric GitHub user ID is stored operationally to survive username changes. Public repository content uses the GitHub handle where attribution is appropriate.

## Existing brand edits

The form loads the current manifest and presents structured field-level edits. Users cannot submit arbitrary repository patches through the website.

After a PR exists, the submission service rebases or recreates the proposed change against current `main` before every update. Conflicts return to the contributor for review rather than being resolved silently.

## Authentication and sessions

Use GitHub App user authorization for identity only. Browser sessions are secure, HttpOnly, SameSite cookies through a same-origin `/api/contributions` route. State-changing requests require CSRF protection.

## Consequences

- Contributors get a guided flow without learning repository internals.
- The canonical review and audit trail remains GitHub pull requests.
- The bot has narrow repository permissions and users grant no access to their own repositories.
- Submission validation can evolve without replacing the contribution model.

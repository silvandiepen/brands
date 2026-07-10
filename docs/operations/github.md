# GitHub App and repository rules

The Open Brands GitHub App is installed only on `silvandiepen/brands`.

## Permissions

- repository metadata: read;
- contents: read and write;
- pull requests: read and write;
- check status: read when needed.

The app has no administration, workflow-write, secret, deployment, organization, or merge permissions.

Users authorize identity only. They do not grant access to their repositories.

## Contribution branches

```text
contrib/<github-user-id>/<submission-id>
```

Branch segments are generated server-side. The same validated submission can create at most one active pull request.

## Repository rules

- block force pushes and branch deletion;
- require contribution CI and human review;
- require code-owner review for canonical data and validation code;
- dismiss stale approvals after changes;
- restrict workflow changes to trusted maintainers;
- never grant the contribution app a ruleset bypass.

Untrusted pull-request workflows use `pull_request`, read-only permissions, and no production secrets.

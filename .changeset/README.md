# Changesets

This folder is how we version and publish `@cbnsndwch/opencpq`.

When you make a user-visible change, run:

```bash
pnpm changeset
```

Select the affected package(s) and bump kind (patch / minor / major), and
write a short summary. A markdown file gets dropped into this directory
and committed alongside your PR.

When the PR lands on `master`, the Release workflow opens (or updates) a
“Version Packages” PR that aggregates all pending changesets. Merging that
PR bumps versions, updates changelogs, and publishes to npm.

The example apps are ignored — they’re private and never published.

# Repository Instructions

## Release Notes

- Keep the docs release notes current for the latest released version on `main` and for the next version that is queued locally but not yet pushed.
- Store release notes as versioned pages under `apps/docs/release-notes/`.
- Do not use an `upcoming` release-notes page in this repo, because merges to `main` are released directly.
- When `main` is already released and local commits are still ahead of the release commit, collect those user-visible changes in the next versioned page before pushing.
- When a release lands on `main`, add or update the matching versioned page in the same change set if the user-facing summary is missing or incomplete.
- Write release notes for users, not commit logs. Prefer short sections such as `Added`, `Changed`, and `Fixed`, with concrete impact.

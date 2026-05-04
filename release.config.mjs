export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "packages/girk/CHANGELOG.md",
      },
    ],
    "./scripts/semantic-release/sync-versions.mjs",
    [
      "@semantic-release/npm",
      {
        pkgRoot: "packages/girk-sdk",
      },
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: "packages/girk-cli",
      },
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: "packages/girk",
      },
    ],
    "./scripts/semantic-release/release-notes-plugin.mjs",
    [
      "@semantic-release/git",
      {
        assets: [
          "packages/girk/package.json",
          "packages/girk-sdk/package.json",
          "packages/girk-cli/package.json",
          "packages/girk/CHANGELOG.md",
          "apps/docs/release-notes/*.md",
        ],
        message:
          "chore(Release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

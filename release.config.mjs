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
          "packages/girk/CHANGELOG.md",
          "apps/docs/release-notes/*.md",
        ],
        message:
          "chore(Release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

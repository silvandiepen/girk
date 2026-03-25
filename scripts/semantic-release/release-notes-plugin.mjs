import { writeReleaseNotes } from "../release-notes.mjs";

const formatDate = (date = new Date()) => date.toISOString().slice(0, 10);

export async function prepare(pluginConfig, context) {
  const { cwd, commits, logger, nextRelease } = context;
  const { pagePath, readmePath, sections } = writeReleaseNotes({
    rootDir: cwd,
    version: nextRelease.version,
    date: formatDate(),
    commits,
  });

  logger.log(
    "Updated docs release notes: %s, %s (%s)",
    readmePath.replace(`${cwd}/`, ""),
    pagePath.replace(`${cwd}/`, ""),
    Object.keys(sections).join(", ") || "no sections"
  );
}

export default {
  prepare,
};

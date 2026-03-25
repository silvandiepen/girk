import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  getReleaseEntry,
  groupReleaseNotes,
  renderReleaseNotesIndex,
  writeReleaseNotes,
} from "./release-notes.mjs";
import { prepare } from "./semantic-release/release-notes-plugin.mjs";

test("getReleaseEntry maps conventional commits into release sections", () => {
  assert.deepEqual(
    getReleaseEntry("feat(Navigation): include first-level section home pages"),
    {
      section: "Added",
      text: "`Navigation`: Include first-level section home pages.",
    }
  );

  assert.deepEqual(
    getReleaseEntry(
      "fix(Data)!: change generated payload shape\n\nBREAKING CHANGE: result is now an array"
    ),
    {
      section: "Changed",
      text: "`Data`: Change generated payload shape.",
    }
  );

  assert.equal(getReleaseEntry("docs(README): rewrite the introduction"), null);
});

test("groupReleaseNotes deduplicates entries and keeps user-facing sections", () => {
  assert.deepEqual(
    groupReleaseNotes([
      "feat(Examples): add dedicated data-source example",
      "feat(Examples): add dedicated data-source example",
      "fix(Navigation): include first-level section home pages",
    ]),
    {
      Added: ["`Examples`: Add dedicated data-source example."],
      Fixed: ["`Navigation`: Include first-level section home pages."],
    }
  );
});

test("renderReleaseNotesIndex lists versions from newest to oldest", () => {
  const index = renderReleaseNotesIndex(["1.17.1", "1.17.0", "1.16.0"]);

  assert.match(index, /\[1\.17\.1\].*\n- \[1\.17\.0\].*\n- \[1\.16\.0\]/s);
  assert.match(index, /generated during the publish workflow/i);
});

test("writeReleaseNotes writes the version page and refreshes the index", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "girk-release-notes-"));
  const notesDir = join(rootDir, "apps/docs/release-notes");

  mkdirSync(notesDir, { recursive: true });
  writeFileSync(
    join(notesDir, "v1-17-0.md"),
    `---
title: 1.17.0
order: 0
---
`
  );

  writeReleaseNotes({
    rootDir,
    version: "1.17.1",
    date: "2026-03-25",
    commits: [
      "fix(Navigation): include first-level section home pages",
      "feat(Customisation): add section color tokens and docs",
    ],
  });

  const page = readFileSync(join(notesDir, "v1-17-1.md"), "utf8");
  const index = readFileSync(join(notesDir, "README.md"), "utf8");

  assert.match(page, /# 1\.17\.1/);
  assert.match(page, /Released on 2026-03-25\./);
  assert.match(page, /## Added/);
  assert.match(page, /## Fixed/);
  assert.match(index, /\[1\.17\.1\].*\n- \[1\.17\.0\]/s);
});

test("semantic-release prepare writes docs release notes for the computed version", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "girk-release-plugin-"));
  mkdirSync(join(cwd, "apps/docs/release-notes"), { recursive: true });

  await prepare(
    {},
    {
      cwd,
      commits: [
        {
          message: "fix(Navigation): include first-level section home pages",
        },
      ],
      logger: {
        log: () => {},
      },
      nextRelease: {
        version: "1.17.1",
      },
    }
  );

  const page = readFileSync(
    join(cwd, "apps/docs/release-notes/v1-17-1.md"),
    "utf8"
  );

  assert.match(page, /# 1\.17\.1/);
  assert.match(page, /## Fixed/);
  assert.match(page, /`Navigation`: Include first-level section home pages\./);
});

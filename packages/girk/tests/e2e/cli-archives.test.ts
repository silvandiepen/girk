import { afterEach, describe, expect, it } from "vitest";

import { runFixtureBuild } from "./build-runner";
import { fileExists, readOutput } from "./helpers";

const originalCwd = process.cwd();
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  process.chdir(originalCwd);

  while (cleanups.length) {
    const cleanup = cleanups.pop();
    if (cleanup) await cleanup();
  }
});

describe("CLI archive pages", () => {
  it("creates archive output and lists archive children", async () => {
    const result = await runFixtureBuild("archives");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/blog/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/blog/post-one/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/blog/post-two/index.html`)).toBe(true);

    const archiveHtml = await readOutput(result.outputDir, "blog/index.html");

    expect(archiveHtml).toContain("Blog");
    expect(archiveHtml).toContain("Post One");
    expect(archiveHtml).toContain("Post Two");
  });
});

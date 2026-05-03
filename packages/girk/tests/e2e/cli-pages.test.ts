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

describe("CLI page generation", () => {
  it("creates content pages for the basic fixture", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/about/index.html`)).toBe(true);

    const aboutHtml = await readOutput(result.outputDir, "about/index.html");

    expect(aboutHtml).toContain("About");
    expect(aboutHtml).toContain("About this site.");
  });

  it("creates pages for the config fixture", async () => {
    const result = await runFixtureBuild("config");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/page/index.html`)).toBe(true);

    const pageHtml = await readOutput(result.outputDir, "page/index.html");

    expect(pageHtml).toContain("A Page");
    expect(pageHtml).toContain("Content here.");
  });
});

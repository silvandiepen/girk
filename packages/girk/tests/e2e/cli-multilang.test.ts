import { afterEach, describe, expect, it } from "vitest";

import { runFixtureBuild } from "./build-runner";
import { fileExists, listFiles, readOutput } from "./helpers";

const originalCwd = process.cwd();
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  process.chdir(originalCwd);

  while (cleanups.length) {
    const cleanup = cleanups.pop();
    if (cleanup) await cleanup();
  }
});

describe("CLI multilingual output", () => {
  it("builds English and Dutch pages with language-specific paths", async () => {
    const result = await runFixtureBuild("multilang");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/about/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/nl/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/nl/about/index.html`)).toBe(true);

    const builtFiles = await listFiles(result.outputDir);
    const dutchHome = await readOutput(result.outputDir, "nl/index.html");
    const dutchAbout = await readOutput(result.outputDir, "nl/about/index.html");

    expect(builtFiles).toContain("nl/index.html");
    expect(builtFiles).toContain("nl/about/index.html");
    expect(dutchHome).toContain("Welkom.");
    expect(dutchAbout).toContain("Over deze site.");
  });
});

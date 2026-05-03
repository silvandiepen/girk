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

describe("CLI build pipeline", () => {
  it("builds the basic fixture into a public site", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    expect(await fileExists(result.outputDir)).toBe(true);
    expect(await fileExists(`${result.outputDir}/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/style/app.css`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/robots.txt`)).toBe(true);

    const homeHtml = await readOutput(result.outputDir, "index.html");
    const robots = await readOutput(result.outputDir, "robots.txt");

    expect(homeHtml).toMatch(/<!doctype html>/i);
    expect(homeHtml).toContain("Hello World");
    expect(robots).toContain("User-agent: *");
  });
});

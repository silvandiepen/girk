import { afterEach, describe, expect, it } from "vitest";

import { runFixtureBuild } from "./build-runner";
import { readOutput } from "./helpers";

const originalCwd = process.cwd();
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  process.chdir(originalCwd);

  while (cleanups.length) {
    const cleanup = cleanups.pop();
    if (cleanup) await cleanup();
  }
});

describe("CLI config loading", () => {
  it("applies girk.config.json project settings to the generated HTML", async () => {
    const result = await runFixtureBuild("config");
    cleanups.push(result.cleanup);

    const homeHtml = await readOutput(result.outputDir, "index.html");

    expect(homeHtml).toContain("<title>Config Test</title>");
    expect(homeHtml).toContain("/style/app.css");
  });

  it("falls back to gieter.config.json compatibility", async () => {
    const result = await runFixtureBuild("gieter");
    cleanups.push(result.cleanup);

    const homeHtml = await readOutput(result.outputDir, "index.html");

    expect(homeHtml).toContain("<title>Gieter compat</title>");
    expect(homeHtml).toContain("Gieter Site");
  });
});

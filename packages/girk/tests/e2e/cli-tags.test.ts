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

describe("CLI tag pages", () => {
  it("creates tag archive pages with linked content", async () => {
    const result = await runFixtureBuild("tags");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/tag/javascript/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/tag/typescript/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/tag/design/index.html`)).toBe(true);

    const javascriptTag = await readOutput(result.outputDir, "tag/javascript/index.html");
    const typescriptTag = await readOutput(result.outputDir, "tag/typescript/index.html");

    expect(javascriptTag).toContain("#javascript");
    expect(javascriptTag).toContain("Coding");
    expect(typescriptTag).toContain("Coding");
    expect(typescriptTag).toContain("Design");
  });
});

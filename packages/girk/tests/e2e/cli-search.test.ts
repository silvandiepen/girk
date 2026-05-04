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

describe("CLI search index generation", () => {
  it("writes a manifest and shard documents when search is enabled", async () => {
    const result = await runFixtureBuild("search");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/assets/search/manifest.json`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/assets/search/en.json`)).toBe(true);

    const manifest = JSON.parse(
      await readOutput(result.outputDir, "assets/search/manifest.json"),
    ) as {
      shards: Array<{ id: string; path: string; documents: number }>;
      languages: string[];
    };
    const shard = JSON.parse(await readOutput(result.outputDir, "assets/search/en.json")) as {
      docs: Record<string, { title: string; link: string }>;
      terms: Record<string, Array<[string, number]>>;
    };

    expect(manifest.languages).toContain("en");
    expect(manifest.shards.length).toBeGreaterThan(0);
    expect(manifest.shards[0]?.path).toContain("/assets/search/");
    expect(manifest.shards[0]?.documents).toBeGreaterThan(0);
    expect(Object.values(shard.docs).some((document) => document.title.includes("Page One"))).toBe(true);
    expect(Object.keys(shard.terms).length).toBeGreaterThan(0);
  });
});

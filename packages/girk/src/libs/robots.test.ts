import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createRobots } from "@/libs/robots";

describe("robots.txt generation", () => {
  it("writes robots.txt to the output directory", async () => {
    const output = await mkdtemp(join(tmpdir(), "girk-robots-"));

    await createRobots({
      settings: {
        output,
        config: {},
      },
    } as any);

    const file = await readFile(join(output, "robots.txt"), "utf8");
    expect(file).toContain("User-agent: *");

    await rm(output, { recursive: true, force: true });
  });

  it("skips robots.txt when noRobots is enabled", async () => {
    const output = await mkdtemp(join(tmpdir(), "girk-no-robots-"));

    await createRobots({
      settings: {
        output,
        config: {
          noRobots: true,
        },
      },
    } as any);

    await expect(readFile(join(output, "robots.txt"), "utf8")).rejects.toThrow();

    await rm(output, { recursive: true, force: true });
  });
});

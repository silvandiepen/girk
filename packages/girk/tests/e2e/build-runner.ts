import { join } from "node:path";

import { build } from "@/build";
import type { Payload } from "@/types";

import { cleanupFixture, setupFixture } from "./helpers";

interface BuildResult {
  fixtureDir: string;
  outputDir: string;
  payload: Payload;
  cleanup: () => Promise<void>;
}

export async function runFixtureBuild(name: string): Promise<BuildResult> {
  const fixtureDir = await setupFixture(name);
  const outputDir = join(fixtureDir, "public");
  const originalCwd = process.cwd();

  try {
    process.chdir(fixtureDir);

    const payload = await build({ output: outputDir, args: {} });

    return {
      fixtureDir,
      outputDir,
      payload,
      cleanup: async () => {
        await cleanupFixture(fixtureDir);
      },
    };
  } catch (error) {
    await cleanupFixture(fixtureDir);
    throw error;
  } finally {
    process.chdir(originalCwd);
  }
}

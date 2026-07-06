import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const readPackage = (path: string) =>
  JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as {
    version: string;
    dependencies?: Record<string, string>;
  };

describe("published package dependencies", () => {
  it("keeps CLI packages on the latest SDK template version", () => {
    for (const packagePath of [
      "packages/girk/package.json",
      "packages/girk-cli/package.json",
    ]) {
      const packageJson = readPackage(packagePath);

      expect(packageJson.dependencies?.["girk-sdk"]).toBe("latest");
    }
  });
});

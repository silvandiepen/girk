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
  it("pins CLI packages to the girk-sdk version released alongside them", () => {
    const sdk = readPackage("packages/girk-sdk/package.json");

    for (const packagePath of ["packages/girk/package.json", "packages/girk-cli/package.json"]) {
      const packageJson = readPackage(packagePath);

      expect(packageJson.version).toBe(sdk.version);
      expect(packageJson.dependencies?.["girk-sdk"]).toBe(sdk.version);
    }
  });
});

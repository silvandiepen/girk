import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

/*
 * All packages release together under one version. Packages that depend on
 * girk-sdk pin the exact version released in the same run, so an installed CLI
 * never floats onto a newer (possibly breaking) SDK.
 */
export async function prepare(pluginConfig, context) {
  const { cwd, nextRelease, logger } = context;

  const packages = [
    "packages/girk-sdk/package.json",
    "packages/girk-cli/package.json",
    "packages/girk/package.json",
  ];

  const version = nextRelease.version;

  for (const pkgPath of packages) {
    const fullPath = `${cwd}/${pkgPath}`;
    const pkg = JSON.parse(readFileSync(fullPath, "utf8"));

    pkg.version = version;
    if (pkg.dependencies?.["girk-sdk"]) pkg.dependencies["girk-sdk"] = version;

    writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
    logger.log("Synced %s to version %s", pkg.name, version);
  }

  // Keep the lockfile in step so `npm ci` keeps working after the release commit.
  execFileSync("npm", ["install", "--package-lock-only", "--ignore-scripts"], {
    cwd,
    stdio: "inherit",
  });
}

export default { prepare };

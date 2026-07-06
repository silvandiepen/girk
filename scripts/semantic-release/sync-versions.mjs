import { readFileSync, writeFileSync } from "fs";

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
    if (pkg.dependencies?.["girk-sdk"]) {
      pkg.dependencies["girk-sdk"] = "latest";
    }
    if (pkg.version !== version) {
      pkg.version = version;
      writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
      logger.log("Synced %s to version %s", pkg.name, version);
    } else if (pkg.dependencies?.["girk-sdk"] === "latest") {
      writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
      logger.log("Synced %s dependencies to latest girk-sdk", pkg.name);
    } else {
      logger.log("%s already at version %s", pkg.name, version);
    }
  }
}

export default { prepare };

import { readFileSync, writeFileSync } from "fs";

export async function prepare(pluginConfig, context) {
  const { cwd, nextRelease, logger } = context;

  const packages = [
    "packages/girk-sdk/package.json",
  ];

  const version = nextRelease.version;

  for (const pkgPath of packages) {
    const fullPath = `${cwd}/${pkgPath}`;
    const pkg = JSON.parse(readFileSync(fullPath, "utf8"));
    if (pkg.version !== version) {
      pkg.version = version;
      writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
      logger.log("Synced %s to version %s", pkg.name, version);
    } else {
      logger.log("%s already at version %s", pkg.name, version);
    }
  }
}

export default { prepare };

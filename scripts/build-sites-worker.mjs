import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const workerPublicDir = join(rootDir, "workers/sites/public");
const sitesDir = join(workerPublicDir, "__sites");

const sites = [
  {
    key: "docs",
    source: join(rootDir, "apps/docs/public"),
  },
  {
    key: "example-basic",
    source: join(rootDir, "apps/example-basic/public"),
  },
  {
    key: "example-multilang",
    source: join(rootDir, "apps/example-multilang/public"),
  },
  {
    key: "example-config",
    source: join(rootDir, "apps/example-config/public"),
  },
  {
    key: "example-blog",
    source: join(rootDir, "apps/example-blog/public"),
  },
  {
    key: "example-recipes",
    source: join(rootDir, "apps/example-recipes/public"),
  },
];

const ensureExists = async (path, label) => {
  try {
    await access(path);
  } catch {
    throw new Error(`Missing build output for ${label} at ${path}. Run the matching app build first.`);
  }
};

await rm(workerPublicDir, { recursive: true, force: true });
await mkdir(sitesDir, { recursive: true });

for (const site of sites) {
  await ensureExists(site.source, site.key);
  await cp(site.source, join(sitesDir, site.key), { recursive: true });
}

await writeFile(
  join(sitesDir, "manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sites: sites.map(({ key }) => key),
    },
    null,
    2
  )
);

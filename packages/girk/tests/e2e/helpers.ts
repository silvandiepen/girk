import { access, cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const fixturesDirectory = fileURLToPath(new URL("./fixtures", import.meta.url));

export async function setupFixture(name: string): Promise<string> {
  const source = join(fixturesDirectory, name);
  const target = await mkdtemp(join(tmpdir(), `girk-e2e-${name}-`));

  const entries = await readdir(source);

  await Promise.all(
    entries.map(async (entry) => {
      await cp(join(source, entry), join(target, entry), { recursive: true });
    }),
  );

  return target;
}

export async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const nextPrefix = (prefix ? join(prefix, entry.name) : entry.name).replace(/\\/g, "/");
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(fullPath, nextPrefix);
      }

      return [nextPrefix];
    }),
  );

  return files.flat().sort();
}

export async function readOutput(outputDir: string, filePath: string): Promise<string> {
  return readFile(join(outputDir, filePath), "utf8");
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function cleanupFixture(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

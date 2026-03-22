import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  asyncForEach,
  createDir,
  fileExists,
  getFileData,
  getStringFromTag,
  hello,
  nthIndex,
  parentPath,
  removeTag,
  renamePath,
} from "@/libs/utils";

describe("Local runtime utils", () => {
  it("preserves order in asyncForEach", async () => {
    const values: string[] = [];

    await asyncForEach([1, 2, 3], async (item) => {
      values.push(`start-${item}`);
      await Promise.resolve();
      values.push(`end-${item}`);
    });

    expect(values).toEqual([
      "start-1",
      "end-1",
      "start-2",
      "end-2",
      "start-3",
      "end-3",
    ]);
  });

  it("returns the provided value from hello", async () => {
    await expect(hello({ ok: true })).resolves.toEqual({ ok: true });
    await expect(hello()).resolves.toEqual({});
  });

  it("removes matching tags", () => {
    expect(removeTag("<h1>Hello</h1><p>World</p>", "h1")).toBe("<p>World</p>");
  });

  it("returns the first matching tag content", () => {
    expect(getStringFromTag("<h1>Hello</h1><h1>World</h1>", "h1")).toBe("Hello");
  });

  it("returns the requested nth index", () => {
    expect(nthIndex("a---b---c", "---", 0)).toBe(1);
    expect(nthIndex("a---b---c", "---", 1)).toBe(5);
  });

  it("returns the parent path", () => {
    expect(parentPath("/a/b/c.txt")).toBe("/a/b");
    expect(parentPath("/a/b/c/d.txt", -2)).toBe("/a/b");
  });

  it("renames the final folder segment", () => {
    expect(renamePath("/docs/old-name/index.html", "new-name")).toBe(
      "/docs/new-name/index.html"
    );
  });

  it("creates nested directories", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-runtime-utils-"));
    const target = join(root, "a", "b", "c");

    await createDir(target);

    await expect(fileExists(target)).resolves.toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("loads text and json files", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-runtime-utils-"));
    const textFile = join(root, "example.txt");
    const jsonFile = join(root, "example.json");

    await writeFile(textFile, "hello");
    await writeFile(jsonFile, JSON.stringify({ ok: true }));

    await expect(getFileData(textFile)).resolves.toBe("hello");
    await expect(getFileData<{ ok: boolean }>(jsonFile)).resolves.toEqual({
      ok: true,
    });

    await rm(root, { recursive: true, force: true });
  });

  it("returns false for missing paths", async () => {
    const missingPath = join(tmpdir(), "girk-runtime-utils-missing-file");
    await expect(fileExists(missingPath)).resolves.toBe(false);
  });
});

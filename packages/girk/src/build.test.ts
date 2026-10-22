import { describe, expect, it } from "vitest";

import { isIgnoredPath, stripSourceRoot } from "@/build";
import type { File } from "@/types";

describe("isIgnoredPath", () => {
  it("matches whole folder and file names", () => {
    expect(isIgnoredPath("/drafts/post.md", ["drafts"])).toBe(true);
    expect(isIgnoredPath("/blog/private.md", ["private"])).toBe(true);
    expect(isIgnoredPath("/blog/private.md", ["private.md"])).toBe(true);
    expect(isIgnoredPath("/blog/private:nl.md", ["private"])).toBe(true);
  });

  it("does not match parts of names", () => {
    expect(isIgnoredPath("/drafts-guide.md", ["drafts"])).toBe(false);
    expect(isIgnoredPath("/blog/privateer.md", ["private"])).toBe(false);
  });

  it("matches path prefixes", () => {
    expect(isIgnoredPath("/blog/drafts/post.md", ["blog/drafts"])).toBe(true);
    expect(isIgnoredPath("/blog/drafts-old/post.md", ["blog/drafts"])).toBe(false);
  });
});

describe("stripSourceRoot", () => {
  const file = (relativePath: string, cwd: string) =>
    ({ id: "x", relativePath, path: `${cwd}${relativePath}` }) as File;

  it("publishes a top-level src folder from the root", () => {
    expect(stripSourceRoot(file("/src/guide/intro.md", "/site"), "/site")).toMatchObject({
      id: "en-guide-intro",
      relativePath: "/guide/intro.md",
      path: "/site/guide/intro.md",
    });
  });

  it("leaves projects that live inside a src directory alone", () => {
    const input = file("/guide/intro.md", "/Users/me/src/site");
    expect(stripSourceRoot(input, "/Users/me/src/site")).toBe(input);
  });

  it("leaves nested src folders alone", () => {
    const input = file("/docs/src/intro.md", "/site");
    expect(stripSourceRoot(input, "/site")).toBe(input);
  });
});

import { describe, it, expect } from "vitest";
import { extname, basename, dirname, join } from "./path-utils";

describe("path-utils", () => {
  describe("extname", () => {
    it("returns .md for markdown files", () => {
      expect(extname("readme.md")).toBe(".md");
    });

    it("returns last extension for double-dotted files", () => {
      expect(extname("file.test.js")).toBe(".js");
    });

    it("returns empty string for no extension", () => {
      expect(extname("noext")).toBe("");
    });

    it("returns empty string for hidden files with no extension", () => {
      expect(extname(".gitignore")).toBe("");
    });

    it("works with full paths", () => {
      expect(extname("/blog/post.md")).toBe(".md");
    });

    it("returns dot for trailing dot", () => {
      expect(extname("file.")).toBe(".");
    });
  });

  describe("basename", () => {
    it("returns filename from path", () => {
      expect(basename("/blog/post.md")).toBe("post.md");
    });

    it("strips extension when provided", () => {
      expect(basename("/blog/post.md", ".md")).toBe("post");
    });

    it("returns filename for no-directory path", () => {
      expect(basename("post.md")).toBe("post.md");
    });

    it("handles trailing slash", () => {
      expect(basename("/blog/")).toBe("blog");
    });

    it("does not strip non-matching extension", () => {
      expect(basename("post.md", ".html")).toBe("post.md");
    });
  });

  describe("dirname", () => {
    it("returns directory from path", () => {
      expect(dirname("/blog/post.md")).toBe("/blog");
    });

    it("returns empty for filename only", () => {
      expect(dirname("post.md")).toBe("");
    });

    it("handles nested paths", () => {
      expect(dirname("/a/b/c/d.md")).toBe("/a/b/c");
    });

    it("returns empty for root", () => {
      expect(dirname("/")).toBe("");
    });
  });

  describe("join", () => {
    it("joins two segments", () => {
      expect(join("/blog", "post.md")).toBe("/blog/post.md");
    });

    it("joins multiple segments", () => {
      expect(join("", "a", "b", "c")).toBe("a/b/c");
    });

    it("collapses multiple slashes", () => {
      expect(join("/assets/", "/style/")).toBe("/assets/style/");
    });

    it("returns . for no segments", () => {
      expect(join()).toBe(".");
    });

    it("handles empty segments", () => {
      expect(join("", "a", "", "b")).toBe("a/b");
    });
  });
});

import { describe, it, expect } from "vitest";
import { build } from "../src/build";
import type { GirkBuildInput } from "../src/types";

describe("SDK build", () => {
  it("should compile without errors", async () => {
    const input: GirkBuildInput = {
      files: [
        {
          path: "/index.md",
          content: "# Hello World\n\nThis is a test page.",
        },
      ],
    };

    const result = await build(input);

    expect(result).toBeDefined();
    expect(result.files).toBeInstanceOf(Array);
    expect(result.pages).toBeInstanceOf(Array);
    expect(result.languages).toContain("en");
  });

  it("should produce HTML output files", async () => {
    const input: GirkBuildInput = {
      files: [
        {
          path: "/index.md",
          content: "# Hello World\n\nThis is a test page.",
        },
      ],
    };

    const result = await build(input);

    const htmlFiles = result.files.filter((f) => f.contentType === "text/html");
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  it("should produce CSS output", async () => {
    const input: GirkBuildInput = {
      files: [
        {
          path: "/index.md",
          content: "# Hello World",
        },
      ],
    };

    const result = await build(input);

    const cssFiles = result.files.filter((f) => f.contentType === "text/css");
    expect(cssFiles.length).toBeGreaterThan(0);
  });
});

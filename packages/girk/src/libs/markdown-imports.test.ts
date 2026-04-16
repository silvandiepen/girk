import { afterEach, describe, expect, it, vi } from "vitest";
import fetch from "node-fetch";
import { readFile } from "node:fs/promises";

import { loadImport, resolveImports, rewriteImportedLinks, toHtml } from "@/libs/markdown";

vi.mock("node-fetch", () => ({ default: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));

const fetchMock = vi.mocked(fetch);
const readFileMock = vi.mocked(readFile);

// ---------------------------------------------------------------------------
// rewriteImportedLinks
// ---------------------------------------------------------------------------

describe("rewriteImportedLinks", () => {
  it("converts a .md link to a directory URL", () => {
    expect(rewriteImportedLinks("[Convert](./convert.md)")).toBe("[Convert](./convert/)");
  });

  it("converts README.md to a trailing-slash directory URL", () => {
    expect(rewriteImportedLinks("[API](./README.md)")).toBe("[API](./)");
  });

  it("converts index.md to a trailing-slash directory URL", () => {
    expect(rewriteImportedLinks("[Home](./index.md)")).toBe("[Home](./)");
  });

  it("preserves anchor fragments on rewritten links", () => {
    expect(rewriteImportedLinks("[API](./api.md#usage)")).toBe("[API](./api/#usage)");
  });

  it("keeps relative paths as-is — only the extension is converted", () => {
    // ../utils.md stays ../utils/ — no rebasing to an absolute-style relative path
    expect(rewriteImportedLinks("[Utils](../utils.md)")).toBe("[Utils](../utils/)");
  });

  it("does not rewrite external URLs", () => {
    const input = "[Docs](https://example.com/api.md)";
    expect(rewriteImportedLinks(input)).toBe(input);
  });

  it("does not rewrite root-relative paths", () => {
    const input = "[Page](/other/page.md)";
    expect(rewriteImportedLinks(input)).toBe(input);
  });

  it("does not rewrite anchor-only hrefs", () => {
    const input = "[Section](#section)";
    expect(rewriteImportedLinks(input)).toBe(input);
  });

  it("leaves non-.md links unchanged", () => {
    const input = "[Site](https://example.com)  [Local](./page.html)";
    expect(rewriteImportedLinks(input)).toBe(input);
  });

  it("rewrites multiple links in one pass", () => {
    const result = rewriteImportedLinks(
      "- [Convert](./convert.md)\n- [Palette](./palette.md)\n- [API](./README.md)"
    );
    expect(result).toBe(
      "- [Convert](./convert/)\n- [Palette](./palette/)\n- [API](./)"
    );
  });
});

// ---------------------------------------------------------------------------
// loadImport — local files
// ---------------------------------------------------------------------------

describe("loadImport — local file", () => {
  afterEach(() => vi.clearAllMocks());

  it("reads a file relative to basePath and returns its body", async () => {
    readFileMock.mockResolvedValue("# Component\n\nBody content." as any);

    const result = await loadImport("../src/README.md", "/docs/button.md");

    expect(result.trim()).toBe("# Component\n\nBody content.");
  });

  it("strips frontmatter from the imported file", async () => {
    readFileMock.mockResolvedValue(
      "---\ntitle: Internal\ntags: ui\n---\n\n# Component\n\nBody only." as any
    );

    const result = await loadImport("../src/README.md", "/docs/button.md");

    expect(result).not.toContain("---");
    expect(result).not.toContain("title: Internal");
    expect(result.trim()).toBe("# Component\n\nBody only.");
  });

  it("rewrites .md links to directory URLs, keeping relative paths as-is", async () => {
    readFileMock.mockResolvedValue(
      "- [Convert](./convert.md)\n- [Palette](./palette.md)\n- [API](./README.md)" as any
    );

    const result = await loadImport("../../src/libs/README.md", "/docs/api.md");

    expect(result).toContain("[Convert](./convert/)");
    expect(result).toContain("[Palette](./palette/)");
    expect(result).toContain("[API](./)");
    expect(result).not.toContain(".md)");
  });

  it("returns an empty string and warns when the file is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    readFileMock.mockRejectedValue(new Error("ENOENT: no such file or directory"));

    const result = await loadImport("../missing.md", "/docs/page.md");

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[girk]"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("ENOENT"));
  });
});

// ---------------------------------------------------------------------------
// loadImport — URLs
// ---------------------------------------------------------------------------

describe("loadImport — URL", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches a URL and returns its body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "# Remote Doc\n\nFetched content.",
    } as any);

    const result = await loadImport("https://example.com/README.md", "/docs/page.md");

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/README.md");
    expect(result.trim()).toBe("# Remote Doc\n\nFetched content.");
  });

  it("strips frontmatter from the URL response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "---\ntitle: Remote\n---\n\n# Remote\n\nRemote body.",
    } as any);

    const result = await loadImport("https://example.com/README.md", "/docs/page.md");

    expect(result).not.toContain("title: Remote");
    expect(result.trim()).toBe("# Remote\n\nRemote body.");
  });

  it("returns an empty string and warns on a non-ok HTTP response", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as any);

    const result = await loadImport("https://example.com/gone.md", "/docs/page.md");

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("404"));
  });

  it("returns an empty string and warns when the fetch throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network unavailable"));

    const result = await loadImport("https://example.com/README.md", "/docs/page.md");

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("network unavailable"));
  });
});

// ---------------------------------------------------------------------------
// resolveImports
// ---------------------------------------------------------------------------

describe("resolveImports", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns content unchanged when no [import:] markers are present", async () => {
    const content = "# Page\n\nNo imports here.";
    expect(await resolveImports(content, "/docs/page.md")).toBe(content);
    expect(readFileMock).not.toHaveBeenCalled();
  });

  it("replaces a single [import:] marker with the file body", async () => {
    readFileMock.mockResolvedValue("Imported body." as any);

    const result = await resolveImports(
      "# Wrapper\n\n[import:../src/README.md]\n\n## After",
      "/docs/page.md"
    );

    expect(result).toContain("Imported body.");
    expect(result).toContain("## After");
    expect(result).not.toContain("[import:");
  });

  it("replaces multiple different [import:] markers", async () => {
    readFileMock
      .mockResolvedValueOnce("Button body." as any)
      .mockResolvedValueOnce("Input body." as any);

    const result = await resolveImports(
      "[import:../button/README.md]\n\n[import:../input/README.md]",
      "/docs/page.md"
    );

    expect(result).toContain("Button body.");
    expect(result).toContain("Input body.");
  });

  it("loads a duplicate import path only once and reuses the result", async () => {
    readFileMock.mockResolvedValue("Shared content." as any);

    const result = await resolveImports(
      "[import:../shared.md]\n\n[import:../shared.md]",
      "/docs/page.md"
    );

    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(result.match(/Shared content\./g)).toHaveLength(2);
  });

  it("does NOT recurse into [import:] markers found inside a loaded file", async () => {
    // The loaded file contains its own [import:] marker — it must be left as literal text
    readFileMock.mockResolvedValue("Loaded body.\n\n[import:../nested.md]" as any);

    const result = await resolveImports("[import:../first.md]", "/docs/page.md");

    // nested.md must never be read
    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(result).toContain("[import:../nested.md]");
  });
});

// ---------------------------------------------------------------------------
// toHtml — metadata import
// ---------------------------------------------------------------------------

describe("toHtml — metadata import", () => {
  afterEach(() => vi.clearAllMocks());

  it("prepends the imported body before the page's own content", async () => {
    readFileMock.mockResolvedValue("# Button\n\nImported section." as any);

    const { document } = await toHtml(
      "---\ntitle: Button Docs\nimport: ../src/README.md\n---\n\n## Own Content",
      "/docs/button.md"
    );

    expect(document).toContain("Imported section.");
    expect(document).toContain("Own Content");
    expect(document.indexOf("Imported section.")).toBeLessThan(
      document.indexOf("Own Content")
    );
  });

  it("uses only the imported body when the page itself has no content", async () => {
    readFileMock.mockResolvedValue("# Component\n\nOnly imported." as any);

    const { document } = await toHtml(
      "---\ntitle: Component\nimport: ../src/README.md\n---",
      "/docs/component.md"
    );

    expect(document).toContain("Only imported.");
  });

  it("strips frontmatter from the imported file", async () => {
    readFileMock.mockResolvedValue(
      "---\ntitle: Internal\n---\n\n# Component\n\nClean body." as any
    );

    const { document } = await toHtml(
      "---\nimport: ../src/README.md\n---",
      "/docs/page.md"
    );

    expect(document).not.toContain("Internal");
    expect(document).toContain("Clean body.");
  });

  it("skips import resolution when filePath is not provided", async () => {
    const { document } = await toHtml(
      "---\nimport: ../src/README.md\n---\n\n# Content"
    );

    expect(readFileMock).not.toHaveBeenCalled();
    expect(document).toContain("Content");
  });
});

// ---------------------------------------------------------------------------
// toHtml — inline import
// ---------------------------------------------------------------------------

describe("toHtml — inline import", () => {
  afterEach(() => vi.clearAllMocks());

  it("replaces [import:] markers in the body", async () => {
    readFileMock.mockResolvedValue("# Input\n\nInline imported." as any);

    const { document } = await toHtml(
      "# API\n\n[import:../src/input/README.md]",
      "/docs/api.md"
    );

    expect(document).toContain("Inline imported.");
    expect(document).not.toContain("[import:");
  });

  it("resolves an inline URL import", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => "# External\n\nFetched inline.",
    } as any);

    const { document } = await toHtml(
      "# Page\n\n[import:https://example.com/README.md]",
      "/docs/page.md"
    );

    expect(document).toContain("Fetched inline.");
    expect(document).not.toContain("[import:");
  });
});

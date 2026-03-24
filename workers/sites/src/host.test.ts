import { describe, expect, it } from "vitest";

import { getAssetCandidates, getSiteKey } from "./host";

describe("getSiteKey", () => {
  it("maps the docs hosts to the docs site", () => {
    expect(getSiteKey("girk.dev")).toBe("docs");
    expect(getSiteKey("www.girk.dev")).toBe("docs");
    expect(getSiteKey("docs.girk.dev")).toBe("docs");
  });

  it("maps example subdomains to the matching site bundle", () => {
    expect(getSiteKey("example-basic.girk.dev")).toBe("example-basic");
    expect(getSiteKey("example-data.girk.dev")).toBe("example-data");
    expect(getSiteKey("example-multilang.girk.dev")).toBe("example-multilang");
    expect(getSiteKey("example-config.girk.dev")).toBe("example-config");
    expect(getSiteKey("example-blog.girk.dev")).toBe("example-blog");
    expect(getSiteKey("example-recipes.girk.dev")).toBe("example-recipes");
  });

  it("uses the preview query parameter for localhost development", () => {
    expect(getSiteKey("localhost", new URLSearchParams("site=example-basic"))).toBe(
      "example-basic"
    );
    expect(getSiteKey("localhost", new URLSearchParams("site=example-data"))).toBe(
      "example-data"
    );
    expect(getSiteKey("localhost", new URLSearchParams("site=example-config"))).toBe(
      "example-config"
    );
    expect(getSiteKey("localhost", new URLSearchParams("site=example-recipes"))).toBe(
      "example-recipes"
    );
  });

  it("returns null for unknown subdomains", () => {
    expect(getSiteKey("unknown.girk.dev")).toBeNull();
    expect(getSiteKey("example.com")).toBeNull();
  });
});

describe("getAssetCandidates", () => {
  it("builds root candidates for a site", () => {
    expect(getAssetCandidates("docs", "/")).toEqual([
      "/__sites/docs/index.html",
      "/__sites/docs/",
    ]);
  });

  it("builds asset candidates for directory paths", () => {
    expect(getAssetCandidates("example-basic", "/guide/")).toEqual([
      "/__sites/example-basic/guide/index.html",
      "/__sites/example-basic/guide/",
    ]);
  });

  it("leaves file paths unchanged", () => {
    expect(getAssetCandidates("example-multilang", "/style/app.css")).toEqual([
      "/__sites/example-multilang/style/app.css",
    ]);
  });

  it("adds an index fallback for extensionless paths", () => {
    expect(getAssetCandidates("example-basic", "/guide")).toEqual([
      "/__sites/example-basic/guide/index.html",
      "/__sites/example-basic/guide",
    ]);
  });
});

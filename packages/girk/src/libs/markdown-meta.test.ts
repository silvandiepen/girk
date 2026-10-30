import { describe, expect, it } from "vitest";

import { extractMeta } from "./markdown-meta";

describe("extractMeta", () => {
  it("keeps commas in string values", async () => {
    const meta = await extractMeta(
      "---\ntitle: Toast, grind, store\ndescription: Warm, smoky and earthy.\n---\n# Body"
    );

    expect(meta.title).toBe("Toast, grind, store");
    expect(meta.description).toBe("Warm, smoky and earthy.");
  });

  it("splits list keys into arrays", async () => {
    const meta = await extractMeta(
      "---\ntags: spices, mix, 2026\nimport: a.md, b.md\n---\n# Body"
    );

    expect(meta.tags).toEqual(["spices", "mix", 2026]);
    expect(meta.import).toEqual(["a.md", "b.md"]);
  });

  it("keeps a single tag as a string", async () => {
    const meta = await extractMeta("---\ntags: spices\n---\n# Body");

    expect(meta.tags).toBe("spices");
  });
});

import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import fetch from "node-fetch";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prepareDataFiles } from "@/libs/data";
import { extractMeta, removeMeta } from "@/libs/markdown-meta";
import type { File } from "@/types";

vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

const createFile = (root: string, relativePath: string, data: string): File => ({
  id: relativePath.replace(/\//g, "-"),
  fileName: relativePath.split("/").pop()?.replace(".md", "") || "file",
  name: relativePath.split("/").pop()?.replace(".md", "") || "file",
  path: join(root, relativePath),
  relativePath: `/${relativePath}`,
  created: new Date("2026-03-24T00:00:00.000Z"),
  language: "en",
  ext: ".md",
  parent: relativePath.split("/").length > 1 ? relativePath.split("/")[0] : "",
  data,
});

afterEach(() => {
  vi.mocked(fetch).mockReset();
});

describe("Build-time data sources", () => {
  it("replaces result placeholders on a normal page and strips data settings", async () => {
    const root = process.cwd();
    const url = "https://example.test/object";

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "API Powered Page",
        summary: "Built from a fetched object.",
      }),
    } as never);

    const [page] = await prepareDataFiles([
      createFile(
        root,
        "about.md",
        `---
dataSource: ${url}
title: {{result.title}}
---

# {{result.title}}

{{result.summary}}
`
      ),
    ]);

    const meta = await extractMeta(page.data || "");
    const body = await removeMeta(page.data || "");

    expect(meta).toEqual({
      title: "API Powered Page",
    });
    expect(body).toContain("# API Powered Page");
    expect(body).toContain("Built from a fetched object.");
    expect(page.data).not.toContain("dataSource:");
  });

  it("renders repeated blocks from an array source", async () => {
    const root = process.cwd();
    const url = "https://example.test/list";

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { title: "Alpha", summary: "First item" },
          { title: "Beta", summary: "Second item" },
        ],
      }),
    } as never);

    const [page] = await prepareDataFiles([
      createFile(
        root,
        "projects.md",
        `---
dataSource: ${url}
dataItems: items
title: Projects
---

# Projects

{{#each result}}
## {{result.title}}

{{result.summary}}
{{/each}}
`
      ),
    ]);

    const body = await removeMeta(page.data || "");

    expect(body).toContain("## Alpha");
    expect(body).toContain("First item");
    expect(body).toContain("## Beta");
    expect(body).toContain("Second item");
  });

  it("fans out a template file into generated detail pages", async () => {
    const root = process.cwd();
    const url = "https://example.test/generated";

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { slug: "alpha", title: "Alpha Project", summary: "First generated page" },
          {
            slug: "nested/beta",
            title: "Beta Project",
            summary: "Second generated page",
          },
        ],
      }),
    } as never);

    const files = await prepareDataFiles([
      createFile(
        root,
        "projects/-detail.md",
        `---
dataSource: ${url}
dataItems: items
dataSlug: slug
title: {{result.title}}
description: {{result.summary}}
---

# {{result.title}}

{{result.summary}}
`
      ),
    ]);

    expect(files).toHaveLength(2);
    expect(files.map((file) => file.relativePath)).toEqual([
      "/projects/alpha.md",
      "/projects/nested/beta.md",
    ]);

    const firstMeta = await extractMeta(files[0].data || "");
    const firstBody = await removeMeta(files[0].data || "");

    expect(firstMeta).toEqual({
      title: "Alpha Project",
      description: "First generated page",
    });
    expect(firstBody).toContain("# Alpha Project");
    expect(firstBody).toContain("First generated page");
    expect(files[0].parent).toBe("projects");
    expect(files[1].parent).toBe("nested");
  });

  it("loads a local json file as a data source", async () => {
    const root = process.cwd();
    const dataFile = join(root, "src/libs/.tmp-data-source.json");

    await writeFile(
      dataFile,
      JSON.stringify({
        title: "Local Source",
        summary: "Resolved from a project file.",
      })
    );

    try {
      const [page] = await prepareDataFiles([
        createFile(
          root,
          "local-source.md",
          `---
dataSource: src/libs/.tmp-data-source.json
title: {{result.title}}
---

{{result.summary}}
`
        ),
      ]);

      const meta = await extractMeta(page.data || "");
      const body = await removeMeta(page.data || "");

      expect(meta).toEqual({
        title: "Local Source",
      });
      expect(body).toContain("Resolved from a project file.");
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    } finally {
      await rm(dataFile, { force: true });
    }
  });
});

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { generateSearchIndex, hasSearchEnabled } from "@/libs/search";
import { ArchiveType, File, FileType, Payload } from "@/types";

const originalCwd = process.cwd();

const createFile = (root: string, input: Partial<File>): File => ({
  id: input.id || "page",
  name: input.name || "page",
  fileName: input.fileName || input.name || "page",
  path: input.path || `${input.name || "page"}.md`,
  created: input.created || new Date("2026-04-06T00:00:00.000Z"),
  language: input.language || "en",
  type: FileType.CONTENT,
  title: input.title || "Page",
  html: input.html || "<p>Page</p>",
  meta: input.meta || {},
  parent: input.parent,
  home: input.home,
});

const createPayload = (root: string, files: File[], searchProject = {}): Payload => ({
  files,
  media: [],
  socials: [],
  languages: ["en"],
  settings: {
    output: join(root, "public"),
    languages: ["en"],
    args: {},
    config: {},
  },
  output: join(root, "public"),
  args: {},
  config: {},
  project: {
    title: "Example Project",
    search: true,
    ...searchProject,
  },
  generator: {
    name: "Girk",
    version: "1.24.0-test",
  },
});

afterEach(async () => {
  process.chdir(originalCwd);
});

describe("Search index generation", () => {
  it("writes a generic language shard and skips non-routable pages", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-search-"));
    process.chdir(root);

    const guideHome = createFile(root, {
      id: "guide-home",
      name: "guide",
      fileName: "README",
      path: "guide/README.md",
      home: true,
      title: "Guide",
      meta: {
        archive: ArchiveType.SECTIONS,
      },
      html: "<h1>Guide</h1><p>Guide overview</p>",
    });

    const payload = createPayload(root, [
      createFile(root, {
        id: "home",
        name: "index",
        fileName: "README",
        path: "README.md",
        home: true,
        title: "Home",
        html: "<h1>Home</h1><p>Welcome to the project</p>",
      }),
      createFile(root, {
        id: "search-page",
        name: "search",
        path: "features/search.md",
        parent: "features",
        title: "Search",
        html: "<h1>Search</h1><h2>Static Index</h2><p>Search content without a database.</p>",
      }),
      createFile(root, {
        id: "hidden-page",
        name: "hidden",
        path: "features/hidden.md",
        parent: "features",
        title: "Hidden",
        meta: {
          hide: true,
        },
      }),
      createFile(root, {
        id: "redirect-page",
        name: "redirect",
        path: "features/redirect.md",
        parent: "features",
        title: "Redirect",
        meta: {
          redirect: "/elsewhere/",
        },
      }),
      guideHome,
      createFile(root, {
        id: "guide-intro",
        name: "intro",
        path: "guide/intro.md",
        parent: "guide",
        title: "Intro",
        html: "<h1>Intro</h1><p>This page is part of a sections archive.</p>",
      }),
    ]);

    await generateSearchIndex(payload);

    const manifest = JSON.parse(
      await readFile(join(root, "public", "assets", "search", "manifest.json"), "utf8")
    );
    const shard = JSON.parse(
      await readFile(join(root, "public", "assets", "search", "en.json"), "utf8")
    );
    const client = await readFile(join(root, "public", "assets", "search", "client.js"), "utf8");

    expect(manifest.version).toBe("1.24.0-test");
    expect(manifest.shards).toEqual([
      {
        id: "en",
        language: "en",
        section: "all",
        documents: 3,
        path: "/assets/search/en.json",
      },
    ]);
    expect(Object.keys(shard.docs)).toEqual(["home", "search-page", "guide-home"]);
    expect(shard.terms.search[0][0]).toBe("search-page");
    expect(client).toContain("window.GirkSearch");

    await rm(root, { recursive: true, force: true });
  });

  it("can split shards by top-level section when configured", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-search-section-"));
    process.chdir(root);

    const payload = createPayload(
      root,
      [
        createFile(root, {
          id: "home",
          name: "index",
          fileName: "README",
          path: "README.md",
          home: true,
          title: "Home",
        }),
        createFile(root, {
          id: "features-search",
          name: "search",
          path: "features/search.md",
          parent: "features",
          title: "Search",
        }),
        createFile(root, {
          id: "guides-install",
          name: "install",
          path: "guides/install.md",
          parent: "guides",
          title: "Install",
        }),
      ],
      {
        searchSharding: "section",
      }
    );

    await generateSearchIndex(payload);

    const manifest = JSON.parse(
      await readFile(join(root, "public", "assets", "search", "manifest.json"), "utf8")
    );

    expect(manifest.shards).toEqual([
      {
        id: "en-root",
        language: "en",
        section: "root",
        documents: 1,
        path: "/assets/search/en-root.json",
      },
      {
        id: "en-features",
        language: "en",
        section: "features",
        documents: 1,
        path: "/assets/search/en-features.json",
      },
      {
        id: "en-guides",
        language: "en",
        section: "guides",
        documents: 1,
        path: "/assets/search/en-guides.json",
      },
    ]);

    await rm(root, { recursive: true, force: true });
  });

  it("writes search assets when a single page enables search", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-search-page-enable-"));
    process.chdir(root);

    const payload = createPayload(
      root,
      [
        createFile(root, {
          id: "home",
          name: "index",
          fileName: "README",
          path: "README.md",
          home: true,
          title: "Home",
        }),
        createFile(root, {
          id: "search-page",
          name: "search",
          path: "features/search.md",
          parent: "features",
          title: "Search",
          meta: {
            search: true,
          },
        }),
      ],
      {
        search: false,
      }
    );

    await generateSearchIndex(payload);

    const manifest = JSON.parse(
      await readFile(join(root, "public", "assets", "search", "manifest.json"), "utf8")
    );

    expect(manifest.shards).toHaveLength(1);

    await rm(root, { recursive: true, force: true });
  });
});

describe("Search enablement", () => {
  it("can enable search for one page without projectSearch", () => {
    const root = "/tmp/search-enable";
    const home = createFile(root, {
      id: "home",
      name: "index",
      fileName: "README",
      path: "README.md",
      home: true,
      title: "Home",
    });
    const page = createFile(root, {
      id: "search-page",
      name: "search",
      path: "features/search.md",
      parent: "features",
      title: "Search",
      meta: {
        search: true,
      },
    });
    const sibling = createFile(root, {
      id: "plain-page",
      name: "plain",
      path: "features/plain.md",
      parent: "features",
      title: "Plain",
    });
    const payload = createPayload(root, [home, page, sibling], {
      search: false,
    });

    expect(hasSearchEnabled(page, payload)).toBe(true);
    expect(hasSearchEnabled(sibling, payload)).toBe(false);
  });

  it("can enable search for an archive branch from the archive home page", () => {
    const root = "/tmp/search-archive";
    const archiveHome = createFile(root, {
      id: "guide-home",
      name: "guide",
      fileName: "README",
      path: "guide/README.md",
      home: true,
      title: "Guide",
      meta: {
        archive: ArchiveType.SECTIONS,
        archiveSearch: true,
      },
    });
    const archiveChild = createFile(root, {
      id: "guide-install",
      name: "install",
      path: "guide/install.md",
      parent: "guide",
      title: "Install",
    });
    const outsidePage = createFile(root, {
      id: "other-page",
      name: "other",
      path: "other/page.md",
      parent: "other",
      title: "Other",
    });
    const payload = createPayload(root, [archiveHome, archiveChild, outsidePage], {
      search: false,
    });

    expect(hasSearchEnabled(archiveHome, payload)).toBe(true);
    expect(hasSearchEnabled(archiveChild, payload)).toBe(true);
    expect(hasSearchEnabled(outsidePage, payload)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { buildPage, isActiveMenuParent } from "@/libs/page";
import { File, Payload } from "@/types";

describe("Page navigation state", () => {
  it("does not treat the homepage as the parent of every route", () => {
    expect(isActiveMenuParent("/", "/features/index.html")).toBe(false);
  });

  it("keeps nested sections marked as parents", () => {
    expect(isActiveMenuParent("/features/index.html", "/features/archives/index.html")).toBe(true);
  });

  it("adds the generator name and version to the page head", async () => {
    const file: File = {
      id: "page-home",
      name: "index",
      fileName: "README",
      path: "/tmp/project/README.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      home: true,
      title: "Example",
      html: "<p>Hello world</p>",
      meta: {},
    };

    const payload: Payload = {
      files: [file],
      media: [],
      socials: [],
      languages: ["en"],
      settings: {
        output: "/tmp/project/public",
        languages: ["en"],
        args: {},
        config: {},
      },
      output: "/tmp/project/public",
      args: {},
      config: {},
      project: {
        title: "Example Project",
      },
      style: {
        path: "/style/app.css",
      },
      generator: {
        name: "Girk",
        version: "9.9.9-test",
      },
    };

    const page = await buildPage(payload, file);

    expect(page.html.data).toContain('<meta name="generator" content="Girk 9.9.9-test">');
  });

  it("includes the built-in search client when project search is enabled", async () => {
    const file: File = {
      id: "page-home",
      name: "index",
      fileName: "README",
      path: "/tmp/project/README.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      home: true,
      title: "Example",
      html: "<p>Hello world</p>",
      meta: {},
    };

    const payload: Payload = {
      files: [file],
      media: [],
      socials: [],
      languages: ["en"],
      settings: {
        output: "/tmp/project/public",
        languages: ["en"],
        args: {},
        config: {},
      },
      output: "/tmp/project/public",
      args: {},
      config: {},
      project: {
        title: "Example Project",
        search: true,
      },
      style: {
        path: "/style/app.css",
      },
      generator: {
        name: "Girk",
        version: "9.9.9-test",
      },
    };

    const page = await buildPage(payload, file);

    expect(page.html.data).toContain('<script src="/assets/search/client.js"></script>');
  });

  it("includes the built-in search client when a page enables search directly", async () => {
    const file: File = {
      id: "search-page",
      name: "search",
      fileName: "search",
      path: "/tmp/project/features/search.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      parent: "features",
      title: "Search",
      html: "<p>Hello world</p>",
      meta: {
        search: true,
      },
    };

    const payload: Payload = {
      files: [file],
      media: [],
      socials: [],
      languages: ["en"],
      settings: {
        output: "/tmp/project/public",
        languages: ["en"],
        args: {},
        config: {},
      },
      output: "/tmp/project/public",
      args: {},
      config: {},
      project: {
        title: "Example Project",
        search: false,
      },
      style: {
        path: "/style/app.css",
      },
      generator: {
        name: "Girk",
        version: "9.9.9-test",
      },
    };

    const page = await buildPage(payload, file);

    expect(page.html.data).toContain('aria-label="Open search"');
    expect(page.html.data).toContain('<script src="/assets/search/client.js"></script>');
  });

  it("includes the built-in search client on archive children when archiveSearch is enabled", async () => {
    const archiveHome: File = {
      id: "guide-home",
      name: "guide",
      fileName: "README",
      path: "/tmp/project/guide/README.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      home: true,
      title: "Guide",
      html: "<p>Guide overview</p>",
      meta: {
        archiveSearch: true,
      },
    };

    const file: File = {
      id: "guide-install",
      name: "install",
      fileName: "install",
      path: "/tmp/project/guide/install.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      parent: "guide",
      title: "Install",
      html: "<p>Install guide</p>",
      meta: {},
    };

    const payload: Payload = {
      files: [archiveHome, file],
      media: [],
      socials: [],
      languages: ["en"],
      settings: {
        output: "/tmp/project/public",
        languages: ["en"],
        args: {},
        config: {},
      },
      output: "/tmp/project/public",
      args: {},
      config: {},
      project: {
        title: "Example Project",
        search: false,
      },
      style: {
        path: "/style/app.css",
      },
      generator: {
        name: "Girk",
        version: "9.9.9-test",
      },
    };

    const page = await buildPage(payload, file);

    expect(page.html.data).toContain('aria-label="Open search"');
    expect(page.html.data).toContain('<script src="/assets/search/client.js"></script>');
  });

  it("renders resolved icons in navigation and related page cards", async () => {
    const home: File = {
      id: "features-home",
      name: "features",
      fileName: "README",
      path: "/tmp/project/features/README.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      home: true,
      title: "Features",
      html: "<p>Features landing page</p>",
      meta: {},
    };

    const file: File = {
      id: "metadata-page",
      name: "metadata",
      fileName: "metadata",
      path: "/tmp/project/features/metadata.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      parent: "features",
      title: "Page Metadata",
      html: "<p>Hello world</p>",
      meta: {},
    };

    const relatedPage: File = {
      id: "archives-page",
      name: "archives",
      fileName: "archives",
      path: "/tmp/project/features/archives.md",
      created: new Date("2026-03-25T00:00:00.000Z"),
      language: "en",
      parent: "features",
      title: "Archives",
      html: "<p>Archive docs</p>",
      meta: { color: "primary" },
      icon: {
        provider: "open-icon",
        svg: '<svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg>',
      },
    };

    const payload: Payload = {
      files: [home, file, relatedPage],
      media: [],
      socials: [],
      menu: [
        {
          id: "features-home",
          name: "Features",
          link: "/features/index.html",
          active: true,
          language: "en",
          icon: {
            provider: "open-icon",
            svg: '<svg viewBox="0 0 16 16"><path d="M2 8h12"/></svg>',
          },
        },
      ],
      languages: ["en"],
      settings: {
        output: "/tmp/project/public",
        languages: ["en"],
        args: {},
        config: {},
      },
      output: "/tmp/project/public",
      args: {},
      config: {},
      project: {
        title: "Example Project",
      },
      style: {
        path: "/style/app.css",
      },
      generator: {
        name: "Girk",
        version: "9.9.9-test",
      },
    };

    const page = await buildPage(payload, file);

    expect(page.html.data).toContain("navigation__icon");
    expect(page.html.data).toContain("archive-card__icon");
    expect(page.html.data).toContain('<svg viewBox="0 0 16 16"><path d="M2 8h12"/></svg>');
    expect(page.html.data).toContain('<svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg>');
    expect(page.html.data).toContain(
      'style="--section-background-color: var(--color-primary); --section-text-color: var(--color-primary-contrast)"'
    );
  });
});

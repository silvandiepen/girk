import { describe, expect, it } from "vitest";

import { buildPage, isActiveMenuParent } from "@/libs/page";
import { File, Payload } from "@/types";

describe("Page navigation state", () => {
  it("does not treat the homepage as the parent of every route", () => {
    expect(isActiveMenuParent("/", "/features/index.html")).toBe(false);
  });

  it("keeps nested sections marked as parents", () => {
    expect(
      isActiveMenuParent("/features/index.html", "/features/archives/index.html")
    ).toBe(true);
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

    expect(page.html.data).toContain(
      '<meta name="generator" content="Girk 9.9.9-test">'
    );
  });
});

import { describe, expect, it } from "vitest";

import { generateMenu } from "@/libs/menu";

describe("Menu generation", () => {
  it("keeps boolean-hidden pages out of the menu", async () => {
    const payload = await generateMenu({
      files: [
        {
          id: "visible",
          title: "Visible",
          path: `${process.cwd()}/visible.md`,
          language: "en",
          meta: {},
        },
        {
          id: "hidden",
          title: "Hidden",
          path: `${process.cwd()}/hidden.md`,
          language: "en",
          meta: { hide: true },
        },
        {
          id: "hidden-home",
          title: "Hidden Home",
          path: `${process.cwd()}/release-notes/README.md`,
          language: "en",
          home: true,
          meta: { hide: true },
        },
      ],
      languages: ["en"],
    } as any);

    expect(payload.menu.map((item) => item.name)).toEqual(["Visible"]);
  });

  it("includes first-level section home pages without archive metadata", async () => {
    const payload = await generateMenu({
      files: [
        {
          id: "home",
          title: "Home",
          path: `${process.cwd()}/README.md`,
          home: true,
          language: "en",
          meta: {},
        },
        {
          id: "icons",
          title: "Icons",
          path: `${process.cwd()}/icons/README.md`,
          home: true,
          language: "en",
          meta: { order: 1 },
        },
        {
          id: "packages",
          title: "Packages",
          path: `${process.cwd()}/packages/README.md`,
          home: true,
          language: "en",
          meta: { order: 2 },
        },
        {
          id: "api",
          title: "API",
          path: `${process.cwd()}/api/README.md`,
          home: true,
          language: "en",
          meta: { archive: "sections", order: 3 },
        },
      ],
      languages: ["en"],
    } as any);

    expect(payload.menu.map((item) => item.name)).toEqual([
      "Icons",
      "Packages",
      "API",
    ]);
  });
});

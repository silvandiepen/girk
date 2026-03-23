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
});

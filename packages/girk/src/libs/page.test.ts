import { describe, expect, it } from "vitest";

import { isActiveMenuParent } from "@/libs/page";

describe("Page navigation state", () => {
  it("does not treat the homepage as the parent of every route", () => {
    expect(isActiveMenuParent("/", "/features/index.html")).toBe(false);
  });

  it("keeps nested sections marked as parents", () => {
    expect(
      isActiveMenuParent("/features/index.html", "/features/archives/index.html")
    ).toBe(true);
  });
});

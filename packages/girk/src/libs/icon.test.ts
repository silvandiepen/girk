import { rm, writeFile } from "fs/promises";
import { join } from "path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveIcon, setOpenIconModuleLoader } from "@/libs/icon";

afterEach(() => {
  setOpenIconModuleLoader();
});

describe("Icon resolution", () => {
  it("resolves Open Icon shorthand keys from page metadata", async () => {
    setOpenIconModuleLoader(async () => await import("open-icon"));

    const icon = await resolveIcon("ADD");

    expect(icon?.provider).toBe("open-icon");
    expect(icon?.svg).toContain("<svg");
  });

  it("inlines local svg assets", async () => {
    const iconPath = join(process.cwd(), ".tmp-open-icon-test.svg");
    await writeFile(
      iconPath,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1H0z"/></svg>',
    );

    try {
      const icon = await resolveIcon("/.tmp-open-icon-test.svg");

      expect(icon?.provider).toBe("asset");
      expect(icon?.svg).toContain("<svg");
    } finally {
      await rm(iconPath, { force: true });
    }
  });
});

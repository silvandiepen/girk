import { describe, expect, it } from "vitest";

import { ArchiveType, type File, type Payload } from "@/types";
import { generateArchives, isSectionsArchiveChild } from "./archives";

const createFile = (overrides: Partial<File>): File =>
  ({
    id: "file",
    name: "file",
    fileName: "file",
    path: "/tmp/file.md",
    created: new Date(),
    language: "en",
    meta: {},
    ...overrides,
  }) as File;

describe("archives helpers", () => {
  it("marks children of sections archives as inline-only content", () => {
    const parent = createFile({
      id: "examples",
      name: "examples",
      fileName: "README",
      path: "/tmp/examples/README.md",
      home: true,
      meta: { archive: ArchiveType.SECTIONS },
    });

    const child = createFile({
      id: "example-basic",
      name: "example-basic",
      fileName: "example-basic",
      path: "/tmp/examples/example-basic.md",
      parent: "examples",
    });

    expect(isSectionsArchiveChild(child, [parent, child])).toBe(true);
  });

  it("does not mark normal archive children as inline-only content", () => {
    const parent = createFile({
      id: "guide",
      name: "guide",
      fileName: "README",
      path: "/tmp/guide/README.md",
      home: true,
      meta: { archive: ArchiveType.ARTICLES },
    });

    const child = createFile({
      id: "install",
      name: "install",
      fileName: "install",
      path: "/tmp/guide/install.md",
      parent: "guide",
    });

    expect(isSectionsArchiveChild(child, [parent, child])).toBe(false);
  });

  it("builds section style variables from child meta colors", async () => {
    const parent = createFile({
      id: "examples",
      name: "examples",
      fileName: "README",
      path: "/tmp/examples/README.md",
      home: true,
      meta: { archive: ArchiveType.SECTIONS },
    });

    const child = createFile({
      id: "intro",
      name: "intro",
      fileName: "intro",
      path: "/tmp/examples/intro.md",
      parent: "examples",
      meta: { color: "blue" },
    });

    const payload = {
      files: [parent, child],
      tags: [],
    } as unknown as Payload;

    const result = await generateArchives(payload);
    const archiveChild = result.files[0].archives?.[0]?.children?.[0];

    expect(archiveChild?.meta.sectionStyle).toBe(
      "--section-background-color: var(--color-blue); --section-text-color: var(--color-blue-contrast)"
    );
  });

  it("keeps hidden children out of generated archives", async () => {
    const parent = createFile({
      id: "guide",
      name: "guide",
      fileName: "README",
      path: "/tmp/guide/README.md",
      home: true,
      meta: { archive: ArchiveType.ARTICLES },
    });

    const visibleChild = createFile({
      id: "install",
      name: "install",
      fileName: "install",
      path: "/tmp/guide/install.md",
      parent: "guide",
      title: "Install",
    });

    const hiddenChild = createFile({
      id: "legacy",
      name: "legacy",
      fileName: "legacy",
      path: "/tmp/guide/legacy.md",
      parent: "guide",
      title: "Legacy",
      meta: { hide: true },
    });

    const payload = {
      files: [parent, visibleChild, hiddenChild],
      tags: [],
    } as unknown as Payload;

    const result = await generateArchives(payload);

    expect(result.files[0].archives?.[0]?.children?.map((item) => item.title)).toEqual(["Install"]);
  });
});

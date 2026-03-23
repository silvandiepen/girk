import { describe, expect, it } from "vitest";

import { ArchiveType, type File } from "@/types";
import { isSectionsArchiveChild } from "./archives";

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
});

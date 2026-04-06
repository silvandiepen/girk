import { describe, expect, it, vi } from "vitest";

import { ArchiveType, type File, type Payload, type Tag } from "@/types";
import { createTagPages } from "./tags";

const { createPageMock } = vi.hoisted(() => ({
  createPageMock: vi.fn(async () => {}),
}));

vi.mock("./page", () => ({
  createPage: createPageMock,
}));

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

describe("tag pages", () => {
  it("keeps hidden tagged pages out of generated tag archives", async () => {
    createPageMock.mockClear();

    const visibleFile = createFile({
      id: "visible",
      name: "visible",
      title: "Visible",
      parent: "guide",
      meta: { tags: ["documentation"] },
    });

    const hiddenFile = createFile({
      id: "hidden",
      name: "hidden",
      title: "Hidden",
      parent: "guide",
      meta: { hide: true, tags: ["documentation"] },
    });

    const payload = {
      files: [visibleFile, hiddenFile],
      tags: [
        {
          name: "documentation",
          parent: "guide",
          type: "",
        } as Tag,
      ],
      project: {
        groupTags: true,
      },
    } as unknown as Payload;

    await createTagPages(payload);

    expect(createPageMock).toHaveBeenCalledTimes(1);

    const tagPage = createPageMock.mock.calls[0]?.[1] as File;

    expect(tagPage.archives).toEqual([
      {
        name: "documentation",
        type: ArchiveType.ARTICLES,
        children: [visibleFile],
      },
    ]);
  });
});

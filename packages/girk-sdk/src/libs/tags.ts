import { asyncForEach } from "@/libs/utils";
import { isHidden } from "@/libs/helpers";

import { Payload, File, FileType, Tag } from "@/types";
import { fileId } from "./files";

/*
 *  Tags
 */

export const generateTags = async (payload: Payload): Promise<Payload> => {
  const tags: Tag[] = [];

  await asyncForEach(payload.files, (file: File) => {
    if (!isHidden(file.meta) && file.meta && file.meta?.tags) {
      if (typeof file.meta?.tags === "string")
        file.meta.tags = [file.meta.tags];

      for (let i = 0; i < file.meta.tags.length; i++) {
        const parent = payload.files.find((f) => f.name == file.parent);

        const tag = {
          name: file.meta.tags[i],
          link: `/tag/${file.meta.tags[i]}`,
          parent: file.parent,
          type: parent?.meta.type || "",
        };

        if (payload.project?.groupTags) {
          if (
            !tags.some(
              (item) => item.name === tag.name && item.parent === tag.parent
            )
          )
            tags.push(tag);
        } else {
          if (!tags.some((item) => item.name === tag.name)) tags.push(tag);
        }
      }
    }
  });
  return { ...payload, tags };
};

/**
 * Build tag page files in memory (SDK version).
 * Returns an array of File objects representing tag pages.
 */
export const createTagPages = async (payload: Payload): Promise<Payload & { _sdkTagPages?: File[] }> => {
  const tagPages: File[] = [];

  await asyncForEach(payload.tags, async (tag: Tag) => {
    const path = `/tag/${payload.project?.groupTags ? `${tag.parent}/` : ``}${
      tag.name
    }/index.html`;

    const archive = payload.project?.groupTags
      ? payload.files.filter(
          (file) =>
            !isHidden(file.meta) &&
            file.meta?.tags?.includes(tag.name) &&
            file.parent == tag.parent
        )
      : payload.files.filter(
          (file) => !isHidden(file.meta) && file.meta?.tags?.includes(tag.name)
        );

    const file: File = {
      id: fileId(path),
      name: tag.name,
      title: `#${tag.name}`,
      path,
      created: new Date(),
      language: "en",
      fileName: "index.html",
      parent: tag.parent,
      meta: { type: tag.type },
      archives: [
        {
          name: tag.name,
          type: "articles" as any,
          children: archive,
        },
      ],
      html: `<h1>#${tag.name}</h1>`,
      type: FileType.TAG,
    };

    tagPages.push(file);
  });

  return { ...payload, _sdkTagPages: tagPages };
};

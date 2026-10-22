import { asyncForEach } from "@/libs/utils";
import { isHidden } from "@/libs/helpers";

import { Payload, File, FileType, Tag, ArchiveType } from "../types";
import { toArchiveChild } from "./archives";
import { createPage } from "./page";
import { fileId } from "./files";

import { blockMid } from "cli-block";

/*
 *  Tags
 */

/*
 * Tag pages live under their section when tags are grouped, so links and
 * output paths come from the same place.
 */
const tagLink = (name: string, parent: string, grouped: boolean): string =>
  `/tag/${grouped ? `${parent}/` : ``}${name}`;

export const generateTags = async (payload: Payload): Promise<Payload> => {
  const tags: Tag[] = [];

  await asyncForEach(payload.files, (file: File) => {
    if (!isHidden(file.meta) && file.meta && file.meta?.tags) {
      if (typeof file.meta?.tags === "string") file.meta.tags = [file.meta.tags];

      for (let i = 0; i < file.meta.tags.length; i++) {
        const parent = payload.files.find((f) => f.name == file.parent);

        const tag = {
          name: file.meta.tags[i],
          link: tagLink(file.meta.tags[i], file.parent, !!payload.project.groupTags),
          parent: file.parent,
          type: parent?.meta.type || "",
        };

        if (payload.project.groupTags) {
          if (!tags.some((item) => item.name === tag.name && item.parent === tag.parent))
            tags.push(tag);
        } else {
          if (!tags.some((item) => item.name === tag.name)) tags.push(tag);
        }
      }
    }
  });
  return { ...payload, tags };
};

export const createTagPages = async (payload: Payload): Promise<Payload> => {
  if (payload.tags.length) blockMid("Tag pages");

  await asyncForEach(payload.tags, async (tag: Tag) => {
    const path = `${tagLink(tag.name, tag.parent, !!payload.project.groupTags)}/index.html`;

    const tagged = payload.project.groupTags
      ? payload.files.filter(
          (file) =>
            !isHidden(file.meta) &&
            file.meta?.tags?.includes(tag.name) &&
            file.parent == tag.parent,
        )
      : payload.files.filter((file) => !isHidden(file.meta) && file.meta?.tags?.includes(tag.name));
    const archive = tagged.map((item) => toArchiveChild(item, payload));
    const title = `#${tag.name}`;

    const file: File = {
      id: fileId(path),
      name: tag.name,
      title,
      path,
      created: new Date(),
      language: tagged[0]?.language || "en",
      fileName: "index.html",
      parent: tag.parent,
      meta: { type: tag.type, title },
      archives: [
        {
          name: tag.name,
          type: ArchiveType.ARTICLES,
          children: archive,
        },
      ],
      html: `<h1>${title}</h1>`,
      type: FileType.TAG,
    };

    await createPage(payload, file);
  });
  return payload;
};

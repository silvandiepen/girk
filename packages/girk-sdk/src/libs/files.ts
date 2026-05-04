import { basename, extname } from "./path-utils";
import { renamePath } from "@/libs/utils";

import { File, buildHtmlArgs, Archive } from "@/types";
import { fixLangInPath } from "@/libs/language";
import { removeTitle } from "@/libs/helpers";
import { buildSectionStyle } from "@/libs/section-style";
import { renderEjs } from "./render";

/*
	::fileId
	Generate a unique id from a virtual path
*/
export const fileId = (path: string): string =>
  fixLangInPath(path, false)
    .replace(/\//g, "-")
    .substring(1)
    .split(".")[0]
    .toLowerCase();

export const isHomePath = (path: string): boolean => {
  const fileName = basename(path, extname(path)).split(":")[0].toLowerCase();

  return fileName === "readme" || fileName === "index";
};

const filterArchive = (file: File): Archive[] => {
  if (file?.archives && file?.archives[0]?.children?.length) {
    if (!file.relativePath) {
      return file.archives;
    }
    const parentUrl = file.relativePath
      .split("/")
      .filter(Boolean)
      .slice(0, -1)
      .join("-");

    file.archives[0].children = file.archives[0].children.filter((child) => {
      const childUrl = child.link
        .split("/")
        .filter(Boolean)
        .slice(0, -2)
        .join("-");
      return childUrl == parentUrl;
    });
    return file.archives;
  } else {
    return [];
  }
};

export const buildHtml = async (
  file: File,
  args: buildHtmlArgs,
  template = ""
): Promise<string> => {
  const archives = filterArchive(file);

  archives.map((archive) => {
    if (archive.type === "blog") {
      archive.children;
      return {
        ...archive,
        children: archive.children.sort((a, b) =>
          b.created > a.created ? 1 : a.created > b.created ? -1 : 0
        ),
      };
    }
    return archive;
  });

  const options = {
    ...args,
    name: file.name,
    title: file.title,
    content: file.html,
    meta: {
      ...file.meta,
      sectionStyle: buildSectionStyle(file.meta),
    },
    archives: archives,
    type: file.type,
    formatDate: undefined, // renderEjs provides formatDate automatically
    removeTitle: removeTitle,
  };

  const templateName = template || "page";
  const html = renderEjs(options, templateName);

  return html;
};

export const makePath = (file: File): string => {
  let link = makeLink(file.path);
  if (file.meta?.name) link = renamePath(link, file.meta.name.toString());

  return link;
};

export const makeLink = (path: string, virtualRoot = ""): string => {
  const uri = fixLangInPath(
    path
      .replace(virtualRoot, "")
      .toLowerCase()
      .replace("readme", "index")
      .replace(".md", ".html")
  );

  return uri.split("/")[uri.split("/").length - 1].replace(".html", "") !==
    "index"
    ? uri.replace(".html", "/index.html")
    : uri;
};

export const getParentFile = (child: File, files: File[]): File | undefined => {
  const file = files.find(
    (f) =>
      f.home &&
      f.name == child.parent &&
      f.id !== child.id &&
      f.language === child.language
  );

  return file;
};

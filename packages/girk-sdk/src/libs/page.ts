import { join } from "@/libs/path-utils";

import {
  Payload,
  File,
  Page,
  Meta,
  buildHtmlArgs,
  MenuItem,
  Project,
  Language,
} from "@/types";
import { getLanguageMenu, getDefaultLanguage } from "@/libs/language";
import { makePath, buildHtml, getParentFile } from "./files";
import { getExcerpt } from "./helpers";
import { isHidden } from "./helpers";
import { getSearchContext, hasSearchEnabled } from "./search";
import { buildSectionStyle } from "./section-style";

import { getThumbnail } from "./media";

const simplifyUrl = (url: string): string => url.replace("/index.html", "") || "/";

const isActiveMenu = (link: string, current: string): boolean =>
  simplifyUrl(link) == simplifyUrl(current);

export const isActiveMenuParent = (link: string, current: string): boolean => {
  const normalizedLink = simplifyUrl(link);
  const normalizedCurrent = simplifyUrl(current);

  if (normalizedLink === "/" || normalizedCurrent === "/") return false;

  return (
    normalizedCurrent.startsWith(`${normalizedLink}/`) &&
    normalizedCurrent !== normalizedLink
  );
};

const getArchiveHtml = (file: File): string =>
  (file.archives || [])
    .flatMap((archive) => archive.children || [])
    .map((child) => child.html || child.excerpt || "")
    .join("\n");

const getPageFeatureHtml = (file: File, relatedPages: File[]): string =>
  [
    file.html || "",
    getArchiveHtml(file),
    ...relatedPages.map((page) => page.excerpt || ""),
  ].join("\n");

const hasTable = (html: string) => html.includes("<table>");

const hasUrlToken = (html: string) =>
  html.includes('<span class="token url">http');

const hasHeader = (menu: MenuItem[]) => menu.length > 0;

const hasColors = (html: string) =>
  !!html.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/i);

const hasLanguages = (languages: Language[]) => !!(languages.length > 1);

const hasMath = (html: string) =>
  /\bclass="[^"]*\bmath(?:-inline|-display)?\b/.test(html);

const hasDiagrams = (html: string) =>
  /\bclass="[^"]*\bmermaid\b/.test(html);

const getParentPage = (file: File, files: File[]): File | undefined =>
  files.find(
    (candidate) =>
      candidate.home &&
      candidate.name == file.parent &&
      candidate.id !== file.id &&
      candidate.language === file.language
  );

const getRelatedPages = (file: File, files: File[]): File[] => {
  if (file.home) return [];

  const parentPage = getParentPage(file, files);
  if (!parentPage) return [];

  return files
    .filter(
      (candidate) =>
        candidate.parent == file.parent &&
        candidate.id !== file.id &&
        !candidate.home &&
        candidate.language === file.language &&
        !isHidden(candidate.meta)
    )
    .map((candidate): File => {
      const meta: Meta = candidate.meta || {};

      return {
        ...candidate,
        link: makePath(candidate),
        excerpt: getExcerpt(candidate),
        meta: {
          ...meta,
          sectionStyle: buildSectionStyle(meta),
        },
      };
    })
    .sort((a, b) => (a.meta?.order || 999) - (b.meta?.order || 999));
};

const subtitle = (file: File, payload: Payload): string => {
  if (!file.home) {
    const parent = getParentFile(file, payload.files);
    return parent?.title || "";
  } else {
    return "";
  }
};

const getProjectByLanguage = (
  project: Project,
  language: Language
): Project => {
  const langProject = {};
  Object.entries(project || {}).filter((value) => {
    if (value[0].includes(":")) {
      if (value[0].includes(`:${language}`)) {
        langProject[value[0].split(":")[0]] = value[1];
      }
    } else {
      langProject[value[0]] = value[1];
    }
  });

  return langProject;
};

/**
 * Build a page from the payload and file, returning page data in memory.
 * No filesystem writes — the caller receives the Page object.
 */
export const buildPage = async (
  payload: Payload,
  file: File,
  outputDir = ""
): Promise<Page> => {
  const currentLink = makePath(file);
  const currentLanguage = file.language;

  /*
   * Generate the html for this page
   */

  const menuStatus = (menu: MenuItem[]): MenuItem[] => {
    if (menu) {
      return menu
        .map((item) => ({
          ...item,
          current: isActiveMenu(item.link, currentLink),
          isParent: isActiveMenuParent(item.link, currentLink),
          children: menuStatus(item.children),
        }))
        .filter((item) => item.language == currentLanguage);
    } else {
      return [];
    }
  };

  const menu = payload.menu ? menuStatus(payload.menu) : [];
  const project = getProjectByLanguage(payload.project || {}, currentLanguage);
  const parentPage = getParentPage(file, payload.files);
  const relatedPages = getRelatedPages(file, payload.files);
  const pageFeatureHtml = getPageFeatureHtml(file, relatedPages);
  const favicons = payload.favicons;
  const tags = payload.tags
    ? payload.tags.filter((tag) => tag.parent == file.parent)
    : [];

  const style = {
    ...payload.style,
    page: currentLink.replace(".html", ".css"),
  };

  const data: buildHtmlArgs = {
    menu,
    tags,
    thumbnail: getThumbnail(file),
    project,
    generator: payload.generator,
    style,
    favicons,
    media: payload.media,
    logo: payload.logo,
    meta: file.meta,
    contentOnly: false,
    showContentImage: file.meta?.image && file.meta?.type !== "photo",
    homeLink: file.language == getDefaultLanguage() ? "/" : `/${file.language}`,
    langMenu: getLanguageMenu(payload, file),
    language: currentLanguage,
    subtitle: subtitle(file, payload),
    components: [],
    socials: payload.socials,
    parentPage,
    relatedPages,
    searchContext: getSearchContext(file, payload),
    config: payload.settings?.config,
    has: {
      table: hasTable(pageFeatureHtml),
      header: hasHeader(menu),
      urlToken: hasUrlToken(pageFeatureHtml),
      colors: hasColors(pageFeatureHtml),
      languages: hasLanguages(payload.languages),
      math: hasMath(pageFeatureHtml),
      diagrams: hasDiagrams(pageFeatureHtml),
      search: hasSearchEnabled(file, payload),
    },
  };
  const html = await buildHtml(file, data);

  const customCssFilePath = outputDir
    ? join(outputDir, currentLink).replace(".html", ".css")
    : currentLink.replace(".html", ".css");

  /*
   * Return the page
   */
  return {
    dir: outputDir
      ? join(
          outputDir,
          currentLink.split("/").slice(0, -1).join("/")
        )
      : currentLink.split("/").slice(0, -1).join("/"),
    css: {
      data: '',
      file: customCssFilePath,
    },
    html: {
      data: html,
      file: outputDir ? join(outputDir, currentLink) : currentLink,
    },
    name: file.name,
    link: currentLink,
    title: file.title,
  };
};

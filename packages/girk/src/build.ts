import { getArgs } from "@sil/args";
import { blockHeader, blockMid, blockSettings } from "cli-block";
import { readFileSync } from "fs";
import { join } from "path";

import { generateArchives, isSectionsArchiveChild } from "@/libs/archives";
import { generateStyles } from "@/libs/buildStyle/style";
import { prepareDataFiles } from "@/libs/data";
import { generateFavicon } from "@/libs/favicon";
import { fileId, getFiles, isHomePath } from "@/libs/files";
import { fileTitle } from "@/libs/helpers";
import { resolveFileIcons } from "@/libs/icon";
import { getLanguageName } from "@/libs/language";
import { toHtml } from "@/libs/markdown";
import {
  copyToAssets,
  createThumbnails,
  getLogo,
  getMedia,
  getSvgThumbnail,
  getThumbnail,
} from "@/libs/media";
import { generateMenu } from "@/libs/menu";
import { createPage } from "@/libs/page";
import { processPartials } from "@/libs/partials";
import { getConfig, getProjectData } from "@/libs/project";
import { createRobots } from "@/libs/robots";
import { generateSearchIndex } from "@/libs/search";
import { generateSocials } from "@/libs/socials";
import { createTagPages, generateTags } from "@/libs/tags";
import { asyncForEach } from "@/libs/utils";
import { File, Payload, Project, Settings } from "@/types";

export const version: string = (
  JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8")) as { version: string }
).version;

export interface BuildOptions {
  /** Output directory. Defaults to `<cwd>/public`. */
  output?: string;
  /** CLI arguments. Defaults to the parsed process arguments. */
  args?: Settings["args"];
}

/*
 * A project-relative path is ignored when an ignore entry names one of its
 * segments (`drafts`, `notes.md`, `notes`) or is a path prefix (`blog/drafts`).
 */
export const isIgnoredPath = (relativePath: string, ignore: string[] = []): boolean => {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
  const segments = normalized.split("/");
  const fileName = segments[segments.length - 1];
  const stem = fileName.split(".")[0].split(":")[0];

  return ignore.some((entry) => {
    const rule = entry
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();
    if (!rule) return false;
    if (rule.includes("/")) return normalized === rule || normalized.startsWith(`${rule}/`);
    return segments.includes(rule) || stem === rule;
  });
};

/*
 * Projects that keep their content in a top-level `src/` folder publish it from the root.
 * Only that leading segment is stripped; a `src` folder deeper in the tree, or in the
 * directory the project lives in, is left alone.
 */
export const stripSourceRoot = (file: File, cwd = process.cwd()): File => {
  if (!file.relativePath.startsWith("/src/")) return file;

  const relativePath = file.relativePath.slice("/src".length);

  return {
    ...file,
    id: fileId(relativePath),
    relativePath,
    path: join(cwd, relativePath),
  };
};

const settingsAndConfig = async (payload: Payload, options: BuildOptions): Promise<Payload> => {
  const settings: Settings = {
    output: options.output ?? join(process.cwd(), "public"),
    languages: [],
    args: options.args ?? getArgs(),
    config: await getConfig(),
  };

  return {
    ...payload,
    settings,
    generator: {
      name: "Girk",
      version,
    },
  };
};

const loadFiles = async (payload: Payload): Promise<Payload> => {
  let files = await getFiles(process.cwd(), ".md");
  files = await prepareDataFiles(files);

  const languages: Payload["languages"] = [];
  for (const file of files) {
    if (!languages.includes(file.language)) languages.push(file.language);
  }

  /*
   * Render every file to HTML and extract its metadata.
   */
  files = await Promise.all(
    files.map(async (file) => {
      const rendered = await toHtml(file.data || "", file.path);
      return { ...file, html: rendered.document, meta: rendered.meta };
    }),
  );

  const project: Project = await getProjectData(files);

  files = files.map((file) => {
    const title = file.meta?.title ? file.meta.title : fileTitle(file);
    return { ...file, home: isHomePath(file.path), title: title.toString() };
  });

  files = await resolveFileIcons(files);

  files = await Promise.all(
    files.map(async (file) => {
      const thumbnail = getThumbnail(file);
      return { ...file, thumbnail, thumbnailSvg: await getSvgThumbnail(thumbnail) };
    }),
  );

  files = files.map((file) => stripSourceRoot(file));

  /*
   * Project settings can be set from any file, so ignored files can only be
   * filtered once every file has been read.
   */
  if (project?.ignore)
    files = files.filter((file) => !isIgnoredPath(file.relativePath, project.ignore));

  if (Object.keys(project).length) {
    blockMid("Project settings");
    blockSettings(project, {}, { exclude: ["logoData"] });
  }

  return {
    ...payload,
    files,
    project,
    languages,
  };
};

const buildMedia = async (payload: Payload): Promise<Payload> => {
  const media = await getMedia(payload);
  const logo: File = await getLogo(payload, media);

  await createThumbnails(payload);
  await copyToAssets(payload);

  return { ...payload, media, logo };
};

const contentPages = async (payload: Payload): Promise<Payload> => {
  const shouldCreatePage = (file: File): boolean =>
    !file.name.startsWith("-") && !isSectionsArchiveChild(file, payload.files);

  const multilingual = payload.languages.length > 1;

  for (const language of multilingual ? payload.languages : [null]) {
    blockMid(language ? `Pages ${getLanguageName(language)}` : "Pages");

    await asyncForEach(
      payload.files.filter(
        (file: File) => (language === null || file.language == language) && shouldCreatePage(file),
      ),
      async (file: File) => await createPage(payload, file),
    );
  }

  return payload;
};

/**
 * Build the Girk site for the project in the current working directory.
 */
export const build = async (options: BuildOptions = {}): Promise<Payload> => {
  let payload = await settingsAndConfig({ files: [], media: [], socials: [] } as Payload, options);

  blockHeader(`Girk ${version}`);
  const { args, config } = payload.settings;
  if (args && Object.keys(args).length) blockSettings(args);
  if (config && Object.keys(config).length) blockSettings(config);

  const steps: Array<(payload: Payload) => Promise<Payload> | Payload> = [
    loadFiles,
    processPartials,
    buildMedia,
    generateSocials,
    generateTags,
    generateArchives,
    generateMenu,
    generateStyles,
    generateFavicon,
    generateSearchIndex,
    contentPages,
    createTagPages,
    createRobots,
  ];

  for (const step of steps) payload = await step(payload);

  return payload;
};

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { prepareDataFiles } from "@/libs/data";
import { generateArchives, isSectionsArchiveChild } from "@/libs/archives";
import { generateStyles } from "@/libs/buildStyle/style";
import { getFiles, isHomePath } from "@/libs/files";
import { generateFavicon } from "@/libs/favicon";
import { fileTitle } from "@/libs/helpers";
import { resolveFileIcons } from "@/libs/icon";
import { toHtml } from "@/libs/markdown";
import { copyToAssets, createThumbnails, getLogo, getMedia, getSvgThumbnail, getThumbnail } from "@/libs/media";
import { generateMenu } from "@/libs/menu";
import { createPage } from "@/libs/page";
import { processPartials } from "@/libs/partials";
import { getConfig, getProjectData } from "@/libs/project";
import { createRobots } from "@/libs/robots";
import { generateSearchIndex } from "@/libs/search";
import { createTagPages, generateTags } from "@/libs/tags";
import { asyncForEach } from "@/libs/utils";
import { generateSocials } from "@/libs/socials";
import type { File, Payload, Project, Settings } from "@/types";

import { cleanupFixture, setupFixture } from "./helpers";

const packageDirectory = dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));

interface BuildResult {
  fixtureDir: string;
  outputDir: string;
  payload: Payload;
  cleanup: () => Promise<void>;
}

const removeUrlParts = (payload: Payload): Payload => {
  payload.files = payload.files.map((file) => ({
    ...file,
    id: file.id.replace("-src-", "-"),
    relativePath: file.relativePath.replace("/src/", "/"),
    path: file.path.replace("/src/", "/"),
  }));

  return payload;
};

const createSettings = async (outputDir: string): Promise<Payload> => {
  const config = await getConfig();
  const packageJson = JSON.parse(
    await readFile(join(packageDirectory, "package.json"), "utf8"),
  ) as { version: string };

  const settings: Settings = {
    output: outputDir,
    languages: [],
    args: {},
    config,
  };

  return {
    output: settings.output,
    languages: [],
    args: settings.args,
    config: settings.config,
    files: [],
    media: [],
    socials: [],
    settings,
    project: {} as Project,
    generator: {
      name: "Girk",
      version: packageJson.version,
    },
  } as Payload;
};

const loadFiles = async (payload: Payload): Promise<Payload> => {
  let files = await getFiles(process.cwd(), ".md");
  files = await prepareDataFiles(files);

  const languages = [] as Payload["languages"];

  for (const file of files) {
    if (!languages.includes(file.language)) {
      languages.push(file.language);
    }
  }

  await asyncForEach(files, async (file: File, index: number) => {
    const rendered = await toHtml(file.data || "", file.path);

    files[index] = {
      ...file,
      html: rendered.document,
      meta: rendered.meta,
    };
  });

  const project: Project = await getProjectData(files);

  await asyncForEach(files, async (file: File, index: number) => {
    files[index].home = isHomePath(file.path);
  });

  await asyncForEach(files, async (file: File, index: number) => {
    const title = file.meta?.title ? file.meta.title : fileTitle(file);
    files[index].title = title.toString();
  });

  files = await resolveFileIcons(files);

  await asyncForEach(files, async (file: File, index: number) => {
    const thumbnail = getThumbnail(file);
    const thumbnailSvg = thumbnail ? await getSvgThumbnail(thumbnail) : "";

    files[index].thumbnail = thumbnail;
    files[index].thumbnailSvg = thumbnailSvg;
  });

  if (project.ignore) {
    files = files.filter((file) => !project.ignore.some((ignore) => file.path.includes(ignore)));
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
  const logo = await getLogo(payload, media);

  await createThumbnails(payload);
  await copyToAssets(payload);

  return { ...payload, media, logo };
};

const buildContentPages = async (payload: Payload): Promise<Payload> => {
  const shouldCreatePage = (file: File): boolean =>
    !file.name.startsWith("-") && !isSectionsArchiveChild(file, payload.files);

  if (payload.languages.length > 1) {
    await asyncForEach(payload.languages, async (language) => {
      await asyncForEach(
        payload.files
          .filter((file) => file.language === language)
          .filter((file) => shouldCreatePage(file)),
        async (file) => createPage(payload, file),
      );
    });
  } else {
    await asyncForEach(
      payload.files.filter((file) => shouldCreatePage(file)),
      async (file) => createPage(payload, file),
    );
  }

  return payload;
};

export async function runFixtureBuild(name: string): Promise<BuildResult> {
  const fixtureDir = await setupFixture(name);
  const outputDir = join(fixtureDir, "public");
  const originalCwd = process.cwd();

  try {
    process.chdir(fixtureDir);

    let payload = await createSettings(outputDir);
    payload = await loadFiles(payload);
    payload = removeUrlParts(payload);
    payload = await processPartials(payload);
    payload = await buildMedia(payload);
    payload = await generateSocials(payload);
    payload = await generateTags(payload);
    payload = await generateArchives(payload);
    payload = await generateMenu(payload);
    payload = await generateStyles(payload);
    payload = await generateFavicon(payload);
    payload = await generateSearchIndex(payload);
    payload = await buildContentPages(payload);
    payload = await createTagPages(payload);
    payload = await createRobots(payload);

    return {
      fixtureDir,
      outputDir,
      payload,
      cleanup: async () => {
        await cleanupFixture(fixtureDir);
      },
    };
  } catch (error) {
    await cleanupFixture(fixtureDir);
    throw error;
  } finally {
    process.chdir(originalCwd);
  }
}

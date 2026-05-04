// SDK Build Pipeline — pure in-memory build from GirkBuildInput to GirkBuildResult

import { normalize } from "./normalize";
import { processPartials } from "@/libs/partials";
import { generateSocials } from "@/libs/socials";
import { generateTags, createTagPages } from "@/libs/tags";
import { generateArchives } from "@/libs/archives";
import { generateMenu } from "@/libs/menu";
import { generateStyles } from "@/libs/buildStyle/style";
import { buildSearchIndex } from "@/libs/search";
import { buildPage } from "@/libs/page";
import { generateRobots } from "@/libs/robots";
import { asyncForEach } from "@/libs/utils";
import { isSectionsArchiveChild } from "@/libs/archives";
import {
  GirkBuildInput,
  GirkBuildResult,
  GirkOutputFile,
  GirkOutputPage,
  Payload,
  File,
  Page,
} from "@/types";

const VERSION = "0.0.0";

/**
 * Remove /src/ from paths — same logic as CLI version
 */
const removeUrlParts = (payload: Payload): Payload => {
  payload.files = payload.files.map((file) => ({
    ...file,
    id: file.id.replace("-src-", "-"),
    relativePath: file.relativePath.replace("/src/", "/"),
    path: file.path.replace("/src/", "/"),
  }));
  return payload;
};

/**
 * Build all content pages in memory
 */
const buildContentPages = async (payload: Payload): Promise<Payload> => {
  const shouldBuild = (file: File): boolean =>
    !file.name.startsWith("-") && !isSectionsArchiveChild(file, payload.files);

  const filesToBuild = payload.files.filter(shouldBuild);
  const builtPages: Page[] = [];

  await asyncForEach(filesToBuild, async (file: File) => {
    const result = await buildPage(payload, file);
    if (result) {
      builtPages.push(result);
    }
  });

  return {
    ...payload,
    _sdkBuiltPages: builtPages,
  };
};

/**
 * Main SDK entry point.
 * Takes in-memory input, returns in-memory output.
 * Zero filesystem access.
 */
export const build = async (input: GirkBuildInput): Promise<GirkBuildResult> => {
  const outputFiles: GirkOutputFile[] = [];
  const pages: GirkOutputPage[] = [];

  // 1. Normalize input into internal Payload
  let payload = await normalize(input, VERSION);

  // 2. Run the pipeline
  payload = removeUrlParts(payload);
  payload = await processPartials(payload);
  // No media processing in SDK — media comes from input as-is
  payload = await generateSocials(payload);
  payload = await generateTags(payload);
  payload = await generateArchives(payload);
  payload = await generateMenu(payload);
  payload = await generateStyles(payload);
  // No favicon in SDK — no filesystem to write to

  // 3. Build search index
  const searchResult = await buildSearchIndex(payload);
  payload = searchResult.payload;
  outputFiles.push(...searchResult.files);

  // 4. Build content pages
  payload = await buildContentPages(payload);

  // 5. Build tag pages
  payload = await createTagPages(payload);

  // 6. Generate robots.txt
  payload = await generateRobots(payload);

  // 7. Extract results

  // Content pages
  const builtPages = payload._sdkBuiltPages || [];
  for (const page of builtPages) {
    if (page.html?.data) {
      outputFiles.push({
        path: page.link,
        content: page.html.data,
        contentType: "text/html",
      });
    }
    pages.push({
      title: page.title || page.name,
      path: page.link,
      language: "", // Page type doesn't carry language, use empty
    });
  }

  // Tag pages
  const tagPages = payload._sdkTagPages || [];
  for (const page of tagPages) {
    if (page.html) {
      outputFiles.push({
        path: page.path,
        content: page.html,
        contentType: "text/html",
      });
    }
    pages.push({
      title: page.title || page.name,
      path: page.path,
      language: page.language || "en",
    });
  }

  // CSS
  if (payload._sdkStyleResult?.cssContent) {
    outputFiles.push({
      path: "/style/app.css",
      content: payload._sdkStyleResult.cssContent,
      contentType: "text/css",
    });
  }

  // Robots.txt
  if (payload.robots) {
    outputFiles.push({
      path: "/robots.txt",
      content: payload.robots,
      contentType: "text/plain",
    });
  }

  // Media assets — pass through from input
  if (payload.media) {
    for (const mediaFile of payload.media) {
      if (mediaFile.data) {
        outputFiles.push({
          path: mediaFile.path,
          content: mediaFile.data,
          contentType: "application/octet-stream",
        });
      }
    }
  }

  return {
    files: outputFiles,
    pages,
    project: payload.project || {},
    languages: payload.languages || [],
  };
};

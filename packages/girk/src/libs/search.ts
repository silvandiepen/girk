import { blockLine, blockLineSuccess } from "cli-block";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getArchiveParent, isSectionsArchiveChild } from "@/libs/archives";
import { makePath } from "@/libs/files";
import { getExcerpt } from "@/libs/helpers";
import { createDir } from "@/libs/utils";
import {
  File,
  FileType,
  Payload,
  Project,
  SearchContext,
  SearchDocument,
  SearchManifest,
  SearchManifestShard,
  SearchScope,
} from "@/types";

const SEARCH_DIRECTORY = "assets/search";
const SEARCH_CLIENT_SOURCE = "../../src/template/script/search.js";
const SEARCH_BODY_LIMIT = 2000;
const SEARCH_SECTION_MIN_DOCUMENTS = 2;
const SEARCH_SECTION_AUTO_MIN_DOCUMENTS = 24;
const SEARCH_SCOPE_VALUES: SearchScope[] = ["project", "archive", "page"];

interface SearchIndexShard {
  meta: {
    id: string;
    language: SearchDocument["language"];
    section: string;
    documents: number;
  };
  docs: Record<string, SearchDocument>;
  terms: Record<string, Array<[string, number]>>;
}

interface SearchShardGroup {
  id: string;
  language: SearchDocument["language"];
  section: string;
  documents: SearchDocument[];
}

const isTrue = (value: unknown): boolean => value === true || value === "true";

const isFalse = (value: unknown): boolean => value === false || value === "false";

const isSearchScope = (value: unknown): value is SearchScope =>
  typeof value === "string" && SEARCH_SCOPE_VALUES.includes(value as SearchScope);

const trimText = (input: string, maxLength: number): string => {
  if (!input) return "";
  if (input.length <= maxLength) return input;

  return input.slice(0, maxLength).trimEnd();
};

const decodeHtmlEntity = (entity: string): string => {
  switch (entity) {
    case "&amp;":
      return "&";
    case "&lt;":
      return "<";
    case "&gt;":
      return ">";
    case "&quot;":
      return '"';
    case "&#39;":
      return "'";
    case "&nbsp;":
      return " ";
    default:
      return entity;
  }
};

const stripHtml = (input: string): string =>
  input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|nbsp);|&#39;/g, decodeHtmlEntity)
    .replace(/&#x([0-9a-f]+);/gi, (_, value) =>
      String.fromCodePoint(Number.parseInt(value, 16))
    )
    .replace(/&#([0-9]+);/g, (_, value) =>
      String.fromCodePoint(Number.parseInt(value, 10))
    )
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearchText = (input: string): string =>
  stripHtml(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (input: string): string[] =>
  normalizeSearchText(input)
    .split(" ")
    .filter((token) => token.length > 1);

const getBodyLimit = (project: Project): number => {
  const configured = Number(project.searchBodyLimit);

  if (!Number.isFinite(configured) || configured <= 0) {
    return SEARCH_BODY_LIMIT;
  }

  return Math.floor(configured);
};

const getSearchLink = (file: File): string => {
  const link = makePath(file);

  return link.startsWith("/") ? link : `/${link}`;
};

const getSearchSection = (file: File, languages: Payload["languages"]): string => {
  const pathSegments = getSearchLink(file)
    .replace(/(^|\/)index\.html$/, "")
    .split("/")
    .filter(Boolean);

  const segments =
    languages.length > 1 && pathSegments[0] === file.language
      ? pathSegments.slice(1)
      : pathSegments;

  return segments[0] || "root";
};

const getSearchExcerpt = (file: File): string => {
  const override = file.meta?.searchExcerpt;

  if (override) return String(override);
  if (file.meta?.description) return String(file.meta.description);

  return getExcerpt(file);
};

const getSearchBranch = (file: File): string => {
  if (file.home) return file.name || "root";
  return file.parent || file.name || "root";
};

const getSearchTitle = (file: File): string =>
  String(file.meta?.searchTitle || file.title || file.meta?.title || file.name);

const getSearchHeadings = (html: string): string[] =>
  Array.from(html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi))
    .map(([, heading]) => stripHtml(heading))
    .filter(Boolean);

const addWeightedTokens = (
  input: string,
  weight: number,
  terms: Map<string, number>
): void => {
  const counts = new Map<string, number>();

  tokenize(input).forEach((token) => {
    counts.set(token, Math.min((counts.get(token) || 0) + 1, 3));
  });

  counts.forEach((count, token) => {
    terms.set(token, (terms.get(token) || 0) + count * weight);
  });
};

const isSearchableFile = (file: File, files: File[]): boolean => {
  if (file.type && file.type !== FileType.CONTENT) return false;
  if (!file.html) return false;
  if (file.name.startsWith("-")) return false;
  if (isSectionsArchiveChild(file, files)) return false;
  if (isTrue(file.meta?.hide)) return false;
  if (file.meta?.redirect) return false;
  if (isFalse(file.meta?.search)) return false;

  return true;
};

const createSearchDocument = (
  file: File,
  payload: Payload
): { document: SearchDocument; terms: Map<string, number> } => {
  const title = getSearchTitle(file);
  const excerpt = getSearchExcerpt(file);
  const headings = getSearchHeadings(file.html || "");
  const tags = Array.isArray(file.meta?.tags)
    ? file.meta.tags.join(" ")
    : String(file.meta?.tags || "");
  const body = trimText(stripHtml(file.html || ""), getBodyLimit(payload.project || {}));
  const terms = new Map<string, number>();

  addWeightedTokens(title, 12, terms);
  addWeightedTokens(String(file.meta?.description || ""), 8, terms);
  addWeightedTokens(headings.join(" "), 7, terms);
  addWeightedTokens(tags, 6, terms);
  addWeightedTokens(excerpt, 4, terms);
  addWeightedTokens(body, 1, terms);

  return {
    document: {
      id: file.id,
      title,
      link: getSearchLink(file),
      excerpt,
      section: getSearchSection(file, payload.languages),
      branch: getSearchBranch(file),
      language: file.language,
    },
    terms,
  };
};

const buildSearchGroups = (
  documents: Array<{ document: SearchDocument; terms: Map<string, number> }>,
  project: Project
): SearchShardGroup[] => {
  const groupedByLanguage = new Map<
    SearchDocument["language"],
    Array<{ document: SearchDocument; terms: Map<string, number> }>
  >();

  documents.forEach((entry) => {
    const languageEntries = groupedByLanguage.get(entry.document.language) || [];
    languageEntries.push(entry);
    groupedByLanguage.set(entry.document.language, languageEntries);
  });

  const groups: SearchShardGroup[] = [];

  groupedByLanguage.forEach((languageEntries, language) => {
    const groupedBySection = new Map<
      string,
      Array<{ document: SearchDocument; terms: Map<string, number> }>
    >();

    languageEntries.forEach((entry) => {
      const sectionEntries = groupedBySection.get(entry.document.section) || [];
      sectionEntries.push(entry);
      groupedBySection.set(entry.document.section, sectionEntries);
    });

    const sharding = project.searchSharding || "auto";
    const hasMultiDocSection = Array.from(groupedBySection.values()).some(
      (entries) => entries.length >= SEARCH_SECTION_MIN_DOCUMENTS
    );
    const useSectionShards =
      sharding === "section" ||
      (sharding === "auto" &&
        languageEntries.length >= SEARCH_SECTION_AUTO_MIN_DOCUMENTS &&
        groupedBySection.size > 1 &&
        hasMultiDocSection);
    const useLanguageShard = sharding === "language" || !useSectionShards;

    if (useLanguageShard) {
      groups.push({
        id: language,
        language,
        section: "all",
        documents: languageEntries.map((entry) => entry.document),
      });
      return;
    }

    const languageGroups: SearchShardGroup[] = [];
    const rootDocuments = (groupedBySection.get("root") || []).map((entry) => entry.document);

    groupedBySection.forEach((entries, section) => {
      if (section === "root") return;

      if (sharding !== "section" && entries.length < SEARCH_SECTION_MIN_DOCUMENTS) {
        rootDocuments.push(...entries.map((entry) => entry.document));
        return;
      }

      languageGroups.push({
        id: `${language}-${section}`,
        language,
        section,
        documents: entries.map((entry) => entry.document),
      });
    });

    if (rootDocuments.length) {
      languageGroups.unshift({
        id: `${language}-root`,
        language,
        section: "root",
        documents: rootDocuments,
      });
    }

    groups.push(...languageGroups);
  });

  return groups;
};

const buildSearchShard = (
  group: SearchShardGroup,
  entries: Array<{ document: SearchDocument; terms: Map<string, number> }>
): SearchIndexShard => {
  const docs: Record<string, SearchDocument> = {};
  const terms = new Map<string, Array<[string, number]>>();
  const includedIds = new Set(group.documents.map((document) => document.id));

  entries.forEach((entry) => {
    if (!includedIds.has(entry.document.id)) return;

    docs[entry.document.id] = entry.document;

    entry.terms.forEach((weight, term) => {
      const postings = terms.get(term) || [];
      postings.push([entry.document.id, weight]);
      terms.set(term, postings);
    });
  });

  const serializedTerms: SearchIndexShard["terms"] = {};

  terms.forEach((postings, term) => {
    serializedTerms[term] = postings.sort((left, right) => right[1] - left[1]);
  });

  return {
    meta: {
      id: group.id,
      language: group.language,
      section: group.section,
      documents: group.documents.length,
    },
    docs,
    terms: serializedTerms,
  };
};

const getSearchClientSource = async (): Promise<string> =>
  readFile(join(__dirname, SEARCH_CLIENT_SOURCE), "utf8");

const getSearchDocuments = (
  payload: Payload
): Array<{ document: SearchDocument; terms: Map<string, number> }> =>
  payload.files
    .filter((file) => isSearchableFile(file, payload.files))
    .map((file) => createSearchDocument(file, payload));

export const hasSearchEnabled = (file: File, payload: Payload): boolean => {
  if (isFalse(file.meta?.search)) return false;
  if (isTrue(payload.project?.search)) return true;
  if (isTrue(file.meta?.search)) return true;
  if (file.home && isTrue(file.meta?.archiveSearch)) return true;

  const archiveParent = getArchiveParent(file, payload.files);

  return isTrue(archiveParent?.meta?.archiveSearch);
};

export const getSearchScope = (file: File, payload: Payload): SearchScope => {
  if (isSearchScope(file.meta?.searchScope)) return file.meta.searchScope;

  const archiveParent = getArchiveParent(file, payload.files);

  if (isSearchScope(archiveParent?.meta?.searchScope)) {
    return archiveParent.meta.searchScope;
  }

  if (isSearchScope(payload.project?.searchScope)) {
    return payload.project.searchScope;
  }

  return "project";
};

export const getSearchContext = (file: File, payload: Payload): SearchContext => ({
  scope: getSearchScope(file, payload),
  pageId: file.id,
  branch: getSearchBranch(file),
});

export const generateSearchIndex = async (payload: Payload): Promise<Payload> => {
  const shouldGenerateSearch = payload.files.some((file) => hasSearchEnabled(file, payload));

  if (!shouldGenerateSearch) return payload;

  const entries = getSearchDocuments(payload);
  const groups = buildSearchGroups(entries, payload.project);
  const outputDirectory = join(payload.settings.output, SEARCH_DIRECTORY);

  await createDir(outputDirectory);

  const shards: SearchManifestShard[] = [];

  for (const group of groups) {
    const shard = buildSearchShard(group, entries);
    const fileName = `${group.id}.json`;

    await writeFile(join(outputDirectory, fileName), JSON.stringify(shard));

    shards.push({
      id: group.id,
      language: group.language,
      section: group.section,
      documents: group.documents.length,
      path: `/${SEARCH_DIRECTORY}/${fileName}`,
    });
  }

  const manifest: SearchManifest = {
    version: payload.generator?.version || "0.0.0",
    languages: payload.languages,
    shards,
  };

  await writeFile(join(outputDirectory, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(outputDirectory, "client.js"), await getSearchClientSource());

  blockLineSuccess("Search");
  blockLine(`   ${shards.length} shard${shards.length === 1 ? "" : "s"}`);
  blockLine(`   /${SEARCH_DIRECTORY}/manifest.json`);

  return payload;
};

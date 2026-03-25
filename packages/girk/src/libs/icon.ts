import { join } from "path";

import { File, ResolvedIcon } from "@/types";
import { getSVGData } from "@/libs/svg";
import { fileExists } from "@/libs/utils";

type OpenIconModule = typeof import("open-icon");

const loadModule = (<T>(specifier: string): Promise<T> =>
  (0, eval)(`import(${JSON.stringify(specifier)})`)) as <T>(specifier: string) => Promise<T>;

let openIconModulePromise: Promise<OpenIconModule> | null = null;
let openIconModuleLoader = (): Promise<OpenIconModule> => loadModule<OpenIconModule>("open-icon");

const iconCache = new Map<string, Promise<ResolvedIcon | undefined>>();

const isInlineSvg = (value: string): boolean => value.trim().startsWith("<svg");

const isExternalAsset = (value: string): boolean =>
  /^(https?:)?\/\//i.test(value) || value.startsWith("data:");

const isPathLike = (value: string): boolean =>
  /^(\/|\.{1,2}\/)/.test(value) || /\.[a-z0-9]+(?:[?#].*)?$/i.test(value);

const getPathWithoutQuery = (value: string): string => value.split(/[?#]/, 1)[0];

const getPathExtension = (value: string): string =>
  getPathWithoutQuery(value).split(".").pop()?.toLowerCase() || "";

const getOpenIconModule = async (): Promise<OpenIconModule> => {
  if (!openIconModulePromise) {
    openIconModulePromise = openIconModuleLoader();
  }

  return await openIconModulePromise;
};

export const setOpenIconModuleLoader = (loader?: () => Promise<OpenIconModule>): void => {
  openIconModulePromise = null;
  openIconModuleLoader = loader || (() => loadModule<OpenIconModule>("open-icon"));
};

const resolveAssetIcon = async (value: string): Promise<ResolvedIcon | undefined> => {
  if (!isPathLike(value) && !isExternalAsset(value)) return undefined;

  const extension = getPathExtension(value);
  if (extension !== "svg") return { src: value, provider: "asset" };
  if (isExternalAsset(value)) return { src: value, provider: "asset" };

  const localPath = join(process.cwd(), value);
  if (!(await fileExists(localPath))) {
    return { src: value, provider: "asset" };
  }

  return {
    svg: await getSVGData(value),
    provider: "asset",
    name: value,
  };
};

const getOpenIconSvg = async (value: string): Promise<string | undefined> => {
  const { getIcon, resolveOpenIconName, Icons } = await getOpenIconModule();

  const iconKey = value.trim();
  if (!iconKey) return undefined;

  const upperSnake = iconKey
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  const lowerDash = iconKey.trim().replace(/_/g, "-").replace(/\s+/g, "-").toLowerCase();
  const directName = resolveOpenIconName(iconKey);
  if (directName) {
    const svg = getIcon(directName);
    if (svg) return svg;
  }

  const keyCandidates = [iconKey, upperSnake, `UI_${upperSnake}`, `UI_${upperSnake}_M`].filter(
    (candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index,
  );

  for (const candidate of keyCandidates) {
    const mappedName = Icons[candidate];
    if (!mappedName) continue;

    const svg = getIcon(mappedName);
    if (svg) return svg;
  }

  const nameCandidates = [`icon-${lowerDash}`, `icon-${lowerDash}-m`, `ui/${lowerDash}-m`].filter(
    (candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index,
  );

  for (const candidate of nameCandidates) {
    const resolvedName = resolveOpenIconName(candidate);
    if (!resolvedName) continue;

    const svg = getIcon(resolvedName);
    if (svg) return svg;
  }

  return undefined;
};

export const resolveIcon = async (value?: string | null): Promise<ResolvedIcon | undefined> => {
  const iconReference = value?.toString().trim();
  if (!iconReference) return undefined;

  if (!iconCache.has(iconReference)) {
    iconCache.set(
      iconReference,
      (async () => {
        if (isInlineSvg(iconReference)) {
          return {
            svg: iconReference,
            provider: "inline",
          };
        }

        const assetIcon = await resolveAssetIcon(iconReference);
        if (assetIcon) return assetIcon;

        const openIconSvg = await getOpenIconSvg(iconReference);
        if (!openIconSvg) return undefined;

        return {
          svg: openIconSvg,
          provider: "open-icon",
          name: iconReference,
        };
      })(),
    );
  }

  return await iconCache.get(iconReference);
};

export const resolveFileIcons = async (files: File[]): Promise<File[]> => {
  return await Promise.all(
    files.map(async (file) => ({
      ...file,
      icon: await resolveIcon(file.meta?.icon),
    })),
  );
};

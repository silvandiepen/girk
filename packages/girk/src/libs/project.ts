import { asyncForEach, fileExists, getFileData } from "@/libs/utils";
import { camelCase } from "@sil/case";
import {
  Project,
  Meta,
  File,
  Arguments,
  ProjectScriptEntry,
  ProjectScriptType,
} from "../types";
import { flattenObject } from "./helpers";

export const getConfig = async (): Promise<Arguments> => {
  const configFiles = ["./girk.config.json", "./gieter.config.json"];

  for (const configFile of configFiles) {
    const configExists = await fileExists(configFile);

    if (configExists) {
      const data = await getFileData(configFile);
      return flattenObject(data as unknown as Record<string, unknown>);
    }
  }

  return {};
};

const fixProjectTypes = (input: Project): Project => {
  const fixedProject: Project = {};

  Object.keys(input).forEach((key: string) => {
    let value: any;
    const rawValue = input[key];

    if (rawValue === "false" || rawValue === false) value = false;
    else if (rawValue === "true" || rawValue === true) value = true;
    else if (
      typeof rawValue === "string" &&
      !/\r|\n/.exec(rawValue) &&
      rawValue.split(",").length > 1
    )
      value = rawValue.split(",").map((entry) => entry.trim()).filter(Boolean);
    else value = rawValue;

    fixedProject[key] = value;
  });

  return fixedProject;
};

const toScriptEntries = (
  value: Project["script"] | Project["scriptModule"],
  type: ProjectScriptType
): ProjectScriptEntry[] => {
  if (!value) return [];

  const entries = Array.isArray(value) ? value : [value];

  return entries
    .filter(Boolean)
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          src: entry,
          type,
        };
      }

      return {
        src: entry.src,
        type: entry.type || type,
      };
    })
    .filter((entry) => entry.src);
};

const normalizeProjectScripts = (input: Project): Project => {
  const { scriptModule, ...project } = input;
  const scripts = [
    ...toScriptEntries(project.script, "text/javascript"),
    ...toScriptEntries(scriptModule, "module"),
  ];

  if (!scripts.length) return project;

  return {
    ...project,
    script: scripts,
  };
};

const getProjectConfig = (meta: Meta): Project => {
  const project: Project = {};
  // Merge configs
  Object.keys(meta).forEach((item) => {
    if (item.includes("project") && typeof item == "string") {
      const key = camelCase(item.replace("project", ""), { exclude: [":"] });
      if (key == "ignore") {
        project[key] = meta[item]
          .toString()
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      } else project[key] = meta[item];
    }
  });
  return project;
};

export const getProjectData = async (files: File[]): Promise<Project> => {
  const project: Project = {};

  // First set the argumnets from the config file
  const config = await getConfig();
  if (config) {
    const projectMeta = getProjectConfig(config);
    Object.keys(projectMeta).forEach((key) => {
      if (!project[key]) project[key] = projectMeta[key];
    });
  }

  // Arguments set in files itself, will override the config file.
  await asyncForEach(files, async (file: File) => {
    const projectMeta = getProjectConfig(file.meta);
    Object.keys(projectMeta).forEach((key) => {
      project[key] = projectMeta[key];
    });
  });

  return normalizeProjectScripts(fixProjectTypes(project));
};

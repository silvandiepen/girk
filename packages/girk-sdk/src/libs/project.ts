import { asyncForEach } from "@/libs/utils";
import { camelCase } from "@sil/case";
import {
  Project,
  Meta,
  File,
  Arguments,
  ProjectScriptEntry,
  ProjectScriptType,
} from "@/types";
import { flattenObject } from "./helpers";

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

/**
 * Get project data from files and an optional pre-resolved config object.
 * In SDK mode, config comes from GirkBuildInput.config rather than the filesystem.
 */
export const getProjectData = async (
  files: File[],
  config?: Arguments
): Promise<Project> => {
  const project: Project = {};

  // First set the arguments from the config object (if provided)
  if (config) {
    const flatConfig = flattenObject(config as unknown as Record<string, unknown>);
    const projectMeta = getProjectConfig(flatConfig as Meta);
    Object.keys(projectMeta).forEach((key) => {
      if (!project[key]) project[key] = projectMeta[key];
    });

    // Also directly check config keys that match project keys
    const directProjectMeta = getProjectConfig(config as Meta);
    Object.keys(directProjectMeta).forEach((key) => {
      if (!project[key]) project[key] = directProjectMeta[key];
    });
  }

  // Arguments set in files themselves will override the config.
  await asyncForEach(files, async (file: File) => {
    if (!file.meta) return;
    const projectMeta = getProjectConfig(file.meta);
    Object.keys(projectMeta).forEach((key) => {
      project[key] = projectMeta[key];
    });
  });

  return normalizeProjectScripts(fixProjectTypes(project));
};

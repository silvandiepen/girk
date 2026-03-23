import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { getProjectData } from "@/libs/project";

const originalCwd = process.cwd();

afterEach(async () => {
  process.chdir(originalCwd);
});

describe("Project settings", () => {
  it("lets markdown project settings override config file values", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-project-settings-"));
    process.chdir(root);

    await writeFile(
      join(root, "girk.config.json"),
      JSON.stringify({
        project: {
          title: "Config Title",
          description: "Config Description",
        },
        projectGroupTags: false,
      })
    );

    const project = await getProjectData([
      {
        meta: {
          projectTitle: "Markdown Title",
          projectGroupTags: "true",
          projectIgnore: "drafts, private",
        },
      } as any,
    ]);

    expect(project.title).toBe("Markdown Title");
    expect(project.description).toBe("Config Description");
    expect(project.groupTags).toBe(true);
    expect(project.ignore).toEqual(["drafts", "private"]);

    await rm(root, { recursive: true, force: true });
  });

  it("normalizes classic and module project scripts", async () => {
    const root = await mkdtemp(join(tmpdir(), "girk-project-scripts-"));
    process.chdir(root);

    await writeFile(
      join(root, "girk.config.json"),
      JSON.stringify({
        project: {
          script: "/assets/from-config.js",
          scriptModule: "/assets/from-config-module.js",
        },
      })
    );

    const project = await getProjectData([
      {
        meta: {
          projectScript: "/assets/from-markdown.js",
          projectScriptModule:
            "/assets/component-one.js, /assets/component-two.js",
        },
      } as any,
    ]);

    expect(project.script).toEqual([
      { src: "/assets/from-markdown.js", type: "text/javascript" },
      { src: "/assets/component-one.js", type: "module" },
      { src: "/assets/component-two.js", type: "module" },
    ]);

    await rm(root, { recursive: true, force: true });
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { runFixtureBuild } from "./build-runner";
import { fileExists, readOutput } from "./helpers";

const originalCwd = process.cwd();
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  process.chdir(originalCwd);

  while (cleanups.length) {
    const cleanup = cleanups.pop();
    if (cleanup) await cleanup();
  }
});

describe("CLI page generation", () => {
  it("creates content pages for the basic fixture", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/about/index.html`)).toBe(true);

    const aboutHtml = await readOutput(result.outputDir, "about/index.html");

    expect(aboutHtml).toContain("About");
    expect(aboutHtml).toContain("About this site.");
  });

  it("rewrites .md links to girk's URL format", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    const homeHtml = await readOutput(result.outputDir, "index.html");

    expect(homeHtml).toContain('href="about/"');
    expect(homeHtml).not.toContain('href="about.md"');
  });

  it("renders an expanded footer navigation instead of a second header menu", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    const homeHtml = await readOutput(result.outputDir, "index.html");
    const headerNavigationCount = (
      homeHtml.match(/<nav class="navigation navigation--header/g) || []
    ).length;

    expect(headerNavigationCount).toBe(1);
    expect(homeHtml).toContain('<nav class="navigation navigation--footer">');
    expect(homeHtml).toContain('navigation__footer-list');
    expect(homeHtml).not.toContain(
      '<div class="footer__navigation">\n                  <nav class="navigation navigation--header',
    );
  });

  it("renders color mode toggle controls as siblings", async () => {
    const result = await runFixtureBuild("basic");
    cleanups.push(result.cleanup);

    const homeHtml = await readOutput(result.outputDir, "index.html");
    const toggleMatch = homeHtml.match(
      /<button class="color-mode-toggle"[\s\S]*?<\/button>/,
    );

    expect(toggleMatch?.[0]).toBeDefined();
    expect(toggleMatch?.[0].match(/color-mode-toggle__option/g) || []).toHaveLength(
      2,
    );
    const compactToggle = toggleMatch?.[0].replace(/\s+/g, "") || "";

    expect(compactToggle).toContain(
      '</svg></span></span><spanclass="color-mode-toggle__track"aria-hidden="true">',
    );
    expect(compactToggle).toContain(
      '</span></span><spanclass="color-mode-toggle__option"aria-hidden="true">',
    );
  });

  it("creates pages for the config fixture", async () => {
    const result = await runFixtureBuild("config");
    cleanups.push(result.cleanup);

    expect(await fileExists(`${result.outputDir}/index.html`)).toBe(true);
    expect(await fileExists(`${result.outputDir}/page/index.html`)).toBe(true);

    const pageHtml = await readOutput(result.outputDir, "page/index.html");

    expect(pageHtml).toContain("A Page");
    expect(pageHtml).toContain("Content here.");
  });
});

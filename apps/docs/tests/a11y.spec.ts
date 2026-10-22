import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const sites = [
  { name: "docs", root: "apps/docs/public", baseUrl: "http://127.0.0.1:4173" },
  { name: "example-basic", root: "apps/example-basic/public", baseUrl: "http://127.0.0.1:4174" },
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const listPages = (root: string): string[] => {
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== "assets") walk(path);
      } else if (entry === "index.html") {
        pages.push(`/${relative(root, dir).split(sep).join("/")}`.replace(/\/$/, "") + "/");
      }
    }
  };
  walk(root);
  return pages.sort();
};

for (const site of sites) {
  test.describe(`${site.name} accessibility`, () => {
    for (const path of listPages(site.root)) {
      // Redirect pages leave the site before axe can run.
      if (path.includes("/redirect/")) continue;

      for (const colorScheme of ["light", "dark"] as const) {
        test(`${path} has no WCAG violations (${colorScheme})`, async ({ page }) => {
          await page.emulateMedia({ colorScheme });
          await page.goto(`${site.baseUrl}${path}`);

          const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

          expect(
            violations.map((violation) => ({
              id: violation.id,
              nodes: violation.nodes.map((node) => node.target.join(" ")),
            }))
          ).toEqual([]);
        });
      }
    }
  });
}

test.describe("keyboard and preference behaviour", () => {
  const docs = "http://127.0.0.1:4173";

  test("the skip link is the first tab stop and moves focus to the content", async ({ page }) => {
    await page.goto(`${docs}/`);
    await page.keyboard.press("Tab");

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("follows the system colour scheme until the visitor picks one", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${docs}/`);

    expect(await page.evaluate(() => localStorage.getItem("colorMode"))).toBeNull();
    await expect(page.locator("html")).not.toHaveAttribute("color-mode", /.*/);
    await expect(page.locator("[data-color-mode-toggle]")).toHaveAttribute("aria-pressed", "true");

    await page.locator("[data-color-mode-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("color-mode", "light");
    expect(await page.evaluate(() => localStorage.getItem("colorMode"))).toBe("light");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("color-mode", "light");
  });

  test("page features keep working when storage is blocked", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("denied", "SecurityError");
        },
      });
    });

    await page.goto(`${docs}/`);
    await page.locator("[data-color-mode-toggle]").click();

    await expect(page.locator("html")).toHaveAttribute("color-mode", /dark|light/);
    expect(errors).toEqual([]);
  });

  test("search keeps focus in the dialog and announces results", async ({ page }) => {
    await page.goto(`${docs}/`);
    await page.locator("[data-search-open]").first().click();

    const input = page.locator("[data-search-input]");
    await expect(input).toBeFocused();
    await input.fill("markdown");
    await expect(page.locator("[data-search-status]")).toHaveText(/\d+ results?/);

    for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
    const focusInDialog = await page.evaluate(
      () =>
        document.activeElement === document.body ||
        !!document.activeElement?.closest("[data-search-shell]")
    );
    expect(focusInDialog).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-search-open]").first()).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  });

  test("the open mobile menu keeps focus inside it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${docs}/`);

    const toggle = page.locator(".navigation__mobile-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inMenu = await page.evaluate(
        () =>
          document.activeElement === document.body ||
          !!document.activeElement?.closest(".navigation--header")
      );
      expect(inMenu).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  });

  test("content reflows at 320px without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });

    for (const path of ["/", "/how-to/data-sources/", "/features/kitchensink/"]) {
      await page.goto(`${docs}${path}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, path).toBe(0);
    }
  });

  test("navigation marks the current page", async ({ page }) => {
    await page.goto(`${docs}/features/`);
    await expect(page.locator('.navigation--header a[aria-current="page"]').first()).toHaveAttribute(
      "href",
      /\/features/
    );
  });
});

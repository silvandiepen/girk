import { expect, test } from "@playwright/test";

type RouteExpectation = {
  path: string;
  heading: RegExp;
  text: string;
};

const routes: RouteExpectation[] = [
  {
    path: "/",
    heading: /^Girk$/,
    text: "Markdown-first static sites without the sprawl.",
  },
  {
    path: "/features/",
    heading: /^Features$/,
    text: "practical site-building features",
  },
  {
    path: "/features/archives/",
    heading: /^Archives$/,
    text: "turn a folder landing page into a generated overview",
  },
  {
    path: "/features/media/",
    heading: /^Media and Assets$/,
    text: "copies your static files into the generated site",
  },
  {
    path: "/features/metadata/",
    heading: /^Page Metadata$/,
    text: "Page frontmatter is how you shape navigation",
  },
  {
    path: "/features/customisation/",
    heading: /^Customisation$/,
    text: "Girk gives you a default stylesheet",
  },
  {
    path: "/features/multilingual/",
    heading: /^Multilingual Content$/,
    text: "supports multilingual content with filename suffixes",
  },
  {
    path: "/examples/",
    heading: /^Examples$/,
    text: "These are complete Girk projects you can inspect",
  },
  {
    path: "/how-to/",
    heading: /^How to Use$/,
    text: "the practical path is",
  },
  {
    path: "/release-notes/",
    heading: /^Release Notes$/,
    text: "tracks what changed in Girk",
  },
  {
    path: "/how-to/getting-started/",
    heading: /^Getting Started$/,
    text: "The fastest way to understand Girk",
  },
  {
    path: "/release-notes/v1-13-0/",
    heading: /^1.13.0$/,
    text: "Queued from the current local main branch",
  },
  {
    path: "/release-notes/v1-12-0/",
    heading: /^1.12.0$/,
    text: "Released on 2026-03-23",
  },
  {
    path: "/how-to/structure/",
    heading: /^Structure a Project$/,
    text: "Girk gets its routes from the file tree",
  },
  {
    path: "/how-to/configuration/",
    heading: /^Configure a Project$/,
    text: "Use frontmatter for page-specific behavior",
  },
  {
    path: "/how-to/page-settings/",
    heading: /^Use Page Settings$/,
    text: "Page frontmatter is where you control titles",
  },
  {
    path: "/how-to/ai/",
    heading: /^AI Reference$/,
    text: "This page is written to be fed to an AI assistant",
  },
];

test.describe("generated docs", () => {
  test("homepage and primary docs routes have the expected titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/^Girk$/);

    await page.goto("/about/");
    await expect(page).toHaveURL(/\/(?:index\.html)?$/);
    await expect(page).toHaveTitle(/^Girk$/);

    await page.goto("/features/");
    await expect(page).toHaveTitle(/^Features \| Girk$/);

    await page.goto("/examples/");
    await expect(page).toHaveTitle(/^Examples \| Girk$/);

    await page.goto("/release-notes/");
    await expect(page).toHaveTitle(/^Release Notes \| Girk$/);
  });

  for (const route of routes) {
    test(`renders ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path);

      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator("main")).toContainText(route.text);
    });
  }

  test("navigation links stay reachable from the homepage", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("banner").getByRole("link", { name: "Release Notes" })
    ).toHaveCount(0);
    await expect(
      page.locator("main").getByRole("link", { name: "Release Notes" }).first()
    ).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "Features" }).click();
    await page.getByRole("banner").getByRole("link", { name: "Features" }).click();
    await expect(page).toHaveURL(/\/features(?:\/|\/index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Features" })).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/(?:index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Girk" })).toBeVisible();
  });

  test("navigation submenus can be opened from the header", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("banner")
      .getByRole("button", { name: "Toggle Features submenu" })
      .click();

    await expect(
      page.getByRole("banner").getByRole("link", { name: "Archives" })
    ).toBeVisible();
  });

  test("navigation submenus size to their content", async ({ page }) => {
    await page.goto("/examples/");

    const toggle = page
      .getByRole("banner")
      .getByRole("button", { name: "Toggle How to Use submenu" });
    const panelId = await toggle.getAttribute("aria-controls");

    expect(panelId).toBeTruthy();

    await toggle.click();

    const panel = page.locator(`#${panelId}`);
    const inner = panel.locator(".navigation__panel-inner");

    await expect(panel).toBeVisible();

    const [panelBox, innerBox] = await Promise.all([panel.boundingBox(), inner.boundingBox()]);

    expect(panelBox).toBeTruthy();
    expect(innerBox).toBeTruthy();
    expect(Math.abs((panelBox?.width ?? 0) - (innerBox?.width ?? 0))).toBeLessThan(24);
    expect(panelBox?.width ?? 0).toBeLessThan(380);
  });

  test("footer exposes the main navigation links", async ({ page }) => {
    await page.goto("/features/");

    await expect(page.getByRole("contentinfo").locator(".logo")).toBeVisible();
    await expect(page.getByRole("contentinfo").locator("[data-color-mode-toggle]")).toBeVisible();

    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Features" })
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "About" })
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "How to Use" })
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Examples" })
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Release Notes" })
    ).toHaveCount(0);
  });

  test("features landing page exposes child feature pages as visible links", async ({ page }) => {
    await page.goto("/features/");

    const main = page.locator("main");

    await expect(main.getByRole("link", { name: "Archives", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Media and Assets", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Customisation", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Multilingual Content", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Page Metadata", exact: true }).first()).toBeVisible();
  });

  test("child pages expose related sibling pages below the content", async ({ page }) => {
    await page.goto("/features/archives/");

    await expect(page.locator("main").getByRole("heading", { name: "More Pages" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Media and Assets" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Customisation" })).toBeVisible();
  });

  test("examples page links to the deployed example sites", async ({ page }) => {
    await page.goto("/examples/");

    await expect(
      page.getByRole("link", { name: "example-basic.girk.dev" })
    ).toHaveAttribute("href", "https://example-basic.girk.dev/");
    await expect(
      page.getByRole("link", { name: "example-multilang.girk.dev" })
    ).toHaveAttribute("href", "https://example-multilang.girk.dev/");
    await expect(
      page.getByRole("link", { name: "example-config.girk.dev" })
    ).toHaveAttribute("href", "https://example-config.girk.dev/");
    await expect(
      page.getByRole("link", { name: "example-blog.girk.dev" })
    ).toHaveAttribute("href", "https://example-blog.girk.dev/");
    await expect(
      page.getByRole("link", { name: "example-recipes.girk.dev" })
    ).toHaveAttribute("href", "https://example-recipes.girk.dev/");
  });

  test("examples page shows the example sections on one page", async ({ page }) => {
    await page.goto("/examples/");

    await expect(page.getByRole("heading", { level: 2, name: "Example Basic" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Example Multilang" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Example Config" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Example Blog" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Example Recipes" })).toBeVisible();
  });
});

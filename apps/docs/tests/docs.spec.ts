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
    heading: /^Page Frontmatter$/,
    text: "Page frontmatter is the single place where you control",
  },
  {
    path: "/features/customisation/",
    heading: /^Customisation$/,
    text: "Girk gives you a default stylesheet",
  },
  {
    path: "/features/kitchensink/",
    heading: /^Kitchen Sink$/,
    text: "shows how Girk renders common content and native HTML controls",
  },
  {
    path: "/features/multilingual/",
    heading: /^Multilingual Content$/,
    text: "supports multilingual content with filename suffixes",
  },
  {
    path: "/features/search/",
    heading: /^Search$/,
    text: "fully static search index at build time",
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
    text: "tracks what changed in each released version of Girk",
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
    text: "single canonical page",
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

  test("main layout exposes view-transition and anchor-positioning hooks", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium");

    await page.goto("/features/");

    await expect(
      page.locator('meta[name="view-transition"][content="same-origin"]')
    ).toHaveCount(1);

    const styles = await page.evaluate(() => {
      const header = document.querySelector(".header");
      const main = document.querySelector(".main");
      const footer = document.querySelector(".footer");
      const navList = document.querySelector(".navigation--header .navigation__list");
      const activeLink = document.querySelector(
        ".navigation--header .navigation__item--current > .navigation__entry > .navigation__link, .navigation--header .navigation__item--parent > .navigation__entry > .navigation__link"
      );
      const activePill = document.querySelector(".navigation--header .navigation__active-pill");

      return {
        supportsAnchors: CSS.supports("position-anchor: --anchor"),
        headerTransition: header ? getComputedStyle(header).viewTransitionName : "",
        mainTransition: main ? getComputedStyle(main).viewTransitionName : "",
        footerTransition: footer ? getComputedStyle(footer).viewTransitionName : "",
        navTransition: navList ? getComputedStyle(navList).viewTransitionName : "",
        activeAnchor: activeLink ? getComputedStyle(activeLink).anchorName : "",
        pillTransition: activePill ? getComputedStyle(activePill).viewTransitionName : "",
      };
    });

    expect(styles.headerTransition).toBe("site-header");
    expect(styles.mainTransition).toBe("site-main");
    expect(styles.footerTransition).toBe("site-footer");
    expect(styles.navTransition).toBe("navigation-links");

    if (styles.supportsAnchors) {
      expect(styles.activeAnchor).toContain("--navigation-active");
      expect(styles.pillTransition).toBe("navigation-pill");
    }
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

  test("navigation submenus stay within the desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/examples/");

    const toggle = page
      .getByRole("banner")
      .getByRole("button", { name: "Toggle How to Use submenu" });
    const panelId = await toggle.getAttribute("aria-controls");

    expect(panelId).toBeTruthy();

    await toggle.click();

    const panel = page.locator(`#${panelId}`);
    await expect(panel).toBeVisible();

    const [panelBox, viewportWidth] = await Promise.all([
      panel.boundingBox(),
      page.evaluate(() => window.innerWidth),
    ]);

    expect(panelBox).toBeTruthy();
    const panelLeft = panelBox?.x ?? 0;
    const panelRight = panelLeft + (panelBox?.width ?? 0);

    expect(panelLeft).toBeGreaterThanOrEqual(16);
    expect(panelRight).toBeLessThanOrEqual(viewportWidth - 16);
  });

  test("header navigation switches to the mobile menu at tablet widths", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/");

    const toggle = page
      .getByRole("banner")
      .getByRole("button", { name: "Toggle navigation menu" });

    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole("banner").getByRole("link", { name: "Features" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "How to Use" })).toBeVisible();
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
    await expect(main.getByRole("link", { name: "Kitchen Sink", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Multilingual Content", exact: true }).first()).toBeVisible();
    await expect(main.getByRole("link", { name: "Page Frontmatter", exact: true }).first()).toBeVisible();
  });

  test("header search stays hidden until the icon button is opened, then shows live results", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByRole("banner");
    const openButton = banner.getByRole("button", { name: "Open search" });
    const dialog = page.getByRole("dialog", { name: "Search" });
    const input = page.locator("#site-search-input");

    await expect(openButton).toBeVisible();
    await expect(input).toBeHidden();

    await openButton.click();

    await expect(dialog).toBeVisible();
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill("archives");

    await expect(dialog.getByRole("link", { name: "Archives" }).first()).toBeVisible();
    await dialog.getByRole("link", { name: "Archives" }).first().click();

    await expect(page).toHaveURL(/\/features\/archives(?:\/|\/index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Archives" })).toBeVisible();
  });

  test("header search opens and works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const openButton = page.getByRole("banner").getByRole("button", { name: "Open search" });

    await openButton.click();

    const dialog = page.getByRole("dialog", { name: "Search" });
    const input = page.locator("#site-search-input");

    await expect(dialog).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill("multilingual");

    await expect(
      dialog.getByRole("link", { name: "Multilingual Content" }).first()
    ).toBeVisible();
  });

  test("excluded sections do not appear in live search results", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("banner").getByRole("button", { name: "Open search" }).click();

    const dialog = page.getByRole("dialog", { name: "Search" });
    const input = page.locator("#site-search-input");

    await input.fill("generator meta tag");

    await expect(dialog.locator(".search-results__list")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Page Frontmatter" }).first()).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Release Notes" })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: "1.19.3" })).toHaveCount(0);
  });

  test("kitchen sink exposes native form controls", async ({ page }) => {
    await page.goto("/features/kitchensink/");

    const main = page.locator("main");

    await expect(main.locator("#kitchen-name")).toBeVisible();
    await expect(main.locator("#kitchen-search")).toBeVisible();
    await expect(main.locator("#kitchen-email")).toBeVisible();
    await expect(main.locator("#kitchen-password")).toBeVisible();
    await expect(main.locator("#kitchen-phone")).toBeVisible();
    await expect(main.locator("#kitchen-url")).toBeVisible();
    await expect(main.locator("#kitchen-number")).toBeVisible();
    await expect(main.locator("#kitchen-date")).toBeVisible();
    await expect(main.locator("#kitchen-time")).toBeVisible();
    await expect(main.locator("#kitchen-datetime")).toBeVisible();
    await expect(main.locator("#kitchen-month")).toBeVisible();
    await expect(main.locator("#kitchen-week")).toBeVisible();
    await expect(main.locator("#kitchen-role")).toBeVisible();
    await expect(main.locator("#kitchen-stack")).toBeVisible();
    await expect(main.locator("#kitchen-country")).toBeVisible();
    await expect(main.locator("#kitchen-message")).toBeVisible();
    await expect(main.locator("#kitchen-color")).toBeVisible();
    await expect(main.locator("#kitchen-range")).toBeVisible();
    await expect(main.locator("#kitchen-file")).toBeVisible();
    await expect(main.getByRole("checkbox", { name: /send product updates/i })).toBeVisible();
    await expect(main.getByRole("checkbox", { name: /send security notices/i })).toBeVisible();
    await expect(main.getByRole("radio", { name: "Email" })).toBeVisible();
    await expect(main.getByRole("radio", { name: "RSS" })).toBeVisible();
  });

  test("semantic article blocks render with default styling", async ({ page }) => {
    await page.goto("/features/kitchensink/");

    const articles = page.locator("#en-features-kitchensink-semantics article");

    await expect(articles).toHaveCount(2);
    await expect(articles.nth(0)).toContainText("Raw HTML article");
    await expect(articles.nth(1)).toContainText("Note");
    await expect(articles.nth(1)).toContainText("Authoring pattern");
    await expect(articles.nth(1)).toContainText("2026-03-27");
    await expect(articles.nth(1)).toContainText("This article assumes basic Markdown knowledge.");

    const styles = await articles.nth(1).evaluate((element) => {
      const computed = window.getComputedStyle(element);

      return {
        articleColor: element.getAttribute("style"),
        backgroundColor: computed.backgroundColor,
        borderTopWidth: computed.borderTopWidth,
        borderRadius: computed.borderRadius,
        color: computed.color,
        paddingTop: computed.paddingTop,
      };
    });

    expect(styles.articleColor).toContain("--article-color:");
    expect(styles.articleColor).toContain("--article-color-contrast:");
    expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(styles.borderTopWidth).not.toBe("0px");
    expect(styles.borderRadius).not.toBe("0px");
    expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(styles.paddingTop).not.toBe("0px");
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

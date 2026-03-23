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
    text: "Girk is a Markdown-first static site generator.",
  },
  {
    path: "/about/",
    heading: /^About$/,
    text: "the files are the project model",
  },
  {
    path: "/docs/",
    heading: /^Documentation$/,
    text: "It derives the site directly from those files",
  },
  {
    path: "/docs/archive/",
    heading: /^Archives$/,
    text: "Archives let a folder landing page collect and present its child pages",
  },
  {
    path: "/docs/media/",
    heading: /^Media and Assets$/,
    text: "Girk copies those folders into the generated site",
  },
  {
    path: "/docs/meta/",
    heading: /^Meta$/,
    text: "Most Girk behavior is driven by these keys",
  },
  {
    path: "/docs/partials/",
    heading: /^Partials$/,
    text: "Files starting with `-` are skipped during standalone page generation",
  },
  {
    path: "/docs/project-settings/",
    heading: /^Project Settings$/,
    text: "Project settings can be declared in any Markdown file",
  },
  {
    path: "/docs/settings/",
    heading: /^Settings$/,
    text: "Girk keeps CLI configuration minimal",
  },
  {
    path: "/docs/styling/",
    heading: /^Styling$/,
    text: "The generated stylesheet exposes a token system",
  },
  {
    path: "/docs/examples/",
    heading: /^Examples$/,
    text: "example-basic.girk.dev",
  },
  {
    path: "/docs/structure/",
    heading: /^Project Structure$/,
    text: "Girk derives routes from folders and filenames.",
  },
  {
    path: "/docs/generation/",
    heading: /^Generation Flow$/,
    text: "Girk follows a predictable pipeline.",
  },
  {
    path: "/docs/ai/",
    heading: /^AI Usage$/,
    text: "Girk works well with AI because the project model is explicit and file-based",
  },
  {
    path: "/docs/kitchensink/",
    heading: /^Header 123$/,
    text: "This is an example link.",
  },
];

test.describe("generated docs", () => {
  test("homepage and primary docs routes have the expected titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/^Girk$/);

    await page.goto("/about/");
    await expect(page).toHaveTitle(/^About \| Girk$/);

    await page.goto("/docs/");
    await expect(page).toHaveTitle(/^Documentation \| Girk$/);
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

    await page.getByRole("banner").getByRole("link", { name: "Documentation" }).click();
    await expect(page).toHaveURL(/\/docs(?:\/|\/index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Documentation" })).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about(?:\/|\/index\.html)?$/);
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  });

  test("docs landing page exposes child docs as visible links", async ({ page }) => {
    await page.goto("/docs/");

    await expect(page.getByRole("link", { name: "Archives" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Project Structure" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Generation Flow" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI Usage" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Examples" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Media and Assets" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Project Settings" })).toBeVisible();
  });

  test("examples page links to the deployed example sites", async ({ page }) => {
    await page.goto("/docs/examples/");

    await expect(
      page.getByRole("link", { name: "example-basic.girk.dev" })
    ).toHaveAttribute("href", "https://example-basic.girk.dev/");
    await expect(
      page.getByRole("link", { name: "example-multilang.girk.dev" })
    ).toHaveAttribute("href", "https://example-multilang.girk.dev/");
  });
});

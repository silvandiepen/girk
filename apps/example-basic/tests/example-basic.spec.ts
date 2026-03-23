import { expect, test } from "@playwright/test";

const exampleBaseUrl = "http://127.0.0.1:4174";

test.describe("example-basic integrations", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://esm.sh/vue@3.5.13", async (route) => {
      await route.fulfill({
        contentType: "text/javascript",
        body: `
          export const createApp = (component) => ({
            mount(target) {
              const state = component.data ? component.data() : {};
              target.innerHTML = \`
                <aside style="border-left: 4px solid rgb(28 83 52); padding: 1rem 1.25rem; background: rgba(28, 83, 52, 0.08);">
                  <strong style="display: block; margin-bottom: 0.35rem;">Vue block</strong>
                  <span>\${state.message ?? ""}</span>
                </aside>
              \`;
            }
          });
        `,
      });
    });
  });

  test("loads the native custom element from the module script", async ({ page }) => {
    await page.goto(`${exampleBaseUrl}/`);

    const exampleNote = page.locator("example-note");

    await expect(exampleNote).toContainText("Interactive block");
    await expect(exampleNote).toContainText(
      "Web component loaded through projectScriptModule"
    );
  });

  test("mounts the Vue example from the module script", async ({ page }) => {
    await page.goto(`${exampleBaseUrl}/`);

    const vueExample = page.locator("[data-vue-example]");

    await expect(vueExample).toContainText("Vue block");
    await expect(vueExample).toContainText(
      "Vue mounted this block through projectScriptModule."
    );
    await expect(vueExample).not.toContainText("Loading Vue example...");
  });
});

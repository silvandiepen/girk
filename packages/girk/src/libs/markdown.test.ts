import { describe, expect, it } from "vitest";

import { toHtml } from "@/libs/markdown";

describe("Markdown code highlighting", () => {
  it.each([
    ["bash", "echo hello", "token builtin"],
    ["json", '{\"name\":\"girk\"}', "token property"],
    ["markdown", "# Heading", "token title"],
    ["css", "body { color: red; }", "token selector"],
  ])(
    "renders Prism token markup for %s fences",
    async (language, source, tokenClass) => {
      const { document } = await toHtml(`\`\`\`${language}\n${source}\n\`\`\``);

      expect(document).toContain(`class="language-${language}"`);
      expect(document).toContain(tokenClass);
    }
  );
});

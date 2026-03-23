import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { join } from "node:path";

const root = process.cwd();

const run = (args, cwd = root) => {
  const result = spawnSync("npm", args, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `Command failed: npm ${args.join(" ")}\n${result.stdout}\n${result.stderr}`
  );
};

const read = (relativePath) => readFile(join(root, relativePath), "utf8");

test("example-basic builds a feature-rich sample site", async () => {
  run(["run", "build", "-w", "@girk/example-basic"]);

  const home = await read("apps/example-basic/public/index.html");
  const guide = await read("apps/example-basic/public/guide/index.html");
  const sections = await read("apps/example-basic/public/sections/index.html");
  const hidden = await read("apps/example-basic/public/hidden/index.html");
  const groupedTag = await read(
    "apps/example-basic/public/tag/guide/basics/index.html"
  );
  const copied = await read("apps/example-basic/public/assets/snippets/quote.txt");

  assert.match(home, /Girk Basic/);
  assert.match(home, /\/style\/app\.css/);
  assert.match(home, /\/assets\/custom\.css/);
  assert.match(home, /\/assets\/custom\.js/);
  assert.match(home, /https:\/\/example\.com\/support/);
  assert.match(guide, /Install/);
  assert.match(guide, /Configuration/);
  assert.match(sections, /Intro Section/);
  assert.match(sections, /Deep Dive/);
  assert.equal(
    existsSync(join(root, "apps/example-basic/public/sections/intro/index.html")),
    false
  );
  assert.equal(
    existsSync(join(root, "apps/example-basic/public/sections/details/index.html")),
    false
  );
  assert.match(hidden, /Hidden Page/);
  assert.match(groupedTag, /#basics/);
  assert.match(copied, /book-like projects/);
});

test("example-multilang builds translated routes and style overrules", async () => {
  run(["run", "build", "-w", "@girk/example-multilang"]);

  const home = await read("apps/example-multilang/public/index.html");
  const dutchHome = await read("apps/example-multilang/public/nl/index.html");
  const aboutNl = await read("apps/example-multilang/public/nl/about/index.html");

  assert.match(home, /Girk Multilang/);
  assert.match(home, /\/assets\/minimal\.css/);
  assert.doesNotMatch(home, /\/style\/app\.css/);
  assert.match(home, /data-code="en"/);
  assert.match(home, /data-code="nl"/);
  assert.match(dutchHome, /Girk Meertalig/);
  assert.match(dutchHome, /Dit is de Nederlandse homepage/);
  assert.match(aboutNl, /Deze pagina controleert/);
});

test("example-config builds a config-driven sample site", async () => {
  run(["run", "build", "-w", "@girk/example-config"]);

  const home = await read("apps/example-config/public/index.html");
  const guide = await read("apps/example-config/public/guide/index.html");

  assert.match(home, /Girk Config/);
  assert.match(home, /\/assets\/site\.css/);
  assert.match(home, /A sample project driven by girk\.config\.json/);
  assert.match(guide, /Color Roles/);
  assert.match(guide, /Shared Defaults/);
});

test("example-blog builds a dated blog archive", async () => {
  run(["run", "build", "-w", "@girk/example-blog"]);

  const home = await read("apps/example-blog/public/index.html");
  const journal = await read("apps/example-blog/public/journal/index.html");

  assert.match(home, /Girk Blog/);
  assert.match(journal, /Launch Post/);
  assert.match(journal, /First Notes/);
});

test("example-recipes builds checklist-driven recipe pages", async () => {
  run(["run", "build", "-w", "@girk/example-recipes"]);

  const home = await read("apps/example-recipes/public/index.html");
  const recipes = await read("apps/example-recipes/public/recipes/index.html");
  const orzo = await read("apps/example-recipes/public/recipes/one-pan-tomato-orzo/index.html");

  assert.match(home, /Girk Recipes/);
  assert.match(recipes, /One-Pan Tomato Orzo/);
  assert.match(recipes, /Crispy Chickpea Wraps/);
  assert.match(orzo, /task-list/);
  assert.match(orzo, /Ingredients/);
  assert.match(orzo, /Steps/);
});

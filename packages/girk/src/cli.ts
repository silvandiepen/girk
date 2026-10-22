#!/usr/bin/env node
import { blockFooter } from "cli-block";

import { build } from "./build";

/*
 * Girk requires require()-of-ESM support to load girk-sdk's compiled
 * template registry, which only landed in Node 20.19+ / 22.12+. Without
 * this check, an older Node fails deep inside render.js with a confusing
 * error instead of the real cause.
 */
const checkNodeVersion = (): void => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  const supported = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22;

  if (!supported) {
    console.error(
      `Girk requires Node.js ^20.19.0 || >=22.12.0 (needs require() support for ESM, ` +
        `available from Node 20.19 or 22.12 onwards).\n` +
        `You're running Node.js ${process.versions.node}. Please upgrade Node and try again.`,
    );
    process.exit(1);
  }
};

checkNodeVersion();

build()
  .then(() => blockFooter())
  .catch((error: unknown) => {
    console.error(`\nGirk build failed: ${error instanceof Error ? error.message : String(error)}`);
    if (process.env.DEBUG && error instanceof Error && error.stack) console.error(error.stack);
    process.exitCode = 1;
  });

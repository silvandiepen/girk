/**
 * EJS template rendering for Girky CLI.
 *
 * Self-contained — reads templates from girk-sdk's compiled registry
 * using filesystem access (CLI only, not for Workers).
 */

import { existsSync } from "fs";
import { join } from "path";

/**
 * HTML-escape a string.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Compile an EJS template into a reusable function.
 */
function compile(template: string): (data: Record<string, unknown>) => string {
  const body: string[] = ["var __out = [];"];
  let cursor = 0;

  while (cursor < template.length) {
    const tagStart = template.indexOf("<%", cursor);

    if (tagStart === -1) {
      if (cursor < template.length) {
        body.push(`__out.push(${JSON.stringify(template.slice(cursor))});`);
      }
      break;
    }

    if (tagStart > cursor) {
      body.push(`__out.push(${JSON.stringify(template.slice(cursor, tagStart))});`);
    }

    const tagEnd = template.indexOf("%>", tagStart + 2);
    if (tagEnd === -1) throw new Error("Unclosed EJS tag in template");

    const inner = template.slice(tagStart + 2, tagEnd);

    if (inner.startsWith("%")) {
      body.push(`__out.push("<%");`);
    } else if (inner.startsWith("=")) {
      body.push(`__out.push(__escape(String(${inner.slice(1).trim()})));`);
    } else if (inner.startsWith("-")) {
      body.push(`__out.push(String(${inner.slice(1).trim()}));`);
    } else {
      body.push(inner);
    }

    cursor = tagEnd + 2;
  }

  body.push("return __out.join('');");
  const fnBody = `with(__data) { ${body.join("\n")} }`;
  const fn = new Function("__data", fnBody);

  return (data: Record<string, unknown>) => fn({ ...data, __escape: escapeHtml });
}

const cache = new Map<string, (data: Record<string, unknown>) => string>();

function getCompiled(name: string, source: string) {
  if (!cache.has(name)) cache.set(name, compile(source));
  return cache.get(name)!;
}

interface RegistryModule {
  templates: Record<string, string>;
  scripts: Record<string, string>;
}

/**
 * Resolve and load girk-sdk template registry.
 */
function loadRegistryFromDisk(): RegistryModule {
  const candidates = [
    join(__dirname, "../../../girk-sdk/dist/libs/templates/registry.js"),
    join(__dirname, "../../../node_modules/girk-sdk/dist/libs/templates/registry.js"),
    join(__dirname, "../../../../node_modules/girk-sdk/dist/libs/templates/registry.js"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        // Node 22+ supports require() for ESM (experimental)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(candidate) as RegistryModule;
        if (mod.templates) return mod;
      } catch {
        continue;
      }
    }
  }

  throw new Error("Could not resolve girk-sdk template registry. Ensure girk-sdk is installed and built.");
}

let _registry: RegistryModule | null = null;

function loadRegistry() {
  if (_registry) return;
  _registry = loadRegistryFromDisk();
}

/**
 * Format a date using Intl.DateTimeFormat.
 */
function formatDate(value: string | Date, format?: string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return String(value);

  if (format === "time") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  if (format === "year") {
    return String(d.getFullYear());
  }
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Render an icon (svg or img) as an HTML string.
 */
function renderIcon(
  icon: { svg?: string; src?: string } | undefined,
  wrapperClass = "icon",
  assetClass = "icon__asset"
): string {
  if (!icon) return "";
  let out = `<span class="${wrapperClass}" aria-hidden="true">`;
  if (icon.svg) {
    out += `<span class="${assetClass}">${icon.svg}</span>`;
  } else if (icon.src) {
    out += `<img class="${assetClass}" src="${icon.src}" alt="">`;
  }
  out += "</span>";
  return out;
}

/**
 * Render a full page using EJS templates.
 */
export function renderEjs(
  data: Record<string, unknown>,
  templateName = "page",
  customTemplates?: Record<string, string>
): string {
  loadRegistry();

  const allTemplates = { ..._registry!.templates, ...customTemplates };
  const source = allTemplates[templateName];

  if (!source) throw new Error(`Template "${templateName}" not found`);

  const scripts = _registry!.scripts;

  // Build partials
  const partials: Record<string, (d: Record<string, unknown>) => string> = {};
  for (const [name, src] of Object.entries(allTemplates)) {
    if (name === "page") continue;
    partials[name] = (d) =>
      getCompiled(name, src as string)({ ...d, data: d, partials, scripts, formatDate, renderIcon });
  }

  const enhancedData = { ...data, data, partials, scripts, formatDate, renderIcon };
  return getCompiled(templateName, source)(enhancedData);
}

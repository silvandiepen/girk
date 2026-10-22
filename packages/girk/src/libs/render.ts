/**
 * EJS template rendering for Girky CLI.
 *
 * Renders girk-sdk's compiled template registry (girk-sdk/templates).
 */

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

let _registry: RegistryModule | null = null;

/**
 * Load the girk-sdk template registry through its package export.
 * girk-sdk is ESM; require() of ESM needs Node 20.19+ / 22.12+ (checked in the CLI).
 */
export function getRegistry(): RegistryModule {
  if (!_registry) _registry = require("girk-sdk/templates") as RegistryModule;
  return _registry;
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
 * Give every id inside each inline <svg> a per-instance suffix, so a logo or
 * icon inlined more than once doesn't produce duplicate ids, and point the
 * svg's own references (url(#id), href="#id") at the renamed ids.
 */
export function uniqueSvgIds(html: string): string {
  let instance = 0;
  return html.replace(/<svg\b[\s\S]*?<\/svg>/g, (svg) => {
    const ids = new Set(Array.from(svg.matchAll(/\sid="([^"]+)"/g), (match) => match[1]));
    if (!ids.size) return svg;

    instance += 1;
    const rename = (id: string) => (ids.has(id) ? `${id}-${instance}` : id);
    return svg
      .replace(/(\sid=")([^"]+)"/g, (_, attr, id) => `${attr}${rename(id)}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${rename(id)})`)
      .replace(/(href=")#([^"]+)"/g, (_, attr, id) => `${attr}#${rename(id)}"`);
  });
}

/**
 * Render a full page using EJS templates.
 */
export function renderEjs(
  data: Record<string, unknown>,
  templateName = "page",
  customTemplates?: Record<string, string>
): string {
  const registry = getRegistry();

  const allTemplates = { ...registry.templates, ...customTemplates };
  const source = allTemplates[templateName];

  if (!source) throw new Error(`Template "${templateName}" not found`);

  const scripts = registry.scripts;

  // Build partials
  const partials: Record<string, (d: Record<string, unknown>) => string> = {};
  for (const [name, src] of Object.entries(allTemplates)) {
    if (name === "page") continue;
    partials[name] = (d) =>
      getCompiled(name, src as string)({ ...d, data: d, partials, scripts, formatDate, renderIcon });
  }

  const enhancedData = { ...data, data, partials, scripts, formatDate, renderIcon };
  return uniqueSvgIds(getCompiled(templateName, source)(enhancedData));
}

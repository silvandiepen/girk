/**
 * EJS template rendering engine for Girk SDK.
 *
 * Replaces pug.renderFile() with in-memory EJS rendering.
 * All templates and scripts are loaded from the generated registry
 * (no filesystem access required — works in CF Workers).
 *
 * Custom templates can be passed via the `customTemplates` config option.
 */

import { templates, scripts } from "./templates/registry";
import { formatDate } from "./formatDate";
import { renderIcon } from "./renderIcon";

/**
 * HTML-escape a string for safe output in <%= %> tags.
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
 * Compile an EJS template string into a reusable render function.
 *
 * Supports:
 *   <%- expr %>   → unescaped output (for HTML)
 *   <%= expr %>   → HTML-escaped output
 *   <% code %>    → control flow (if/for/while/etc.)
 *   <%%           → literal <%
 */
function compile(template: string): (data: Record<string, unknown>) => string {
  const body: string[] = ["var __out = [];"];
  let cursor = 0;

  while (cursor < template.length) {
    const tagStart = template.indexOf("<%", cursor);

    if (tagStart === -1) {
      // No more tags — rest is literal
      if (cursor < template.length) {
        body.push(`__out.push(${JSON.stringify(template.slice(cursor))});`);
      }
      break;
    }

    // Push literal text before the tag
    if (tagStart > cursor) {
      body.push(`__out.push(${JSON.stringify(template.slice(cursor, tagStart))});`);
    }

    // Find closing %>
    const tagEnd = template.indexOf("%>", tagStart + 2);
    if (tagEnd === -1) {
      throw new Error("Unclosed EJS tag in template");
    }

    const inner = template.slice(tagStart + 2, tagEnd);

    if (inner.startsWith("%")) {
      // <%% → literal <%
      body.push(`__out.push("<%");`);
    } else if (inner.startsWith("=")) {
      // <%= expr %> → escaped output
      body.push(`__out.push(__escape(String(${inner.slice(1).trim()})));`);
    } else if (inner.startsWith("-")) {
      // <%- expr %> → unescaped output
      body.push(`__out.push(String(${inner.slice(1).trim()}));`);
    } else {
      // <% code %> → control flow
      body.push(inner);
    }

    cursor = tagEnd + 2;
  }

  body.push("return __out.join('');");

  // Build function: with(__data) makes all data props available as locals.
  // We pass __escape as a property of __data so it's accessible inside `with`.
  const fnBody = `with(__data) { ${body.join("\n")} }`;
  const fn = new Function("__data", fnBody);

  return (data: Record<string, unknown>) => fn({ ...data, __escape: escapeHtml });
}

/** Compiled template cache. */
const cache = new Map<string, (data: Record<string, unknown>) => string>();

/**
 * Get a compiled template, using cache if available.
 */
function getCompiled(name: string, source: string) {
  if (!cache.has(name)) {
    cache.set(name, compile(source));
  }
  return cache.get(name)!;
}

/**
 * Build the partials object.
 * Each key is a template name, each value is a render function.
 */
function buildPartials(
  allTemplates: Record<string, string>
): Record<string, (data: Record<string, unknown>) => string> {
  const partials: Record<string, (data: Record<string, unknown>) => string> = {};

  for (const [name, source] of Object.entries(allTemplates)) {
    if (name === "page") continue; // page is the top-level template, not a partial
    partials[name] = (data) => getCompiled(name, source)({ ...data, data, partials, scripts, formatDate, renderIcon });
  }

  return partials;
}

/**
 * Render a full page using EJS templates.
 *
 * @param data - Template data (menu, project, content, etc.)
 * @param templateName - Template to render (default: "page")
 * @param customTemplates - Optional custom templates to override/extend built-ins
 */
export function renderEjs(
  data: Record<string, unknown>,
  templateName = "page",
  customTemplates?: Record<string, string>
): string {
  const allTemplates = { ...templates, ...customTemplates };
  const source = allTemplates[templateName];

  if (!source) {
    throw new Error(`Template "${templateName}" not found`);
  }

  const partials = buildPartials(allTemplates);

  const enhancedData = {
    ...data,
    data,
    partials,
    scripts,
    formatDate,
    renderIcon,
  };

  return getCompiled(templateName, source)(enhancedData);
}

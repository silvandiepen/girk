/**
 * Pure string-based path utilities — drop-in replacement for Node `path`.
 *
 * Only the functions actually used by girk-sdk are implemented:
 * `extname`, `basename`, `dirname`, `join`, and `resolve`.
 *
 * These work on forward-slash paths only (no Windows backslash handling),
 * which is fine because girk always uses POSIX-style virtual paths.
 *
 * @module girk-sdk/path-utils
 */

/**
 * Return the file extension including the leading dot.
 *
 * @example
 * ```ts
 * extname("readme.md");   // ".md"
 * extname("file.test.js"); // ".js"
 * extname("noext");        // ""
 * ```
 */
export const extname = (path: string): string => {
  const base = path.split("/").pop() || "";
  const dotIndex = base.lastIndexOf(".");
  // Node returns "" if no dot, if dot is at position 0 (hidden file), or if only dot
  if (dotIndex <= 0) return "";
  return base.slice(dotIndex);
};

/**
 * Return the last portion of a path, optionally stripping a known extension.
 *
 * @example
 * ```ts
 * basename("/blog/post.md");       // "post.md"
 * basename("/blog/post.md", ".md"); // "post"
 * ```
 */
export const basename = (path: string, ext?: string): string => {
  // Strip trailing slashes
  const stripped = path.replace(/\/+$/, "");
  const last = stripped.split("/").pop() || "";
  if (ext && last.endsWith(ext)) {
    return last.slice(0, -ext.length);
  }
  return last;
};

/**
 * Return the directory portion of a path.
 *
 * @example
 * ```ts
 * dirname("/blog/post.md"); // "/blog"
 * dirname("post.md");        // ""
 * dirname("/");              // ""
 * ```
 */
export const dirname = (path: string): string => {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
};

/**
 * Join path segments, normalizing slashes.
 *
 * - Multiple consecutive slashes are collapsed to one.
 * - Trailing slashes are preserved from the last segment.
 * - Empty segments are ignored.
 *
 * @example
 * ```ts
 * join("/blog", "post.md");       // "/blog/post.md"
 * join("", "a", "b");             // "a/b"
 * join("/assets/", "/style/");     // "/assets/style/"
 * ```
 */
export const join = (...segments: string[]): string => {
  if (segments.length === 0) return ".";

  const joined = segments
    .filter((s) => s !== "")
    .map((s) => s.replace(/\\/g, "/"))
    .join("/")
    .replace(/\/+/g, "/");

  if (joined === "") return ".";

  return joined.startsWith("//") ? joined.slice(1) : joined;
};

/**
 * Resolve a sequence of paths to an absolute path.
 *
 * If a segment is absolute (starts with `/`), it becomes the new base.
 * Otherwise, it's joined onto the running base.
 *
 * Note: Unlike Node's `path.resolve`, this does NOT use `process.cwd()`
 * as the implicit starting point — it starts from `""`.
 *
 * @example
 * ```ts
 * resolve("/blog", "post.md");         // "/blog/post.md"
 * resolve("/blog", "../archive/a.md"); // "/archive/a.md"
 * resolve("/a", "/b", "c");             // "/b/c"
 * ```
 */
export const resolve = (...segments: string[]): string => {
  let resolved = "";

  for (const segment of segments) {
    const normalized = segment.replace(/\\/g, "/");
    if (normalized.startsWith("/")) {
      resolved = normalized;
    } else {
      resolved = resolved ? join(resolved, normalized) : normalized;
    }
  }

  // Normalize: collapse `..` and `.`
  const parts = resolved.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
    } else if (part !== ".") {
      stack.push(part);
    }
  }

  const result = "/" + stack.join("/");
  return result === "/" ? "/" : result;
};

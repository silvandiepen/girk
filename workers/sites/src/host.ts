import type { SiteKey } from "./host.model";

const docsHosts = new Set(["girk.dev", "www.girk.dev", "docs.girk.dev"]);
const localHosts = new Set(["localhost", "127.0.0.1"]);
const subdomainSites: Record<string, SiteKey> = {
  docs: "docs",
  "example-basic": "example-basic",
  "example-multilang": "example-multilang",
  "example-config": "example-config",
  "example-blog": "example-blog",
  "example-recipes": "example-recipes",
};

export const isSiteKey = (value: string | null): value is SiteKey =>
  value === "docs" ||
  value === "example-basic" ||
  value === "example-multilang" ||
  value === "example-config" ||
  value === "example-blog" ||
  value === "example-recipes";

export const getSiteKey = (hostname: string, searchParams = new URLSearchParams()): SiteKey | null => {
  const normalizedHost = hostname.split(":")[0].toLowerCase();
  const previewSite = searchParams.get("site");

  if (isSiteKey(previewSite)) {
    return previewSite;
  }

  if (docsHosts.has(normalizedHost) || localHosts.has(normalizedHost)) {
    return "docs";
  }

  if (!normalizedHost.endsWith(".girk.dev")) {
    return null;
  }

  const subdomain = normalizedHost.slice(0, -".girk.dev".length);
  return subdomainSites[subdomain] ?? null;
};

export const getAssetCandidates = (siteKey: SiteKey, pathname: string): string[] => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const hasExtension = normalizedPath.split("/").pop()?.includes(".") ?? false;
  const basePath = `/__sites/${siteKey}`;

  if (normalizedPath === "/") {
    return [`${basePath}/index.html`, `${basePath}/`];
  }

  if (normalizedPath.endsWith("/")) {
    return [`${basePath}${normalizedPath}index.html`, `${basePath}${normalizedPath}`];
  }

  if (hasExtension) {
    return [`${basePath}${normalizedPath}`];
  }

  return [`${basePath}${normalizedPath}/index.html`, `${basePath}${normalizedPath}`];
};

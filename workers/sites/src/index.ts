import { getAssetCandidates, getSiteKey } from "./host";
import type { SiteKey } from "./host.model";
import type { Env, WorkerHandler } from "./index.model";

const fetchSiteAsset = async (
  request: Request,
  env: Env,
  siteKey: SiteKey
): Promise<Response> => {
  const url = new URL(request.url);

  for (const candidate of getAssetCandidates(siteKey, url.pathname)) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = candidate;

    const response = await env.ASSETS.fetch(assetUrl);

    if (response.status !== 404) {
      return response;
    }
  }

  return new Response("Not Found", { status: 404 });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const siteKey = getSiteKey(url.hostname, url.searchParams);

    if (!siteKey) {
      return Response.redirect("https://girk.dev/", 302);
    }

    return fetchSiteAsset(request, env, siteKey);
  },
} satisfies WorkerHandler<Env>;

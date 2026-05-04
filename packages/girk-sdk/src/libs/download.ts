import fetch from "node-fetch";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "girky",
};

export interface DownloadResponse {
  body?: any;
  ok?: boolean;
  status?: number;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
  [index: string]: any;
}

export const getGist = async (id: string): Promise<string> => {
  const url = `https://api.github.com/gists/${id}`;

  try {
    const response: DownloadResponse = await fetch(url, {
      headers: GITHUB_HEADERS,
    });
    const res =
      typeof response.json === "function" ? await response.json() : undefined;
    const files = res?.files;
    const [file] =
      files && typeof files === "object" ? (Object.values(files) as any[]) : [];

    if (response.ok === false || !file) {
      const reason =
        typeof res?.message === "string"
          ? res.message
          : `GitHub API returned ${response.status ?? "an unknown error"}`;

      console.warn(`[girky] Failed to load gist ${id}: ${reason}`);

      return "";
    }

    if (typeof file.content === "string") {
      return file.content;
    }

    if (typeof file.raw_url !== "string") {
      console.warn(`[girky] Failed to load gist ${id}: missing gist file content`);

      return "";
    }

    const rawResponse: DownloadResponse = await fetch(file.raw_url, {
      headers: GITHUB_HEADERS,
    });

    if (rawResponse.ok === false || typeof rawResponse.text !== "function") {
      console.warn(`[girky] Failed to load gist ${id}: unable to fetch raw gist content`);

      return "";
    }

    return rawResponse.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown fetch error";

    console.warn(`[girky] Failed to load gist ${id}: ${reason}`);

    return "";
  }
};

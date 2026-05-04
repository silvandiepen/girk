import { dirname } from "path";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { createDir } from "@/libs/utils";

const GITHUB_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "girky",
};

export const download = async (
  url: string,
  destination: string
): Promise<void> => {
  const res = await fetch(url);
  await createDir(dirname(destination));
  if (!res.body) throw new Error(`No response body for ${url}`);
  const nodeStream = Readable.fromWeb(res.body as any);
  await new Promise<void>((resolve, reject) => {
    const fileStream = createWriteStream(destination);
    nodeStream.pipe(fileStream);
    nodeStream.on("error", reject);
    fileStream.on("finish", resolve);
  });
};

export const getGist = async (id: string): Promise<string> => {
  const url = `https://api.github.com/gists/${id}`;

  try {
    const response = await fetch(url, {
      headers: GITHUB_HEADERS,
    });
    const res = await response.json() as any;
    const files = res?.files;
    const [file] =
      files && typeof files === "object" ? (Object.values(files) as any[]) : [];

    if (!response.ok || !file) {
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

    const rawResponse = await fetch(file.raw_url, {
      headers: GITHUB_HEADERS,
    });

    if (!rawResponse.ok) {
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

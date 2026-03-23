import { afterEach, describe, expect, it, vi } from "vitest";
import fetch from "node-fetch";

import { getGist } from "@/libs/download";

vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

const fetchMock = vi.mocked(fetch);

describe("Gist downloads", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the inline content from the first gist file", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          "example.md": {
            content: "hello from gist",
          },
        },
      }),
    } as any);

    await expect(getGist("abc123")).resolves.toBe("hello from gist");
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/gists/abc123", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "girky",
      },
    });
  });

  it("falls back to the raw gist url when inline content is missing", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: {
            "example.md": {
              raw_url: "https://gist.githubusercontent.com/example/raw",
            },
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "hello from raw gist",
      } as any);

    await expect(getGist("abc123")).resolves.toBe("hello from raw gist");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://gist.githubusercontent.com/example/raw",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "girky",
        },
      }
    );
  });

  it("returns an empty string when the gist payload has no files", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Not Found",
      }),
    } as any);

    await expect(getGist("missing")).resolves.toBe("");
    expect(warnSpy).toHaveBeenCalledWith(
      "[girky] Failed to load gist missing: Not Found"
    );
  });

  it("returns an empty string when the gist request fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    fetchMock.mockRejectedValue(new Error("network unavailable"));

    await expect(getGist("offline")).resolves.toBe("");
    expect(warnSpy).toHaveBeenCalledWith(
      "[girky] Failed to load gist offline: network unavailable"
    );
  });
});

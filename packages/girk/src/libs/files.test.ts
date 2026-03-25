import { describe, expect, it } from "vitest";
import { isHomePath, makeLink } from "./files";

describe("Make Link", () => {
  it("Should return the right url from readme", () => {
    const input = "some/link/to/blabla/readme.md";
    const output = "some/link/to/blabla/index.html";

    const result = makeLink(input);

    expect(result).toStrictEqual(output);
  });
  it("Should return the right url from README", () => {
    const input = "some/link/to/blabla/README.md";
    const output = "some/link/to/blabla/index.html";
    const result = makeLink(input);

    expect(result).toStrictEqual(output);
  });
  it("Should return the right url from index", () => {
    const input = "some/link/to/blabla/index.md";
    const output = "some/link/to/blabla/index.html";
    const result = makeLink(input);

    expect(result).toStrictEqual(output);
  });
  it("Should return the right url from index", () => {
    const input = "some/link/to/blabla/some-test.md";
    const output = "some/link/to/blabla/some-test/index.html";
    const result = makeLink(input);

    expect(result).toStrictEqual(output);
  });
});

describe("isHomePath", () => {
  it("marks README and index files as home pages", () => {
    expect(isHomePath("/tmp/section/README.md")).toBe(true);
    expect(isHomePath("/tmp/section/readme.md")).toBe(true);
    expect(isHomePath("/tmp/section/index.md")).toBe(true);
    expect(isHomePath("/tmp/section/index:nl.md")).toBe(true);
  });

  it("does not mark non-home files as home pages", () => {
    expect(isHomePath("/tmp/section/my-readme-notes.md")).toBe(false);
    expect(isHomePath("/tmp/section/indexing.md")).toBe(false);
  });
});

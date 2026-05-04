import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";

function generateAttributes(md: MarkdownIt, token: Token) {
  const ignore = ["src", "alt"];
  const escape = ["title"];
  let attributes = "";

  token.attrs.forEach((entry: string[]) => {
    const name = entry[0];

    if (ignore.includes(name)) return;

    let value = "";

    if (escape.includes(name)) {
      value = md.utils.escapeHtml(entry[1]);
    } else {
      value = entry[1];
    }

    attributes += ` ${name}="${value}"`;
  });

  return attributes;
}

const generateClass = (className: string): string =>
  className ? ' class="' + className + '"' : "";

const isRemote = (url: string): boolean => {
  const pattern = /^https?:\/\//i;
  return pattern.test(url);
};

interface MITConfig {
  imgClass: string;
}

const svgImages = (md: MarkdownIt, config: MITConfig): void => {
  md.renderer.rules.image = (tokens: Token[], idx: number) => {
    const localConfig = { ...config };

    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    const url = token.attrs[srcIndex][1];
    const caption = md.utils.escapeHtml(token.content);

    const isSvg = url.indexOf(".svg") >= url.length - 5;

    const imgClass = generateClass(localConfig.imgClass);
    const otherAttributes = generateAttributes(md, token);

    if (!isSvg) {
      return `<img src="${url}" alt="${caption}" ${imgClass} ${otherAttributes}>`;
    } else {
      // In SDK mode, we don't read SVGs from the filesystem.
      // Return the image tag as-is for SVG files.
      return `<img src="${url}" alt="${caption}" ${imgClass} ${otherAttributes}>`;
    }
  };
};
export default svgImages;

import MarkdownIt from "markdown-it";

const ARTICLE_TOKEN = /^[a-z0-9-]+$/i;
const ARTICLE_ATTRIBUTE_PATTERN =
  /([a-zA-Z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;

export interface ArticleOptions {
  classes: string[];
  className: string;
  color: string;
  date: string;
  description: string;
  style: string;
  subtitle: string;
  title: string;
  type: string;
}

const normalizeValue = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeToken = (value: unknown): string => {
  const token = normalizeValue(value).toLowerCase();
  return ARTICLE_TOKEN.test(token) ? token : "";
};

const normalizeStyle = (value: unknown): string => {
  const style = normalizeValue(value);
  return style.endsWith(";") ? style.slice(0, -1) : style;
};

const humanizeToken = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const splitClasses = (value: string): string[] =>
  normalizeValue(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const parseArticleOptions = (input = ""): ArticleOptions => {
  const options: ArticleOptions = {
    classes: [],
    className: "",
    color: "",
    date: "",
    description: "",
    style: "",
    subtitle: "",
    title: "",
    type: "",
  };

  Array.from(input.matchAll(ARTICLE_ATTRIBUTE_PATTERN)).forEach((match) => {
    const key = match[1]?.toLowerCase();
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    const value = normalizeValue(rawValue);

    if (!rawValue) {
      options.classes.push(key);
      return;
    }

    switch (key) {
      case "class":
        options.classes.push(...splitClasses(value));
        break;
      case "color":
        options.color = normalizeToken(value);
        break;
      case "date":
        options.date = value;
        break;
      case "description":
        options.description = value;
        break;
      case "style":
        options.style = normalizeStyle(value);
        break;
      case "subtitle":
        options.subtitle = value;
        break;
      case "title":
        options.title = value;
        break;
      case "type":
        options.type = normalizeToken(value);
        break;
      default:
        break;
    }
  });

  options.className = options.classes.join(" ");

  return options;
};

export const buildArticleClassName = (options: ArticleOptions): string => {
  const classNames = ["article-block"];

  if (options.type) {
    classNames.push(`article-block--type-${options.type}`);
  }

  if (options.color) {
    classNames.push(`article-block--color-${options.color}`);
  }

  if (options.className) {
    classNames.push(...splitClasses(options.className));
  }

  return classNames.join(" ");
};

export const buildArticleStyle = (options: ArticleOptions): string => {
  const rules: string[] = [];
  const themeToken = options.type || options.color;

  if (themeToken) {
    rules.push(`--article-color: var(--color-${themeToken})`);
    rules.push(`--article-color-contrast: var(--color-${themeToken}-contrast)`);
  }

  if (options.style) {
    rules.push(options.style);
  }

  return rules.join("; ");
};

const renderArticleHeader = (md: MarkdownIt, options: ArticleOptions): string => {
  const metaItems: string[] = [];

  if (options.type) {
    metaItems.push(
      `<p class="article-block__type">${md.utils.escapeHtml(
        humanizeToken(options.type)
      )}</p>`
    );
  }

  if (options.subtitle) {
    metaItems.push(
      `<p class="article-block__subtitle">${md.utils.escapeHtml(
        options.subtitle
      )}</p>`
    );
  }

  if (options.date) {
    const escapedDate = md.utils.escapeHtml(options.date);
    metaItems.push(
      `<time class="article-block__date" datetime="${escapedDate}">${escapedDate}</time>`
    );
  }

  const headerContent: string[] = [];

  if (metaItems.length) {
    headerContent.push(
      `<div class="article-block__meta">${metaItems.join("")}</div>`
    );
  }

  if (options.title) {
    headerContent.push(
      `<h3 class="article-block__title">${md.utils.escapeHtml(options.title)}</h3>`
    );
  }

  if (options.description) {
    headerContent.push(
      `<p class="article-block__description">${md.utils.escapeHtml(
        options.description
      )}</p>`
    );
  }

  if (!headerContent.length) {
    return "";
  }

  return `<header class="article-block__header">${headerContent.join(
    ""
  )}</header>`;
};

export const renderArticle = (
  md: MarkdownIt,
  rawOptions: string,
  rawContent: string
): string => {
  const options = parseArticleOptions(rawOptions);
  const className = buildArticleClassName(options);
  const style = buildArticleStyle(options);
  const header = renderArticleHeader(md, options);
  const bodyContent = md.render(rawContent).trim();
  const styleAttribute = style ? ` style="${md.utils.escapeHtml(style)}"` : "";
  const body = bodyContent
    ? `<div class="article-block__content">\n${bodyContent}\n</div>`
    : "";

  return `<article class="${md.utils.escapeHtml(
    className
  )}"${styleAttribute}>\n${header}${body}\n</article>\n`;
};

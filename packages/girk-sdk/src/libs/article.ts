const ARTICLE_TOKEN = /^[a-z0-9-]+$/i;
const ARTICLE_ATTRIBUTE_PATTERN =
  /([a-zA-Z][\w-]*)(?:=(?:\"([^\"]*)\"|'([^']*)'|([^\s]+)))?/g;

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

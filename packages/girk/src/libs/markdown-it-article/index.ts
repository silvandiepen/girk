import MarkdownIt from "markdown-it";

import { renderArticle } from "@/libs/article";

const ARTICLE_OPEN_PATTERN = /^:{3,}\s*article(?:\s+(.+?))?\s*$/;
const ARTICLE_CLOSE_PATTERN = /^:{3,}\s*$/;

const articleBlock = (md: MarkdownIt): void => {
  md.block.ruler.before(
    "fence",
    "article",
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const marker = state.src.slice(start, max).trim();
      const openMatch = marker.match(ARTICLE_OPEN_PATTERN);

      if (!openMatch) {
        return false;
      }

      if (silent) {
        return true;
      }

      let nextLine = startLine + 1;

      while (nextLine < endLine) {
        const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
        const nextMax = state.eMarks[nextLine];
        const nextMarker = state.src.slice(nextStart, nextMax).trim();

        if (ARTICLE_CLOSE_PATTERN.test(nextMarker)) {
          break;
        }

        nextLine += 1;
      }

      if (nextLine >= endLine) {
        return false;
      }

      const className = openMatch[1]?.trim();
      const articleContent = state.getLines(startLine + 1, nextLine, 0, true);
      const articleMarkup = renderArticle(md, className || "", articleContent);

      const article = state.push("html_block", "", 0);
      article.block = true;
      article.map = [startLine, nextLine + 1];
      article.content = articleMarkup;

      state.line = nextLine + 1;

      return true;
    }
  );
};

export default articleBlock;

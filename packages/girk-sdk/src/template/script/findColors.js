// Show a swatch next to hex colours in page content. Works on text nodes only,
// so existing markup (links, highlighted code) is left intact.
const COLOR_PATTERN = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;

const decorateColors = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest("script, style, .color-preview")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const text = node.nodeValue || "";
    COLOR_PATTERN.lastIndex = 0;
    if (!COLOR_PATTERN.test(text)) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    text.replace(COLOR_PATTERN, (color, index) => {
      fragment.append(text.slice(lastIndex, index));
      const preview = document.createElement("span");
      preview.className = "color-preview";
      preview.style.setProperty("--color-preview", color);
      preview.textContent = color;
      fragment.append(preview);
      lastIndex = index + color.length;
      return color;
    });
    fragment.append(text.slice(lastIndex));
    node.replaceWith(fragment);
  });
};

document.querySelectorAll(".nizel-content").forEach(decorateColors);

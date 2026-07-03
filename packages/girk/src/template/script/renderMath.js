const initMath = async () => {
  const nodes = document.querySelectorAll(".math-inline, .math-display");
  if (!nodes.length) return;

  const ensureKatexStyles = () => {
    if (document.querySelector('link[data-girk-katex="true"]')) return;

    const link = document.createElement("link");
    link.dataset.girkKatex = "true";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css";
    document.head.appendChild(link);
  };

  try {
    ensureKatexStyles();
    const katex = await import("https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.mjs");

    nodes.forEach((node) => {
      katex.render(node.textContent || "", node, {
        displayMode: node.classList.contains("math-display"),
        throwOnError: false,
        trust: false,
      });
    });
  } catch (error) {
    console.warn("[girk] Failed to render math", error);
  }
};

initMath();

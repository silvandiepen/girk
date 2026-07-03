const initDiagrams = async () => {
  const nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length) return;

  try {
    const mermaid = await import("https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.esm.min.mjs");
    mermaid.default.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: document.documentElement.getAttribute("color-mode") === "dark" ? "dark" : "default",
    });
    await mermaid.default.run({ nodes });
  } catch (error) {
    console.warn("[girk] Failed to render diagrams", error);
  }
};

initDiagrams();

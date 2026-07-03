const initCodeCopy = () => {
  document.querySelectorAll("[data-nizel-code-copy]").forEach((container) => {
    const button = container.querySelector("[data-nizel-copy-button]");
    const source = container.getAttribute("data-nizel-copy-source");

    if (!button || !source) return;

    const originalLabel = button.textContent || "Copy";

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(source);
        button.textContent = "Copied";
        button.dataset.copyState = "copied";

        window.setTimeout(() => {
          button.textContent = originalLabel;
          delete button.dataset.copyState;
        }, 1800);
      } catch {
        button.textContent = "Failed";
        button.dataset.copyState = "error";
      }
    });
  });
};

initCodeCopy();

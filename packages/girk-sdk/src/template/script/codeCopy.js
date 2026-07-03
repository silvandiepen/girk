const initCodeCopy = () => {
  document.querySelectorAll("[data-nizel-code-copy]").forEach((container) => {
    const button = container.querySelector("[data-nizel-copy-button]");
    const sourceElement = container.querySelector("[data-nizel-copy-source]");
    const source =
      sourceElement?.value ||
      sourceElement?.textContent ||
      container.getAttribute("data-nizel-copy-source");

    if (!button || !source) return;

    const originalLabel = button.textContent || "Copy";

    button.addEventListener("click", async () => {
      try {
        await copyText(source);
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

const copyText = async (source) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(source);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = source;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) throw new Error("Copy command failed");
  } finally {
    textarea.remove();
  }
};

initCodeCopy();

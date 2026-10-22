// UI strings for the page language, rendered onto <body> by page.ejs.
const readUi = () => {
  try {
    return JSON.parse(document.body.dataset.girkUi || "{}");
  } catch {
    return {};
  }
};

const initCodeCopy = () => {
  const ui = readUi();

  document.querySelectorAll("[data-nizel-code-copy]").forEach((container) => {
    const button = container.querySelector("[data-nizel-copy-button]");
    const sourceElement = container.querySelector("[data-nizel-copy-source]");
    const source =
      sourceElement?.value ||
      sourceElement?.textContent ||
      container.getAttribute("data-nizel-copy-source");

    if (!button || !source) return;

    // Only the label changes, so the button keeps nizel's markup.
    const label = button.querySelector("[data-nizel-copy-label]") || button;
    if (ui.copy && label !== button) label.textContent = ui.copy;
    const originalLabel = label.textContent || "Copy";
    const language = container
      .querySelector("code[class*='language-']")
      ?.className.match(/language-(\S+)/)?.[1];
    button.setAttribute(
      "aria-label",
      language
        ? (ui.copyLanguageCode || "Copy {language} code").replace("{language}", language)
        : ui.copyCode || "Copy code",
    );

    button.addEventListener("click", async () => {
      try {
        await copyText(source);
        label.textContent = ui.copied || "Copied";
        button.dataset.copyState = "copied";
        announce(ui.copiedAnnouncement || "Copied to clipboard");

        window.setTimeout(() => {
          label.textContent = originalLabel;
          delete button.dataset.copyState;
        }, 1800);
      } catch {
        label.textContent = ui.copyFailed || "Failed";
        button.dataset.copyState = "error";
        announce(ui.copyFailedAnnouncement || "Copy failed");
      }
    });
  });
};

const announce = (message) => {
  let status = document.querySelector("[data-copy-status]");
  if (!status) {
    status = document.createElement("p");
    status.className = "visually-hidden";
    status.setAttribute("role", "status");
    status.dataset.copyStatus = "";
    document.body.appendChild(status);
  }
  status.textContent = "";
  window.requestAnimationFrame(() => {
    status.textContent = message;
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

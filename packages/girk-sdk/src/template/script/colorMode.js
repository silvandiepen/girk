const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

const currentMode = () =>
  document.documentElement.getAttribute("color-mode") || (systemDark.matches ? "dark" : "light");

const updateColorModeToggle = () => {
  const toggle = document.querySelector("[data-color-mode-toggle]");
  if (!toggle) return;

  const mode = currentMode();
  toggle.dataset.colorMode = mode;
  toggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
};

const saveMode = (mode) => {
  try {
    localStorage.setItem("colorMode", mode);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
};

// Only an explicit choice is stored, so the system preference keeps applying until then.
const switchMode = () => {
  const mode = currentMode() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("color-mode", mode);
  saveMode(mode);
  updateColorModeToggle();
};

const bindColorModeToggle = () => {
  const toggle = document.querySelector("[data-color-mode-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", switchMode);
};

systemDark.addEventListener("change", updateColorModeToggle);
updateColorModeToggle();
bindColorModeToggle();

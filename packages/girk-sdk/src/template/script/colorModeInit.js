// Runs in <head> so a stored choice applies before first paint. Without one,
// color-mode stays unset and the prefers-color-scheme rules decide.
try {
  const storedMode = localStorage.getItem("colorMode");
  if (storedMode === "dark" || storedMode === "light")
    document.documentElement.setAttribute("color-mode", storedMode);
} catch {
  // Storage can be blocked; the system preference still applies.
}

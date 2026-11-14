(() => {
  const root = document.documentElement;
  const key = "calculator_theme";
  const system = matchMedia("(prefers-color-scheme: dark)");
  let preference;

  function readTheme() {
    try { preference = localStorage.getItem(key); } catch { /* Retain the choice for this page. */ }
    applyTheme();
  }

  function applyTheme() {
    const dark = preference === "dark" || (preference !== "light" && system.matches);
    root.dataset.theme = dark ? "dark" : "light";
    const button = document.getElementById("theme");
    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Açık temaya geç" : "Koyu temaya geç";
    }
  }

  // Set the palette and starting width before the header is painted.
  readTheme();
  if (document.referrer && matchMedia("(prefers-reduced-motion: no-preference)").matches &&
      performance.getEntriesByType("navigation")[0]?.type === "navigate") {
    const previous = new URL(document.referrer);
    const fromCalculator = ["/", "/index", "/index.html"].includes(previous.pathname);
    const fromSales = ["/satislar", "/satislar/", "/satislar.html"].includes(previous.pathname);
    if (previous.origin === location.origin &&
        ((root.dataset.page === "sales" && fromCalculator) ||
         (root.dataset.page === "calculator" && fromSales))) root.dataset.navArrival = "";
  }
  document.addEventListener("animationend", event => {
    if (event.animationName === "nav-arrival") delete root.dataset.navArrival;
  });
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    document.getElementById("theme").addEventListener("click", () => {
      preference = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme();
      try { localStorage.setItem(key, preference); } catch { /* The current page still updates. */ }
    });
  });
  system.addEventListener("change", applyTheme);
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) readTheme();
  });
  window.addEventListener("pageshow", readTheme);
})();

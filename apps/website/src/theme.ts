export type Theme = "light" | "dark";

const STORAGE_KEY = "safe-stake-theme";

/**
 * Initial theme: an explicit stored choice if present, otherwise the user's OS
 * preference, otherwise light.
 */
export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

/** Reflect the theme on <html> — drives the CSS variables + `color-scheme`. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** Persist an explicit user choice (so it wins over the OS preference next visit). */
export function storeTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
}

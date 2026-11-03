import { store } from "olum";

// The StackBlitz VM handle. A class instance, so it lives outside the store
// (stores only track plain data).
let vm = null;

/**
 * Shared UI state — replaces the React ThemeProvider context.
 * Read by ThemeToggle (theme) and Loader (ready); the component that owns the
 * embed never reads it, so it never re-renders and the iframe is never patched away.
 */
export const sandbox = store({
  // The pre-paint script in public/index.html already applied the saved theme.
  theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  ready: false,

  toggleTheme() {
    const next = this.theme === "dark" ? "light" : "dark";
    this.theme = next;
    try {
      localStorage.setItem("olum-theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
    // Keep the embed's editor theme in sync with the site theme.
    if (vm) vm.editor.setTheme(next).catch(() => {});
  },
});

/** Hand the embed's VM over once it has booted (null on unmount). */
export function attachVm(next) {
  vm = next;
  if (vm) vm.editor.setTheme(sandbox.theme).catch(() => {});
}

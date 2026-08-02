"use client";
import { useEffect, useRef, useState } from "react";
import sdk, { type VM } from "@stackblitz/sdk";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteConfig } from "@/lib/site-config";

/**
 * The GitHub repo StackBlitz imports and runs live — `owner/repo/tree/branch`,
 * i.e. https://github.com/olumjs/olum-starter/tree/code. Not a StackBlitz-hosted
 * project; the embed clones this repo into WebContainers.
 */
const STARTER_REPO_SLUG = "olumjs/olum-starter/tree/code";

/** Tab the editor opens on — the starter's entry component. */
const ENTRY_FILE = "src/page.html";

export default function Playground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const vmRef = useRef<VM | null>(null);
  const { theme } = useTheme(); // site theme, drives the embed theme
  const [ready, setReady] = useState(false);

  // Embed the project once. The VM handle lets us drive the editor afterwards
  // without reloading the iframe.
  useEffect(() => {
    // WebContainers needs SharedArrayBuffer, which requires the document to be
    // cross-origin isolated (COOP/COEP headers, set in next.config). If the
    // document somehow loaded without isolation, `crossOriginIsolated` is false
    // and the embed fails silently — force one full reload of the current URL to
    // pick up the headers. The sessionStorage guard ensures we never reload more
    // than once if isolation still can't be had.
    const RELOAD_KEY = "pg-reload-for-coi";
    if (window.crossOriginIsolated) {
      sessionStorage.removeItem(RELOAD_KEY);
    } else if (!sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    // The SDK replaces the element it's given with the iframe, so embed into a
    // throwaway child of the stable host (also makes the effect safe to re-run
    // under React Strict Mode).
    const target = document.createElement("div");
    host.replaceChildren(target);

    // Read the applied theme from the DOM (set before paint) so the initial
    // embed matches even before the ThemeProvider's own effect has run. Live
    // changes are handled by the reactive effect below.
    const embedTheme =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

    sdk
      .embedGithubProject(target, STARTER_REPO_SLUG, {
        forceEmbedLayout: true,
        openFile: ENTRY_FILE,
        view: "default",
        theme: embedTheme,
        hideNavigation: true,
        // The file explorer is how you reach the rest of the starter, so keep it.
        hideExplorer: false,
        hideDevTools: true,
        terminalHeight: 0, // minimize the terminal
        height: "100%",
        crossOriginIsolated: true,
      })
      .then((vm) => {
        if (cancelled) return;
        vmRef.current = vm;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      vmRef.current = null;
      host.replaceChildren();
    };
  }, []);

  // Keep the embed's editor theme in sync with the site theme. Runs once the VM
  // is ready and again whenever the user toggles the theme.
  useEffect(() => {
    if (!ready) return;
    vmRef.current?.editor.setTheme(theme).catch(() => {});
  }, [theme, ready]);

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      {/* Branded toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#25C97E] shadow-[0_0_8px_rgba(37,201,126,0.7)]" />
          <span
            className="text-sm font-bold text-[var(--fg)]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Playground
          </span>
          <span className="hidden sm:inline truncate font-mono text-xs text-[var(--fg-subtle)]">
            olumjs/olum-starter
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <a
            href={siteConfig.github}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(37,201,126,0.2)] bg-[rgba(37,201,126,0.08)] px-3 py-1.5 text-xs font-mono font-semibold text-[#25C97E] transition-colors hover:bg-[rgba(37,201,126,0.14)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>

      {/* Editor + preview */}
      <div className="relative min-h-0 flex-1">
        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[var(--bg)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[#25C97E]" />
            <p className="text-xs font-mono text-[var(--fg-subtle)]">Booting the playground…</p>
          </div>
        )}
        <div
          ref={hostRef}
          className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
        />
      </div>
    </div>
  );
}

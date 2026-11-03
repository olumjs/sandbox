/*
 * Cross-origin isolation service worker.
 *
 * The StackBlitz embed runs on WebContainers, which needs SharedArrayBuffer, which
 * needs the page to be cross-origin isolated (COOP + COEP headers). GitHub Pages
 * and the olum dev server can't send those headers, so this worker adds them to
 * page navigations. COEP `credentialless` lets the cross-origin StackBlitz iframe
 * and Google Fonts load without CORP opt-in.
 *
 * Registered from public/index.html. When the host already sends the headers the
 * page is isolated on first load and this worker is never registered.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Only the document's own headers decide isolation; leave every other request alone.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).then((res) => {
      // Redirects / opaque responses can't be rebuilt — pass them through.
      if (res.status === 0 || res.type === "opaqueredirect") return res;

      const headers = new Headers(res.headers);
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Embedder-Policy", "credentialless");
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }),
  );
});

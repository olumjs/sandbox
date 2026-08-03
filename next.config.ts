import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // The StackBlitz embed is a WebContainers project, which relies on
    // SharedArrayBuffer and therefore requires the embedding page to be
    // cross-origin isolated. The sandbox is the whole site, so apply the
    // headers everywhere. COEP `credentialless` lets the cross-origin
    // StackBlitz iframe load without needing CORP opt-in.
    const isolation = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ];
    return [{ source: "/:path*", headers: isolation }];
  },
};

export default nextConfig;

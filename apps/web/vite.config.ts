import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";
  const basePattern = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return {
    base,
    plugins: [react(), VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/feed.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: base,
        name: "BNUZ Feed · 校园信息",
        short_name: "BNUZ Feed",
        description: "北师大珠海校区的通知、新闻和活动，一处读完。",
        lang: "zh-CN",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#fafaf7",
        theme_color: "#fafaf7",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        cacheId: "bnuz-feed",
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "index.html",
        navigateFallbackAllowlist: [new RegExp(`^${basePattern}(?:index\\.html)?$`)],
        runtimeCaching: [{
          urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/data\/(?:feed-snapshot|source-health)\.json$/.test(url.pathname),
          handler: "NetworkFirst",
          options: {
            cacheName: `bnuz-feed-data:${base}`,
            networkTimeoutSeconds: 3,
            cacheableResponse: { statuses: [200] },
            expiration: { maxEntries: 2 },
          },
        }],
      },
    })],
  };
});

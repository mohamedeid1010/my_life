import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    // ── Chunk Splitting for Performance ──
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase SDK into its own chunk (~400KB → loaded only when needed)
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Split React core into vendor chunk (stable, cacheable)
          vendor: ['react', 'react-dom'],
          // Split icons library
          icons: ['lucide-react'],
        },
      },
    },
    // Suppress chunk size warning since we're manually splitting
    chunkSizeWarningLimit: 300,
    // Optimize CSS
    cssMinify: true,
    // Minify with terser for smaller output
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
  },
});

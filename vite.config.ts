import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Mobile-first perf: smaller initial JS, modern syntax, no sourcemaps
      target: 'es2020',
      minify: 'esbuild' as const,
      sourcemap: false,
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // inline only tiny icons; images stay as files
      chunkSizeWarningLimit: 250, // warn early — initial chunk must stay small for 4G
      modulePreload: { polyfill: false }, // modern mobile browsers support modulepreload
      rollupOptions: {
        output: {
          // Route-level splitting: admin + checkout + product load on demand only
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

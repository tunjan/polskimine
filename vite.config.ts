import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      '__APP_VERSION__': JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                        'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-switch',
              '@radix-ui/react-slider',
              '@radix-ui/react-progress',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-toggle',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
            ],
                        'vendor-charts': ['recharts'],
                        'vendor-db': ['dexie', 'dexie-react-hooks', 'idb'],
                        'vendor-motion': ['framer-motion'],
                        'vendor-icons': ['lucide-react'],
                        'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
                        'vendor-srs': ['ts-fsrs'],
                        'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'uuid'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/vitest.setup.ts',
      coverage: {
        reporter: ['text', 'lcov'],
        include: [
          'src/services/**/*.ts',
          'src/components/**/*.tsx',
          'src/contexts/**/*.tsx',
          'src/routes/**/*.tsx'
        ]
      }
    }
  };
});
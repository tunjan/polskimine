import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        '__APP_VERSION__': JSON.stringify(version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        coverage: {
          reporter: ['text', 'lcov'],
          include: [
            'services/**/*.ts',
            'components/**/*.tsx',
            'contexts/**/*.tsx',
            'routes/**/*.tsx'
          ]
        }
      }
    };
});

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * Dev-only AI middleware: /api/ai/ask, /api/ai/explain, /api/ai/summarize, /api/ai/recommend
 * Runs `mmx text chat` server-side so the browser doesn't need direct access to the LLM.
 */
function aiMiddleware(): Plugin {
  return {
    name: 'maobible-ai-middleware',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        const body = await readBody(req);
        const { prompt, system } = JSON.parse(body) as { prompt: string; system: string };
        const text = await runMmx(prompt, system);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ text }));
      });
    },
  };
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c: Buffer) => (data += c.toString('utf8')));
    req.on('end', () => resolve(data));
  });
}

function runMmx(prompt: string, system: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(
      'mmx',
      [
        'text', 'chat',
        '--model', 'MiniMax-M2.7-highspeed',
        '--system', system,
        '--message', prompt,
        '--max-tokens', '1024',
        '--quiet',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => proc.kill(), 30_000);
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')));
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && stdout.trim()) resolve(stdout.trim());
      else resolve(`抱歉, AI 暂时不可用 (mmx exit ${code}: ${stderr.slice(0, 100)})`);
    });
    proc.on('error', () => resolve('抱歉, AI 暂时不可用'));
  });
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    aiMiddleware(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MaoBible',
        short_name: 'MaoBible',
        description: 'A quiet, multi-language reader for Selected Works of Mao Zedong.',
        theme_color: '#1D8C80',
        background_color: '#F4F1EA',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Article JSON content — cache-first so reads are instant offline
            urlPattern: ({ url }) => url.pathname.startsWith('/content/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'maobible-content',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google Fonts CSS
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'maobible-gfonts' },
          },
          {
            // Google Fonts woff2 files
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'maobible-gfonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { pathToFileURL } from 'url';
import path from 'path';

// 로컬에서 /api/notify 를 Vercel 함수처럼 실행하는 플러그인
function localNotifyPlugin(env) {
  return {
    name: 'local-notify',
    configureServer(server) {
      server.middlewares.use('/api/notify', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
          return res.end();
        }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            // 환경변수 주입
            Object.assign(process.env, {
              SLACK_WEBHOOK_URL: env.SLACK_WEBHOOK_URL,
              GMAIL_USER: env.GMAIL_USER,
              GMAIL_CLIENT_ID: env.GMAIL_CLIENT_ID,
              GMAIL_CLIENT_SECRET: env.GMAIL_CLIENT_SECRET,
              GMAIL_REFRESH_TOKEN: env.GMAIL_REFRESH_TOKEN,
              GMAIL_TO: env.GMAIL_TO,
            });
            const notifyUrl = pathToFileURL(path.resolve('./api/notify.js')).href + '?t=' + Date.now();
            const { default: handler } = await import(notifyUrl);
            await handler(
              { method: 'POST', body: data },
              {
                setHeader: () => {},
                status: (code) => ({ json: (v) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(v)); } }),
              }
            );
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8766';

  return {
    plugins: [react(), localNotifyPlugin(env)],
    server: {
      port: 5173,
      proxy: {
        '/api/notify': false, // 로컬 미들웨어에서 처리
        '/api': { target: apiTarget, changeOrigin: true, ws: true },
        '/auth': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});

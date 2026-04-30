import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const apiTarget = env.VITE_API_BASE_URL || 'https://api.stepd.co.kr';

  return {
    plugins: [react()],
    root: '.',
    server: {
      port: 5174,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
  };
});

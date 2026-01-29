import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    // CHANGE THIS: Match your Express server port (usually 5000 or 8000)
    const BACKEND_URL = env.BACKEND_URL || 'http://localhost:5000'; 

    return {
      define: {
        'process.env': {}
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        // --- ADD THIS SECTION ---
        proxy: {
            '/api': {
                target: BACKEND_URL,
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: BACKEND_URL,
                changeOrigin: true,
                secure: false,
            }
        }
        // ------------------------
      },
      plugins: [
        react({
          babel: {
            plugins: [
              ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
            ],
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
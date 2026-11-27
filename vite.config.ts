import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleCustomersApiRequest } from './server/customersApi.js';

function customersDbApiPlugin(): Plugin {
  return {
    name: 'top-laptop-customers-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url || '').startsWith('/api/customers')) {
          handleCustomersApiRequest(req, res, process.cwd()).catch(next);
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    customersDbApiPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/data/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
});

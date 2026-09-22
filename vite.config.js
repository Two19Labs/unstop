import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function devApiPlugin() {
  const handler = async (req, res) => {
    try {
      const { fetchCompetitionsFromUnstop } = await import('./api/competitions.js');
      const data = await fetchCompetitionsFromUnstop();
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, count: data.length, data }));
    } catch (err) {
      console.error('Error fetching live Unstop competitions:', err.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  };

  return {
    name: 'dev-api-competitions',
    configureServer(server) {
      server.middlewares.use('/api/competitions', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/competitions', handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/posthog-js')) {
            return 'vendor-posthog';
          }
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function devApiPlugin() {
  const compHandler = async (req, res) => {
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

  const roundsHandler = async (req, res) => {
    try {
      const { fetchRoundsForMultipleCompetitions } = await import('./api/rounds.js');
      const url = new URL(req.url, 'http://localhost');
      const rawIds = url.searchParams.get('ids') || url.searchParams.get('id') || '';
      const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean);

      if (ids.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'Missing required "ids" query parameter' }));
      }

      const data = await fetchRoundsForMultipleCompetitions(ids);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, count: Object.keys(data).length, data }));
    } catch (err) {
      console.error('Error fetching rounds in dev:', err.message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  };

  return {
    name: 'dev-api-competitions',
    configureServer(server) {
      server.middlewares.use('/api/competitions', compHandler);
      server.middlewares.use('/api/rounds', roundsHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/competitions', compHandler);
      server.middlewares.use('/api/rounds', roundsHandler);
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
          if (id.includes('data/colleges.js') || id.includes('data/colleges')) {
            return 'colleges-data';
          }
        },
      },
    },
  },
});

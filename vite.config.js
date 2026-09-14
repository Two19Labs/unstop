import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function devApiPlugin() {
  return {
    name: 'dev-api-competitions',
    configureServer(server) {
      server.middlewares.use('/api/competitions', async (req, res) => {
        try {
          const { fetchCompetitionsFromUnstop } = await import('./api/competitions.js');
          const data = await fetchCompetitionsFromUnstop();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, count: data.length, data }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
});

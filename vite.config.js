import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function saveCollidersPlugin() {
  return {
    name: 'save-colliders',
    configureServer(server) {
      server.middlewares.use('/api/save-colliders', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
          const outPath = path.resolve(process.cwd(), 'public/assets/maps/mainmap/colliders.json');
          fs.writeFileSync(outPath, body, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveCollidersPlugin()],
})

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Enable CORS and handle OPTIONS preflight requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API endpoint to proxy Google Sheets CSV fetching server-side (bypasses browser CORS)
  app.post('/api/fetch-sheets', async (req, res) => {
    try {
      const { url, sheetName } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL da planilha é obrigatória' });
        return;
      }

      const match = url.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9_.-]+)/);
      if (!match || !match[1]) {
        res.status(400).json({ error: 'Link do Google Sheets inválido' });
        return;
      }

      const sheetId = match[1];
      const gidMatch = url.match(/[?&]gid=(\d+)/) || url.match(/#gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : null;

      const candidates: string[] = [];

      // 1. If tab name specified
      if (sheetName && typeof sheetName === 'string' && sheetName.trim()) {
        const encName = encodeURIComponent(sheetName.trim());
        candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encName}`);
        candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encName}`);
      }

      // 2. If GID in URL
      if (gid) {
        candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
      }

      // 3. Fallbacks
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);

      let csvContent = '';
      let errorMsg = '';

      for (const targetUrl of candidates) {
        try {
          const resp = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (resp.ok) {
            const txt = await resp.text();
            if (txt && !txt.includes('<!DOCTYPE html>') && txt.trim().length > 0) {
              csvContent = txt;
              break;
            }
          }
        } catch (e: any) {
          errorMsg = e.message;
        }
      }

      if (!csvContent) {
        res.status(400).json({
          error: 'Não foi possível ler a planilha. Garanta que ela esteja compartilhada como "Qualquer pessoa com o link pode ver".'
        });
        return;
      }

      res.json({ csv: csvContent });
    } catch (err: any) {
      console.error('Error fetching sheet:', err);
      res.status(500).json({ error: err.message || 'Erro interno no servidor' });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

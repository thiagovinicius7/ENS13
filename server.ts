import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
const REFLEXOES_FILE = path.join(DATA_DIR, 'reflexoes.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readReflexoesFromFile(): any[] {
  ensureDataDir();
  if (!fs.existsSync(REFLEXOES_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(REFLEXOES_FILE, 'utf-8');
    const parsed = JSON.parse(content || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading reflexoes.json:', err);
    return [];
  }
}

function writeReflexoesToFile(list: any[]) {
  ensureDataDir();
  const tempFile = `${REFLEXOES_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tempFile, REFLEXOES_FILE);
}

// Background sync to Firestore when possible
let firestoreDb: any = null;
function getFirestoreDb() {
  if (!firestoreDb) {
    try {
      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore } = require('firebase/firestore');
      const firebaseConfig = require('./firebase-applet-config.json');
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      console.warn('Could not initialize Firebase in server for sync:', e);
    }
  }
  return firestoreDb;
}

async function trySyncDocToFirestore(item: any) {
  try {
    const db = getFirestoreDb();
    if (!db) return false;
    const { collection, addDoc } = require('firebase/firestore');
    const { id, pendingFirestoreSync, firestoreId, ...payload } = item;
    const docRef = await addDoc(collection(db, 'reflexoes'), payload);
    console.log(`[Sync] Reflexao synced to Firestore: ${docRef.id}`);
    return docRef.id;
  } catch (err: any) {
    console.warn('[Sync] Firestore write deferred (local copy intact):', err?.message || err);
    return false;
  }
}

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

  // REST endpoints for reflexoes - guaranteed fast, reliable persistence
  app.get('/api/reflexoes', (req, res) => {
    try {
      const list = readReflexoesFromFile();
      res.json(list);
    } catch (err: any) {
      console.error('Error GET /api/reflexoes:', err);
      res.status(500).json({ error: 'Erro ao buscar reflexões' });
    }
  });

  app.post('/api/reflexoes', async (req, res) => {
    try {
      const { coupleName, theme, year, answers, createdAt } = req.body;
      if (!coupleName || theme === undefined || !year || !answers || !Array.isArray(answers)) {
        res.status(400).json({ error: 'Dados incompletos para a reflexão' });
        return;
      }

      const cleanAnswers = answers
        .map((a: any) => String(a || '').trim())
        .filter((a: string) => a.length > 0);

      if (cleanAnswers.length === 0) {
        res.status(400).json({ error: 'Ao menos uma resposta deve ser preenchida' });
        return;
      }

      const list = readReflexoesFromFile();
      const existingIndex = list.findIndex(
        (r: any) =>
          r.coupleName?.toLowerCase().trim() === String(coupleName).toLowerCase().trim() &&
          String(r.theme).trim() === String(theme).trim() &&
          Number(r.year) === Number(year)
      );

      const docId =
        existingIndex >= 0 && list[existingIndex].id
          ? list[existingIndex].id
          : 'serv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const newRecord = {
        id: docId,
        coupleName: String(coupleName).trim(),
        theme: String(theme).trim(),
        year: Number(year),
        answers: cleanAnswers,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pendingFirestoreSync: true
      };

      if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], ...newRecord };
      } else {
        list.push(newRecord);
      }

      writeReflexoesToFile(list);

      // Return immediately so client gets sub-50ms response!
      res.status(200).json({
        success: true,
        id: docId,
        message: 'Reflexão salva com sucesso!',
        record: newRecord
      });

      // Background attempt to write to Firestore
      trySyncDocToFirestore(newRecord)
        .then(fsId => {
          if (fsId) {
            const currentList = readReflexoesFromFile();
            const idx = currentList.findIndex((r: any) => r.id === docId);
            if (idx >= 0) {
              currentList[idx].pendingFirestoreSync = false;
              currentList[idx].firestoreId = fsId;
              writeReflexoesToFile(currentList);
            }
          }
        })
        .catch(() => {});
    } catch (err: any) {
      console.error('Error POST /api/reflexoes:', err);
      res.status(500).json({ error: err.message || 'Erro ao salvar reflexão' });
    }
  });

  app.put('/api/reflexoes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { answers, coupleName, theme, year } = req.body;
      const list = readReflexoesFromFile();
      const idx = list.findIndex((r: any) => r.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'Reflexão não encontrada' });
        return;
      }

      if (answers && Array.isArray(answers)) {
        list[idx].answers = answers
          .map((a: any) => String(a || '').trim())
          .filter((a: string) => a.length > 0);
      }
      if (coupleName) list[idx].coupleName = String(coupleName).trim();
      if (theme !== undefined) list[idx].theme = String(theme).trim();
      if (year) list[idx].year = Number(year);
      list[idx].updatedAt = new Date().toISOString();

      writeReflexoesToFile(list);
      res.json({ success: true, record: list[idx] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/reflexoes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const list = readReflexoesFromFile();
      const updated = list.filter((r: any) => r.id !== id);
      writeReflexoesToFile(updated);
      res.json({ success: true, message: 'Reflexão excluída com sucesso' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

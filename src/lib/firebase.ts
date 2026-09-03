import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocFromServer,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Reuniao,
  Evento,
  Aniversario,
  CasalMes,
  CardapioItem,
  Reflexao,
  EmailContact,
  EmailLog,
  MembroEquipe,
  ConselheiroEspiritual,
  TemaAno
} from '../types';
import {
  INITIAL_MEMBROS_EQUIPE,
  INITIAL_REUNIOES,
  INITIAL_EVENTOS,
  INITIAL_ANIVERSARIOS,
  INITIAL_CASAIS_MES,
  INITIAL_CARDAPIO,
  INITIAL_EMAILS_LIST,
  INITIAL_CONSELHEIRO
} from '../data/initialData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity check
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore offline connection check:', error.message);
    }
  }
}

// Wipe all data from all collections in Firestore
export async function wipeAllDatabaseData() {
  try {
    console.log('Wiping all collections in Firestore...');
    const collectionsToClear = ['reunioes', 'eventos', 'aniversarios', 'casaisMes', 'cardapio', 'emails', 'reflexoes', 'emailLogs'];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
    }

    console.log('All collections wiped successfully!');
    return { success: true, message: 'Todos os dados do banco foram apagados com sucesso!' };
  } catch (err: any) {
    console.error('Error wiping database:', err);
    return { success: false, message: 'Erro ao apagar dados: ' + (err.message || String(err)) };
  }
}

// Force re-seed / overwrite database with full spreadsheet data
export async function forceReseedAllData() {
  try {
    console.log('Force re-seeding all collections in Firestore...');
    const collectionsToClear = ['reunioes', 'eventos', 'aniversarios', 'casaisMes', 'cardapio', 'emails'];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
    }

    for (const r of INITIAL_REUNIOES) {
      await addDoc(collection(db, 'reunioes'), r);
    }
    for (const e of INITIAL_EVENTOS) {
      await addDoc(collection(db, 'eventos'), e);
    }
    for (const a of INITIAL_ANIVERSARIOS) {
      await addDoc(collection(db, 'aniversarios'), a);
    }
    for (const c of INITIAL_CASAIS_MES) {
      await addDoc(collection(db, 'casaisMes'), c);
    }
    for (const item of INITIAL_CARDAPIO) {
      await addDoc(collection(db, 'cardapio'), item);
    }
    for (const em of INITIAL_EMAILS_LIST) {
      await addDoc(collection(db, 'emails'), {
        email: em.email,
        casal: em.casal,
        createdAt: new Date().toISOString()
      });
    }

    console.log('Force re-seed finished successfully!');
    return { success: true, message: 'Dados completos da planilha reimportados com sucesso!' };
  } catch (err) {
    console.error('Error during force re-seed:', err);
    return { success: false, message: 'Erro ao reimportar dados da planilha.' };
  }
}

// Seed or sync initial data in Firestore
export async function seedInitialDataIfNeeded() {
  try {
    const sysRef = doc(db, '_system', 'initialized');
    const sysSnap = await getDoc(sysRef);
    if (sysSnap.exists()) {
      // Clean up invalid legacy conselheiro entries if present
      const snap = await getDocs(collection(db, 'membros'));
      for (const d of snap.docs) {
        const data = d.data();
        if (
          data.casal?.toLowerCase().includes('conselheiro') ||
          data.casal?.toLowerCase().includes('acompanhante') ||
          data.funcao?.toLowerCase().includes('conselheiro')
        ) {
          await deleteDoc(doc(db, 'membros', d.id));
        }
      }
      return;
    }

    const snap = await getDocs(collection(db, 'membros'));
    if (snap.empty) {
      console.log('Seeding initial membros to Firestore...');
      for (const m of INITIAL_MEMBROS_EQUIPE) {
        await addDoc(collection(db, 'membros'), m);
      }
    }

    // Seed/sync aniversarios
    const snapAniv = await getDocs(collection(db, 'aniversarios'));
    if (snapAniv.empty) {
      console.log('Seeding initial aniversarios to Firestore...');
      for (const a of INITIAL_ANIVERSARIOS) {
        await addDoc(collection(db, 'aniversarios'), a);
      }
    }

    // Seed/sync reunioes
    const snapReu = await getDocs(collection(db, 'reunioes'));
    if (snapReu.empty) {
      console.log('Seeding initial reunioes to Firestore...');
      for (const r of INITIAL_REUNIOES) {
        await addDoc(collection(db, 'reunioes'), r);
      }
    }

    // Seed/sync eventos
    const snapEve = await getDocs(collection(db, 'eventos'));
    if (snapEve.empty) {
      console.log('Seeding initial eventos to Firestore...');
      for (const e of INITIAL_EVENTOS) {
        await addDoc(collection(db, 'eventos'), e);
      }
    }

    // Seed/sync casaisMes
    const snapCasais = await getDocs(collection(db, 'casaisMes'));
    if (snapCasais.empty) {
      console.log('Seeding initial casaisMes to Firestore...');
      for (const c of INITIAL_CASAIS_MES) {
        await addDoc(collection(db, 'casaisMes'), c);
      }
    }

    // Seed/sync emails
    const snapEmails = await getDocs(collection(db, 'emails'));
    if (snapEmails.empty) {
      console.log('Seeding initial emails to Firestore...');
      for (const em of INITIAL_EMAILS_LIST) {
        await addDoc(collection(db, 'emails'), {
          email: em.email,
          casal: em.casal,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Seed/sync cardapio
    const snapCardapio = await getDocs(collection(db, 'cardapio'));
    if (snapCardapio.empty) {
      console.log('Seeding initial cardapio to Firestore...');
      for (const item of INITIAL_CARDAPIO) {
        await addDoc(collection(db, 'cardapio'), item);
      }
    }

    await setDoc(sysRef, { seeded: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.warn('Could not seed initial data:', err);
  }
}

// Data Fetching API
export async function fetchReunioes(): Promise<Reuniao[]> {
  try {
    const snap = await getDocs(collection(db, 'reunioes'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reuniao));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reunioes');
    return [];
  }
}

export async function fetchEventos(): Promise<Evento[]> {
  try {
    const snap = await getDocs(collection(db, 'eventos'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Evento));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'eventos');
    return [];
  }
}

export async function fetchAniversarios(): Promise<Aniversario[]> {
  try {
    const snap = await getDocs(collection(db, 'aniversarios'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Aniversario));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'aniversarios');
    return [];
  }
}

export async function fetchCasaisMes(): Promise<CasalMes[]> {
  try {
    const snap = await getDocs(collection(db, 'casaisMes'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CasalMes));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'casaisMes');
    return [];
  }
}

export async function fetchCardapio(): Promise<CardapioItem[]> {
  try {
    const snap = await getDocs(collection(db, 'cardapio'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CardapioItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'cardapio');
    return [];
  }
}

export async function fetchReflexoes(): Promise<Reflexao[]> {
  const reflexoesMap = new Map<string, Reflexao>();

  // 1. Fetch from Firestore first (base historical records)
  try {
    const fsPromise = getDocs(collection(db, 'reflexoes'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
    );
    const snap = await Promise.race([fsPromise, timeoutPromise]);
    snap.docs.forEach(d => {
      const data = { ...d.data(), id: d.id } as Reflexao;
      const key = `${data.coupleName?.toLowerCase().trim()}_${String(data.theme).trim()}_${data.year}`;
      reflexoesMap.set(key, data);
    });
  } catch (err) {
    console.warn('Firestore fetchReflexoes notice:', err);
  }

  // 2. Fetch from local server endpoint /api/reflexoes (recent updates take precedence over Firestore)
  try {
    const res = await fetch('/api/reflexoes', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const serverList = await res.json();
      if (Array.isArray(serverList)) {
        serverList.forEach((r: Reflexao) => {
          const key = `${r.coupleName?.toLowerCase().trim()}_${String(r.theme).trim()}_${r.year}`;
          const existing = reflexoesMap.get(key);
          if (existing) {
            // Keep firestore id if server record was temporary, but take the latest answers
            reflexoesMap.set(key, { ...existing, ...r, id: existing.id || r.id });
          } else {
            reflexoesMap.set(key, r);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch reflexoes from server endpoint:', err);
  }

  // 3. Merge with local backup storage if any
  try {
    const cached = localStorage.getItem('ens13_cached_reflexoes');
    if (cached) {
      const localList: Reflexao[] = JSON.parse(cached);
      if (Array.isArray(localList)) {
        localList.forEach(lr => {
          const key = `${lr.coupleName?.toLowerCase().trim()}_${String(lr.theme).trim()}_${lr.year}`;
          if (!reflexoesMap.has(key)) {
            reflexoesMap.set(key, lr);
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(reflexoesMap.values());
}

export async function fetchEmails(): Promise<EmailContact[]> {
  try {
    const snap = await getDocs(collection(db, 'emails'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as EmailContact));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'emails');
    return [];
  }
}

export async function fetchEmailLogs(): Promise<EmailLog[]> {
  try {
    const snap = await getDocs(collection(db, 'emailLogs'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as EmailLog));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'emailLogs');
    return [];
  }
}

export async function fetchMembros(): Promise<MembroEquipe[]> {
  try {
    const snap = await getDocs(collection(db, 'membros'));
    return snap.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as MembroEquipe))
      .filter(m => !(
        m.casal?.toLowerCase().includes('conselheiro') ||
        m.casal?.toLowerCase().includes('acompanhante') ||
        m.funcao?.toLowerCase().includes('conselheiro')
      ));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'membros');
    return [];
  }
}

export async function fetchConselheiroEspiritual(): Promise<ConselheiroEspiritual | null> {
  try {
    const snap = await getDocs(collection(db, 'conselheiro'));
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as ConselheiroEspiritual;
    }
    return null;
  } catch (err) {
    console.warn('Erro ao buscar conselheiro espiritual:', err);
    return null;
  }
}

export async function saveConselheiroEspiritual(data: ConselheiroEspiritual): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'conselheiro'));
    if (!snap.empty) {
      const docRef = doc(db, 'conselheiro', snap.docs[0].id);
      await updateDoc(docRef, { ...data });
    } else {
      await addDoc(collection(db, 'conselheiro'), data);
    }
  } catch (err) {
    console.error('Erro ao salvar conselheiro espiritual:', err);
    throw err;
  }
}

export async function fetchAdminPassword(): Promise<string> {
  try {
    const docRef = doc(db, 'systemConfig', 'adminPass');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.password) return data.password;
    }
  } catch (err) {
    console.warn('Erro ao buscar senha admin:', err);
  }
  return 'ens13'; // default password
}

export async function saveAdminPassword(newPassword: string): Promise<void> {
  try {
    const docRef = doc(db, 'systemConfig', 'adminPass');
    await setDoc(docRef, { password: newPassword, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar senha admin:', err);
    throw err;
  }
}

export async function fetchTemasAnoList(): Promise<TemaAno[]> {
  try {
    const snap = await getDocs(collection(db, 'temasAno'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as TemaAno));
  } catch (err) {
    console.warn('Erro ao buscar temas do ano:', err);
    return [];
  }
}

export async function saveTemaAno(year: number, temas: Record<string, string>): Promise<void> {
  try {
    const q = query(collection(db, 'temasAno'), where('year', '==', year));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = doc(db, 'temasAno', snap.docs[0].id);
      await updateDoc(docRef, { year, temas, updatedAt: new Date().toISOString() });
    } else {
      await addDoc(collection(db, 'temasAno'), { year, temas, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error('Erro ao salvar temas do ano:', err);
    throw err;
  }
}

// Add operations
export async function addMembro(data: Omit<MembroEquipe, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'membros'), data);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'membros');
  }
}
export async function addReuniao(data: Omit<Reuniao, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'reunioes'), data);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reunioes');
  }
}

export async function addEvento(data: Omit<Evento, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'eventos'), data);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'eventos');
  }
}

export async function addAniversario(data: Omit<Aniversario, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'aniversarios'), data);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'aniversarios');
  }
}

export async function saveCasaisMes(data: Omit<CasalMes, 'id'>) {
  try {
    const q = query(collection(db, 'casaisMes'), where('mes', '==', data.mes));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await updateDoc(doc(db, 'casaisMes', docId), data as any);
      return docId;
    } else {
      const docRef = await addDoc(collection(db, 'casaisMes'), data);
      return docRef.id;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'casaisMes');
  }
}

export async function addReflexao(data: Omit<Reflexao, 'id'>): Promise<string> {
  const sanitized = {
    coupleName: String(data.coupleName || '').trim(),
    theme: String(data.theme || '0').trim(),
    year: Number(data.year) || new Date().getFullYear(),
    answers: (data.answers || []).map(a => String(a || '').trim()).filter(a => a.length > 0),
    createdAt: data.createdAt || new Date().toISOString()
  };

  let savedId = '';

  // 1. Immediately save to server endpoint /api/reflexoes (fast, unblocked, persists in data/reflexoes.json)
  try {
    const res = await fetch('/api/reflexoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const json = await res.json();
      savedId = json.id || json.record?.id || '';
      console.log('Reflexao gravada via servidor com sucesso:', savedId);
    }
  } catch (serverErr) {
    console.warn('Servidor reflexao POST aviso:', serverErr);
  }

  // 2. Always persist locally in browser localStorage as immediate failsafe
  try {
    const key = `${sanitized.coupleName.toLowerCase()}_${sanitized.theme}_${sanitized.year}`;
    const cached = localStorage.getItem('ens13_cached_reflexoes');
    const list: Reflexao[] = cached ? JSON.parse(cached) : [];
    const localId = savedId || 'rec_' + Date.now();
    const updated = list.filter(
      r => `${r.coupleName?.toLowerCase().trim()}_${String(r.theme).trim()}_${r.year}` !== key
    );
    updated.push({
      id: localId,
      ...sanitized
    });
    localStorage.setItem('ens13_cached_reflexoes', JSON.stringify(updated));
    if (!savedId) savedId = localId;
  } catch (lsErr) {
    console.warn('LocalStorage backup aviso:', lsErr);
  }

  // 3. Background attempt to write to Firestore (fire-and-forget, non-blocking)
  (async () => {
    try {
      const q = query(
        collection(db, 'reflexoes'),
        where('coupleName', '==', sanitized.coupleName),
        where('theme', '==', sanitized.theme),
        where('year', '==', sanitized.year)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingId = snap.docs[0].id;
        await updateDoc(doc(db, 'reflexoes', existingId), sanitized);
        console.log('Firestore background update completed:', existingId);
      } else {
        const docRef = await addDoc(collection(db, 'reflexoes'), sanitized);
        console.log('Firestore background write completed:', docRef.id);
      }
    } catch (fsErr) {
      console.warn('Firestore background write status:', fsErr);
    }
  })();

  if (!savedId) {
    throw new Error('Não foi possível salvar a reflexão. Verifique sua conexão e tente novamente.');
  }

  return savedId;
}

export async function addEmail(email: string) {
  try {
    const q = query(collection(db, 'emails'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, message: 'E-mail já cadastrado!' };
    }
    await addDoc(collection(db, 'emails'), {
      email,
      createdAt: new Date().toISOString()
    });
    return { success: true, message: 'E-mail cadastrado com sucesso!' };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'emails');
    return { success: false, message: 'Erro ao cadastrar e-mail.' };
  }
}

export async function addEmailLog(log: Omit<EmailLog, 'id'>) {
  try {
    await addDoc(collection(db, 'emailLogs'), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'emailLogs');
  }
}

export async function updateItemById(collectionName: string, id: string, data: any) {
  // If reflexoes, also sync with server API
  if (collectionName === 'reflexoes') {
    try {
      await fetch(`/api/reflexoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('Server reflexao update failed:', e);
    }
  }

  try {
    if (!id) throw new Error('ID do item não especificado.');
    const { id: _, ...payload } = data;

    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    let updated = false;

    for (const d of snap.docs) {
      const itemData = d.data();
      const match =
        d.id === id ||
        (itemData.evento && (itemData.evento === id || `${itemData.data}-${itemData.evento}` === id)) ||
        (itemData.tipo && (itemData.tipo === id || `${itemData.data}-${itemData.tipo}` === id)) ||
        (itemData.nome && (itemData.nome === id || `${itemData.dia}-${itemData.nome}` === id)) ||
        (itemData.casal && itemData.casal === id);

      if (match) {
        await updateDoc(doc(db, collectionName, d.id), payload);
        updated = true;
      }
    }

    if (!updated) {
      if (!id.includes('/')) {
        try {
          const docRef = doc(db, collectionName, id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            await updateDoc(docRef, payload);
            return;
          }
        } catch (e) {
          console.warn('Direct doc update bypassed:', e);
        }
      }
      await addDoc(colRef, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, collectionName);
  }
}

function normalizeStr(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(undefined|-)+|(undefined|-)+$/gi, '')
    .trim()
    .toLowerCase();
}

export async function deleteItemById(collectionName: string, id: string): Promise<number> {
  // If reflexoes, also sync deletion with server API
  if (collectionName === 'reflexoes') {
    try {
      await fetch(`/api/reflexoes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Server reflexao delete failed:', e);
    }
  }

  try {
    if (!id) throw new Error('ID do item não especificado.');

    let deletedCount = 0;
    const collectionsToCheck = Array.from(
      new Set([collectionName, 'reunioes', 'eventos', 'aniversarios', 'casaisMes', 'cardapio', 'emails', 'membros', 'emailLogs', 'reflexoes'])
    );

    // 1. Direct doc lookup by ID across candidate collections
    if (!id.includes('/') && id.trim().length > 0) {
      for (const col of collectionsToCheck) {
        try {
          const docRef = doc(db, col, id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            await deleteDoc(docRef);
            console.log(`Directly deleted doc '${id}' from collection '${col}'`);
            return 1;
          }
        } catch (e) {
          // continue checking other collections
        }
      }
    }

    // 2. Fallback search by normalized fields or synthetic IDs
    const normId = normalizeStr(id);
    if (!normId) return 0;

    for (const col of collectionsToCheck) {
      const colRef = collection(db, col);
      const snap = await getDocs(colRef);

      for (const d of snap.docs) {
        const data = d.data();
        const docId = d.id;

        const normDocId = normalizeStr(docId);
        const normEvento = normalizeStr(data.evento || '');
        const normTipo = normalizeStr(data.tipo || '');
        const normNome = normalizeStr(data.nome || '');
        const normCasal = normalizeStr(data.casal || '');
        const normEmail = normalizeStr(data.email || '');
        const normPrato = normalizeStr(data.prato || '');
        const normData = normalizeStr(data.data || '');
        const normDia = normalizeStr(data.dia || '');

        const exactFieldMatch =
          docId === id ||
          normDocId === normId ||
          (data.id && String(data.id) === id) ||
          (normEvento && normEvento === normId) ||
          (normTipo && normTipo === normId) ||
          (normNome && normNome === normId) ||
          (normCasal && normCasal === normId) ||
          (normEmail && normEmail === normId) ||
          (normPrato && normPrato === normId);

        const compositeMatch =
          (normData && normTipo && normId === `${normData}-${normTipo}`) ||
          (normData && normEvento && normId === `${normData}-${normEvento}`) ||
          (normDia && normNome && normId === `${normDia}-${normNome}`) ||
          (normCasal && normPrato && normId === `${normCasal}-${normPrato}`);

        const partialMatch =
          normId.length >= 3 &&
          ((normEvento && (normEvento.includes(normId) || normId.includes(normEvento))) ||
            (normTipo && (normTipo.includes(normId) || normId.includes(normTipo))) ||
            (normNome && (normNome.includes(normId) || normId.includes(normNome))) ||
            (normCasal && (normCasal.includes(normId) || normId.includes(normCasal))) ||
            (normEmail && (normEmail.includes(normId) || normId.includes(normEmail))) ||
            (normPrato && (normPrato.includes(normId) || normId.includes(normPrato))));

        if (exactFieldMatch || compositeMatch || partialMatch) {
          console.log(`Matched and deleting doc ${docId} from collection '${col}'`);
          await deleteDoc(doc(db, col, docId));
          deletedCount++;
        }
      }
    }

    return deletedCount;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, collectionName);
    return 0;
  }
}

export async function bulkImportCollection(collectionName: string, items: any[], clearExisting: boolean = false) {
  try {
    if (clearExisting) {
      const snap = await getDocs(collection(db, collectionName));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, collectionName, d.id));
      }
    }

    for (const item of items) {
      await addDoc(collection(db, collectionName), item);
    }
    return { success: true, count: items.length };
  } catch (err: any) {
    console.error(`Error bulk importing into ${collectionName}:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

// Cardápio specific operations
export async function saveCardapioItem(item: Partial<CardapioItem> & { anfitriao: string; prato: string; quem: string }) {
  try {
    const tipo = item.tipoMenu || 'Café da Manhã';
    const mesNum = item.mes || 0;

    const q = query(
      collection(db, 'cardapio'),
      where('anfitriao', '==', item.anfitriao),
      where('prato', '==', item.prato)
    );
    const snap = await getDocs(q);

    // Filter by tipoMenu & mes
    const existingDoc = snap.docs.find(d => {
      const data = d.data();
      const matchType = (data.tipoMenu || 'Café da Manhã').toLowerCase().trim() === tipo.toLowerCase().trim();
      const matchMes = (data.mes || 0) === mesNum;
      return matchType && matchMes;
    });

    const payload = {
      anfitriao: item.anfitriao,
      prato: item.prato,
      quem: item.quem,
      tipoMenu: tipo,
      mes: mesNum
    };

    if (existingDoc) {
      await updateDoc(doc(db, 'cardapio', existingDoc.id), payload);
      return existingDoc.id;
    } else {
      const docRef = await addDoc(collection(db, 'cardapio'), payload);
      return docRef.id;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cardapio');
  }
}

export async function saveCardapioMatrixForDish(
  prato: string,
  assignments: Record<string, string>,
  tipoMenu: string = 'Café da Manhã',
  mes: number = 0
) {
  try {
    for (const [anfitriao, quem] of Object.entries(assignments)) {
      await saveCardapioItem({
        anfitriao,
        prato,
        quem,
        tipoMenu,
        mes
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cardapio');
  }
}

export async function deleteCardapioDish(prato: string, tipoMenu: string = 'Café da Manhã', mes: number = 0) {
  try {
    const normPrato = normalizeStr(prato);
    const normTipo = normalizeStr(tipoMenu);
    const snap = await getDocs(collection(db, 'cardapio'));
    let deleted = 0;
    for (const d of snap.docs) {
      const data = d.data();
      const p = normalizeStr(data.prato || '');
      const t = normalizeStr(data.tipoMenu || 'Café da Manhã');
      const m = Number(data.mes || 0);

      const matchPrato = p === normPrato || p.includes(normPrato) || normPrato.includes(p);
      const matchType = !tipoMenu || tipoMenu === 'Todos' || t === normTipo || normTipo.includes(t) || t.includes(normTipo);
      const matchMes = mes === 0 || m === mes || m === 0;

      if (matchPrato && matchType && matchMes) {
        await deleteDoc(doc(db, 'cardapio', d.id));
        deleted++;
      }
    }
    return deleted;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'cardapio');
    return 0;
  }
}

export async function updateCardapioDishName(
  oldPrato: string,
  newPrato: string,
  tipoMenu: string = 'Café da Manhã',
  mes: number = 0
) {
  try {
    if (!newPrato.trim()) return;
    const snap = await getDocs(collection(db, 'cardapio'));
    for (const d of snap.docs) {
      const data = d.data();
      const matchPrato = (data.prato || '').toLowerCase().trim() === oldPrato.toLowerCase().trim();
      const matchType = (data.tipoMenu || 'Café da Manhã').toLowerCase().trim() === tipoMenu.toLowerCase().trim();
      const matchMes = (data.mes || 0) === mes;
      if (matchPrato && matchType && matchMes) {
        await updateDoc(doc(db, 'cardapio', d.id), { prato: newPrato.trim() });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'cardapio');
  }
}

export async function cleanDuplicateCardapio() {
  try {
    const snap = await getDocs(collection(db, 'cardapio'));
    const seenKeys = new Set<string>();
    let removedCount = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const anf = (data.anfitriao || '').toLowerCase().trim();
      const prato = (data.prato || '').toLowerCase().trim();
      const tipo = (data.tipoMenu || 'Café da Manhã').toLowerCase().trim();
      const mes = data.mes || 0;

      const key = `${anf}__${prato}__${tipo}__${mes}`;
      if (seenKeys.has(key)) {
        await deleteDoc(doc(db, 'cardapio', d.id));
        removedCount++;
      } else {
        seenKeys.add(key);
      }
    }
    return removedCount;
  } catch (err) {
    console.error('Erro ao limpar cardápio duplicado:', err);
    return 0;
  }
}

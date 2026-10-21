import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { app, db, detectarLimiteDoBanco } from './firebase';
import { MembroEquipe } from '../types';

/**
 * Login com Google e controle de quem pode usar o app.
 *
 * - Só entra quem tem o e-mail na coleção "acesso" (um documento por e-mail).
 * - A lista é montada a partir dos e-mails do cadastro dos casais e pode
 *   receber e-mails extras pelo Admin (ex.: conta Google diferente).
 * - Os administradores principais ficam fixos aqui e nas regras do banco
 *   (firestore.rules), para que nunca fiquem trancados para fora.
 */

export const SUPER_ADMINS = ['thiagovinicius7@gmail.com'];

export const auth = getAuth(app);

export interface Acesso {
  email: string;
  casal?: string;
  admin?: boolean;
  /** "cadastro" = veio do cadastro do casal; "manual" = incluído pelo Admin */
  origem?: 'cadastro' | 'manual';
}

export interface SituacaoAcesso {
  membro: boolean;
  admin: boolean;
}

export function normalizarEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function ehSuperAdmin(email: string | null | undefined): boolean {
  return SUPER_ADMINS.includes(normalizarEmail(email));
}

export function observarLogin(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function entrarComGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function sair(): Promise<void> {
  await signOut(auth);
}

export async function verificarAcesso(user: User): Promise<SituacaoAcesso> {
  const email = normalizarEmail(user.email);
  if (!email) return { membro: false, admin: false };
  if (ehSuperAdmin(email)) return { membro: true, admin: true };
  try {
    const snap = await getDoc(doc(db, 'acesso', email));
    if (!snap.exists()) return { membro: false, admin: false };
    return { membro: true, admin: snap.data().admin === true };
  } catch (err) {
    detectarLimiteDoBanco(err);
    console.warn('Não foi possível verificar o acesso:', err);
    return { membro: false, admin: false };
  }
}

export async function fetchAcessos(): Promise<Acesso[]> {
  const snap = await getDocs(collection(db, 'acesso'));
  return snap.docs
    .map(d => ({ ...(d.data() as Acesso), email: d.id }))
    .sort((a, b) => (a.casal || '~').localeCompare(b.casal || '~') || a.email.localeCompare(b.email));
}

export async function salvarAcesso(acesso: Acesso): Promise<void> {
  const email = normalizarEmail(acesso.email);
  if (!email.includes('@')) throw new Error('E-mail inválido.');
  await setDoc(
    doc(db, 'acesso', email),
    {
      email,
      casal: acesso.casal || '',
      admin: acesso.admin === true,
      origem: acesso.origem || 'manual'
    },
    { merge: true }
  );
}

export async function removerAcesso(email: string): Promise<void> {
  await deleteDoc(doc(db, 'acesso', normalizarEmail(email)));
}

/**
 * Deixa a lista de acesso igual aos e-mails dos casais ativos no cadastro.
 * E-mails incluídos à mão e administradores nunca são removidos aqui.
 */
export async function sincronizarAcessos(
  membros: MembroEquipe[]
): Promise<{ adicionados: number; removidos: number; atualizados: number }> {
  const desejados = new Map<string, string>();
  membros
    .filter(m => m.ativo !== false)
    .forEach(m => {
      [m.emailEsposa, m.emailMarido].forEach(e => {
        const email = normalizarEmail(e);
        if (email.includes('@') && !desejados.has(email)) desejados.set(email, m.casal || '');
      });
    });

  const snap = await getDocs(collection(db, 'acesso'));
  const existentes = new Map(snap.docs.map(d => [d.id, d.data() as Acesso]));
  const resultado = { adicionados: 0, removidos: 0, atualizados: 0 };

  for (const [email, casal] of desejados) {
    const atual = existentes.get(email);
    if (!atual) {
      await setDoc(doc(db, 'acesso', email), { email, casal, admin: false, origem: 'cadastro' });
      resultado.adicionados++;
    } else if ((atual.casal || '') !== casal && atual.origem !== 'manual') {
      await setDoc(doc(db, 'acesso', email), { casal }, { merge: true });
      resultado.atualizados++;
    }
  }

  for (const [email, atual] of existentes) {
    if (desejados.has(email) || atual.origem === 'manual' || atual.admin) continue;
    await deleteDoc(doc(db, 'acesso', email));
    resultado.removidos++;
  }
  return resultado;
}

// ============================================================
// MIGRAÇÃO DO BANCO ANTIGO (projeto compartilhado do AI Studio)
// Usada uma única vez para trazer os dados para o projeto próprio.
// ============================================================

const BANCO_ANTIGO = {
  config: {
    apiKey: 'AIzaSyDEGkvtd1E9iJ04aACDEDEvQIO0e6NECVA',
    authDomain: 'gen-lang-client-0996248003.firebaseapp.com',
    projectId: 'gen-lang-client-0996248003',
    storageBucket: 'gen-lang-client-0996248003.firebasestorage.app',
    messagingSenderId: '634023244351',
    appId: '1:634023244351:web:f10ffd622125715385fe8a'
  },
  databaseId: 'ai-studio-equipe13ens-634c979d-dbc1-44a7-a7da-1c936869209b'
};

export const COLECOES_MIGRACAO = [
  'membros',
  'reunioes',
  'eventos',
  'aniversarios',
  'casaisMes',
  'cardapio',
  'emails',
  'emailLogs',
  'reflexoes',
  'temasAno',
  'conselheiro',
  'systemConfig'
];

export async function migrarDoBancoAntigo(
  onProgresso?: (colecao: string, quantidade: number) => void
): Promise<Record<string, number>> {
  const appAntigo = getApps().find(a => a.name === 'banco-antigo') || initializeApp(BANCO_ANTIGO.config, 'banco-antigo');
  const dbAntigo = getFirestore(appAntigo, BANCO_ANTIGO.databaseId);
  const totais: Record<string, number> = {};

  for (const nome of COLECOES_MIGRACAO) {
    const snap = await getDocs(collection(dbAntigo, nome));
    let lote = writeBatch(db);
    let noLote = 0;
    for (const d of snap.docs) {
      // Mantém o mesmo id do documento para não quebrar referências.
      lote.set(doc(db, nome, d.id), d.data());
      noLote++;
      if (noLote === 400) {
        await lote.commit();
        lote = writeBatch(db);
        noLote = 0;
      }
    }
    if (noLote > 0) await lote.commit();
    totais[nome] = snap.size;
    onProgresso?.(nome, snap.size);
  }
  return totais;
}

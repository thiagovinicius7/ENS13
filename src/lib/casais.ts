import { MembroEquipe, CASAIS_DA_EQUIPE } from '../types';
import { INITIAL_MEMBROS_EQUIPE } from '../data/initialData';

/**
 * Utilitários para tratar a lista de casais da equipe de forma centralizada.
 *
 * O cadastro de casais (coleção "membros") é a fonte única da verdade:
 * - casais com `ativo === false` saíram da equipe e não aparecem em listas,
 *   cardápio, estudo do tema, etc.
 * - nomes de casal são comparados sem acento, sem diferenciar maiúsculas e
 *   independente da ordem ("Luana e Thiago" == "Thiago e Luana").
 */

export function normalizeName(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chave única do casal, independente da ordem dos nomes. */
export function coupleKey(name: string | undefined | null): string {
  const norm = normalizeName(name);
  if (!norm) return '';
  return norm
    .split(/\s+e\s+|\s*&\s*|\s*,\s*|\s*\/\s*/)
    .map(p => p.trim())
    .filter(Boolean)
    .sort()
    .join('|');
}

export function sameCouple(a: string | undefined | null, b: string | undefined | null): boolean {
  const ka = coupleKey(a);
  const kb = coupleKey(b);
  return !!ka && ka === kb;
}

export function isMembroAtivo(m: MembroEquipe): boolean {
  return m.ativo !== false;
}

/** Membros ativos (com fallback para a lista inicial se o banco ainda estiver vazio). */
export function getMembrosAtivos(membros: MembroEquipe[]): MembroEquipe[] {
  if (!membros || membros.length === 0) return INITIAL_MEMBROS_EQUIPE;
  return membros.filter(isMembroAtivo);
}

/** Nomes dos casais ativos da equipe, sem duplicatas. */
export function getCasaisAtivos(membros: MembroEquipe[]): string[] {
  const result: string[] = [];
  getMembrosAtivos(membros).forEach(m => {
    const nome = (m.casal || '').trim();
    if (nome && !result.some(r => sameCouple(r, nome))) result.push(nome);
  });
  return result;
}

/**
 * Lista de casais para o Estudo do Tema. Mantém o nome antigo usado nas
 * reflexões já enviadas (ex.: "Thiago e Luana") para não quebrar o histórico.
 */
export function getCasaisEstudo(membros: MembroEquipe[]): string[] {
  return getCasaisAtivos(membros).map(
    nome => CASAIS_DA_EQUIPE.find(legacy => sameCouple(legacy, nome)) || nome
  );
}

/** Verifica se um nome (de casal) pertence a algum casal ativo. */
export function isCasalAtivo(nome: string, membros: MembroEquipe[]): boolean {
  return getCasaisAtivos(membros).some(c => sameCouple(c, nome));
}

/** Converte "08-10-2016", "08/10/2016" ou "08/10" em "DD/MM". */
export function toDiaMes(raw?: string): string {
  if (!raw) return '';
  const m = String(raw).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})/);
  if (!m) return '';
  const dia = m[1].padStart(2, '0');
  const mes = m[2].padStart(2, '0');
  const d = Number(dia);
  const mm = Number(mes);
  if (d < 1 || d > 31 || mm < 1 || mm > 12) return '';
  return `${dia}/${mes}`;
}

export const A_DEFINIR = 'A definir';

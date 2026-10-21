import React, { useEffect, useState } from 'react';
import { MembroEquipe } from '../types';
import {
  Acesso,
  fetchAcessos,
  salvarAcesso,
  removerAcesso,
  sincronizarAcessos,
  migrarDoBancoAntigo,
  ehSuperAdmin,
  SUPER_ADMINS
} from '../lib/acesso';

interface AcessoPanelProps {
  membros: MembroEquipe[];
  isSuperAdmin: boolean;
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
  refreshData: () => void;
}

export const AcessoPanel: React.FC<AcessoPanelProps> = ({ membros, isSuperAdmin, onNotify, refreshData }) => {
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoCasal, setNovoCasal] = useState('');
  const [novoAdmin, setNovoAdmin] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [progresso, setProgresso] = useState<string[]>([]);

  const carregar = async () => {
    setCarregando(true);
    try {
      setAcessos(await fetchAcessos());
    } catch (err: any) {
      onNotify('Erro ao carregar a lista de acesso: ' + (err?.message || err), 'e');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const casaisAtivos = membros.filter(m => m.ativo !== false).map(m => m.casal).filter(Boolean);

  const handleIncluir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEmail.includes('@')) {
      onNotify('Informe um e-mail válido.', 'e');
      return;
    }
    try {
      await salvarAcesso({ email: novoEmail, casal: novoCasal, admin: novoAdmin, origem: 'manual' });
      setNovoEmail('');
      setNovoCasal('');
      setNovoAdmin(false);
      onNotify('E-mail liberado no app.', 's');
      carregar();
    } catch (err: any) {
      onNotify('Erro ao liberar e-mail: ' + (err?.message || err), 'e');
    }
  };

  const handleAlternarAdmin = async (a: Acesso) => {
    try {
      await salvarAcesso({ ...a, admin: !a.admin });
      onNotify(a.admin ? 'Deixou de ser administrador.' : 'Agora é administrador.', 's');
      carregar();
    } catch (err: any) {
      onNotify('Erro ao alterar: ' + (err?.message || err), 'e');
    }
  };

  const handleRemover = async (a: Acesso) => {
    const aviso =
      a.origem === 'cadastro'
        ? `Remover ${a.email}? Como ele está no cadastro do casal, volta a ser liberado na próxima sincronização. Para tirar de vez, apague o e-mail no cadastro do casal.`
        : `Remover o acesso de ${a.email}?`;
    if (!window.confirm(aviso)) return;
    try {
      await removerAcesso(a.email);
      onNotify('Acesso removido.', 's');
      carregar();
    } catch (err: any) {
      onNotify('Erro ao remover: ' + (err?.message || err), 'e');
    }
  };

  const handleSincronizar = async () => {
    try {
      const r = await sincronizarAcessos(membros);
      onNotify(
        `Lista atualizada: ${r.adicionados} incluído(s), ${r.atualizados} atualizado(s), ${r.removidos} removido(s).`,
        's'
      );
      carregar();
    } catch (err: any) {
      onNotify('Erro ao sincronizar: ' + (err?.message || err), 'e');
    }
  };

  const handleMigrar = async () => {
    const jaTemDados = membros.length > 0;
    const msg = jaTemDados
      ? 'O banco novo já tem casais cadastrados. Trazer de novo vai SOBRESCREVER os registros com os do banco antigo (mesmo id). Continuar?'
      : 'Copiar todos os dados do banco antigo (AI Studio) para o banco novo?';
    if (!window.confirm(msg)) return;
    setMigrando(true);
    setProgresso([]);
    try {
      const totais = await migrarDoBancoAntigo((colecao, qtd) =>
        setProgresso(prev => [...prev, `${colecao}: ${qtd}`])
      );
      const total = Object.values(totais).reduce((a, b) => a + b, 0);
      onNotify(`Migração concluída: ${total} registro(s) copiados.`, 's');
      refreshData();
      setTimeout(carregar, 1500);
    } catch (err: any) {
      onNotify('Erro na migração: ' + (err?.message || err), 'e');
    } finally {
      setMigrando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">Acesso ao app</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Só entra no app quem faz login com Google usando um e-mail desta lista. Os e-mails do cadastro dos casais
            entram sozinhos; quem sai da equipe perde o acesso. Inclua à mão quem usa outra conta Google.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSincronizar}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C52A4] hover:bg-slate-800 text-white shadow-sm"
          >
            Sincronizar com o cadastro
          </button>
        </div>

        {carregando ? (
          <p className="text-xs text-slate-400 py-4">Carregando…</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            {SUPER_ADMINS.map(email => (
              <div key={email} className="p-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-700/40">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 break-all">{email}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Administrador principal (fixo)</p>
                </div>
              </div>
            ))}
            {acessos
              .filter(a => !ehSuperAdmin(a.email))
              .map(a => (
                <div key={a.email} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 break-all">{a.email}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {a.casal || 'Sem casal'} · {a.origem === 'manual' ? 'incluído à mão' : 'do cadastro'}
                      {a.admin ? ' · administrador' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAlternarAdmin(a)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                        a.admin
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {a.admin ? 'Tirar admin' : 'Tornar admin'}
                    </button>
                    <button
                      onClick={() => handleRemover(a)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            {acessos.filter(a => !ehSuperAdmin(a.email)).length === 0 && (
              <p className="p-4 text-xs text-slate-400">
                Nenhum e-mail liberado ainda. Use “Sincronizar com o cadastro” depois de trazer os dados.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleIncluir} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center pt-2">
          <input
            type="email"
            value={novoEmail}
            onChange={e => setNovoEmail(e.target.value)}
            placeholder="e-mail da conta Google"
            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
          />
          <select
            value={novoCasal}
            onChange={e => setNovoCasal(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
          >
            <option value="">Casal (opcional)</option>
            {casaisAtivos.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={novoAdmin} onChange={e => setNovoAdmin(e.target.checked)} />
            admin
          </label>
          <button type="submit" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
            Liberar
          </button>
        </form>
      </div>

      {isSuperAdmin && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">Trazer dados do banco antigo</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Copia casais, agenda, aniversários, cardápio, e-mails, reflexões e configurações do banco do AI Studio para o
            banco próprio da equipe. Use uma vez, logo depois da mudança. Depois de conferir, feche o banco antigo.
          </p>
          <button
            onClick={handleMigrar}
            disabled={migrando}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
          >
            {migrando ? 'Copiando…' : 'Trazer dados agora'}
          </button>
          {progresso.length > 0 && (
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
              {progresso.map(p => (
                <li key={p}>✓ {p}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

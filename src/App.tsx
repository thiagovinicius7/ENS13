import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AgendaTab } from './components/AgendaTab';
import { EstudoTab } from './components/EstudoTab';
import { AdminTab } from './components/AdminTab';
import { ReportModal } from './components/ReportModal';
import { LoginScreen } from './components/LoginScreen';
import type { User } from 'firebase/auth';
import { observarLogin, verificarAcesso, sincronizarAcessos, sair, ehSuperAdmin } from './lib/acesso';
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
  TemaAno
} from './types';
import {
  fetchReunioes,
  fetchEventos,
  fetchAniversarios,
  fetchCasaisMes,
  fetchCardapio,
  fetchReflexoes,
  fetchEmails,
  fetchEmailLogs,
  fetchMembros,
  fetchTemasAnoList,
  cleanDuplicateAniversarios,
  onLimiteDoBanco,
  limparAvisoDeLimite
} from './lib/firebase';
import { isMembroAtivo, getCasaisAtivos, separarAniversariosDuplicados } from './lib/casais';

/** Hora local em que a cota gratuita do Firebase renova (meia-noite no horário do Pacífico). */
function horarioRenovacaoCota(): string {
  try {
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23'
    }).formatToParts(agora);
    const get = (t: string) => Number(partes.find(p => p.type === t)?.value || 0);
    const decorrido = (get('hour') * 3600 + get('minute') * 60 + get('second')) * 1000;
    const renovacao = new Date(agora.getTime() + (24 * 3600 * 1000 - decorrido));
    return renovacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'reflexoes' | 'admin'>('agenda');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ens13_dark') === 'true';
  });

  // Toast Notification state
  const [toast, setToast] = useState<{ msg: string; type: 's' | 'e' | 'i' } | null>(null);

  // Data states
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [aniversarios, setAniversarios] = useState<Aniversario[]>([]);
  const [casaisMesList, setCasaisMesList] = useState<CasalMes[]>([]);
  const [cardapioList, setCardapioList] = useState<CardapioItem[]>([]);
  const [reflexoes, setReflexoes] = useState<Reflexao[]>([]);
  const [emails, setEmails] = useState<EmailContact[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [temasAnoList, setTemasAnoList] = useState<TemaAno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Casais ativos x casais que saíram da equipe
  const membrosAtivos = membros.filter(isMembroAtivo);
  const exMembros = membros.filter(m => !isMembroAtivo(m));

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTema, setReportTema] = useState('1');
  const [reportAno, setReportAno] = useState(2026);

  // Toast helper
  const notify = (msg: string, type: 's' | 'e' | 'i' = 'i') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('ens13_dark', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Login com Google e permissão de acesso
  const [usuario, setUsuario] = useState<User | null>(null);
  const [authPronto, setAuthPronto] = useState(false);
  const [acesso, setAcesso] = useState<{ membro: boolean; admin: boolean } | null>(null);

  useEffect(
    () =>
      observarLogin(async user => {
        setUsuario(user);
        setAcesso(null);
        if (user) setAcesso(await verificarAcesso(user));
        setAuthPronto(true);
      }),
    []
  );

  // Aviso de limite diário do banco
  const [limiteBanco, setLimiteBanco] = useState(false);
  useEffect(() => onLimiteDoBanco(setLimiteBanco), []);

  const acessoRef = useRef(acesso);
  acessoRef.current = acesso;

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [r, e, a, c, cd, rf, em, el, mb, ta] = await Promise.all([
        fetchReunioes(),
        fetchEventos(),
        fetchAniversarios(),
        fetchCasaisMes(),
        fetchCardapio(),
        fetchReflexoes(),
        fetchEmails(),
        fetchEmailLogs(),
        fetchMembros(),
        fetchTemasAnoList()
      ]);

      setReunioes(r);
      setEventos(e);
      // Mostra cada aniversário uma vez só e apaga do banco os repetidos.
      const { manter, duplicados } = separarAniversariosDuplicados(a);
      setAniversarios(manter);
      if (duplicados.length > 0) {
        cleanDuplicateAniversarios(a).then(n => {
          if (n > 0) console.info(`${n} aniversário(s) duplicado(s) removido(s) do banco.`);
        });
      }
      limparAvisoDeLimite();
      setCasaisMesList(c);
      setCardapioList(cd);
      setReflexoes(rf);
      setEmails(em);
      setEmailLogs(el);
      setMembros(mb);

      // Mantém a lista de e-mails liberados igual ao cadastro dos casais.
      if (acessoRef.current?.admin && mb.length > 0) {
        sincronizarAcessos(mb).catch(err => console.warn('Erro ao sincronizar acessos:', err));
      }
      setTemasAnoList(ta);
    } catch (err) {
      console.error('Error loading data:', err);
      notify('Falha ao carregar dados do banco.', 'e');
    } finally {
      setLoading(false);
    }
  };

  const reloadReflexoesOnly = async () => {
    try {
      const rf = await fetchReflexoes();
      setReflexoes(rf);
    } catch (err) {
      console.warn('Erro ao recarregar reflexões:', err);
    }
  };

  useEffect(() => {
    if (acesso?.membro) loadAllData();
  }, [acesso?.membro]);

  const handleOpenReportModal = (tema: string, ano: number) => {
    setReportTema(tema);
    setReportAno(ano);
    setReportModalOpen(true);
  };

  if (!authPronto || (usuario && !acesso)) {
    return <LoginScreen verificando />;
  }
  if (!usuario) {
    return <LoginScreen />;
  }
  if (!acesso?.membro) {
    return <LoginScreen emailSemAcesso={usuario.email} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#0F1623] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md pointer-events-none">
          <div
            className={`p-3.5 rounded-2xl shadow-xl font-semibold text-xs text-white flex items-center justify-between gap-2 border animate-in fade-in slide-in-from-top duration-300 pointer-events-auto ${
              toast.type === 's'
                ? 'bg-emerald-600 border-emerald-500'
                : toast.type === 'e'
                ? 'bg-rose-600 border-rose-500'
                : 'bg-[#1C52A4] border-slate-700'
            }`}
          >
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold text-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Aviso: limite diário do banco atingido */}
      {limiteBanco && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <p className="flex-1 leading-relaxed">
              <strong>O banco de dados atingiu o limite diário de uso.</strong> Por enquanto o app pode não mostrar
              dados atualizados e o que for salvo agora pode não ser gravado.
              {horarioRenovacaoCota() && <> O limite renova por volta das <strong>{horarioRenovacaoCota()}</strong>.</>}
            </p>
            <button
              onClick={() => {
                limparAvisoDeLimite();
                loadAllData();
              }}
              className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Conta conectada */}
      <div className="max-w-4xl mx-auto px-4 pt-3 flex items-center justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="truncate">{usuario.email}{acesso.admin ? ' · admin' : ''}</span>
        <button
          onClick={() => sair()}
          className="shrink-0 font-bold text-[#1C52A4] dark:text-amber-300 hover:underline"
        >
          Sair
        </button>
      </div>

      {/* Content Body */}
      <main className="max-w-4xl mx-auto px-4 py-5 md:py-8">
        {activeTab === 'agenda' && (
          <AgendaTab
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            reunioes={reunioes}
            eventos={eventos}
            aniversarios={aniversarios}
            casaisMesList={casaisMesList}
            cardapioList={cardapioList}
            membros={membrosAtivos}
            loading={loading}
            onNotify={notify}
            isAdmin={acesso.admin}
          />
        )}

        {activeTab === 'reflexoes' && (
          <EstudoTab
            reflexoes={reflexoes}
            temasAnoList={temasAnoList}
            membros={membrosAtivos}
            refreshReflexoes={reloadReflexoesOnly}
            onNotify={notify}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            reunioes={reunioes}
            eventos={eventos}
            aniversarios={aniversarios}
            casaisMesList={casaisMesList}
            emails={emails}
            emailLogs={emailLogs}
            reflexoes={reflexoes}
            membros={membrosAtivos}
            exMembros={exMembros}
            cardapioList={cardapioList}
            temasAnoList={temasAnoList}
            refreshData={loadAllData}
            onNotify={notify}
            onOpenReportModal={handleOpenReportModal}
            setCurrentMonth={setCurrentMonth}
            isAdmin={acesso.admin}
            isSuperAdmin={ehSuperAdmin(usuario.email)}
            todosMembros={membros}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Printable Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        tema={reportTema}
        ano={reportAno}
        reflexoes={reflexoes}
        temasAnoList={temasAnoList}
        totalCasais={getCasaisAtivos(membrosAtivos).length}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AgendaTab } from './components/AgendaTab';
import { EstudoTab } from './components/EstudoTab';
import { AdminTab } from './components/AdminTab';
import { ReportModal } from './components/ReportModal';
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
  testFirestoreConnection,
  seedInitialDataIfNeeded,
  fetchReunioes,
  fetchEventos,
  fetchAniversarios,
  fetchCasaisMes,
  fetchCardapio,
  fetchReflexoes,
  fetchEmails,
  fetchEmailLogs,
  fetchMembros,
  fetchTemasAnoList
} from './lib/firebase';
import { isMembroAtivo, getCasaisAtivos } from './lib/casais';

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

  const isInitializedRef = useRef(false);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        testFirestoreConnection().catch(() => {});
        seedInitialDataIfNeeded().catch(() => {});
      }

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
      setAniversarios(a);
      setCasaisMesList(c);
      setCardapioList(cd);
      setReflexoes(rf);
      setEmails(em);
      setEmailLogs(el);
      setMembros(mb);
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
    loadAllData();
  }, []);

  const handleOpenReportModal = (tema: string, ano: number) => {
    setReportTema(tema);
    setReportAno(ano);
    setReportModalOpen(true);
  };

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

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

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

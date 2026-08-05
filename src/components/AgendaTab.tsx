import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  PartyPopper,
  Coffee,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserCheck,
  Table as TableIcon,
  Copy,
  Sparkles,
  Share2
} from 'lucide-react';
import {
  Reuniao,
  Evento,
  Aniversario,
  CasalMes,
  CardapioItem,
  MembroEquipe,
  MONTHS
} from '../types';
import {
  INITIAL_MEMBROS_EQUIPE,
  CARDAPIO_HOSTS,
  CARDAPIO_MATRIX,
  INITIAL_CARDAPIO
} from '../data/initialData';
import { parseTextWithLinks, extractMonthFromDate, isDateTodayOrFuture } from '../lib/utils';
import { addEmail } from '../lib/firebase';


interface AgendaTabProps {
  currentMonth: number;
  setCurrentMonth: React.Dispatch<React.SetStateAction<number>>;
  reunioes: Reuniao[];
  eventos: Evento[];
  aniversarios: Aniversario[];
  casaisMesList: CasalMes[];
  cardapioList: CardapioItem[];
  membros?: MembroEquipe[];
  loading: boolean;
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
}

export const AgendaTab: React.FC<AgendaTabProps> = ({
  currentMonth,
  setCurrentMonth,
  reunioes,
  eventos,
  aniversarios,
  casaisMesList,
  cardapioList,
  membros = [],
  loading,
  onNotify
}) => {
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [selectedMenuType, setSelectedMenuType] = useState<string>('Café da Manhã');
  const [showFullMatrixTable, setShowFullMatrixTable] = useState<boolean>(false);
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const displayMembros = (membros && membros.length > 0) ? membros : INITIAL_MEMBROS_EQUIPE;

  // Filter items for current month (1-indexed month)
  const monthNum = currentMonth + 1;

  const currentCasais = casaisMesList.find(c => Number(c.mes) === monthNum) || {
    animador: '---',
    anfitricao: '---'
  };

  // Active cardapio dataset (use Firestore list or fallback to official matrix)
  const activeCardapio = (cardapioList && cardapioList.length > 0) ? cardapioList : INITIAL_CARDAPIO;

  // Extract unique available menu types
  const availableMenuTypes = Array.from(new Set([
    'Café da Manhã',
    ...activeCardapio.map(c => c.tipoMenu || 'Café da Manhã').filter(Boolean)
  ]));

  const availableHosts = Array.from(new Set([
    ...CARDAPIO_HOSTS,
    ...activeCardapio.map(c => c.anfitriao).filter(Boolean)
  ]));

  // Auto select host when month changes or on initial load
  useEffect(() => {
    if (currentCasais.anfitricao && currentCasais.anfitricao !== '---') {
      setSelectedHost(currentCasais.anfitricao);
    } else if (!selectedHost && availableHosts.length > 0) {
      setSelectedHost(availableHosts[0]);
    }
  }, [currentMonth, currentCasais.anfitricao]);

  // Filter raw items by host, menu type, and month
  const rawHostItems = selectedHost
    ? activeCardapio.filter(c => {
        const matchHost =
          c.anfitriao.toLowerCase().trim() === selectedHost.toLowerCase().trim() ||
          c.anfitriao.toLowerCase().includes(selectedHost.toLowerCase()) ||
          selectedHost.toLowerCase().includes(c.anfitriao.toLowerCase());

        const itemType = (c.tipoMenu || 'Café da Manhã').toLowerCase().trim();
        const selType = (selectedMenuType || 'Café da Manhã').toLowerCase().trim();
        const matchType = itemType === selType;

        const itemMes = c.mes || 0;
        const matchMonth = itemMes === 0 || itemMes === monthNum;

        return matchHost && matchType && matchMonth;
      })
    : [];

  // Sort so month-specific items come first
  rawHostItems.sort((a, b) => {
    const monthA = a.mes === monthNum ? 2 : 1;
    const monthB = b.mes === monthNum ? 2 : 1;
    return monthB - monthA;
  });

  // Deduplicate by dish name (prato) so each item appears EXACTLY ONCE
  const deduplicatedMap = new Map<string, CardapioItem>();
  for (const item of rawHostItems) {
    const key = (item.prato || '').toLowerCase().trim();
    if (!key) continue;
    if (!deduplicatedMap.has(key)) {
      deduplicatedMap.set(key, item);
    }
  }
  const filteredCardapio = Array.from(deduplicatedMap.values());

  const handleCopyCardapio = () => {
    if (!selectedHost || filteredCardapio.length === 0) return;
    let text = `☕ *CARDÁPIO RECEPTIVO (${selectedMenuType.toUpperCase()}) - EQUIPE 13 ENS*\n🏠 *Casal Anfitrião:* ${selectedHost}\n\n`;
    filteredCardapio.forEach(item => {
      text += `• *${item.prato}:* ${item.quem}\n`;
    });
    text += `\nQue Nossa Senhora Desatadora dos Nós abençoe nosso encontro! 🙏✨`;
    navigator.clipboard.writeText(text);
    onNotify(`Cardápio de ${selectedHost} copiado para o WhatsApp!`, 's');
  };

  const monthReunioes = reunioes
    .filter(r => {
      const matchMonth = r.mes ? Number(r.mes) === monthNum : extractMonthFromDate(r.data) === monthNum;
      return matchMonth;
    })
    .sort((a, b) => {
      const dayA = parseInt((a.data || '').match(/\d+/)?.[0] || '0', 10);
      const dayB = parseInt((b.data || '').match(/\d+/)?.[0] || '0', 10);
      return dayA - dayB;
    });

  const monthEventos = eventos
    .filter(e => {
      const matchMonth = e.mes ? Number(e.mes) === monthNum : extractMonthFromDate(e.data) === monthNum;
      return matchMonth;
    })
    .sort((a, b) => {
      const dayA = parseInt((a.data || '').match(/\d+/)?.[0] || '0', 10);
      const dayB = parseInt((b.data || '').match(/\d+/)?.[0] || '0', 10);
      return dayA - dayB;
    });

  const monthAniversarios = aniversarios
    .filter(a => {
      if (a.mes) return Number(a.mes) === monthNum;
      if (a.dia) return extractMonthFromDate(a.dia) === monthNum;
      return false;
    })
    .sort((a, b) => {
      const dayA = parseInt((a.dia || '').match(/\d+/)?.[0] || '0', 10);
      const dayB = parseInt((b.dia || '').match(/\d+/)?.[0] || '0', 10);
      return dayA - dayB;
    });



  const handleMonthChange = (direction: number) => {
    setCurrentMonth(prev => {
      let next = prev + direction;
      if (next < 0) next = 11;
      if (next > 11) next = 0;
      return next;
    });
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      onNotify('Por favor, informe um e-mail válido.', 'e');
      return;
    }

    setSubmittingEmail(true);
    const result = await addEmail(emailInput.trim());
    setSubmittingEmail(false);

    if (result.success) {
      onNotify(result.message, 's');
      setEmailInput('');
    } else {
      onNotify(result.message, 'e');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Month Navigation */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
        <button
          onClick={() => handleMonthChange(-1)}
          className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-[#1C52A4] hover:text-white dark:hover:bg-[#C8952A] transition-all flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95"
          aria-label="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#1C52A4] dark:text-amber-300">
            {MONTHS[currentMonth]} <span className="text-sm font-sans font-semibold text-slate-500 dark:text-slate-400">2026</span>
          </h2>
          <p className="text-[11px] font-semibold text-[#C8952A] tracking-wider uppercase">
            Equipe 13 • ENS
          </p>
        </div>

        <button
          onClick={() => handleMonthChange(1)}
          className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-[#1C52A4] hover:text-white dark:hover:bg-[#C8952A] transition-all flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95"
          aria-label="Próximo Mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Casais do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#1C52A4] text-white rounded-2xl p-4 sm:p-5 shadow-md border-t-4 border-[#C8952A] relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Users className="w-16 h-16" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EFD89A] block mb-1">
            Casal Animador
          </span>
          <p className="font-serif text-lg font-bold text-white tracking-tight">
            {currentCasais.animador || '---'}
          </p>
        </div>

        <div className="bg-[#1C52A4] text-white rounded-2xl p-4 sm:p-5 shadow-md border-t-4 border-amber-400 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Users className="w-16 h-16" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EFD89A] block mb-1">
            Casal Anfitrião
          </span>
          <p className="font-serif text-lg font-bold text-white tracking-tight">
            {currentCasais.anfitricao || '---'}
          </p>
        </div>
      </div>

      {/* Button to show Team Members modal */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowMembersModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1C52A4] dark:hover:border-amber-400 text-xs font-bold uppercase tracking-wider text-[#1C52A4] dark:text-amber-300 rounded-xl shadow-sm transition-all"
        >
          <Users className="w-4 h-4 text-[#C8952A]" />
          Ver Membros da Equipe 13 ({INITIAL_MEMBROS_EQUIPE.length} Casais)
        </button>
      </div>

      {/* Reuniões e Eventos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Reuniões */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-t-4 border-t-[#1C52A4] dark:border-t-amber-400">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#1C52A4]/10 dark:bg-amber-400/10 flex items-center justify-center text-[#1C52A4] dark:text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">
              Reuniões do Mês
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            </div>
          ) : monthReunioes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
              Nenhuma reunião cadastrada para este mês.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {monthReunioes.map((r, idx) => (
                <div key={r.id || idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#1C52A4] dark:text-slate-100 leading-snug">
                      {r.tipo}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#C8952A]/15 text-[#C8952A] dark:text-amber-300 shrink-0">
                      {r.data}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {r.hora && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C8952A]" />
                        {r.hora}
                      </span>
                    )}
                    {r.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {r.local}
                      </span>
                    )}
                  </div>

                  {r.responsavel && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <strong className="text-slate-700 dark:text-slate-200">Responsável:</strong> {r.responsavel}
                    </p>
                  )}

                  {r.observacoes && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {parseTextWithLinks(r.observacoes)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eventos Sociais */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-t-4 border-t-emerald-600 dark:border-t-emerald-400">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PartyPopper className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">
              Eventos da Equipe
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            </div>
          ) : monthEventos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
              Nenhum evento registrado para este mês.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {monthEventos.map((e, idx) => (
                <div key={e.id || idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#1C52A4] dark:text-slate-100 leading-snug">
                      {e.evento}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {e.data}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {e.hora && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {e.hora}
                      </span>
                    )}
                    {e.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {e.local}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aniversariantes do Mês */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-t-4 border-t-rose-500">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <PartyPopper className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">
            Aniversariantes
          </h3>
        </div>

        {monthAniversarios.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
            Nenhum aniversariante registrado neste mês.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {monthAniversarios.map((a, idx) => (
              <div
                key={a.id || idx}
                className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border border-slate-200/70 dark:border-slate-600/60 relative overflow-hidden group hover:border-rose-400 transition-all"
              >
                <span className="absolute top-0 right-0 bg-[#1C52A4] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl-lg">
                  {a.tipo}
                </span>
                <span className="text-[11px] font-bold text-rose-500 block mb-1 mt-1">
                  {a.dia}
                </span>
                <p className="font-serif font-bold text-xs text-[#1C52A4] dark:text-slate-100 leading-snug">
                  {a.nome}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cardápio Receptivo */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200/80 dark:border-slate-700/80 border-t-4 border-t-[#C8952A] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 flex items-center justify-center text-[#C8952A] dark:text-amber-300">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">
                Cardápio Receptivo da Equipe 13
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha o casal anfitrião para ver quem deve levar cada item da reunião.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFullMatrixTable(!showFullMatrixTable)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
              showFullMatrixTable
                ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            {showFullMatrixTable ? 'Ocultar Planilha Geral' : '📊 Ver Planilha Completa do Cardápio'}
          </button>
        </div>

        {/* Tipo de Cardápio Selector */}
        {availableMenuTypes.length > 0 && (
          <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-700/80">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tipo de Cardápio:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableMenuTypes.map(mType => {
                const isSel = selectedMenuType.toLowerCase().trim() === mType.toLowerCase().trim();
                return (
                  <button
                    key={mType}
                    onClick={() => setSelectedMenuType(mType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSel
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    🍽️ {mType}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Host Selection Pills */}
        {(() => {
          const availableHosts = Array.from(
            new Set([
              'Luana e Thiago',
              'Thais e Lucas',
              'Camila e Luciano',
              'Danielle e Fabiano',
              'Pâmela e Gláucio',
              'Patrícia e Mota',
              'Natália e Júlio',
              ...membros.map(m => m.casal).filter(Boolean),
              ...cardapioList.map(c => c.anfitriao).filter(Boolean)
            ])
          );

          return (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Selecione o Casal Anfitrião:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableHosts.map((host) => {
                  const isSelected = selectedHost.toLowerCase().trim() === host.toLowerCase().trim();
                  return (
                    <button
                      key={host}
                      onClick={() => setSelectedHost(host)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#1C52A4] text-amber-300 border-[#1C52A4] shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      🏠 {host}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Table view for Selected Host */}
        {selectedHost && (
          <div className="space-y-3 pt-2">
            <div className="bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Tabela do Receptivo
                </span>
                <h4 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-200">
                  Reunião com Anfitrião: <span className="text-amber-700 dark:text-amber-300">{selectedHost}</span>
                </h4>
                {currentCasais.animador && currentCasais.animador !== '---' && (
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1 mt-0.5">
                    ✨ Casal Animador do Mês ({MONTHS[monthNum - 1]}): <strong className="underline">{currentCasais.animador}</strong>
                  </p>
                )}
              </div>

              {filteredCardapio.length > 0 && (
                <button
                  onClick={handleCopyCardapio}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar para WhatsApp
                </button>
              )}
            </div>

            {filteredCardapio.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#1C52A4] text-amber-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                      <th className="py-3 px-4">Item / Prato do Cardápio</th>
                      <th className="py-3 px-4">Quem Deve Levar</th>
                      <th className="py-3 px-4 text-center">Papel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 bg-white dark:bg-slate-800 text-xs">
                    {filteredCardapio.map((item, idx) => {
                      const quemClean = item.quem.toLowerCase().trim();
                      const hostClean = selectedHost.toLowerCase().trim();
                      const animadorClean = (currentCasais.animador || '').toLowerCase().trim();

                      const isHostBringing = quemClean === hostClean;
                      const isAnimatorBringing = animadorClean !== '---' && animadorClean !== '' && (
                        quemClean === animadorClean ||
                        quemClean.includes(animadorClean) ||
                        animadorClean.includes(quemClean)
                      );

                      return (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {item.prato}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1C52A4] dark:text-amber-300">
                            {item.quem}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isHostBringing ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                🏠 Anfitrião
                              </span>
                            ) : isAnimatorBringing ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                ✨ Casal Animador
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                🎁 Convidado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center">
                Nenhum item cadastrado para este casal anfitrião.
              </p>
            )}
          </div>
        )}

        {/* Full Matrix Spreadsheet Table (Matching Official Image) */}
        {showFullMatrixTable && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-600" /> Planilha Geral do Cardápio Receptivo
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Matriz oficial de distribuição de pratos para cada casal anfitrião. Clique no cabeçalho para selecionar.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-emerald-700/50 shadow-md">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-[#1ba984] text-white text-xs font-bold uppercase tracking-wider border-b-2 border-emerald-800">
                    <th className="py-3 px-4 border-r border-emerald-600/50 w-[240px]">
                      Item / Prato
                    </th>
                    {CARDAPIO_HOSTS.map((host) => {
                      const isSelected = selectedHost.toLowerCase().trim() === host.toLowerCase().trim();
                      return (
                        <th
                          key={host}
                          onClick={() => setSelectedHost(host)}
                          className={`py-3 px-3 text-center border-r border-emerald-600/50 cursor-pointer transition-all hover:bg-emerald-600 ${
                            isSelected ? 'bg-emerald-900 text-amber-300 font-extrabold ring-2 ring-amber-300' : ''
                          }`}
                          title={`Clique para selecionar ${host}`}
                        >
                          {host}
                          {isSelected && <span className="block text-[9px] text-amber-300 font-normal">★ Selecionado</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-200/60 dark:divide-slate-700 text-xs bg-emerald-50/30 dark:bg-slate-800">
                  {CARDAPIO_MATRIX.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-emerald-50/40 dark:bg-slate-700/30'}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 border-r border-emerald-200/60 dark:border-slate-700">
                        {row.prato}
                      </td>
                      {CARDAPIO_HOSTS.map((host) => {
                        const isSelected = selectedHost.toLowerCase().trim() === host.toLowerCase().trim();
                        const quemLeva = row.atribuicoes[host] || '---';
                        const isHostSelf = quemLeva.toLowerCase().trim() === host.toLowerCase().trim();

                        return (
                          <td
                            key={host}
                            onClick={() => setSelectedHost(host)}
                            className={`py-2.5 px-3 text-center border-r border-emerald-200/60 dark:border-slate-700 font-semibold cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-100/50'
                            }`}
                          >
                            <span className={isHostSelf ? 'font-bold text-[#1C52A4] dark:text-amber-300' : ''}>
                              {quemLeva}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inscrição para Lembretes */}
      <div className="bg-[#1C52A4] text-white rounded-3xl p-6 shadow-md text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-[#C8952A]/20 mx-auto flex items-center justify-center text-[#EFD89A]">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-base font-bold text-white">
            Lembretes Oficiais por E-mail
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Cadastre seu e-mail para receber notificações e avisos de reuniões da Equipe 13.
          </p>
        </div>

        <form onSubmit={handleRegisterEmail} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
          <input
            type="email"
            placeholder="seu@email.com"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-[#C8952A]"
          />
          <button
            type="submit"
            disabled={submittingEmail}
            className="bg-[#C8952A] hover:bg-[#b08123] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {submittingEmail ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>

      {/* Team Members Directory Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C8952A]" />
                <h3 className="font-serif font-bold text-lg text-[#1C52A4] dark:text-amber-300">
                  Membros da Equipe 13 • ENS
                </h3>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contatos e funções dos 7 casais integrantes da Equipe 13.
            </p>

            <div className="space-y-3">
              {displayMembros.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-600 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#1C52A4] dark:text-amber-300">
                      {m.casal}
                    </h4>
                    {m.funcao && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1C52A4]/10 dark:bg-white/10 text-[#1C52A4] dark:text-amber-300">
                        {m.funcao}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C8952A] shrink-0" />
                      <span className="truncate">{m.marido}: {m.emailMarido}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C8952A] shrink-0" />
                      <span className="truncate">{m.esposa}: {m.emailEsposa}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase py-3 rounded-xl transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import {
  CASAIS_DA_EQUIPE,
  Reflexao,
  TemaAno,
  MONTH_THEME_MAPPING,
  getThemeCodeForMonth,
  getMonthNameForThemeCode
} from '../types';
import { addReflexao } from '../lib/firebase';

interface EstudoTabProps {
  reflexoes: Reflexao[];
  temasAnoList?: TemaAno[];
  refreshReflexoes: () => void;
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
}

export const EstudoTab: React.FC<EstudoTabProps> = ({
  reflexoes,
  temasAnoList = [],
  refreshReflexoes,
  onNotify
}) => {
  const [selectedCouple, setSelectedCouple] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return getThemeCodeForMonth(new Date().getMonth());
  });
  const [answers, setAnswers] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Find theme config for selected year
  const currentYearThemeConfig = temasAnoList.find(t => Number(t.year) === Number(selectedYear));
  const currentThemeTitle = currentYearThemeConfig?.temas?.[selectedTheme] || '';
  const monthNameForCurrentTheme = getMonthNameForThemeCode(selectedTheme);

  const getDraftKey = (couple: string, theme: string, year: number) =>
    `ens13_draft_${couple.trim()}_${String(theme).trim()}_${year}`;

  // Check duplicate submission
  useEffect(() => {
    if (!selectedCouple || !selectedTheme || !selectedYear) {
      setIsDuplicate(false);
      return;
    }
    const exists = reflexoes.some(
      r =>
        r.coupleName?.toLowerCase().trim() === selectedCouple.toLowerCase().trim() &&
        String(r.theme).trim() === String(selectedTheme).trim() &&
        Number(r.year) === Number(selectedYear)
    );
    setIsDuplicate(exists);
  }, [selectedCouple, selectedTheme, selectedYear, reflexoes]);

  // Load draft when couple or theme or year changes
  useEffect(() => {
    if (!selectedCouple || !selectedTheme || !selectedYear) {
      setDraftRestored(false);
      return;
    }

    const key = getDraftKey(selectedCouple, selectedTheme, selectedYear);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(a => a.trim().length > 0)) {
          setAnswers(parsed);
          setDraftRestored(true);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    setDraftRestored(false);
  }, [selectedCouple, selectedTheme, selectedYear]);

  // Auto-save draft when answers change
  useEffect(() => {
    if (!selectedCouple || !selectedTheme || !selectedYear) return;
    const hasContent = answers.some(a => a.trim().length > 0);
    const key = getDraftKey(selectedCouple, selectedTheme, selectedYear);
    if (hasContent) {
      try {
        localStorage.setItem(key, JSON.stringify(answers));
      } catch (e) {
        // ignore
      }
    }
  }, [answers, selectedCouple, selectedTheme, selectedYear]);

  const handleClearDraft = () => {
    if (selectedCouple && selectedTheme && selectedYear) {
      const key = getDraftKey(selectedCouple, selectedTheme, selectedYear);
      localStorage.removeItem(key);
    }
    setAnswers(['']);
    setDraftRestored(false);
  };

  const handleManualSaveDraft = () => {
    if (!selectedCouple) {
      onNotify('Selecione o casal para salvar o rascunho.', 'e');
      return;
    }
    const key = getDraftKey(selectedCouple, selectedTheme, selectedYear);
    try {
      localStorage.setItem(key, JSON.stringify(answers));
      onNotify('Rascunho salvo com segurança neste dispositivo!', 's');
    } catch (e) {
      onNotify('Erro ao salvar rascunho.', 'e');
    }
  };

  const handleMonthChange = (monthIdx: number) => {
    const code = getThemeCodeForMonth(monthIdx);
    setSelectedTheme(code);
  };

  const handleAddAnswerField = () => {
    if (answers.length < 6) {
      setAnswers([...answers, '']);
    }
  };

  const handleRemoveAnswerField = (index: number) => {
    if (answers.length <= 1) {
      setAnswers(['']);
      return;
    }
    const updated = answers.filter((_, i) => i !== index);
    setAnswers(updated);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCouple || !selectedTheme || !selectedYear) {
      onNotify('Por favor, selecione o Casal, o Tema e o Ano.', 'e');
      return;
    }

    if (isDuplicate) {
      onNotify('Este casal já enviou a reflexão para este tema.', 'e');
      return;
    }

    const validAnswers = answers.filter(a => a.trim().length > 0);
    if (validAnswers.length === 0) {
      onNotify('Escreva ao menos uma resposta para a reflexão.', 'e');
      return;
    }

    setSubmitting(true);
    try {
      // Safety timeout so button is never stuck
      const savePromise = addReflexao({
        coupleName: selectedCouple,
        theme: selectedTheme,
        year: selectedYear,
        answers: validAnswers,
        createdAt: new Date().toISOString()
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tempo limite de conexão excedido, mas suas respostas foram preservadas. Tente novamente.')),
          9000
        )
      );

      await Promise.race([savePromise, timeoutPromise]);

      onNotify('Reflexão enviada com sucesso!', 's');

      // Clear draft on success
      const key = getDraftKey(selectedCouple, selectedTheme, selectedYear);
      localStorage.removeItem(key);

      setAnswers(['']);
      setDraftRestored(false);
      refreshReflexoes();
    } catch (err: any) {
      console.error('Erro ao enviar reflexão:', err);
      onNotify(
        err?.message || 'Erro ao enviar reflexão. Suas respostas permanecem no formulário, tente novamente.',
        'e'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats for current selected theme and year
  const submittedCouples = reflexoes
    .filter(
      r =>
        String(r.theme) === String(selectedTheme) &&
        Number(r.year) === Number(selectedYear)
    )
    .map(r => r.coupleName);

  const missingCouples = CASAIS_DA_EQUIPE.filter(
    c => !submittedCouples.some(sc => sc.toLowerCase() === c.toLowerCase())
  );

  const totalCouples = CASAIS_DA_EQUIPE.length;
  const progressPercent = Math.round((submittedCouples.length / totalCouples) * 100);

  const availableThemeCodes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C52A4] dark:bg-amber-400 text-white dark:text-[#1C52A4] flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1C52A4] dark:text-amber-300">
              Estudo do Tema
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registre a reflexão mensal do casal para compartilhar com a equipe.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Month Selector Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C52A4] dark:text-amber-300">
          📅 Selecionar por Mês do Ano:
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MONTH_THEME_MAPPING.map(m => {
            const isSelected = getThemeCodeForMonth(m.monthIndex) === selectedTheme;
            return (
              <button
                key={m.monthIndex}
                type="button"
                onClick={() => handleMonthChange(m.monthIndex)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#1C52A4] text-white border-[#1C52A4] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {m.monthName} ({m.themeCode === '9' ? 'Tema 9 - Balanço' : `Tema ${m.themeCode}`})
              </button>
            );
          })}
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Casal *
              </label>
              <select
                value={selectedCouple}
                onChange={e => setSelectedCouple(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
              >
                <option value="">Selecione o casal...</option>
                {CASAIS_DA_EQUIPE.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Tema *
              </label>
              <select
                value={selectedTheme}
                onChange={e => setSelectedTheme(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
              >
                {availableThemeCodes.map(code => {
                  const mName = getMonthNameForThemeCode(code);
                  const title = currentYearThemeConfig?.temas?.[code];
                  let label = code === '9' ? 'Tema 9 (Balanço)' : `Tema ${code}`;
                  if (mName) label += ` (${mName})`;
                  if (title) label += ` — ${title}`;
                  return (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Ano *
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                required
                className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
              />
            </div>
          </div>

          {/* Current Theme Title Banner if set */}
          {currentThemeTitle && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-xs font-semibold text-[#1C52A4] dark:text-indigo-300 flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-[#1C52A4] text-white px-2 py-0.5 rounded-md">
                Tema {selectedTheme}{selectedTheme === '9' ? ' (Balanço)' : ''}
              </span>
              <span>{currentThemeTitle}</span>
              {monthNameForCurrentTheme && (
                <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Mês de {monthNameForCurrentTheme}
                </span>
              )}
            </div>
          )}

          {/* Auto-recovered draft alert */}
          {draftRestored && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Rascunho recuperado automaticamente neste aparelho!
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-[11px] underline hover:text-emerald-950 dark:hover:text-emerald-100 font-semibold shrink-0"
              >
                Descartar rascunho
              </button>
            </div>
          )}

          {/* Duplicate Warning */}
          {isDuplicate && (
            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              Este casal já enviou a reflexão para este tema!
            </div>
          )}

          {/* Dynamic Answer Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Respostas do Estudo ({answers.length} {answers.length === 1 ? 'questão' : 'questões'})
              </span>
            </div>

            {answers.map((ans, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C52A4] dark:text-amber-300">
                    Resposta {idx + 1}
                  </label>
                  {answers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnswerField(idx)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1"
                      title="Remover esta questão"
                    >
                      <Trash2 className="w-3 h-3" /> Remover
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={ans}
                  onChange={e => handleAnswerChange(idx, e.target.value)}
                  placeholder={`Escreva a reflexão / resposta ${idx + 1} do casal...`}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400 transition-all resize-y"
                />
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {answers.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddAnswerField}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#1C52A4] dark:text-amber-300 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Resposta
                </button>
              )}

              <button
                type="button"
                onClick={handleManualSaveDraft}
                title="Salvar rascunho no navegador para não perder"
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                Salvar Rascunho
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || isDuplicate}
              className="flex-1 sm:flex-initial bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg min-w-[170px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Reflexão</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress & Team Status */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C8952A]" />
              Participação dos Casais — Tema {selectedTheme}{selectedTheme === '9' ? ' (Balanço)' : ''}
              {monthNameForCurrentTheme ? ` (${monthNameForCurrentTheme})` : ''} ({selectedYear})
            </h3>
            {currentThemeTitle && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pl-6">
                "{currentThemeTitle}"
              </p>
            )}
          </div>
          <span className="font-serif font-bold text-lg text-[#1C52A4] dark:text-amber-300 self-end sm:self-auto">
            {submittedCouples.length}/{totalCouples}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#1C52A4] dark:bg-amber-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status summary tag */}
        <div className="pt-1">
          {missingCouples.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Todos os casais enviaram o estudo!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {submittedCouples.length} de {totalCouples} casais já enviaram ({progressPercent}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

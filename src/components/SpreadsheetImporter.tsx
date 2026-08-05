import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Trash2, Sliders, Sparkles } from 'lucide-react';
import { bulkImportCollection, wipeAllDatabaseData } from '../lib/firebase';

interface SpreadsheetImporterProps {
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
  refreshData: () => void;
}

type TargetType = 'reunioes' | 'eventos' | 'aniversarios' | 'casaisMes' | 'cardapio' | 'emails' | 'membros' | 'reflexoes';

interface TargetOption {
  key: TargetType;
  label: string;
  description: string;
  fields: { key: string; label: string; required?: boolean }[];
}

const TARGET_OPTIONS: TargetOption[] = [
  {
    key: 'reunioes',
    label: '📌 Reuniões Formais / Estudo',
    description: 'Data, Hora, Assunto/Modulo, Local, Responsável/Casal, Observações, Mês, Ano',
    fields: [
      { key: 'data', label: 'Data (ex: 15/01/2026)', required: true },
      { key: 'hora', label: 'Horário (ex: 20:00)' },
      { key: 'tipo', label: 'Assunto / Módulo / Tema' },
      { key: 'local', label: 'Local / Anfitrião' },
      { key: 'responsavel', label: 'Casal Responsável / Estudo' },
      { key: 'observacoes', label: 'Observações / Pauta' },
      { key: 'mes', label: 'Número do Mês (1-12)' },
      { key: 'ano', label: 'Ano (ex: 2026)' }
    ]
  },
  {
    key: 'reflexoes',
    label: '📖 Reflexões dos Temas (R1 a R5)',
    description: 'Data, Casal, Tema, Ano, R1, R2, R3, R4, R5',
    fields: [
      { key: 'data', label: 'Data (ex: 15/01/2026)' },
      { key: 'casal', label: 'Casal (ex: Thiago e Luana)', required: true },
      { key: 'tema', label: 'Tema (ex: 1, 2, 3...)', required: true },
      { key: 'ano', label: 'Ano (ex: 2026)' },
      { key: 'r1', label: 'Resposta 1 (R1)' },
      { key: 'r2', label: 'Resposta 2 (R2)' },
      { key: 'r3', label: 'Resposta 3 (R3)' },
      { key: 'r4', label: 'Resposta 4 (R4)' },
      { key: 'r5', label: 'Resposta 5 (R5)' }
    ]
  },
  {
    key: 'eventos',
    label: '📅 Eventos & Missas',
    description: 'Data, Hora, Evento/Missa, Local, Mês, Ano',
    fields: [
      { key: 'data', label: 'Data (ex: 20/01/2026)', required: true },
      { key: 'hora', label: 'Horário (ex: 19:30)' },
      { key: 'evento', label: 'Nome do Evento / Missa', required: true },
      { key: 'local', label: 'Local / Igreja' },
      { key: 'mes', label: 'Mês (1-12)' },
      { key: 'ano', label: 'Ano (ex: 2026)' }
    ]
  },
  {
    key: 'aniversarios',
    label: '🎉 Aniversários (Natalício / Matrimônio)',
    description: 'Dia/Data, Nome do Membro ou Casal, Tipo, Mês',
    fields: [
      { key: 'dia', label: 'Dia / Data (ex: 15/01)', required: true },
      { key: 'nome', label: 'Nome do Aniversariante / Casal', required: true },
      { key: 'tipo', label: 'Tipo ("Natalício" ou "Matrimônio")' },
      { key: 'mes', label: 'Número do Mês (1-12)' }
    ]
  },
  {
    key: 'casaisMes',
    label: '👥 Casais do Mês (Animador & Anfitrião)',
    description: 'Mês, Ano, Casal Animador, Casal Anfitrião',
    fields: [
      { key: 'mes', label: 'Mês (1-12)', required: true },
      { key: 'ano', label: 'Ano (2026)' },
      { key: 'animador', label: 'Casal Animador' },
      { key: 'anfitricao', label: 'Casal Anfitrião / Acolhida' }
    ]
  },
  {
    key: 'cardapio',
    label: '🍽️ Cardápio das Reuniões',
    description: 'Anfitrião, Prato/Lanche, Quem Leva',
    fields: [
      { key: 'anfitriao', label: 'Casa / Anfitrião' },
      { key: 'prato', label: 'Prato / Alimento / Lanche', required: true },
      { key: 'quem', label: 'Quem Leva / Casal Responsável' }
    ]
  },
  {
    key: 'emails',
    label: '✉️ Lista de E-mails',
    description: 'E-mail, Casal Responsável',
    fields: [
      { key: 'email', label: 'Endereço de E-mail', required: true },
      { key: 'casal', label: 'Nome do Casal / Membro' }
    ]
  },
  {
    key: 'membros',
    label: '👥 Membros da Equipe',
    description: 'Casal, Marido, Esposa, Telefone, Função',
    fields: [
      { key: 'casal', label: 'Nome do Casal', required: true },
      { key: 'marido', label: 'Nome do Marido' },
      { key: 'esposa', label: 'Nome da Esposa' },
      { key: 'emailMarido', label: 'E-mail Marido' },
      { key: 'emailEsposa', label: 'E-mail Esposa' },
      { key: 'telefone', label: 'Telefone / WhatsApp' },
      { key: 'funcao', label: 'Função na Equipe' }
    ]
  }
];

export const SpreadsheetImporter: React.FC<SpreadsheetImporterProps> = ({
  onNotify,
  refreshData
}) => {
  const [selectedTarget, setSelectedTarget] = useState<TargetType>('reunioes');
  const [sheetsUrl, setSheetsUrl] = useState<string>('');
  const [sheetTabName, setSheetTabName] = useState<string>('Reuniões');
  const [pastedText, setPastedText] = useState<string>('');
  const [fetchingUrl, setFetchingUrl] = useState<boolean>(false);
  const [clearExisting, setClearExisting] = useState<boolean>(true);
  
  // Matrix data from raw input
  const [rawMatrix, setRawMatrix] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [colIndex: number]: string }>({});
  
  const [importing, setImporting] = useState<boolean>(false);
  const [wiping, setWiping] = useState<boolean>(false);

  // Helper to normalize strings for comparison
  const norm = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const extractMonth = (dateStr: string): number => {
    if (!dateStr) return new Date().getMonth() + 1;
    const parts = dateStr.split(/[\/\.-]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) return m;
    }
    return new Date().getMonth() + 1;
  };

  // Detect best target category based on headers or content
  const autoDetectTargetCategory = (detectedHeaders: string[]): TargetType => {
    const combined = detectedHeaders.map(h => norm(h)).join(' ');
    if (combined.includes('r1') || combined.includes('r2') || combined.includes('reflexao') || combined.includes('reflexoes') || combined.includes('tema')) {
      return 'reflexoes';
    }
    if (combined.includes('evento') || combined.includes('missa') || combined.includes('celebracao')) {
      return 'eventos';
    }
    if (combined.includes('aniversario') || combined.includes('natalicio') || combined.includes('matrimonio')) {
      return 'aniversarios';
    }
    if (combined.includes('animador') || combined.includes('anfitricao') || combined.includes('casal do mes')) {
      return 'casaisMes';
    }
    if (combined.includes('prato') || combined.includes('lanche') || combined.includes('cardapio') || combined.includes('comida')) {
      return 'cardapio';
    }
    if (combined.includes('marido') || combined.includes('esposa') || combined.includes('funcao')) {
      return 'membros';
    }
    if (combined.includes('email') || combined.includes('e-mail')) {
      return 'emails';
    }
    return 'reunioes';
  };

  // Initial column auto-mapping generator
  const createAutoMapping = (detectedHeaders: string[], targetKey: TargetType) => {
    const targetOpt = TARGET_OPTIONS.find(o => o.key === targetKey);
    if (!targetOpt) return {};

    const mapping: { [colIndex: number]: string } = {};

    detectedHeaders.forEach((h, colIdx) => {
      const hNorm = norm(h);
      let matchedKey = '';

      // Try exact or partial matches with field keys & labels
      for (const field of targetOpt.fields) {
        const fKeyNorm = norm(field.key);
        const fLabelNorm = norm(field.label);

        if (
          hNorm.includes(fKeyNorm) ||
          fLabelNorm.includes(hNorm) ||
          hNorm.includes(fLabelNorm.split(' ')[0])
        ) {
          matchedKey = field.key;
          break;
        }
      }

      // Fallback heuristics for common terms
      if (!matchedKey) {
        if (hNorm.includes('data') || hNorm.includes('dia')) {
          matchedKey = targetOpt.fields.some(f => f.key === 'data') ? 'data' : (targetOpt.fields.some(f => f.key === 'dia') ? 'dia' : '');
        } else if (hNorm.includes('hora') || hNorm.includes('horario')) {
          matchedKey = 'hora';
        } else if (hNorm.includes('local') || hNorm.includes('onde') || hNorm.includes('casa') || hNorm.includes('igreja')) {
          matchedKey = targetOpt.fields.some(f => f.key === 'local') ? 'local' : (targetOpt.fields.some(f => f.key === 'anfitriao') ? 'anfitriao' : '');
        } else if (hNorm.includes('responsavel') || hNorm.includes('casal') || hNorm.includes('quem')) {
          matchedKey = targetOpt.fields.some(f => f.key === 'responsavel') ? 'responsavel' : (targetOpt.fields.some(f => f.key === 'quem') ? 'quem' : (targetOpt.fields.some(f => f.key === 'nome') ? 'nome' : ''));
        } else if (hNorm.includes('obs') || hNorm.includes('nota') || hNorm.includes('comentario') || hNorm.includes('pauta')) {
          matchedKey = 'observacoes';
        } else if (hNorm.includes('mes')) {
          matchedKey = 'mes';
        }
      }

      if (matchedKey && targetOpt.fields.some(f => f.key === matchedKey)) {
        mapping[colIdx] = matchedKey;
      } else {
        // If position matches standard sequence
        if (colIdx < targetOpt.fields.length) {
          mapping[colIdx] = targetOpt.fields[colIdx].key;
        } else {
          mapping[colIdx] = '';
        }
      }
    });

    return mapping;
  };

  // Process matrix after fetch/upload/paste
  const processMatrix = (matrix: string[][], overrideTarget?: TargetType) => {
    const validRows = matrix.filter(r => r && r.some(c => c && c.trim() !== ''));
    if (validRows.length === 0) {
      setRawMatrix([]);
      setHeaders([]);
      return;
    }

    setRawMatrix(validRows);

    // Row 0 as headers
    const rawHeaders = validRows[0].map((c, i) => (c && c.trim() ? c.trim() : `Coluna ${i + 1}`));
    setHeaders(rawHeaders);

    const autoTarget = overrideTarget || autoDetectTargetCategory(rawHeaders);
    setSelectedTarget(autoTarget);

    const initialMap = createAutoMapping(rawHeaders, autoTarget);
    setColumnMapping(initialMap);
  };

  // Handle target category button click
  const handleSelectTarget = (key: TargetType) => {
    setSelectedTarget(key);
    switch (key) {
      case 'reunioes': setSheetTabName('Reuniões'); break;
      case 'reflexoes': setSheetTabName('Reflexões'); break;
      case 'eventos': setSheetTabName('Eventos'); break;
      case 'aniversarios': setSheetTabName('Aniversários'); break;
      case 'casaisMes': setSheetTabName('Casais'); break;
      case 'cardapio': setSheetTabName('Cardápio'); break;
      case 'emails': setSheetTabName('Emails'); break;
      case 'membros': setSheetTabName('Membros'); break;
    }

    if (headers.length > 0) {
      const newMap = createAutoMapping(headers, key);
      setColumnMapping(newMap);
    }
  };

  // Fetch from Google Sheets endpoint
  const handleFetchGoogleSheetsUrl = async () => {
    if (!sheetsUrl.trim()) {
      onNotify('Insira o link da planilha do Google Sheets.', 'e');
      return;
    }

    setFetchingUrl(true);
    try {
      const resp = await fetch('/api/fetch-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sheetsUrl.trim(),
          sheetName: sheetTabName.trim()
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Erro ao buscar planilha');
      }

      const parsed = Papa.parse(data.csv, { skipEmptyLines: true });
      if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
        const matrix = parsed.data as string[][];
        processMatrix(matrix);
        onNotify(`Planilha do Google Sheets lida com sucesso! ${matrix.length} linhas encontradas.`, 's');
      } else {
        throw new Error('Nenhum dado encontrado no CSV retornado.');
      }
    } catch (err: any) {
      console.error('Error fetching sheet:', err);
      onNotify(`Erro ao carregar link: ${err.message}`, 'e');
    } finally {
      setFetchingUrl(false);
    }
  };

  // Wipe database action
  const handleWipeAll = async () => {
    setWiping(true);
    try {
      const res = await wipeAllDatabaseData();
      if (res.success) {
        onNotify('🎉 Todos os dados foram apagados! O banco está completamente limpo.', 's');
        refreshData();
        setRawMatrix([]);
        setHeaders([]);
        setPastedText('');
      } else {
        onNotify(res.message, 'e');
      }
    } catch (err: any) {
      onNotify('Erro ao zerar banco: ' + (err.message || 'Falha no servidor'), 'e');
    } finally {
      setWiping(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && Array.isArray(results.data)) {
          const matrix = results.data as string[][];
          processMatrix(matrix);
          onNotify(`Arquivo "${file.name}" lido. ${matrix.length} linhas encontradas.`, 'i');
        }
      },
      error: (err) => {
        onNotify('Erro ao ler arquivo: ' + err.message, 'e');
      }
    });
  };

  // Paste Text Handler
  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setRawMatrix([]);
      setHeaders([]);
      return;
    }

    const parsed = Papa.parse(text.trim(), {
      delimiter: '', // auto-detect tab / comma / semicolon
      skipEmptyLines: true
    });

    if (parsed.data && Array.isArray(parsed.data)) {
      const matrix = parsed.data as string[][];
      processMatrix(matrix);
    }
  };

  // Build mapped JSON objects for import
  const getMappedRecords = (): any[] => {
    if (rawMatrix.length <= 1) return [];

    const dataRows = rawMatrix.slice(1);
    const targetOpt = TARGET_OPTIONS.find(o => o.key === selectedTarget);
    if (!targetOpt) return [];

    return dataRows.map(row => {
      const record: any = {};

      headers.forEach((_, colIdx) => {
        const fieldKey = columnMapping[colIdx];
        if (fieldKey) {
          record[fieldKey] = (row[colIdx] || '').trim();
        }
      });

      // Apply smart type formatting / defaults per target
      if (selectedTarget === 'reflexoes') {
        const r1 = record.r1 || '';
        const r2 = record.r2 || '';
        const r3 = record.r3 || '';
        const r4 = record.r4 || '';
        const r5 = record.r5 || '';
        const answers = [r1, r2, r3, r4, r5].map(a => String(a || '').trim()).filter(a => a.length > 0);

        record.coupleName = record.casal || record.coupleName || '';
        record.theme = record.tema || record.theme || '1';
        record.year = record.ano ? parseInt(record.ano, 10) : (record.year ? parseInt(record.year, 10) : 2026);
        record.answers = answers.length > 0 ? answers : (record.answers || []);
        record.createdAt = record.data || record.createdAt || new Date().toISOString();

        delete record.casal;
        delete record.tema;
        delete record.ano;
        delete record.r1;
        delete record.r2;
        delete record.r3;
        delete record.r4;
        delete record.r5;
        delete record.data;
      } else if (selectedTarget === 'reunioes') {
        const dataStr = record.data || '';
        record.mes = record.mes ? parseInt(record.mes, 10) : extractMonth(dataStr);
        record.ano = record.ano ? parseInt(record.ano, 10) : 2026;
        record.hora = record.hora || '20:00';
        record.tipo = record.tipo || 'Reunião Formal';
        record.local = record.local || 'A definir';
      } else if (selectedTarget === 'eventos') {
        const dataStr = record.data || '';
        record.mes = record.mes ? parseInt(record.mes, 10) : extractMonth(dataStr);
        record.ano = record.ano ? parseInt(record.ano, 10) : 2026;
        record.hora = record.hora || '10:00';
        record.evento = record.evento || 'Evento ENS';
      } else if (selectedTarget === 'aniversarios') {
        const diaStr = record.dia || '';
        record.mes = record.mes ? parseInt(record.mes, 10) : extractMonth(diaStr);
        record.tipo = record.tipo || 'Natalício';
      } else if (selectedTarget === 'casaisMes') {
        record.mes = parseInt(record.mes || '1', 10);
        record.ano = parseInt(record.ano || '2026', 10);
      } else if (selectedTarget === 'emails') {
        record.createdAt = new Date().toISOString();
      }

      return record;
    }).filter(r => Object.values(r).some(v => v !== undefined && v !== '' && v !== null));
  };

  const handleExecuteImport = async () => {
    const records = getMappedRecords();
    if (records.length === 0) {
      onNotify('Nenhum registro mapeado para salvar.', 'e');
      return;
    }

    setImporting(true);
    try {
      const res = await bulkImportCollection(selectedTarget, records, clearExisting);
      if (res.success) {
        onNotify(`🎉 Importação concluída! ${res.count} registros salvos no destino "${selectedTarget}".`, 's');
        refreshData();
        setRawMatrix([]);
        setHeaders([]);
        setPastedText('');
      } else {
        onNotify(`Erro ao salvar: ${res.error}`, 'e');
      }
    } catch (err: any) {
      onNotify(`Erro inesperado: ${err.message}`, 'e');
    } finally {
      setImporting(false);
    }
  };

  const currentOption = TARGET_OPTIONS.find(o => o.key === selectedTarget);
  const mappedRecords = getMappedRecords();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1C52A4] flex items-center justify-center text-amber-400 shadow-md shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1C52A4] dark:text-amber-300">
              Importar Planilha do Google Sheets / Excel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Importe qualquer aba da sua planilha oficial para o aplicativo em poucos cliques.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWipeAll}
          disabled={wiping}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0"
        >
          {wiping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
          Zerar Banco de Dados
        </button>
      </div>

      {/* Target Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          1. Escolha o Destino no Aplicativo onde os dados serão salvos:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelectTarget(opt.key)}
              className={`p-3.5 rounded-2xl text-left border transition-all text-xs font-semibold ${
                selectedTarget === opt.key
                  ? 'bg-[#1C52A4] text-white border-[#1C52A4] shadow-md ring-2 ring-amber-400/50'
                  : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-[#1C52A4]'
              }`}
            >
              <div className="font-bold text-sm mb-1">{opt.label}</div>
              <div className="text-[11px] opacity-80 leading-tight line-clamp-2">
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Methods */}
      <div className="space-y-4 pt-2">
        {/* Method 1: Google Sheets URL */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-serif font-bold text-sm text-[#1C52A4] dark:text-emerald-300">
              Opção A: Buscar Direto do Link do Google Sheets
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Link da Planilha (URL):
              </label>
              <input
                type="url"
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/SUA_PLANILHA/edit#gid=0"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1C52A4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Nome da Aba no Google Sheets:
              </label>
              <input
                type="text"
                value={sheetTabName}
                onChange={(e) => setSheetTabName(e.target.value)}
                placeholder="Ex: Reuniões, Eventos..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1C52A4]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 items-center text-[10px]">
              <span className="font-bold text-slate-500">Abas Rápidas:</span>
              {['Reuniões', 'Eventos', 'Aniversários', 'Casais', 'Cardápio', 'Emails', 'Membros'].map((tName) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => setSheetTabName(tName)}
                  className={`px-2 py-1 rounded-md font-bold transition-all ${
                    sheetTabName === tName
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                  }`}
                >
                  {tName}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFetchGoogleSheetsUrl}
              disabled={fetchingUrl}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {fetchingUrl ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Carregar Dados
                </>
              )}
            </button>
          </div>
        </div>

        {/* Method B & C */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Opção B: Enviar Arquivo Baixado (.csv / .tsv)
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-7 h-7 text-[#C8952A]" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Clique para selecionar arquivo do seu computador
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Opção C: Copiar e Colar Tabela (Ctrl+C / Ctrl+V)
            </label>
            <textarea
              rows={3}
              value={pastedText}
              onChange={(e) => handlePastedTextChange(e.target.value)}
              placeholder="Copie as células no Google Sheets e cole aqui..."
              className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1C52A4]"
            />
          </div>
        </div>
      </div>

      {/* Column Mapper & Interactive Preview */}
      {headers.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1C52A4] dark:text-amber-300">
                  Mapeamento de Colunas ({headers.length} colunas encontradas)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Abaixo você vê as colunas da sua planilha. Selecione qual campo do aplicativo cada coluna representa:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5" />
              Salvar em: {currentOption?.label}
            </div>
          </div>

          {/* Column selector grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            {headers.map((h, colIdx) => (
              <div key={colIdx} className="space-y-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Coluna {colIdx + 1}: "{h}"
                </div>
                <select
                  value={columnMapping[colIdx] || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [colIdx]: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-[#1C52A4]"
                >
                  <option value="">-- Ignorar Coluna --</option>
                  {currentOption?.fields.map(f => (
                    <option key={f.key} value={f.key}>
                      ➜ {f.label} {f.required ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Clear existing toggle */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 p-3.5 rounded-2xl">
            <input
              type="checkbox"
              id="clearExisting"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="w-4 h-4 rounded text-[#1C52A4] focus:ring-[#1C52A4]"
            />
            <label htmlFor="clearExisting" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
              <strong className="font-bold">Substituir dados antigos:</strong> Apaga os registros atuais da coleção "{currentOption?.label}" no banco antes de gravar os novos.
            </label>
          </div>

          {/* Mapped Data Preview Table */}
          {mappedRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Pré-visualização dos {mappedRecords.length} registros mapeados:
                </h4>
              </div>

              <div className="overflow-x-auto max-h-64 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#1C52A4] text-amber-300 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      {currentOption?.fields.map(f => (
                        <th key={f.key} className="p-2.5">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {mappedRecords.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        {currentOption?.fields.map(f => (
                          <td key={f.key} className="p-2.5 whitespace-nowrap max-w-xs truncate font-mono text-[11px]">
                            {String(row[f.key] !== undefined && row[f.key] !== null && row[f.key] !== '' ? row[f.key] : '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Salvando no Banco de Dados...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Confirmar e Salvar {mappedRecords.length} Registros em "{currentOption?.label}"
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

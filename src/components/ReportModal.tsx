import React from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { Reflexao, CASAIS_DA_EQUIPE, TemaAno, getMonthNameForThemeCode } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tema: string;
  ano: number;
  reflexoes: Reflexao[];
  temasAnoList?: TemaAno[];
  totalCasais?: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  tema,
  ano,
  reflexoes,
  temasAnoList = [],
  totalCasais = CASAIS_DA_EQUIPE.length
}) => {
  if (!isOpen) return null;

  const currentYearThemeConfig = temasAnoList.find(t => Number(t.year) === Number(ano));
  const currentThemeTitle = currentYearThemeConfig?.temas?.[tema] || '';
  const monthName = getMonthNameForThemeCode(tema);

  const themeReflexoes = reflexoes.filter(
    r => String(r.theme) === String(tema) && Number(r.year) === Number(ano)
  );

  const handlePrint = () => {
    try {
      const printWin = window.open('', '_blank');
      if (printWin) {
        const contentHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>Relatório_Tema_${tema}_Equipe13</title>
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: 'Georgia', 'Times New Roman', serif; padding: 20px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #C8952A; padding-bottom: 15px; }
              .logo { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
              .title { font-size: 22px; font-weight: bold; color: #1C52A4; margin: 8px 0 2px 0; }
              .subtitle { font-size: 13px; font-weight: bold; color: #C8952A; letter-spacing: 2px; text-transform: uppercase; }
              .banner { background: #1C52A4; color: #F59E0B; text-align: center; padding: 10px; font-weight: bold; font-size: 14px; margin: 15px 0; border-radius: 8px; }
              .banner-title { font-size: 13px; font-weight: normal; color: #ffffff; margin-top: 4px; display: block; }
              .meta { text-align: center; font-size: 12px; font-style: italic; color: #64748b; margin-bottom: 20px; }
              .couple-card { margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
              .couple-name { font-size: 16px; font-weight: bold; color: #C8952A; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
              .answer-box { margin-left: 10px; margin-bottom: 12px; padding-left: 12px; border-left: 3px solid #C8952A; }
              .answer-title { font-size: 11px; font-weight: bold; color: #C8952A; text-transform: uppercase; margin-bottom: 3px; }
              .answer-text { font-size: 13px; color: #334155; white-space: pre-wrap; margin: 0; }
              .footer { text-align: center; font-size: 11px; font-style: italic; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="https://i.imgur.com/xLZMAXl.png" class="logo" alt="Equipe 13" />
              <div class="title">Nossa Senhora Desatadora dos Nós</div>
              <div class="subtitle">Equipe 13 • ENS</div>
            </div>
            <div class="banner">
              ESTUDO DO TEMA ${tema} ${monthName ? `(${monthName})` : ''} • ANO ${ano}
              ${currentThemeTitle ? `<span class="banner-title">"${currentThemeTitle}"</span>` : ''}
            </div>
            <div class="meta">${themeReflexoes.length} de ${totalCasais} casais responderam</div>
            ${
              themeReflexoes.length === 0
                ? '<p style="text-align:center; color:#94a3b8;">Nenhuma reflexão registrada para este tema até o momento.</p>'
                : themeReflexoes.map(item => `
                  <div class="couple-card">
                    <div class="couple-name">${item.coupleName}</div>
                    ${(item.answers && item.answers.length > 0)
                      ? item.answers.map((ans, i) => `
                        <div class="answer-box">
                          <div class="answer-title">Resposta ${i + 1} (R${i + 1})</div>
                          <p class="answer-text">${ans}</p>
                        </div>
                      `).join('')
                      : '<p style="font-style:italic; font-size:12px; color:#94a3b8; margin-left:10px;">(Nenhuma resposta registrada)</p>'
                    }
                  </div>
                `).join('')
            }
            <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR')} • Equipe 13-D — ENS</div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `;
        printWin.document.open();
        printWin.document.write(contentHtml);
        printWin.document.close();
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div id="printable-report" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto">
        {/* Modal Top Control Bar */}
        <div className="print:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C52A4] dark:text-amber-300">
            <FileText className="w-4 h-4 text-[#C8952A]" />
            Relatório do Diretor Espiritual
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 md:p-8 space-y-6 print:p-0 print:space-y-4">
          {/* Official Document Header */}
          <div className="text-center space-y-2">
            <img
              src="https://i.imgur.com/xLZMAXl.png"
              alt="Logo Equipe 13"
              className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-[#C8952A]/40 shadow-sm"
            />
            <h1 className="font-serif text-xl font-bold text-[#1C52A4] dark:text-amber-300 tracking-tight">
              Nossa Senhora Desatadora dos Nós
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C8952A]">
              Equipe 13 • ENS
            </p>
          </div>

          {/* Theme Banner */}
          <div className="bg-[#1C52A4] text-white py-2.5 px-4 text-center rounded-xl space-y-1">
            <h2 className="font-bold text-xs uppercase tracking-widest text-amber-200">
              ESTUDO DO TEMA {tema} {monthName ? `(${monthName})` : ''} • {ano}
            </h2>
            {currentThemeTitle && (
              <p className="text-xs font-medium text-slate-100 italic">
                "{currentThemeTitle}"
              </p>
            )}
          </div>

          {/* Participation Counter */}
          <div className="text-center">
            <p className="text-xs italic text-slate-500 dark:text-slate-400">
              {themeReflexoes.length} de {totalCasais} casais responderam
            </p>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Reflections List */}
          {themeReflexoes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              Nenhuma reflexão registrada para este tema até o momento.
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              {themeReflexoes.map((item, idx) => (
                <div key={item.id || idx} className="pt-4 first:pt-0 space-y-3">
                  <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#C8952A]">
                    {item.coupleName}
                  </h3>

                  {item.answers && item.answers.length > 0 ? (
                    item.answers.map((ans, ansIdx) => (
                      <div key={ansIdx} className="pl-3 border-l-2 border-[#C8952A]/30 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8952A] block">
                          Resposta {ansIdx + 1}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {ans}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-slate-400 pl-3">
                      (Nenhuma resposta registrada)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-700 pt-4" />

          {/* Document Footer */}
          <div className="text-center text-[10px] italic text-slate-400 dark:text-slate-500">
            Gerado em {new Date().toLocaleDateString('pt-BR')} • Equipe 13-D — ENS
          </div>
        </div>
      </div>
    </div>
  );
};

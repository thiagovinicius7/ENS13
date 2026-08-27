import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  Calendar,
  BookOpen,
  Users,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  Settings,
  Sparkles,
  Award,
  Church,
  Info,
  Upload,
  Image as ImageIcon,
  X,
  CalendarRange
} from 'lucide-react';
import {
  Reuniao,
  Evento,
  Aniversario,
  CasalMes,
  TemaAno,
  MONTHS,
  MONTH_THEME_MAPPING,
  getThemeCodeForMonth,
  getMonthNameForThemeCode
} from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface RoteiroTopico {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  description?: string;
  quoteText?: string;
  footerNote?: string;
}

export interface RoteiroProgramacaoItem {
  id: string;
  data: string;
  dia: string;
  evento: string;
  local: string;
  responsabilidade: string;
}

interface RoteiroReuniaoTabProps {
  reunioes: Reuniao[];
  eventos: Evento[];
  aniversarios: Aniversario[];
  casaisMesList: CasalMes[];
  temasAnoList?: TemaAno[];
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
}

// Logo oficial das Equipes de Nossa Senhora da ENS
export const ENS_OFFICIAL_LOGO_URL = 'https://www.ens.org.br/img/logo-ens.png';

export function EnsOfficialLogo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <img
        src={ENS_OFFICIAL_LOGO_URL}
        alt="Logo Oficial Equipes de Nossa Senhora"
        className={`${className} object-contain max-h-24 max-w-[280px]`}
        loading="eager"
      />
    </div>
  );
}

// Fallback logo oficial em SVG
export function EnsRingsLogo({ className = "w-36 h-20" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg viewBox="0 0 240 120" className="w-full h-auto drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 50 60 C 50 35, 80 30, 100 50 C 115 65, 125 80, 140 80 C 160 80, 185 65, 180 45 C 175 25, 150 25, 130 40 C 110 55, 95 75, 75 75 C 55 75, 50 65, 50 60 Z"
          stroke="#1C52A4"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          cx="120"
          cy="60"
          r="38"
          stroke="#F59E0B"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M 190 60 C 190 85, 160 90, 140 70 C 125 55, 115 40, 100 40 C 80 40, 55 55, 60 75 C 65 95, 90 95, 110 80 C 130 65, 145 45, 165 45 C 185 45, 190 55, 190 60 Z"
          stroke="#DC2626"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-serif text-[11px] tracking-wider text-slate-800 font-semibold mt-1 uppercase">
        Equipes de Nossa Senhora
      </span>
    </div>
  );
}

// Pintura clássica do casal em oração / lar em SVG com estética editorial
export function HolyCouplePaintingIllustration({ className = "w-44 h-44" }: { className?: string }) {
  return (
    <div className={`relative rounded-full p-1.5 bg-gradient-to-b from-[#C8952A] via-[#D4AF37] to-[#8C6218] shadow-md ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden relative bg-[#EFE8DC] flex items-center justify-center border-2 border-white/80">
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Room Background & Light Window */}
          <rect width="200" height="200" fill="#E4DCD0" />
          <rect x="80" y="20" width="80" height="90" fill="#D3E4ED" stroke="#8A7968" strokeWidth="2" />
          <line x1="120" y1="20" x2="120" y2="110" stroke="#8A7968" strokeWidth="1.5" />
          <line x1="80" y1="65" x2="160" y2="65" stroke="#8A7968" strokeWidth="1.5" />
          
          {/* Light Beam */}
          <polygon points="120,30 200,180 80,180 80,60" fill="#FFF8E7" opacity="0.35" />
          
          {/* Table with sewing / Bible */}
          <ellipse cx="120" cy="155" rx="55" ry="25" fill="#8B5A2B" />
          <ellipse cx="120" cy="150" rx="50" ry="20" fill="#A0693B" />
          <rect x="105" y="142" width="30" height="12" fill="#F8FAFC" rx="2" stroke="#475569" strokeWidth="1" />
          
          {/* Husband figure standing */}
          <ellipse cx="68" cy="72" rx="14" ry="16" fill="#D8B498" />
          <path d="M 58 65 Q 68 50 78 65 Q 82 72 78 78 Z" fill="#3D271D" />
          <path d="M 50 92 C 50 82, 85 82, 85 92 L 92 165 L 45 165 Z" fill="#2C3E50" />
          <path d="M 68 88 L 74 110 L 62 110 Z" fill="#FFFFFF" />
          <path d="M 50 96 C 50 115, 68 125, 78 120" stroke="#2C3E50" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="78" cy="120" rx="5" ry="5" fill="#D8B498" />
          
          {/* Wife figure sitting */}
          <ellipse cx="140" cy="85" rx="13" ry="15" fill="#E8C5AC" />
          <path d="M 130 80 Q 140 66 150 80 Q 152 90 145 96 Z" fill="#5A3825" />
          <path d="M 125 102 C 125 95, 155 95, 155 102 L 165 175 L 115 175 Z" fill="#5B84B1" />
          <path d="M 135 100 L 145 100 L 140 120 Z" fill="#FFF" />
          <path d="M 128 108 C 125 125, 135 140, 142 142" stroke="#5B84B1" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="142" cy="142" rx="4.5" ry="4.5" fill="#E8C5AC" />
          
          {/* Subtle cross on wall */}
          <rect x="35" y="35" width="4" height="18" fill="#5A3825" />
          <rect x="29" y="40" width="16" height="4" fill="#5A3825" />
        </svg>
      </div>
    </div>
  );
}

// Tópicos Padrão do Roteiro Oficial ENS
const DEFAULT_TOPICOS: RoteiroTopico[] = [
  {
    id: 'topico-1',
    number: '01',
    title: 'Acolhida',
    subtitle: '1.1 Oração do Espírito Santo',
    description: ''
  },
  {
    id: 'topico-2',
    number: '02',
    title: 'Bênção dos Alimentos',
    subtitle: '2.1 Café da manhã / Coparticipação',
    description: 'Esse é o momento em que os casais falam dos acontecimentos importantes que viveram depois da última reunião. Tenhamos escuta atenta, pois é um tempo forte de ajuda mútua e de oração pelo nosso amigo equipista.'
  },
  {
    id: 'topico-3',
    number: '03',
    title: 'Ruptura',
    description: 'Neste momento em que separamos o social do espiritual, peçamos a Nossa Senhora Desatadora dos Nós que abençoe nossas famílias para que sigam, neste mundo, o exemplo da Família de Nazaré.'
  },
  {
    id: 'topico-4',
    number: '04',
    title: 'Tema da Reunião',
    subtitle: '5.1 Texto Bíblico — Colossenses 3, 12-17',
    description: 'Sob a luz do Espírito Santo, vamos fazer uma reflexão sobre o que Jesus nos fala através de sua Palavra.'
  },
  {
    id: 'topico-5',
    number: '05',
    title: 'PCE — "O Dever de Sentar-se" (CRE)',
    subtitle: '4.1 Oração para antes da Partilha',
    quoteText: 'Senhor Jesus Cristo, no momento de fazermos a nossa partilha, compreendemos melhor que somos em vós, membros uns dos outros. Dai-nos a graça de nos recolhermos perante Vossa misteriosa presença em nós. Pela vida conjugal, por onde nos haveis chamado, deste-nos, Senhor, o sentido do amor: desejar e procurar fazer o bem um do outro. Fazei que o amor fraterno una sempre os casais da equipe. Fazei nossa caridade nem cega nem falsa. Ajudai-nos a manifestar-nos uns aos outros com caridade e lealdade. Ajudai-nos a revelar as nossas faltas, para pedirmos perdão à equipe com o peso que a sobrecarregamos. Ajudai-nos, também, a cantar os nossos sucessos com humildade. Para que sejam ocasião de ação de graças de todos vós, Senhor; para que fortaleçam os que duvidam, os que penam, os que vacilam. Que esta partilha nos ajude a tomar consciência das nossas responsabilidades mútuas e a sermos coerentes. Amém.'
  },
  {
    id: 'topico-6',
    number: '06',
    title: 'Intenções e Intercessões (Crucifixo)',
    description: 'Este é o momento de nos apresentarmos a Deus e buscarmos a sua misericórdia por meio da intercessão de Nossa Senhora Desatadora dos Nós; nossas intenções se unirão às intenções de todas as Equipes na oração do Magnificat.',
    footerNote: 'No final da oração, dizei: Rezemos ao Senhor.  |  Todos: Senhor, escutai a nossa prece.'
  },
  {
    id: 'topico-7',
    number: '07',
    title: 'Oração de Nossa Senhora Desatadora dos Nós',
    quoteText: 'Santa Maria, Mãe de Deus, Virgem cheia de graça, vós sois a nossa Desatadora dos Nós. Com as vossas mãos cheias do amor de Deus, vós desatais os obstáculos de nosso caminho, como nós que se desfazem e se tornam uma fita reta do amor do Pai. Desatai, Virgem e Mãe, Santa e admirável, todos os nós que criamos por vontade própria, e todos os nós que impedem o nosso caminho. Lançai vossos olhos de luz sobre eles, para que todos os nós se desatem e, para que, cheios de gratidão, possamos, por vossas mãos, solucionar aquilo que nos parece impossível. Amém.'
  },
  {
    id: 'topico-8',
    number: '08',
    title: 'Avisos',
    description: 'Programação de eventos e aniversariantes do mês.'
  },
  {
    id: 'topico-9',
    number: '09',
    title: 'Magnificat',
    quoteText: `O Poderoso fez em mim maravilhas, e Santo é seu nome!

A minh'alma engrandece o Senhor, exulta meu espírito em Deus, meu Salvador!
Porque olhou para a humildade de sua serva, doravante as gerações hão de chamar-me de bendita!

O Poderoso fez em mim maravilhas, e Santo é seu nome!

Seu amor para sempre se estende, sobre aqueles que O temem!
Manifesta o poder de seu braço, dispersa os soberbos;
derruba os poderosos de seus tronos e eleva os humildes;
sacia de bens os famintos, despede os ricos sem nada.

Acolhe Israel, seu servidor, fiel ao seu amor,
como havia prometido a nossos pais, em favor de Abraão e de seus filhos para sempre!

Glória ao Pai, ao Filho e ao Espírito Santo, como era no princípio, agora e sempre.

AMÉM`
  }
];

export const RoteiroReuniaoTab: React.FC<RoteiroReuniaoTabProps> = ({
  reunioes,
  eventos,
  aniversarios,
  casaisMesList,
  temasAnoList = [],
  onNotify
}) => {
  // Config state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1..12
  const [selectedThemeCode, setSelectedThemeCode] = useState<string>(() => {
    return getThemeCodeForMonth(new Date().getMonth());
  });

  // Imagem anexada para a capa do mês
  const [coverCustomImage, setCoverCustomImage] = useState<string | null>(null);

  // Modo de avisos e aniversariantes (1 mês ou 2 meses combinados)
  const [isDualMonthAvisos, setIsDualMonthAvisos] = useState<boolean>(false);
  const [secondMonth, setSecondMonth] = useState<number>(() => {
    const cur = new Date().getMonth() + 1;
    return cur === 12 ? 1 : cur + 1;
  });

  const [livroAno, setLivroAno] = useState<string>('O Amor é Muito Mais que Amor');
  const [capituloTema, setCapituloTema] = useState<string>('Capítulo 5 — Curar o Amor');
  const [textoBiblico, setTextoBiblico] = useState<string>('Colossenses 3, 12-17');
  const [casalAnfitriao, setCasalAnfitriao] = useState<string>('Pâmela e Gláucio');
  const [casalResponsavel, setCasalResponsavel] = useState<string>('Patrícia e Mota');
  const [equipeNome, setEquipeNome] = useState<string>('EQUIPES DE NOSSA SENHORA · EQUIPE 13 D');
  const [setorNome, setSetorNome] = useState<string>('Equipe 13 D — Setor D');
  const [invocacaoRodape, setInvocacaoRodape] = useState<string>('NOSSA SENHORA DESATADORA DOS NÓS, ROGAI POR NÓS');

  // Topics and Programming
  const [topicos, setTopicos] = useState<RoteiroTopico[]>(DEFAULT_TOPICOS);
  const [programacaoItems, setProgramacaoItems] = useState<RoteiroProgramacaoItem[]>([]);
  const [aniversariantesList, setAniversariantesList] = useState<string[]>([]);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler for cover image
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'e');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCoverCustomImage(base64);
      onNotify('📷 Imagem da capa anexada com sucesso!', 's');
    };
    reader.onerror = () => {
      onNotify('Erro ao ler o arquivo de imagem.', 'e');
    };
    reader.readAsDataURL(file);
  };

  // Sync with system data when month / year / theme / dual month changes
  const syncFromSystem = () => {
    // 1. Theme title & chapter
    const currentYearThemeConfig = temasAnoList.find(t => Number(t.year) === Number(selectedYear));
    const registeredTitle = currentYearThemeConfig?.temas?.[selectedThemeCode];

    let newCapitulo = '';
    if (selectedThemeCode === '0') {
      newCapitulo = registeredTitle || 'Introdução — Reunião de Amizade';
    } else if (selectedThemeCode === '9') {
      newCapitulo = registeredTitle || 'Balanço da Equipe';
    } else {
      newCapitulo = registeredTitle ? `Capítulo ${selectedThemeCode} — ${registeredTitle}` : `Capítulo ${selectedThemeCode}`;
    }
    setCapituloTema(newCapitulo);

    // Update topic 04 title
    setTopicos(prev =>
      prev.map(t => {
        if (t.number === '04' || t.title.toLowerCase().includes('tema da reunião')) {
          return {
            ...t,
            title: `Tema da Reunião: ${registeredTitle || capituloTema.replace(/^Capítulo \d+ — /, '')}`,
            subtitle: `5.1 Texto Bíblico — ${textoBiblico}`
          };
        }
        return t;
      })
    );

    // 2. Casais da Escala do Mês Principal
    const casalMes = casaisMesList.find(
      c => Number(c.mes) === Number(selectedMonth) && Number(c.ano) === Number(selectedYear)
    );
    if (casalMes) {
      if (casalMes.anfitricao) setCasalAnfitriao(casalMes.anfitricao);
      if (casalMes.animador) setCasalResponsavel(casalMes.animador);
    } else {
      // Look in reunioes for this month
      const reuniaoFormal = reunioes.find(
        r => Number(r.mes) === Number(selectedMonth) && r.tipo?.toLowerCase().includes('formal')
      );
      if (reuniaoFormal) {
        if (reuniaoFormal.local) setCasalAnfitriao(reuniaoFormal.local);
        if (reuniaoFormal.responsavel) setCasalResponsavel(reuniaoFormal.responsavel);
      }
    }

    // 3. Programação (1 mês ou 2 meses combinados)
    const targetMonths = isDualMonthAvisos ? [selectedMonth, secondMonth] : [selectedMonth];
    
    const mesEventos = eventos.filter(e => targetMonths.includes(Number(e.mes)));
    const mesReunioes = reunioes.filter(r => targetMonths.includes(Number(r.mes)));

    const combinedList: RoteiroProgramacaoItem[] = [];

    // Helper to calculate weekday name
    const getDiaSemana = (dateStr: string, defaultDia: string = '—') => {
      try {
        const parts = dateStr.split('/');
        if (parts.length >= 2) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parts[2] ? parseInt(parts[2], 10) : selectedYear;
          const d = new Date(year, month, day);
          const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          return dayNames[d.getDay()];
        }
      } catch (e) {}
      return defaultDia;
    };

    mesEventos.forEach(ev => {
      combinedList.push({
        id: ev.id || `ev-${Math.random()}`,
        data: ev.data || '',
        dia: getDiaSemana(ev.data, '—'),
        evento: ev.evento || '',
        local: ev.local || '—',
        responsabilidade: '—'
      });
    });

    mesReunioes.forEach(r => {
      combinedList.push({
        id: r.id || `reu-${Math.random()}`,
        data: r.data || '',
        dia: getDiaSemana(r.data, 'Sábado'),
        evento: r.tipo || 'Reunião Formal',
        local: r.local || casalAnfitriao || '—',
        responsabilidade: r.responsavel || casalResponsavel || '—'
      });
    });

    // Sort by month then day
    combinedList.sort((a, b) => {
      const partsA = a.data.split('/');
      const partsB = b.data.split('/');
      const monthA = partsA[1] ? parseInt(partsA[1], 10) : selectedMonth;
      const monthB = partsB[1] ? parseInt(partsB[1], 10) : selectedMonth;
      if (monthA !== monthB) return monthA - monthB;
      const dayA = partsA[0] ? parseInt(partsA[0], 10) : 0;
      const dayB = partsB[0] ? parseInt(partsB[0], 10) : 0;
      return dayA - dayB;
    });

    setProgramacaoItems(combinedList);

    // 4. Aniversariantes (1 mês ou 2 meses combinados)
    const mesAniversarios = aniversarios.filter(a => targetMonths.includes(Number(a.mes)));
    
    // Sort birthdays by month then day
    mesAniversarios.sort((a, b) => {
      if (Number(a.mes) !== Number(b.mes)) return Number(a.mes) - Number(b.mes);
      return Number(a.dia) - Number(b.dia);
    });

    const anivFormatted = mesAniversarios.map(a => {
      const tipoTag = a.tipo ? ` (${a.tipo})` : '';
      const mesPrefix = isDualMonthAvisos ? `[${MONTHS[Number(a.mes) - 1].slice(0, 3)}] ` : '';
      return `${mesPrefix}${a.dia} — ${a.nome}${tipoTag}`;
    });
    setAniversariantesList(anivFormatted);

    const mesDesc = isDualMonthAvisos 
      ? `${MONTHS[selectedMonth - 1]} e ${MONTHS[secondMonth - 1]}`
      : `${MONTHS[selectedMonth - 1]}`;

    onNotify(`✨ Dados do período (${mesDesc}) sincronizados com sucesso!`, 's');
  };

  // Auto-sync when theme/month/dualMonth changes
  useEffect(() => {
    syncFromSystem();
  }, [selectedThemeCode, selectedMonth, selectedYear, isDualMonthAvisos, secondMonth]);

  // Update topic 04 subtitle when textoBiblico changes
  useEffect(() => {
    setTopicos(prev =>
      prev.map(t => {
        if (t.number === '04' || t.title.toLowerCase().includes('tema da reunião')) {
          return {
            ...t,
            subtitle: `5.1 Texto Bíblico — ${textoBiblico}`
          };
        }
        return t;
      })
    );
  }, [textoBiblico]);

  // Topic manipulation
  const moveTopic = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === topicos.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...topicos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTopicos(updated);
    onNotify('Ordem dos tópicos atualizada!', 's');
  };

  const handleUpdateTopicField = (id: string, field: keyof RoteiroTopico, value: string) => {
    setTopicos(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddCustomTopic = () => {
    const newNum = String(topicos.length + 1).padStart(2, '0');
    const newTopic: RoteiroTopico = {
      id: `custom-${Date.now()}`,
      number: newNum,
      title: 'Novo Tópico',
      subtitle: '',
      description: 'Descrição do tópico...'
    };
    setTopicos([...topicos, newTopic]);
    setEditingTopicId(newTopic.id);
    onNotify('Novo tópico adicionado!', 's');
  };

  const handleDeleteTopic = (id: string) => {
    if (topicos.length <= 1) {
      onNotify('O roteiro deve conter pelo menos um tópico.', 'e');
      return;
    }
    setTopicos(topicos.filter(t => t.id !== id));
    onNotify('Tópico removido do roteiro.', 's');
  };

  const handleResetTopics = () => {
    setTopicos(DEFAULT_TOPICOS);
    onNotify('Tópicos restaurados para a estrutura oficial das ENS.', 'i');
  };

  // Programação table manipulation
  const handleAddProgramacaoRow = () => {
    const newItem: RoteiroProgramacaoItem = {
      id: `prog-${Date.now()}`,
      data: `${String(new Date().getDate()).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}`,
      dia: 'Sábado',
      evento: 'Novo Evento',
      local: '—',
      responsabilidade: '—'
    };
    setProgramacaoItems([...programacaoItems, newItem]);
  };

  const handleUpdateProgramacaoRow = (id: string, field: keyof RoteiroProgramacaoItem, value: string) => {
    setProgramacaoItems(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleDeleteProgramacaoRow = (id: string) => {
    setProgramacaoItems(programacaoItems.filter(p => p.id !== id));
  };

  // Native Print / Save to PDF
  const handleNativePrint = () => {
    window.print();
  };

  // Generate & Download PDF using html2canvas and jsPDF
  const handleDownloadPdf = async () => {
    if (!pdfContainerRef.current) return;
    setIsGeneratingPdf(true);
    onNotify('Gerando arquivo PDF de alta precisão... aguarde.', 'i');

    try {
      const pages = pdfContainerRef.current.querySelectorAll<HTMLElement>('.pdf-page-sheet');
      if (pages.length === 0) {
        throw new Error('Nenhuma página encontrada para gerar.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FAF8F5',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          windowHeight: 1123
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const mesNome = isDualMonthAvisos
        ? `${MONTHS[selectedMonth - 1]}_${MONTHS[secondMonth - 1]}`
        : (MONTHS[selectedMonth - 1] || 'Reuniao');
      pdf.save(`Roteiro_Formal_Equipe13_${mesNome}_${selectedYear}.pdf`);
      onNotify('🎉 PDF oficial gerado e baixado com sucesso!', 's');
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      onNotify('Erro ao gerar PDF: ' + (err.message || 'Tente imprimir pelo navegador.'), 'e');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const monthName = MONTHS[selectedMonth - 1] || 'Mês';

  // Group topics for page distribution (matching the 5-page layout of the model)
  // Page 2: Topics 01, 02, 03, 04
  // Page 3: Topics 05, 06, 07
  // Page 4: Topic 08 (Avisos: Programação + Aniversariantes)
  // Page 5: Topic 09 (Magnificat)
  const topicosPage2 = topicos.slice(0, 4);
  const topicosPage3 = topicos.slice(4, 7);
  const topicoAvisos = topicos.find(t => t.number === '08' || t.title.toLowerCase().includes('aviso')) || topicos[7];
  const topicoMagnificat = topicos.find(t => t.number === '09' || t.title.toLowerCase().includes('magnificat')) || topicos[8];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1C52A4] via-[#2A3B5C] to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Documento Oficial ENS
            </span>
            <span className="text-xs text-amber-200">Equipe 13 D • Ano {selectedYear}</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-amber-300 flex items-center gap-3">
            <FileText className="w-7 h-7 text-amber-400" /> Roteiro da Reunião Formal
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Configure o tema, texto bíblico, escala do mês, avisos e aniversariantes para gerar o PDF oficial de 5 páginas diagramado no padrão das Equipes de Nossa Senhora.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setPreviewMode(previewMode === 'editor' ? 'preview' : 'editor')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            {previewMode === 'editor' ? '👁️ Ver Prévia PDF' : '✏️ Voltar ao Editor'}
          </button>

          <button
            onClick={handleNativePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
            title="Abre a janela nativa de impressão/PDF do navegador"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md font-extrabold disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
            {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF (.pdf)'}
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setPreviewMode('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            previewMode === 'editor'
              ? 'bg-[#1C52A4] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" /> Painel de Edição e Configuração
        </button>

        <button
          onClick={() => setPreviewMode('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            previewMode === 'preview'
              ? 'bg-[#1C52A4] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" /> Pré-visualização do Modelo PDF (5 Páginas)
        </button>

        <button
          onClick={syncFromSystem}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1C52A4] dark:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
          title="Recarregar dados do banco de dados para este mês"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sincronizar do Sistema
        </button>
      </div>

      {/* EDITOR FORM VIEW */}
      {previewMode === 'editor' && (
        <div className="space-y-6">
          {/* Card 1: Seleção de Tema, Mês e Dados da Reunião */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                1. Escolha do Tema e Dados da Reunião
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Puxa automaticamente título, capítulo, casal anfitrião e avisos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Seletor de Tema */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Tema Cadastrado *
                </label>
                <select
                  value={selectedThemeCode}
                  onChange={e => setSelectedThemeCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
                >
                  {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(code => {
                    const cfg = temasAnoList.find(t => Number(t.year) === Number(selectedYear));
                    const title = cfg?.temas?.[code];
                    const label = code === '9' ? 'Tema 9 (Balanço)' : `Tema ${code}`;
                    return (
                      <option key={code} value={code}>
                        {label} {title ? `— ${title}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Seletor de Mês */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Mês da Reunião *
                </label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ano */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Ano *
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
                />
              </div>

              {/* 5.1 Texto Bíblico (Destaque) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                  📖 5.1 Texto Bíblico (Muda a cada reunião) *
                </label>
                <input
                  type="text"
                  value={textoBiblico}
                  onChange={e => setTextoBiblico(e.target.value)}
                  placeholder="Ex: Colossenses 3, 12-17"
                  className="w-full bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-700 rounded-xl p-2.5 text-xs font-bold text-rose-900 dark:text-rose-200 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Linha 2 de Parâmetros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Livro / Tema Geral do Ano
                </label>
                <input
                  type="text"
                  value={livroAno}
                  onChange={e => setLivroAno(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Capítulo e Título da Reunião
                </label>
                <input
                  type="text"
                  value={capituloTema}
                  onChange={e => setCapituloTema(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Casa de (Anfitrião) *
                </label>
                <input
                  type="text"
                  value={casalAnfitriao}
                  onChange={e => setCasalAnfitriao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Casal Animador do Mês *
                </label>
                <input
                  type="text"
                  value={casalResponsavel}
                  onChange={e => setCasalResponsavel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Anexar Imagem para a Capa */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {coverCustomImage ? (
                      <img
                        src={coverCustomImage}
                        alt="Preview Capa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Imagem da Capa do Mês
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {coverCustomImage
                        ? 'Imagem personalizada anexada para esta capa mensal.'
                        : 'Utilizando a ilustração sagrada padrão. Você pode anexar uma foto ou imagem para cada mês.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCoverImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C52A4] text-white hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {coverCustomImage ? 'Trocar Imagem da Capa' : 'Anexar Imagem da Capa'}
                  </button>

                  {coverCustomImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverCustomImage(null);
                        onNotify('Imagem personalizada removida da capa.', 'i');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Gestor de Tópicos Fixos e Reordenáveis */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  2. Tópicos do Roteiro (Mover, Editar, Adicionar)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Os tópicos vêm pré-configurados no padrão ENS mas você pode movê-los de lugar ou alterar seus textos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomTopic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C52A4] text-white hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Tópico
                </button>
                <button
                  type="button"
                  onClick={handleResetTopics}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  title="Restaurar lista original"
                >
                  Restaurar Padrão
                </button>
              </div>
            </div>

            {/* List of draggable / reorderable topics */}
            <div className="space-y-3">
              {topicos.map((topico, idx) => {
                const isEditing = editingTopicId === topico.id;
                return (
                  <div
                    key={topico.id}
                    className="border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6B2D38] text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm shrink-0">
                          {topico.number}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {topico.title}
                          </h4>
                          {topico.subtitle && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold block">
                              {topico.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reorder and Edit Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveTopic(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTopic(idx, 'down')}
                          disabled={idx === topicos.length - 1}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTopicId(isEditing ? null : topico.id)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                            isEditing
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditing ? 'Fechar' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(topico.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-100"
                          title="Excluir tópico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Topic inline editor */}
                    {isEditing && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Número / Identificador
                            </label>
                            <input
                              type="text"
                              value={topico.number}
                              onChange={e => handleUpdateTopicField(topico.id, 'number', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Título do Tópico
                            </label>
                            <input
                              type="text"
                              value={topico.title}
                              onChange={e => handleUpdateTopicField(topico.id, 'title', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Subtítulo (Ex: 1.1 Oração, 5.1 Texto Bíblico)
                          </label>
                          <input
                            type="text"
                            value={topico.subtitle || ''}
                            onChange={e => handleUpdateTopicField(topico.id, 'subtitle', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Texto Explicativo / Contexto
                          </label>
                          <textarea
                            rows={2}
                            value={topico.description || ''}
                            onChange={e => handleUpdateTopicField(topico.id, 'description', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Caixa de Citação / Oração Completa
                          </label>
                          <textarea
                            rows={4}
                            value={topico.quoteText || ''}
                            onChange={e => handleUpdateTopicField(topico.id, 'quoteText', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-serif italic"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Avisos — Programação do Mês e Aniversariantes */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  3. Tabela de Avisos & Programação
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preenchido automaticamente dos eventos e reuniões cadastrados. Escolha um único mês ou junte dois meses se precisar.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddProgramacaoRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C52A4] text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Linha de Evento
              </button>
            </div>

            {/* Configuração do Período de Avisos / Aniversariantes */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-0.5">
                    Modo do Período de Avisos e Aniversariantes
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Defina se este roteiro mostrará avisos de um mês ou juntará dois meses juntos (ex: Julho + Agosto).
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setIsDualMonthAvisos(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !isDualMonthAvisos
                        ? 'bg-[#1C52A4] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Mês Único ({monthName})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDualMonthAvisos(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isDualMonthAvisos
                        ? 'bg-[#1C52A4] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" /> Juntar 2 Meses
                  </button>
                </div>
              </div>

              {isDualMonthAvisos && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-600">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      1º Mês do Período
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      2º Mês do Período (Adicional)
                    </label>
                    <select
                      value={secondMonth}
                      onChange={e => setSecondMonth(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#6B2D38] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">DATA</th>
                    <th className="p-2.5">DIA</th>
                    <th className="p-2.5">EVENTO</th>
                    <th className="p-2.5">LOCAL</th>
                    <th className="p-2.5">RESPONSABILIDADE</th>
                    <th className="p-2.5 text-center rounded-r-lg">AÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {programacaoItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-slate-400 italic">
                        Nenhum evento na programação. Clique em "Adicionar Linha" ou "Sincronizar do Sistema".
                      </td>
                    </tr>
                  ) : (
                    programacaoItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.data}
                            onChange={e => handleUpdateProgramacaoRow(item.id, 'data', e.target.value)}
                            className="w-20 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-1 font-bold text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.dia}
                            onChange={e => handleUpdateProgramacaoRow(item.id, 'dia', e.target.value)}
                            className="w-24 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.evento}
                            onChange={e => handleUpdateProgramacaoRow(item.id, 'evento', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-1 text-xs font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.local}
                            onChange={e => handleUpdateProgramacaoRow(item.id, 'local', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.responsabilidade}
                            onChange={e => handleUpdateProgramacaoRow(item.id, 'responsabilidade', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-1 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteProgramacaoRow(item.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Aniversariantes do Período */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                🎂 Aniversariantes {isDualMonthAvisos ? `(${monthName} e ${MONTHS[secondMonth - 1]} / ${selectedYear})` : `(${monthName}/${selectedYear})`}
              </label>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1.5">
                {aniversariantesList.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Não há aniversariantes cadastrados para este período.
                  </p>
                ) : (
                  aniversariantesList.map((aniv, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-[#C8952A]" />
                      <span className="font-semibold">{aniv}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PDF PREVIEW (5 PÁGINAS DIAGRAMADAS FIÉIS AO MODELO) */}
      <div className={`${previewMode === 'editor' ? 'hidden' : 'block'} space-y-6`}>
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              Esta é a visualização exata de como o roteiro será impresso ou baixado em PDF A4 (5 Páginas).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNativePrint}
              className="px-3.5 py-1.5 bg-[#1C52A4] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar PDF
            </button>
          </div>
        </div>

        {/* PRINT CONTAINER */}
        <div
          ref={pdfContainerRef}
          id="roteiro-pdf-printable-doc"
          className="flex flex-col items-center gap-8 py-4 bg-slate-300/60 dark:bg-slate-900/60 p-4 md:p-8 rounded-3xl overflow-x-auto"
        >
          {/* ========================================================================= */}
          {/* PÁGINA 1: CAPA OFICIAL (COVER PAGE) */}
          {/* ========================================================================= */}
          <div
            className="pdf-page-sheet w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-[#FAF8F5] text-slate-900 shadow-2xl p-[14mm] md:p-[16mm] flex flex-col justify-between items-center relative overflow-hidden font-sans border border-stone-300 box-border"
          >
            {/* Top Header com Textos Oficiais na Ordem Solicitada */}
            <div className="w-full text-center pt-1 space-y-1 border-b border-stone-300/70 pb-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-700">
                REGIÃO CENTRO OESTE III – SETOR D
              </p>
              <p className="text-[13px] font-black uppercase tracking-[0.16em] text-slate-900 font-serif">
                EQUIPE 13 – NOSSA SENHORA DESATADORA DOS NÓS
              </p>
              <p className="text-[13px] font-black uppercase tracking-[0.25em] text-[#6B2D38]">
                REUNIÃO FORMAL
              </p>
            </div>

            {/* Middle Section: Logo Oficial ENS + Imagem Anexada + Títulos */}
            <div className="flex flex-col items-center justify-center space-y-3.5 my-auto w-full">
              {/* Logo Oficial Obrigatório das Equipes de Nossa Senhora */}
              <div className="flex flex-col items-center justify-center pt-0.5">
                <EnsOfficialLogo className="h-16 md:h-18 w-auto drop-shadow-xs" />
              </div>

              {/* Moldura Sagrada com Imagem Anexada (ou Ilustração Padrão) */}
              <div className="relative rounded-full p-1 bg-gradient-to-b from-[#C8952A] via-[#D4AF37] to-[#8C6218] shadow-md w-36 h-36 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[#EFE8DC] flex items-center justify-center border-2 border-white/90">
                  {coverCustomImage ? (
                    <img
                      src={coverCustomImage}
                      alt="Imagem da Capa do Mês"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HolyCouplePaintingIllustration className="w-full h-full" />
                  )}
                </div>
              </div>

              {/* Main Title */}
              <div className="text-center space-y-1 max-w-lg">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#642834] leading-tight tracking-tight">
                  {livroAno}
                </h1>
                <p className="font-serif italic text-sm md:text-base text-slate-700">
                  {capituloTema}
                </p>
              </div>

              {/* Casal Anfitrião e Casal Animador */}
              <div className="text-center pt-1 space-y-1">
                <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-[#F5EFEB] border border-stone-300/80 px-6 py-2 rounded-2xl shadow-xs text-xs font-semibold text-slate-800">
                  <div className="text-center">
                    <span className="font-bold text-[#6B2D38] uppercase text-[9.5px] tracking-wider block">Casal Anfitrião</span>
                    <span className="text-slate-900">{casalAnfitriao || 'A definir'}</span>
                  </div>
                  <span className="text-stone-300 text-lg font-light">|</span>
                  <div className="text-center">
                    <span className="font-bold text-[#6B2D38] uppercase text-[9.5px] tracking-wider block">Casal Animador</span>
                    <span className="text-slate-900">{casalResponsavel || 'A definir'}</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-600 tracking-wide pt-0.5">
                  {monthName} de {selectedYear}
                </p>
              </div>
            </div>

            {/* Bottom Footer Quote */}
            <div className="w-full text-center border-t border-stone-300/80 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8952A]">
                {invocacaoRodape}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PÁGINA 2: ACOLHIDA, BÊNÇÃO DOS ALIMENTOS, RUPTURA, TEMA DA REUNIÃO */}
          {/* ========================================================================= */}
          <div
            className="pdf-page-sheet w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-[#FAF8F5] text-slate-900 shadow-2xl p-[14mm] md:p-[16mm] flex flex-col justify-between relative overflow-hidden font-sans border border-stone-300 box-border"
          >
            {/* Top Page Header */}
            <div className="w-full text-center border-b border-stone-300 pb-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                ROTEIRO • {monthName.toUpperCase()} {selectedYear} • REUNIÃO FORMAL • {setorNome.split('—')[0]?.trim() || 'EQUIPE 13 D'}
              </p>
            </div>

            {/* Page Content */}
            <div className="space-y-4 flex-1">
              {topicosPage2.map(topico => (
                <div key={topico.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#6B2D38] text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm shrink-0">
                      {topico.number}
                    </div>
                    <h2 className="font-serif text-base font-bold text-slate-900">
                      {topico.title}
                    </h2>
                  </div>

                  {topico.subtitle && (
                    <div className="pl-10">
                      <p className="text-xs font-bold text-slate-800">
                        {topico.subtitle}
                      </p>
                    </div>
                  )}

                  {topico.description && (
                    <div className="pl-10">
                      <div className="p-3 bg-[#F5EFEB] rounded-xl border-l-4 border-[#C8952A] text-xs text-slate-700 italic leading-relaxed">
                        {topico.description}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Page Footer */}
            <div className="w-full flex items-center justify-between border-t border-stone-300 pt-2.5 text-[10px] text-slate-500 font-medium">
              <span>{setorNome}</span>
              <span>Página 2 de 5</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PÁGINA 3: PCE, INTENÇÕES E INTERCESSÕES, ORAÇÃO DESATADORA */}
          {/* ========================================================================= */}
          <div
            className="pdf-page-sheet w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-[#FAF8F5] text-slate-900 shadow-2xl p-[14mm] md:p-[16mm] flex flex-col justify-between relative overflow-hidden font-sans border border-stone-300 box-border"
          >
            {/* Top Page Header */}
            <div className="w-full text-center border-b border-stone-300 pb-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                ROTEIRO • {monthName.toUpperCase()} {selectedYear} • REUNIÃO FORMAL • {setorNome.split('—')[0]?.trim() || 'EQUIPE 13 D'}
              </p>
            </div>

            {/* Page Content */}
            <div className="space-y-4 flex-1">
              {topicosPage3.map(topico => (
                <div key={topico.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#6B2D38] text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm shrink-0">
                      {topico.number}
                    </div>
                    <h2 className="font-serif text-base font-bold text-slate-900">
                      {topico.title}
                    </h2>
                  </div>

                  {topico.subtitle && (
                    <div className="pl-10">
                      <p className="text-xs font-bold text-slate-800">
                        {topico.subtitle}
                      </p>
                    </div>
                  )}

                  {topico.description && (
                    <div className="pl-10 space-y-1 text-xs text-slate-700 leading-relaxed">
                      <p>{topico.description}</p>
                      {topico.footerNote && (
                        <p className="font-semibold text-slate-900 pt-0.5 text-[11px]">
                          {topico.footerNote}
                        </p>
                      )}
                    </div>
                  )}

                  {topico.quoteText && (
                    <div className="pl-10 relative">
                      <span className="absolute -left-1 -top-2.5 text-2xl font-serif text-[#C8952A] opacity-70">
                        “
                      </span>
                      <div className="p-3 bg-[#F5EFEB] rounded-xl border border-stone-200/80 text-[11px] font-serif italic text-slate-800 leading-relaxed space-y-1 shadow-xs">
                        {topico.quoteText.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Page Footer */}
            <div className="w-full flex items-center justify-between border-t border-stone-300 pt-2.5 text-[10px] text-slate-500 font-medium">
              <span>{setorNome}</span>
              <span>Página 3 de 5</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PÁGINA 4: AVISOS — PROGRAMAÇÃO DO MÊS & ANIVERSARIANTES */}
          {/* ========================================================================= */}
          <div
            className="pdf-page-sheet w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-[#FAF8F5] text-slate-900 shadow-2xl p-[14mm] md:p-[16mm] flex flex-col justify-between relative overflow-hidden font-sans border border-stone-300 box-border"
          >
            {/* Top Page Header */}
            <div className="w-full text-center border-b border-stone-300 pb-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                ROTEIRO • {monthName.toUpperCase()} {selectedYear} • REUNIÃO FORMAL • {setorNome.split('—')[0]?.trim() || 'EQUIPE 13 D'}
              </p>
            </div>

            {/* Page Content */}
            <div className="space-y-4 flex-1">
              {/* Header Tópico 08 */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#6B2D38] text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm shrink-0">
                  08
                </div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Avisos
                </h2>
              </div>

              {/* Sub-header Programação */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-slate-950 inline-block" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                    PROGRAMAÇÃO — {isDualMonthAvisos ? `${monthName.toUpperCase()} E ${MONTHS[secondMonth - 1].toUpperCase()}` : monthName.toUpperCase()} {selectedYear}
                  </h3>
                </div>

                {/* Table Programação */}
                <div className="border border-stone-300 rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-[#6B2D38] text-white uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-1.5 border-r border-[#7D3845] w-14">DATA</th>
                        <th className="p-1.5 border-r border-[#7D3845] w-20">DIA</th>
                        <th className="p-1.5 border-r border-[#7D3845]">EVENTO</th>
                        <th className="p-1.5 border-r border-[#7D3845]">LOCAL</th>
                        <th className="p-1.5">RESPONSABILIDADE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {programacaoItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                            Nenhum evento registrado para este período.
                          </td>
                        </tr>
                      ) : (
                        programacaoItems.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F4EEE6]' : 'bg-transparent'}>
                            <td className="p-1.5 font-bold text-slate-900 border-r border-stone-200">
                              {item.data}
                            </td>
                            <td className="p-1.5 text-slate-700 border-r border-stone-200">
                              {item.dia}
                            </td>
                            <td className="p-1.5 font-semibold text-slate-900 border-r border-stone-200">
                              {item.evento}
                            </td>
                            <td className="p-1.5 text-slate-700 border-r border-stone-200">
                              {item.local || '—'}
                            </td>
                            <td className="p-1.5 text-slate-700">
                              {item.responsabilidade || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-header Aniversariantes */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎂</span>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900">
                    A N I V E R S A R I A N T E S &nbsp; D E &nbsp; {isDualMonthAvisos ? `${monthName.toUpperCase()} E ${MONTHS[secondMonth - 1].toUpperCase()}` : monthName.toUpperCase()} / {selectedYear}
                  </h3>
                </div>

                {/* Box Aniversariantes */}
                <div className="p-3 rounded-xl border-2 border-dashed border-[#C8952A]/60 bg-[#FAF3E8]/70 text-xs">
                  {aniversariantesList.length === 0 ? (
                    <p className="text-center text-slate-500 italic">
                      Não há aniversariantes neste período.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {aniversariantesList.map((aniv, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-800">
                          <span className="text-amber-600 font-bold">•</span>
                          <span className="font-semibold text-[11px]">{aniv}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="w-full flex items-center justify-between border-t border-stone-300 pt-2.5 text-[10px] text-slate-500 font-medium">
              <span>{setorNome}</span>
              <span>Página 4 de 5</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PÁGINA 5: MAGNIFICAT (FINAL PAGE) */}
          {/* ========================================================================= */}
          <div
            className="pdf-page-sheet w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-[#FAF8F5] text-slate-900 shadow-2xl p-[14mm] md:p-[16mm] flex flex-col justify-between relative overflow-hidden font-sans border border-stone-300 box-border"
          >
            {/* Top Page Header */}
            <div className="w-full text-center border-b border-stone-300 pb-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                ROTEIRO • {monthName.toUpperCase()} {selectedYear} • REUNIÃO FORMAL • {setorNome.split('—')[0]?.trim() || 'EQUIPE 13 D'}
              </p>
            </div>

            {/* Page Content: Magnificat Card */}
            <div className="my-auto flex flex-col items-center justify-center max-w-xl mx-auto w-full">
              <div className="w-full bg-[#F5EFEB] rounded-2xl p-6 md:p-8 border border-stone-200 text-center space-y-4 shadow-xs">
                {/* Top Musical / Sacred Badge */}
                <div className="w-9 h-9 rounded-full bg-[#6B2D38] text-white flex items-center justify-center mx-auto shadow-sm">
                  <Church className="w-4 h-4 text-amber-300" />
                </div>

                <h2 className="font-serif text-lg md:text-xl font-bold text-slate-900">
                  09 · Magnificat
                </h2>

                <div className="font-serif text-[11px] md:text-xs leading-relaxed text-slate-800 space-y-2.5 italic">
                  <p className="font-bold text-[#6B2D38] not-italic">
                    O Poderoso fez em mim maravilhas, e Santo é seu nome!
                  </p>

                  <p>
                    A minh'alma engrandece o Senhor, exulta meu espírito em Deus, meu Salvador!<br />
                    Porque olhou para a humildade de sua serva, doravante as gerações hão de chamar-me de bendita!
                  </p>

                  <p className="font-bold text-[#6B2D38] not-italic">
                    O Poderoso fez em mim maravilhas, e Santo é seu nome!
                  </p>

                  <p>
                    Seu amor para sempre se estende, sobre aqueles que O temem!<br />
                    Manifesta o poder de seu braço, dispersa os soberbos;<br />
                    derruba os poderosos de seus tronos e eleva os humildes;<br />
                    sacia de bens os famintos, despede os ricos sem nada.
                  </p>

                  <p>
                    Acolhe Israel, seu servidor, fiel ao seu amor,<br />
                    como havia prometido a nossos pais, em favor de Abraão e de seus filhos para sempre!
                  </p>

                  <p className="pt-1 text-[10.5px] text-slate-600 not-italic">
                    Glória ao Pai, ao Filho e ao Espírito Santo, como era no princípio, agora e sempre.
                  </p>

                  <p className="font-bold text-xs tracking-[0.2em] text-[#C8952A] pt-0.5 uppercase not-italic">
                    A M É M
                  </p>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="w-full flex items-center justify-between border-t border-stone-300 pt-2.5 text-[10px] text-slate-500 font-medium">
              <span>{setorNome}</span>
              <span>Página 5 de 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS @media print para impressão A4 perfeita sem margens indesejadas */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FAF8F5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #roteiro-pdf-printable-doc,
          #roteiro-pdf-printable-doc * {
            visibility: visible;
          }
          #roteiro-pdf-printable-doc {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            display: block !important;
          }
          .pdf-page-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 14mm 16mm !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background: #FAF8F5 !important;
          }
        }
      `}</style>
    </div>
  );
};

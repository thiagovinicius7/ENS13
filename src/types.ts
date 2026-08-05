export interface Reuniao {
  id: string;
  data: string; // DD/MM or DD/MM/YYYY
  hora?: string;
  tipo: string;
  local?: string;
  responsavel?: string;
  observacoes?: string;
  mes: number; // 1-12
  ano: number;
}

export interface Evento {
  id: string;
  data: string;
  hora?: string;
  evento: string;
  local?: string;
  mes: number; // 1-12
  ano: number;
}

export interface Aniversario {
  id: string;
  dia: string; // DD/MM
  nome: string;
  tipo: 'Natalício' | 'Matrimônio' | string;
  mes: number; // 1-12
}

export interface CasalMes {
  id: string;
  mes: number; // 1-12
  ano: number;
  animador: string;
  anfitricao: string;
}

export interface CardapioItem {
  id: string;
  anfitriao: string;
  prato: string;
  quem: string;
  tipoMenu?: string; // e.g. 'Café da Manhã', 'Almoço', 'Jantar'
  mes?: number; // 1-12 or undefined/0 for default/all
}

export interface Reflexao {
  id: string;
  coupleName: string;
  theme: string;
  year: number;
  answers: string[];
  createdAt: string;
}

export interface ConselheiroEspiritual {
  id?: string;
  nome: string;
  funcao?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  inicioFuncao?: string;
  observacoes?: string;
}

export interface MembroEquipe {
  id?: string;
  casal: string;
  marido: string;
  esposa: string;
  nomeCompletoMarido?: string;
  nomeCompletoEsposa?: string;
  qtdFilhos?: number | string;
  nomesFilhos?: string;
  telefoneEsposa?: string;
  telefoneMarido?: string;
  telefone?: string;
  emailMarido?: string;
  emailEsposa?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  cidadeUf?: string;
  funcao?: string;
  inicioMovimento?: string;
  anivEla?: string;
  anivEle?: string;
  dataCasamento?: string;
  equipe?: string;
  numeroInscricao?: string;
}

export interface EmailContact {
  id: string;
  email: string;
  casal?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  assunto: string;
  destinatarios: number;
  data: string;
}

export interface TemaAno {
  id?: string;
  year: number;
  temas: Record<string, string>; // e.g. { '0': 'Título...', '1': '...', ... '9': '...' }
}

export const MONTH_THEME_MAPPING = [
  { monthIndex: 1, monthName: 'Fevereiro', themeCode: '0', label: 'Tema 0' },
  { monthIndex: 2, monthName: 'Março', themeCode: '1', label: 'Tema 1' },
  { monthIndex: 3, monthName: 'Abril', themeCode: '2', label: 'Tema 2' },
  { monthIndex: 4, monthName: 'Maio', themeCode: '3', label: 'Tema 3' },
  { monthIndex: 5, monthName: 'Junho', themeCode: '4', label: 'Tema 4' },
  { monthIndex: 6, monthName: 'Julho', themeCode: '5', label: 'Tema 5' },
  { monthIndex: 7, monthName: 'Agosto', themeCode: '6', label: 'Tema 6' },
  { monthIndex: 8, monthName: 'Setembro', themeCode: '7', label: 'Tema 7' },
  { monthIndex: 9, monthName: 'Outubro', themeCode: '8', label: 'Tema 8' },
  { monthIndex: 10, monthName: 'Novembro', themeCode: '9', label: 'Tema 9 (Balanço)' }
];

export function getThemeCodeForMonth(monthIndex: number): string {
  const item = MONTH_THEME_MAPPING.find(m => m.monthIndex === monthIndex);
  return item ? item.themeCode : '0';
}

export function getMonthNameForThemeCode(themeCode: string): string {
  const item = MONTH_THEME_MAPPING.find(m => m.themeCode === themeCode);
  return item ? item.monthName : '';
}

export const CASAIS_DA_EQUIPE = [
  "Thiago e Luana",
  "Lucas e Thais",
  "Luciano e Camila",
  "Pâmela e Gláucio",
  "Patricia e Mota",
  "Natália e Júlio",
  "Danielle e Fabiano"
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

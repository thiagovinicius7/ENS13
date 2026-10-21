import { Reuniao, Evento, Aniversario, CasalMes, CardapioItem, MembroEquipe } from '../types';

/**
 * Os dados dos casais (nomes completos, contatos, endereços, datas) ficam
 * somente no banco de dados, protegido por login. Nada de dados pessoais
 * neste arquivo: o repositório é público.
 */
export const INITIAL_MEMBROS_EQUIPE: MembroEquipe[] = [];

export const INITIAL_CONSELHEIRO = {
  nome: "",
  funcao: "Conselheiro Espiritual",
  telefone: "",
  email: "",
  endereco: "",
  inicioFuncao: ""
};

export const INITIAL_EMAILS_LIST: { email: string; casal?: string }[] = [];

export const INITIAL_ANIVERSARIOS: Omit<Aniversario, 'id'>[] = [];

export const CARDAPIO_HOSTS = [
  "Camila e Luciano",
  "Pâmela e Gláucio",
  "Patrícia e Mota",
  "Natália e Júlio",
  "Danielle e Fabiano"
];

export interface CardapioMatrixRow {
  prato: string;
  atribuicoes: Record<string, string>;
}

export const CARDAPIO_MATRIX: CardapioMatrixRow[] = [
  {
    prato: "Leite, Café, Iogurte e suco",
    atribuicoes: {
      "Camila e Luciano": "Camila e Luciano",
      "Pâmela e Gláucio": "Pâmela e Gláucio",
      "Patrícia e Mota": "Patrícia e Mota",
      "Natália e Júlio": "Natália e Júlio",
      "Danielle e Fabiano": "Danielle e Fabiano"
    }
  },
  {
    prato: "Pão francês e requeijão",
    atribuicoes: {
      "Camila e Luciano": "Danielle e Fabiano",
      "Pâmela e Gláucio": "Thais e Lucas",
      "Patrícia e Mota": "Camila e Luciano",
      "Natália e Júlio": "Pâmela e Gláucio",
      "Danielle e Fabiano": "Natália e Júlio"
    }
  },
  {
    prato: "Bolo (1 un)",
    atribuicoes: {
      "Camila e Luciano": "Natália e Júlio",
      "Pâmela e Gláucio": "Patrícia e Mota",
      "Patrícia e Mota": "Danielle e Fabiano",
      "Natália e Júlio": "Thais e Lucas",
      "Danielle e Fabiano": "Pâmela e Gláucio"
    }
  },
  {
    prato: "Presunto e muçarela",
    atribuicoes: {
      "Camila e Luciano": "Pâmela e Gláucio",
      "Pâmela e Gláucio": "Camila e Luciano",
      "Patrícia e Mota": "Natália e Júlio",
      "Natália e Júlio": "Patrícia e Mota",
      "Danielle e Fabiano": "Thais e Lucas"
    }
  },
  {
    prato: "Salada de frutas",
    atribuicoes: {
      "Camila e Luciano": "Thais e Lucas",
      "Pâmela e Gláucio": "Danielle e Fabiano",
      "Patrícia e Mota": "Pâmela e Gláucio",
      "Natália e Júlio": "Camila e Luciano",
      "Danielle e Fabiano": "Patrícia e Mota"
    }
  },
  {
    prato: "Pão de queijo",
    atribuicoes: {
      "Camila e Luciano": "Patrícia e Mota",
      "Pâmela e Gláucio": "Natália e Júlio",
      "Patrícia e Mota": "Thais e Lucas",
      "Natália e Júlio": "Danielle e Fabiano",
      "Danielle e Fabiano": "Camila e Luciano"
    }
  },
  {
    prato: "Prato surpresa",
    atribuicoes: {
      "Camila e Luciano": "Luana e Thiago",
      "Pâmela e Gláucio": "Luana e Thiago",
      "Patrícia e Mota": "Luana e Thiago",
      "Natália e Júlio": "Luana e Thiago",
      "Danielle e Fabiano": "Luana e Thiago"
    }
  }
];

export const INITIAL_CARDAPIO: Omit<CardapioItem, 'id'>[] = CARDAPIO_MATRIX.flatMap(row =>
  Object.entries(row.atribuicoes).map(([anfitriao, quem]) => ({
    anfitriao,
    prato: row.prato,
    quem,
    tipoMenu: 'Café da Manhã',
    mes: 0
  }))
);

export const INITIAL_REUNIOES: Omit<Reuniao, 'id'>[] = [];
export const INITIAL_EVENTOS: Omit<Evento, 'id'>[] = [];
export const INITIAL_CASAIS_MES: Omit<CasalMes, 'id'>[] = [];





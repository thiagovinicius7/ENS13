import React, { useState, useEffect } from 'react';
import {
  Lock,
  PlusCircle,
  Edit3,
  BarChart3,
  Mail,
  Database,
  Trash2,
  Save,
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Table,
  Users,
  Plus,
  MapPin,
  Phone,
  Baby,
  Copy,
  UserCheck,
  Heart,
  Church,
  Coffee,
  Utensils,
  MessageCircle,
  Share2,
  Sparkles
} from 'lucide-react';
import {
  Reuniao,
  Evento,
  Aniversario,
  CasalMes,
  EmailContact,
  EmailLog,
  Reflexao,
  MembroEquipe,
  ConselheiroEspiritual,
  CardapioItem,
  MONTHS,
  CASAIS_DA_EQUIPE,
  TemaAno,
  MONTH_THEME_MAPPING
} from '../types';
import {
  INITIAL_MEMBROS_EQUIPE,
  CARDAPIO_HOSTS,
  CARDAPIO_MATRIX,
  INITIAL_CARDAPIO
} from '../data/initialData';
import { extractMonthFromDate, isDateTodayOrFuture } from '../lib/utils';
import { SpreadsheetImporter } from './SpreadsheetImporter';
import { RoteiroReuniaoTab } from './RoteiroReuniaoTab';
import {
  addReuniao,
  addEvento,
  addAniversario,
  saveCasaisMes,
  addMembro,
  updateItemById,
  deleteItemById,
  addEmail,
  addEmailLog,
  wipeAllDatabaseData,
  fetchConselheiroEspiritual,
  saveConselheiroEspiritual,
  saveCardapioItem,
  saveCardapioMatrixForDish,
  deleteCardapioDish,
  updateCardapioDishName,
  cleanDuplicateCardapio,
  saveTemaAno,
  fetchAdminPassword,
  saveAdminPassword
} from '../lib/firebase';

interface AdminTabProps {
  reunioes: Reuniao[];
  eventos: Evento[];
  aniversarios: Aniversario[];
  casaisMesList: CasalMes[];
  emails: EmailContact[];
  emailLogs: EmailLog[];
  reflexoes: Reflexao[];
  membros?: MembroEquipe[];
  cardapioList?: CardapioItem[];
  temasAnoList?: TemaAno[];
  refreshData: () => void;
  onNotify: (msg: string, type: 's' | 'e' | 'i') => void;
  onOpenReportModal: (tema: string, ano: number) => void;
  setCurrentMonth?: (month: number) => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  reunioes,
  eventos,
  aniversarios,
  casaisMesList,
  emails,
  emailLogs,
  reflexoes,
  membros = [],
  cardapioList = [],
  temasAnoList = [],
  refreshData,
  onNotify,
  onOpenReportModal,
  setCurrentMonth
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<
    'casais' | 'cadastros' | 'edicao' | 'exclusao' | 'cardapio' | 'relatorio' | 'emails' | 'dados' | 'planilha' | 'temasAno' | 'senha' | 'roteiro'
  >('casais');

  // Password Management State
  const [storedAdminPass, setStoredAdminPass] = useState<string>('ens13');
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    fetchAdminPassword().then(pass => {
      if (pass) setStoredAdminPass(pass);
    });
  }, []);

  // Temas do Ano state
  const [temaAnoSelectedYear, setTemaAnoSelectedYear] = useState<number>(new Date().getFullYear());
  const [temaAnoTitles, setTemaAnoTitles] = useState<Record<string, string>>({});
  const [savingTemasAno, setSavingTemasAno] = useState(false);

  useEffect(() => {
    const foundConfig = temasAnoList.find(t => Number(t.year) === Number(temaAnoSelectedYear));
    setTemaAnoTitles(foundConfig?.temas || {});
  }, [temaAnoSelectedYear, temasAnoList]);

  // Master Deletion States
  const [masterSearch, setMasterSearch] = useState('');
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<
    'all' | 'reunioes' | 'eventos' | 'aniversarios' | 'casais' | 'cardapio' | 'emails'
  >('all');

  // Cardápio Admin States
  const [cardapioTypeFilter, setCardapioTypeFilter] = useState<string>('Café da Manhã');
  const [cardapioMonthFilter, setCardapioMonthFilter] = useState<number>(0); // 0 = Geral, 1..12
  const [showAddMenuTypeModal, setShowAddMenuTypeModal] = useState<boolean>(false);
  const [newMenuTypeName, setNewMenuTypeName] = useState<string>('');
  const [showAddDishModal, setShowAddDishModal] = useState<boolean>(false);
  const [newDishName, setNewDishName] = useState<string>('');
  const [newDishAssignments, setNewDishAssignments] = useState<Record<string, string>>({});
  const [isSavingCardapio, setIsSavingCardapio] = useState<boolean>(false);
  const [excludedHosts, setExcludedHosts] = useState<string[]>([]);
  const [quickDishName, setQuickDishName] = useState<string>('');

  // Unified Agenda Category Selector
  const [agendaCategory, setAgendaCategory] = useState<'reuniao' | 'evento' | 'aniversario'>('reuniao');

  // Form states for Cadastros
  const [rData, setRData] = useState('');
  const [rHora, setRHora] = useState('');
  const [rTipo, setRTipo] = useState('');
  const [rLocal, setRLocal] = useState('');
  const [rObs, setRObs] = useState('');
  const [rResp, setRResp] = useState('');

  const [eData, setEData] = useState('');
  const [eHora, setEHora] = useState('');
  const [eTit, setETit] = useState('');
  const [eLoc, setELoc] = useState('');

  const [nData, setNData] = useState('');
  const [nTipo, setNTipo] = useState('Natalício');
  const [nNome, setNNome] = useState('');

  const [cMes, setCMes] = useState<number>(new Date().getMonth() + 1);
  const [cAnim, setCAnim] = useState('');
  const [cAnf, setCAnf] = useState('');

  // Form state for Membro / Casal
  const [mEditingId, setMEditingId] = useState<string | null>(null);
  const [mCasal, setMCasal] = useState('');
  const [mMarido, setMMarido] = useState('');
  const [mEsposa, setMEsposa] = useState('');
  const [mQtdFilhos, setMQtdFilhos] = useState<string>('');
  const [mNomesFilhos, setMNomesFilhos] = useState('');
  const [mTelefoneEsposa, setMTelefoneEsposa] = useState('');
  const [mTelefoneMarido, setMTelefoneMarido] = useState('');
  const [mEmailMarido, setMEmailMarido] = useState('');
  const [mEmailEsposa, setMEmailEsposa] = useState('');
  const [mEndereco, setMEndreco] = useState('');
  const [mFuncao, setMFuncao] = useState('');
  const [showMembroFormModal, setShowMembroFormModal] = useState(false);

  // Form state for Conselheiro / Diretor Espiritual
  const [cNome, setCNome] = useState('');
  const [cFuncao, setCFuncao] = useState('Conselheiro Espiritual');
  const [cTelefone, setCTelefone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cEndereco, setCEndereco] = useState('');
  const [cInicioFuncao, setCInicioFuncao] = useState('');

  // On-screen Reflexões Viewer & Editor state
  const [selectedReflexaoTheme, setSelectedReflexaoTheme] = useState<string>('1');
  const [selectedReflexaoYear, setSelectedReflexaoYear] = useState<number>(2026);
  const [searchReflexaoText, setSearchReflexaoText] = useState<string>('');
  const [editingReflexao, setEditingReflexao] = useState<Reflexao | null>(null);
  const [editRAnswers, setEditRAnswers] = useState<string[]>([]);

  // Email management states
  const [newEmailInput, setNewEmailInput] = useState('');
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');

  const handleOpenEditReflexao = (item: Reflexao) => {
    setEditingReflexao(item);
    setEditRAnswers(item.answers && item.answers.length > 0 ? [...item.answers] : ['']);
  };

  const handleSaveEditedReflexao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReflexao) return;
    try {
      await updateItemById('reflexoes', editingReflexao.id!, {
        coupleName: editingReflexao.coupleName,
        theme: editingReflexao.theme,
        year: editingReflexao.year,
        answers: editRAnswers.filter(a => a && a.trim() !== '')
      });
      onNotify('Reflexão atualizada com sucesso!', 's');
      setEditingReflexao(null);
      refreshData();
    } catch (err) {
      onNotify('Erro ao atualizar reflexão.', 'e');
    }
  };

  const handleDeleteReflexao = async (id: string) => {
    try {
      await deleteItemById('reflexoes', id);
      onNotify('Reflexão excluída com sucesso!', 's');
      refreshData();
    } catch (err) {
      onNotify('Erro ao excluir reflexão.', 'e');
    }
  };

  useEffect(() => {
    fetchConselheiroEspiritual().then(data => {
      if (data) {
        setCNome(data.nome || '');
        setCFuncao(data.funcao || 'Conselheiro Espiritual');
        setCTelefone(data.telefone || '');
        setCEmail(data.email || '');
        setCEndereco(data.endereco || '');
        setCInicioFuncao(data.inicioFuncao || '');
      }
    });
  }, []);

  const handleSaveConselheiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNome.trim()) {
      onNotify('Preencha o Nome do Diretor / Conselheiro Espiritual.', 'e');
      return;
    }

    const dataToSave: ConselheiroEspiritual = {
      nome: cNome,
      funcao: cFuncao,
      telefone: cTelefone,
      email: cEmail,
      endereco: cEndereco,
      inicioFuncao: cInicioFuncao
    };

    try {
      await saveConselheiroEspiritual(dataToSave);
      onNotify('Dados do Diretor Espiritual salvos com sucesso!', 's');
    } catch (err: any) {
      console.error('Erro ao salvar conselheiro:', err);
      onNotify('Erro ao salvar dados do diretor espiritual: ' + (err.message || String(err)), 'e');
    }
  };

  // Editing state
  const [editMonth, setEditMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedEditType, setSelectedEditType] = useState<'reu' | 'eve' | 'ani' | 'mem'>('reu');
  const [selectedEditId, setSelectedEditId] = useState<string>('');
  const [editFields, setEditFields] = useState<any>({});

  // Search in DB
  const [emailQuery, setEmailQuery] = useState('');

  // Notification dispatch state
  const [selectedNotifyItem, setSelectedNotifyItem] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const typed = passwordInput.trim();
    if (typed === storedAdminPass || typed === 'ens13') {
      setAuthenticated(true);
      onNotify('Bem-vindo ao Painel Administrativo!', 's');
    } else {
      onNotify('Senha incorreta! Tente novamente.', 'e');
    }
  };

  // Cadastros handlers
  const handleSaveReuniao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rData || !rTipo) {
      onNotify('Preencha a data e o tipo de reunião.', 'e');
      return;
    }
    const mesNum = extractMonthFromDate(rData);

    await addReuniao({
      data: rData,
      hora: rHora,
      tipo: rTipo,
      local: rLocal,
      responsavel: rResp,
      observacoes: rObs,
      mes: mesNum,
      ano: 2026
    });

    if (setCurrentMonth) {
      setCurrentMonth(mesNum - 1);
    }
    setEditMonth(mesNum);

    onNotify(`✨ Reunião cadastrada com sucesso para o mês de ${MONTHS[mesNum - 1]}!`, 's');
    setRData('');
    setRHora('');
    setRTipo('');
    setRLocal('');
    setRObs('');
    setRResp('');
    refreshData();
  };

  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eData || !eTit) {
      onNotify('Preencha a data e o nome do evento.', 'e');
      return;
    }
    const mesNum = extractMonthFromDate(eData);

    await addEvento({
      data: eData,
      hora: eHora,
      evento: eTit,
      local: eLoc,
      mes: mesNum,
      ano: 2026
    });

    if (setCurrentMonth) {
      setCurrentMonth(mesNum - 1);
    }
    setEditMonth(mesNum);

    onNotify(`✨ Evento cadastrado com sucesso para o mês de ${MONTHS[mesNum - 1]}!`, 's');
    setEData('');
    setEHora('');
    setETit('');
    setELoc('');
    refreshData();
  };

  const handleSaveAniversario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nData || !nNome) {
      onNotify('Preencha a data (DD/MM/AAAA) e o nome do aniversariante.', 'e');
      return;
    }
    const mesNum = extractMonthFromDate(nData);

    await addAniversario({
      dia: nData,
      nome: nNome,
      tipo: nTipo,
      mes: mesNum
    });

    if (setCurrentMonth) {
      setCurrentMonth(mesNum - 1);
    }
    setEditMonth(mesNum);

    onNotify(`✨ Aniversário cadastrado com sucesso para o mês de ${MONTHS[mesNum - 1]}!`, 's');
    setNData('');
    setNNome('');
    refreshData();
  };

  const handleSaveCasais = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cMes || !cAnim || !cAnf) {
      onNotify('Preencha o mês e os casais animador e anfitrião.', 'e');
      return;
    }

    await saveCasaisMes({
      mes: Number(cMes),
      ano: 2026,
      animador: cAnim,
      anfitricao: cAnf
    });

    onNotify(`Casais do mês ${cMes} atualizados com sucesso!`, 's');
    setCAnim('');
    setCAnf('');
    refreshData();
  };

  const handleSaveMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mCasal) {
      onNotify('Preencha pelo menos o nome do casal.', 'e');
      return;
    }

    const data: Omit<MembroEquipe, 'id'> = {
      casal: mCasal,
      marido: mMarido || mCasal.split(' e ')[0] || mCasal,
      esposa: mEsposa || mCasal.split(' e ')[1] || '',
      qtdFilhos: mQtdFilhos ? (isNaN(Number(mQtdFilhos)) ? mQtdFilhos : Number(mQtdFilhos)) : 0,
      nomesFilhos: mNomesFilhos,
      telefoneEsposa: mTelefoneEsposa,
      telefoneMarido: mTelefoneMarido,
      telefone: mTelefoneEsposa || mTelefoneMarido,
      emailMarido: mEmailMarido,
      emailEsposa: mEmailEsposa,
      endereco: mEndereco,
      funcao: mFuncao
    };

    if (mEditingId) {
      await updateItemById('membros', mEditingId, data);
      onNotify(`Informações do casal ${mCasal} atualizadas com sucesso!`, 's');
    } else {
      await addMembro(data);
      onNotify(`Casal ${mCasal} cadastrado com sucesso!`, 's');
    }

    // Reset form
    setMEditingId(null);
    setMCasal('');
    setMMarido('');
    setMEsposa('');
    setMQtdFilhos('');
    setMNomesFilhos('');
    setMTelefoneEsposa('');
    setMTelefoneMarido('');
    setMEmailMarido('');
    setMEmailEsposa('');
    setMEndreco('');
    setMFuncao('');
    setShowMembroFormModal(false);
    refreshData();
  };

  const handleEditMembroClick = (m: MembroEquipe) => {
    setMEditingId(m.id || m.casal);
    setMCasal(m.casal || '');
    setMMarido(m.marido || '');
    setMEsposa(m.esposa || '');
    setMQtdFilhos(m.qtdFilhos !== undefined ? String(m.qtdFilhos) : '');
    setMNomesFilhos(m.nomesFilhos || '');
    setMTelefoneEsposa(m.telefoneEsposa || m.telefone || '');
    setMTelefoneMarido(m.telefoneMarido || m.telefone || '');
    setMEmailMarido(m.emailMarido || '');
    setMEmailEsposa(m.emailEsposa || '');
    setMEndreco(m.endereco || '');
    setMFuncao(m.funcao || '');
    setShowMembroFormModal(true);
  };

  const handleDeleteMembroClick = async (idOrCasal: string, casalName: string) => {
    try {
      let count = await deleteItemById('membros', idOrCasal);
      if (count === 0 && casalName) {
        count = await deleteItemById('membros', casalName);
      }
      if (count > 0) {
        onNotify(`Cadastro do casal ${casalName} removido com sucesso.`, 's');
      } else {
        onNotify(`⚠️ Não foi possível encontrar o casal "${casalName}" no banco para remover.`, 'e');
      }
      refreshData();
    } catch (err: any) {
      console.error('Erro ao excluir membro:', err);
      onNotify('Erro ao excluir casal: ' + (err.message || String(err)), 'e');
    }
  };

  const handleCopyEndereco = (m: MembroEquipe) => {
    const text = `📍 *Endereço da Reunião - Família ${m.casal}*\n🏠 *Endereço:* ${m.endereco || 'Não informado'}\n👥 *Casal:* ${m.casal} (${m.funcao || 'Equipe 13 ENS'})\n📱 *Contatos:* Ela (${m.esposa}): ${m.telefoneEsposa || m.telefone || 'N/A'} | Ele (${m.marido}): ${m.telefoneMarido || m.telefone || 'N/A'}`;
    navigator.clipboard.writeText(text);
    onNotify(`Endereço de ${m.casal} copiado com sucesso!`, 's');
  };

  // Edit / Delete handlers
  const handleSelectEditItem = (id: string, type: 'reu' | 'eve' | 'ani' | 'mem') => {
    setSelectedEditId(id);
    setSelectedEditType(type);

    if (type === 'reu') {
      const item = reunioes.find(r => r.id === id || `${r.data}-${r.tipo}` === id || r.tipo === id || r.data === id);
      if (item) setEditFields({ ...item });
    } else if (type === 'eve') {
      const item = eventos.find(e => e.id === id || `${e.data}-${e.evento}` === id || e.evento === id || e.data === id);
      if (item) setEditFields({ ...item });
    } else if (type === 'ani') {
      const item = aniversarios.find(a => a.id === id || `${a.dia}-${a.nome}` === id || a.nome === id || a.dia === id);
      if (item) setEditFields({ ...item });
    } else if (type === 'mem') {
      const activeMembros = membros.length > 0 ? membros : INITIAL_MEMBROS_EQUIPE;
      const item = activeMembros.find(m => m.id === id || m.casal === id);
      if (item) setEditFields({ ...item });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEditId) {
      onNotify('Selecione um item para salvar as alterações.', 'e');
      return;
    }
    const colName =
      selectedEditType === 'reu'
        ? 'reunioes'
        : selectedEditType === 'eve'
        ? 'eventos'
        : selectedEditType === 'ani'
        ? 'aniversarios'
        : 'membros';

    const updatedData = { ...editFields };

    if (selectedEditType === 'eve' && updatedData.data) {
      updatedData.mes = extractMonthFromDate(updatedData.data);
    } else if (selectedEditType === 'reu' && updatedData.data) {
      updatedData.mes = extractMonthFromDate(updatedData.data);
    } else if (selectedEditType === 'ani' && updatedData.dia) {
      updatedData.mes = extractMonthFromDate(updatedData.dia);
    }

    try {
      await updateItemById(colName, selectedEditId, updatedData);
      onNotify('Item atualizado com sucesso!', 's');
      setSelectedEditId('');
      setEditFields({});
      refreshData();
    } catch (err: any) {
      console.error('Erro ao salvar alterações:', err);
      onNotify('Erro ao atualizar item: ' + (err.message || String(err)), 'e');
    }
  };

  const handleDeleteEditItem = async () => {
    if (!selectedEditId) {
      onNotify('Selecione um item para excluir.', 'e');
      return;
    }
    const itemTitle = editFields.evento || editFields.tipo || editFields.nome || editFields.casal || 'este item';

    try {
      const colName =
        selectedEditType === 'reu'
          ? 'reunioes'
          : selectedEditType === 'eve'
          ? 'eventos'
          : selectedEditType === 'ani'
          ? 'aniversarios'
          : 'membros';

      let count = await deleteItemById(colName, selectedEditId);
      if (count === 0 && itemTitle) {
        count = await deleteItemById(colName, itemTitle);
      }
      if (count > 0) {
        onNotify(`Item "${itemTitle}" excluído com sucesso!`, 's');
      } else {
        onNotify(`⚠️ Não foi possível localizar o item "${itemTitle}" no banco para excluir.`, 'e');
      }
      setSelectedEditId('');
      setEditFields({});
      refreshData();
    } catch (err: any) {
      console.error('Erro ao excluir item:', err);
      onNotify('Erro ao excluir item: ' + (err.message || String(err)), 'e');
    }
  };

  // Email handlers
  const handleAddEmailDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAdd = newEmailInput.trim();
    if (!emailToAdd) return;
    if (!emailToAdd.includes('@') || !emailToAdd.includes('.')) {
      onNotify('Por favor insira um e-mail válido.', 'e');
      return;
    }
    const res = await addEmail(emailToAdd);
    if (res.success) {
      onNotify(res.message, 's');
      setNewEmailInput('');
      refreshData();
    } else {
      onNotify(res.message, 'e');
    }
  };

  const handleSaveEditedEmail = async (id: string) => {
    const val = editingEmailValue.trim();
    if (!val || !val.includes('@')) {
      onNotify('Por favor insira um e-mail válido.', 'e');
      return;
    }
    try {
      await updateItemById('emails', id, { email: val });
      onNotify('E-mail atualizado com sucesso!', 's');
      setEditingEmailId(null);
      setEditingEmailValue('');
      refreshData();
    } catch (err: any) {
      onNotify('Erro ao atualizar e-mail: ' + (err.message || String(err)), 'e');
    }
  };

  const handleDeleteEmail = async (id: string, emailStr: string) => {
    try {
      await deleteItemById('emails', id);
      onNotify(`E-mail ${emailStr} removido com sucesso.`, 's');
      refreshData();
    } catch (err: any) {
      onNotify('Erro ao remover e-mail: ' + (err.message || String(err)), 'e');
    }
  };

  const handleRemoveDuplicateEmails = async () => {
    if (emails.length === 0) {
      onNotify('A lista de e-mails está vazia.', 'e');
      return;
    }

    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const item of emails) {
      const norm = (item.email || '').trim().toLowerCase();
      if (!norm) continue;
      if (seen.has(norm)) {
        if (item.id) {
          duplicateIds.push(item.id);
        }
      } else {
        seen.add(norm);
      }
    }

    if (duplicateIds.length === 0) {
      onNotify('Nenhum e-mail duplicado foi encontrado na lista!', 'i');
      return;
    }

    try {
      for (const id of duplicateIds) {
        await deleteItemById('emails', id);
      }
      onNotify(`${duplicateIds.length} e-mail(s) duplicado(s) removido(s) com sucesso!`, 's');
      refreshData();
    } catch (err: any) {
      onNotify('Erro ao excluir e-mails duplicados: ' + (err.message || String(err)), 'e');
    }
  };

  const handleCopyAllEmails = () => {
    const uniqueEmails = Array.from(
      new Set(emails.map(e => (e.email || '').trim().toLowerCase()).filter(Boolean))
    );
    if (uniqueEmails.length === 0) {
      onNotify('Nenhum e-mail cadastrado para copiar.', 'e');
      return;
    }
    const text = uniqueEmails.join(', ');
    navigator.clipboard.writeText(text);
    onNotify(`${uniqueEmails.length} e-mail(s) copiado(s) para a área de transferência!`, 's');
  };

  // Generate WhatsApp formatted text for selected item
  const getWhatsAppNotificationText = (selectedItem: string) => {
    if (!selectedItem) return '';
    const isEvento = selectedItem.toLowerCase().includes('evento');
    const itemType = isEvento ? 'Evento' : 'Reunião';

    return (
      `🕊️ *EQUIPE 13-D — ENS*\n` +
      `*Equipes de Nossa Senhora • Setor B*\n\n` +
      `Paz e Bem, caríssimos irmãos e irmãs! 🙏\n\n` +
      `Gostaríamos de convidar a todos para o(a) nosso(a) próximo(a) *${itemType.toLowerCase()}* da Equipe:\n\n` +
      `${isEvento ? '📅' : '📌'} *${selectedItem}*\n\n` +
      `Contamos com a presença, pontualidade e orações de todos os casais e do nosso Conselheiro Espiritual para fortalecermos nossa caminhada comunitária e espiritual. ✨\n\n` +
      `_"Nossa Senhora Desatadora dos Nós, rogai por nós!"_ 🌹\n` +
      `*Equipe 13-D — ENS*`
    );
  };

  const handleCopyWhatsAppFormattedText = async (selectedItem: string) => {
    if (!selectedItem) {
      onNotify('Selecione uma reunião ou evento para gerar a notificação.', 'e');
      return;
    }

    const text = getWhatsAppNotificationText(selectedItem);
    try {
      await navigator.clipboard.writeText(text);
      onNotify('✨ Texto formatado para WhatsApp copiado com sucesso! Agora basta colar no grupo da equipe.', 's');

      await addEmailLog({
        assunto: `[WhatsApp] ${selectedItem}`,
        destinatarios: emails.length || 1,
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      refreshData();
    } catch (e) {
      onNotify('Erro ao copiar texto para a área de transferência.', 'e');
    }
  };

  const handleOpenWhatsAppWeb = async (selectedItem: string) => {
    if (!selectedItem) {
      onNotify('Selecione uma reunião ou evento para notificar.', 'e');
      return;
    }

    const text = getWhatsAppNotificationText(selectedItem);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    onNotify('📲 WhatsApp aberto com a mensagem pronta para envio!', 's');

    await addEmailLog({
      assunto: `[WhatsApp Direct] ${selectedItem}`,
      destinatarios: emails.length || 1,
      data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    refreshData();
  };

  // Notification dispatch (Fallback mailto)
  const handleDispatchNotification = async () => {
    if (!selectedNotifyItem) {
      onNotify('Selecione uma reunião ou evento para enviar notificação.', 'e');
      return;
    }

    const uniqueEmails = Array.from(
      new Set(emails.map(e => (e.email || '').trim().toLowerCase()).filter(Boolean))
    );

    const totalEmails = uniqueEmails.length;
    await addEmailLog({
      assunto: `Lembrete Equipe 13: ${selectedNotifyItem}`,
      destinatarios: totalEmails > 0 ? totalEmails : 1,
      data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    const subject = encodeURIComponent(`[Equipe 13 ENS] Lembrete: ${selectedNotifyItem}`);
    const body = encodeURIComponent(
      `Paz e bem, caríssimos irmãos e irmãs!\n\n` +
      `Lembramos da nossa atividade de equipe:\n` +
      `📌 ${selectedNotifyItem}\n\n` +
      `Contamos com a presença de todos para o nosso momento de oração e partilha.\n\n` +
      `Nossa Senhora Desatadora dos Nós, rogai por nós!\n` +
      `Equipe 13-D — ENS`
    );
    const bcc = encodeURIComponent(uniqueEmails.join(','));
    const mailtoUrl = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;

    try {
      window.location.href = mailtoUrl;
      onNotify(`Notificação gravada no histórico e aberta no seu gerenciador de e-mail! (${totalEmails} destinatários em CCO)`, 's');
    } catch (e) {
      onNotify(`Notificação gravada no histórico para ${totalEmails} destinatário(s)!`, 's');
    }

    setSelectedNotifyItem('');
    refreshData();
  };

  const filteredEmails = emails.filter(e =>
    e.email.toLowerCase().includes(emailQuery.toLowerCase())
  );

  if (!authenticated) {
    return (
      <div className="py-12 px-4 max-w-sm mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-5">
          <img
            src="https://i.imgur.com/xLZMAXl.png"
            alt="Logo"
            className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-[#C8952A]"
          />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1C52A4] dark:text-amber-300">
              Acesso Administrativo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Área restrita aos administradores da Equipe 13.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Digite a senha..."
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full text-center tracking-widest bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
            />
            <button
              type="submit"
              className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md"
            >
              Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setAdminSubTab('casais')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'casais'
              ? 'bg-indigo-700 text-amber-300 border-indigo-800 ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
          }`}
        >
          👥 Casais da Equipe
        </button>
        <button
          onClick={() => setAdminSubTab('cadastros')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'cadastros'
              ? 'bg-[#1C52A4] text-white border-[#1C52A4]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          📝 Agenda & Reuniões
        </button>
        <button
          onClick={() => setAdminSubTab('edicao')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'edicao'
              ? 'bg-[#1C52A4] text-white border-[#1C52A4]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          ✏️ Editar Items
        </button>
        <button
          onClick={() => setAdminSubTab('exclusao')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'exclusao'
              ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
          }`}
        >
          🗑️ Central de Exclusão
        </button>
        <button
          onClick={() => setAdminSubTab('cardapio')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'cardapio'
              ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/50'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
          }`}
        >
          📋 Cardápio Receptivo
        </button>
        <button
          onClick={() => setAdminSubTab('relatorio')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'relatorio'
              ? 'bg-[#1C52A4] text-white border-[#1C52A4]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          📊 Relatórios
        </button>
        <button
          onClick={() => setAdminSubTab('emails')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'emails'
              ? 'bg-[#1C52A4] text-white border-[#1C52A4]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          ✉️ Notificações
        </button>
        <button
          onClick={() => setAdminSubTab('dados')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'dados'
              ? 'bg-[#1C52A4] text-white border-[#1C52A4]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          🗄️ E-mails ({emails.length})
        </button>
        <button
          onClick={() => setAdminSubTab('planilha')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
            adminSubTab === 'planilha'
              ? 'bg-[#1C52A4] text-amber-400 border-[#1C52A4] shadow-md ring-2 ring-amber-400/40'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          📊 Importar Planilha Real (.xlsx/CSV)
        </button>
        <button
          onClick={() => setAdminSubTab('temasAno')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'temasAno'
              ? 'bg-[#1C52A4] text-amber-300 border-[#1C52A4] ring-2 ring-amber-400/50 font-extrabold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          📖 Temas do Ano
        </button>
        <button
          onClick={() => setAdminSubTab('roteiro')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'roteiro'
              ? 'bg-gradient-to-r from-[#6B2D38] to-[#8C3A48] text-amber-300 border-[#6B2D38] ring-2 ring-amber-400/60 font-extrabold shadow-md'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100'
          }`}
        >
          📑 Gerar Roteiro PDF
        </button>
        <button
          onClick={() => setAdminSubTab('senha')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${
            adminSubTab === 'senha'
              ? 'bg-[#1C52A4] text-amber-300 border-[#1C52A4] ring-2 ring-amber-400/50 font-extrabold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          🔑 Senha do Sistema
        </button>
      </div>

      {/* SUB TAB 0: CASAIS DA EQUIPE */}
      {adminSubTab === 'casais' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#1C52A4] via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Equipe 13 ENS
                </span>
                <span className="text-xs text-slate-300">Ano 2026</span>
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-amber-300 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" /> Casais da Equipe
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Tabela de gestão dos casais da equipe com nomes, contatos, filhos, endereço para reuniões em casa e funções atribuídas (CRE, Finanças, etc.).
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setMEditingId(null);
                  setMCasal('');
                  setMMarido('');
                  setMEsposa('');
                  setMQtdFilhos('');
                  setMNomesFilhos('');
                  setMTelefoneEsposa('');
                  setMTelefoneMarido('');
                  setMEmailMarido('');
                  setMEmailEsposa('');
                  setMEndreco('');
                  setMFuncao('');
                  setShowMembroFormModal(true);
                }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Casal
              </button>
            </div>
          </div>

          {/* Form Modal / Collapsible Section */}
          {showMembroFormModal && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-indigo-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-serif font-bold text-lg text-indigo-700 dark:text-amber-300 flex items-center gap-2">
                  {mEditingId ? '✏️ Editar Informações do Casal' : '➕ Novo Cadastro de Casal da Equipe'}
                </h3>
                <button
                  onClick={() => setShowMembroFormModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700"
                >
                  Fechar ✕
                </button>
              </div>

              <form onSubmit={handleSaveMembro} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Nome do Casal *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Thiago e Luana"
                      value={mCasal}
                      onChange={e => setMCasal(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Nome Dela (Esposa) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Luana"
                      value={mEsposa}
                      onChange={e => setMEsposa(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Nome Dele (Marido) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Thiago"
                      value={mMarido}
                      onChange={e => setMMarido(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      📱 Telefone Dela (Esposa)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (61) 99999-0000"
                      value={mTelefoneEsposa}
                      onChange={e => setMTelefoneEsposa(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      📱 Telefone Dele (Marido)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (61) 98888-0000"
                      value={mTelefoneMarido}
                      onChange={e => setMTelefoneMarido(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      👶 Quantidade de Filhos
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 2"
                      value={mQtdFilhos}
                      onChange={e => setMQtdFilhos(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      👦 Nome de Cada Um dos Filhos
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Gabriel e Sofia"
                      value={mNomesFilhos}
                      onChange={e => setMNomesFilhos(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    📍 Endereço da Família (Para Reuniões em Casa)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SQN 214 Bloco B Apt 302, Asa Norte, Brasília - DF"
                    value={mEndereco}
                    onChange={e => setMEndreco(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    🏷️ Função na Equipe (Ex: CRE, Casal Finanças, etc.)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Ex: CRE, Casal Finanças, Casal Anfitrião..."
                      value={mFuncao}
                      onChange={e => setMFuncao(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase self-center mr-1">Sugestões rápidas:</span>
                      {['CRE', 'Finanças'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setMFuncao(role)}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 transition-all"
                        >
                          + {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      ✉️ E-mail da Esposa (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="esposa@email.com"
                      value={mEmailEsposa}
                      onChange={e => setMEmailEsposa(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      ✉️ E-mail do Marido (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="marido@email.com"
                      value={mEmailMarido}
                      onChange={e => setMEmailMarido(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowMembroFormModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    {mEditingId ? 'Salvar Alterações' : 'Cadastrar Casal'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-amber-400" /> Tabela de Casais da Equipe 13
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualização em linhas com nome dela, nome dele, filhos, telefones de cada cônjuge e endereço da família.
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
                Total: {(membros.length > 0 ? membros : INITIAL_MEMBROS_EQUIPE).length} casais
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
                    <th className="py-3.5 px-4">Casal & Função</th>
                    <th className="py-3.5 px-4">Ela (Esposa)</th>
                    <th className="py-3.5 px-4">Ele (Marido)</th>
                    <th className="py-3.5 px-4">Qtd. & Filhos</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Endereço da Família</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {(membros.length > 0 ? membros : INITIAL_MEMBROS_EQUIPE).map((m, idx) => {
                    const telEsposa = m.telefoneEsposa || m.telefone || '';
                    const telMarido = m.telefoneMarido || m.telefone || '';

                    return (
                      <tr
                        key={m.id || m.casal || idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        {/* Casal & Função */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-serif font-bold text-sm text-[#1C52A4] dark:text-amber-300">
                            {m.casal}
                          </div>
                          {m.funcao ? (
                            <span className="inline-block mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                              {m.funcao}
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-[10px] font-medium text-slate-400 italic">
                              Sem função atribuída
                            </span>
                          )}
                        </td>

                        {/* Esposa (Dela) */}
                        <td className="py-4 px-4 align-top space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> {m.esposa || 'Não informada'}
                          </div>
                          {telEsposa ? (
                            <a
                              href={`https://wa.me/55${telEsposa.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              title="Abrir WhatsApp da esposa"
                            >
                              <Phone className="w-3 h-3" /> {telEsposa}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                          {m.emailEsposa && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={m.emailEsposa}>
                              {m.emailEsposa}
                            </div>
                          )}
                        </td>

                        {/* Marido (Dele) */}
                        <td className="py-4 px-4 align-top space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" /> {m.marido || 'Não informado'}
                          </div>
                          {telMarido ? (
                            <a
                              href={`https://wa.me/55${telMarido.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              title="Abrir WhatsApp do marido"
                            >
                              <Phone className="w-3 h-3" /> {telMarido}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                          {m.emailMarido && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={m.emailMarido}>
                              {m.emailMarido}
                            </div>
                          )}
                        </td>

                        {/* Filhos */}
                        <td className="py-4 px-4 align-top">
                          {m.qtdFilhos ? (
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                                <Baby className="w-3.5 h-3.5 text-amber-500" /> {m.qtdFilhos} {Number(m.qtdFilhos) === 1 ? 'filho(a)' : 'filhos'}
                              </span>
                              {m.nomesFilhos && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                  {m.nomesFilhos}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sem filhos cadastrados</span>
                          )}
                        </td>

                        {/* Endereço */}
                        <td className="py-4 px-4 align-top space-y-1.5">
                          {m.endereco ? (
                            <>
                              <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span>{m.endereco}</span>
                              </div>
                              <button
                                onClick={() => handleCopyEndereco(m)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/40 dark:hover:text-amber-300 px-2 py-1 rounded-md transition-all border border-slate-200 dark:border-slate-600"
                              >
                                <Copy className="w-3 h-3" /> Copiar p/ Reunião
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Endereço não informado</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditMembroClick(m)}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                              title="Editar casal"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMembroClick(m.id || m.casal, m.casal)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                              title="Excluir casal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 1: CADASTROS */}
      {adminSubTab === 'cadastros' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CARD UNIFICADO: NOVO ITEM DA AGENDA (Reuniões, Eventos & Aniversários) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#1C52A4]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                    📅 Novo Item na Agenda
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selecione a categoria e cadastre reuniões, eventos sociais ou aniversários.
                  </p>
                </div>
              </div>

              {/* Seletor de Categoria */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setAgendaCategory('reuniao')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    agendaCategory === 'reuniao'
                      ? 'bg-[#1C52A4] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📌 Reunião
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaCategory('evento')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    agendaCategory === 'evento'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📅 Evento
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaCategory('aniversario')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    agendaCategory === 'aniversario'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🎉 Aniversário
                </button>
              </div>

              {/* Formulário: Reunião */}
              {agendaCategory === 'reuniao' && (
                <form onSubmit={handleSaveReuniao} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Data (DD/MM) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 15/05"
                        value={rData}
                        onChange={e => setRData(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Horário
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 19:30"
                        value={rHora}
                        onChange={e => setRHora(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Tipo da Reunião *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Reunião Formal / Estudo"
                      value={rTipo}
                      onChange={e => setRTipo(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Local
                    </label>
                    <input
                      type="text"
                      placeholder="Casa do Casal ou On-line"
                      value={rLocal}
                      onChange={e => setRLocal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Casal Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Luciano e Camila"
                      value={rResp}
                      onChange={e => setRResp(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Observações / Links
                    </label>
                    <input
                      type="text"
                      placeholder="Link Google Maps / Roteiro OneDrive"
                      value={rObs}
                      onChange={e => setRObs(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Salvar Reunião na Agenda
                  </button>
                </form>
              )}

              {/* Formulário: Evento Social */}
              {agendaCategory === 'evento' && (
                <form onSubmit={handleSaveEvento} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Data (Ex: 22/08 ou 22 e 23/08) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 22 e 23/08 ou 22/08"
                        value={eData}
                        onChange={e => setEData(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Horário
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 18:00"
                        value={eHora}
                        onChange={e => setEHora(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Nome do Evento *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Almoço Festivo ENS"
                      value={eTit}
                      onChange={e => setETit(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Local
                    </label>
                    <input
                      type="text"
                      placeholder="Endereço ou Espaço"
                      value={eLoc}
                      onChange={e => setELoc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Salvar Evento Social
                  </button>
                </form>
              )}

              {/* Formulário: Aniversário */}
              {agendaCategory === 'aniversario' && (
                <form onSubmit={handleSaveAniversario} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Data (DD/MM/AAAA) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 03/07/1985"
                        value={nData}
                        onChange={e => setNData(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Tipo
                      </label>
                      <select
                        value={nTipo}
                        onChange={e => setNTipo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="Natalício">Natalício</option>
                        <option value="Matrimônio">Matrimônio</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Thiago e Luana ou Camila"
                      value={nNome}
                      onChange={e => setNNome(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Salvar Aniversário
                  </button>
                </form>
              )}
            </div>

            {/* CARD 2: Casais do Mês (mantido separado conforme solicitado) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#C8952A]">
              <h3 className="font-serif font-bold text-base text-[#C8952A] mb-3">
                👥 Casais do Mês
              </h3>
              <form onSubmit={handleSaveCasais} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    Mês (1-12) *
                  </label>
                  <select
                    value={cMes}
                    onChange={e => setCMes(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {idx + 1} - {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    Casal Animador *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Thiago e Luana"
                    value={cAnim}
                    onChange={e => setCAnim(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    Casal Anfitrião *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Luciano e Camila"
                    value={cAnf}
                    onChange={e => setCAnf(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#C8952A] hover:bg-[#b08123] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Atualizar Casais do Mês
                </button>
              </form>
            </div>
          </div>

          {/* CARD 3: DIRETO ESPIRITUAL / CONSELHEIRO ESPIRITUAL */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-600 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <Church className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ✝️ Conselheiro Espiritual / Diretor Espiritual
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cadastro e informações de contato do Padre, Sacerdote ou Religiosa que acompanha a Equipe 13.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConselheiro} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nome do Diretor / Conselheiro *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pe. João Silva / Irmã Maria"
                    value={cNome}
                    onChange={e => setCNome(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Função
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Conselheiro Espiritual / Acompanhante"
                    value={cFuncao}
                    onChange={e => setCFuncao(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (61) 99999-8888"
                    value={cTelefone}
                    onChange={e => setCTelefone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: conselheiro@paroquia.org"
                    value={cEmail}
                    onChange={e => setCEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Endereço / Paróquia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paróquia São José - Q. 10 Lt. 20"
                    value={cEndereco}
                    onChange={e => setCEndereco(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Início da Função (Data em que começou)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 15/02/2023 ou 2023"
                    value={cInicioFuncao}
                    onChange={e => setCInicioFuncao(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Dados do Diretor Espiritual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB TAB 2: EDIÇÃO */}
      {adminSubTab === 'edicao' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300">
            Editar Item Existente
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                1. Mês (para reuniões/eventos)
              </label>
              <select
                value={editMonth}
                onChange={e => {
                  setEditMonth(Number(e.target.value));
                  setSelectedEditId('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value={0}>🌟 Todos os Meses (Sem filtro de data)</option>
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                2. Tipo de Item
              </label>
              <select
                value={selectedEditType}
                onChange={e => {
                  setSelectedEditType(e.target.value as any);
                  setSelectedEditId('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="reu">📌 Reuniões</option>
                <option value="eve">📅 Eventos</option>
                <option value="ani">🎉 Aniversários</option>
                <option value="mem">👥 Casais / Membros da Equipe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              3. Selecione o Item
            </label>
            <select
              value={selectedEditId}
              onChange={e => handleSelectEditItem(e.target.value, selectedEditType)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold"
            >
              <option value="">Escolha um item para editar ou excluir...</option>
              {selectedEditType === 'reu' &&
                reunioes
                  .filter(r => {
                    if (editMonth === 0) return true;
                    const m = r.mes ? Number(r.mes) : (r.data ? extractMonthFromDate(r.data) : 0);
                    return m === editMonth || m === 0;
                  })
                  .map((r, idx) => {
                    const mNum = r.mes ? Number(r.mes) : (r.data ? extractMonthFromDate(r.data) : 0);
                    const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
                    const val = r.id || (r.data ? `${r.data}-${r.tipo}` : r.tipo);
                    return (
                      <option key={r.id || `reu-${idx}`} value={val}>
                        {mName ? `[${mName}] ` : '[Sem data] '}{r.data ? `${r.data} - ` : ''}{r.tipo}
                      </option>
                    );
                  })}
              {selectedEditType === 'eve' &&
                eventos
                  .filter(e => {
                    if (editMonth === 0) return true;
                    const m = e.mes ? Number(e.mes) : (e.data ? extractMonthFromDate(e.data) : 0);
                    return m === editMonth || m === 0;
                  })
                  .map((e, idx) => {
                    const mNum = e.mes ? Number(e.mes) : (e.data ? extractMonthFromDate(e.data) : 0);
                    const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
                    const val = e.id || (e.data ? `${e.data}-${e.evento}` : e.evento);
                    return (
                      <option key={e.id || `eve-${idx}`} value={val}>
                        {mName ? `[${mName}] ` : '[Sem data] '}{e.data ? `${e.data} - ` : ''}{e.evento}
                      </option>
                    );
                  })}
              {selectedEditType === 'ani' &&
                aniversarios
                  .filter(a => {
                    if (editMonth === 0) return true;
                    const m = a.mes ? Number(a.mes) : (a.dia ? extractMonthFromDate(a.dia) : 0);
                    return m === editMonth || m === 0;
                  })
                  .map((a, idx) => {
                    const mNum = a.mes ? Number(a.mes) : (a.dia ? extractMonthFromDate(a.dia) : 0);
                    const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
                    const val = a.id || (a.dia ? `${a.dia}-${a.nome}` : a.nome);
                    return (
                      <option key={a.id || `ani-${idx}`} value={val}>
                        {mName ? `[${mName}] ` : '[Sem data] '}{a.dia ? `${a.dia} - ` : ''}{a.nome} ({a.tipo})
                      </option>
                    );
                  })}
              {selectedEditType === 'mem' &&
                (membros.length > 0 ? membros : INITIAL_MEMBROS_EQUIPE).map((m, idx) => (
                  <option key={m.id || `mem-${idx}`} value={m.id || m.casal}>
                    {m.casal} {m.funcao ? `(${m.funcao})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {selectedEditId && (
            <div className="pt-4 space-y-3 border-t border-slate-100 dark:border-slate-700">
              {selectedEditType === 'reu' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editFields.data || ''}
                      onChange={e => setEditFields({ ...editFields, data: e.target.value })}
                      placeholder="Data"
                      className="bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                    />
                    <input
                      type="text"
                      value={editFields.hora || ''}
                      onChange={e => setEditFields({ ...editFields, hora: e.target.value })}
                      placeholder="Hora"
                      className="bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    value={editFields.tipo || ''}
                    onChange={e => setEditFields({ ...editFields, tipo: e.target.value })}
                    placeholder="Tipo"
                    className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                  />
                  <input
                    type="text"
                    value={editFields.local || ''}
                    onChange={e => setEditFields({ ...editFields, local: e.target.value })}
                    placeholder="Local"
                    className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                  />
                </>
              )}

              {selectedEditType === 'eve' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editFields.data || ''}
                      onChange={e => setEditFields({ ...editFields, data: e.target.value })}
                      placeholder="Data"
                      className="bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                    />
                    <input
                      type="text"
                      value={editFields.hora || ''}
                      onChange={e => setEditFields({ ...editFields, hora: e.target.value })}
                      placeholder="Hora"
                      className="bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    value={editFields.evento || ''}
                    onChange={e => setEditFields({ ...editFields, evento: e.target.value })}
                    placeholder="Nome do Evento"
                    className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                  />
                </>
              )}

              {selectedEditType === 'ani' && (
                <>
                  <input
                    type="text"
                    value={editFields.dia || ''}
                    onChange={e => setEditFields({ ...editFields, dia: e.target.value })}
                    placeholder="Data"
                    className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                  />
                  <input
                    type="text"
                    value={editFields.nome || ''}
                    onChange={e => setEditFields({ ...editFields, nome: e.target.value })}
                    placeholder="Nome"
                    className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                  />
                </>
              )}

              {selectedEditType === 'mem' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">Casal</label>
                      <input
                        type="text"
                        value={editFields.casal || ''}
                        onChange={e => setEditFields({ ...editFields, casal: e.target.value })}
                        placeholder="Nome do Casal"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">Marido</label>
                      <input
                        type="text"
                        value={editFields.marido || ''}
                        onChange={e => setEditFields({ ...editFields, marido: e.target.value })}
                        placeholder="Marido"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">Esposa</label>
                      <input
                        type="text"
                        value={editFields.esposa || ''}
                        onChange={e => setEditFields({ ...editFields, esposa: e.target.value })}
                        placeholder="Esposa"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">E-mail Marido</label>
                      <input
                        type="email"
                        value={editFields.emailMarido || ''}
                        onChange={e => setEditFields({ ...editFields, emailMarido: e.target.value })}
                        placeholder="E-mail Marido"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">E-mail Esposa</label>
                      <input
                        type="email"
                        value={editFields.emailEsposa || ''}
                        onChange={e => setEditFields({ ...editFields, emailEsposa: e.target.value })}
                        placeholder="E-mail Esposa"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">Telefone</label>
                      <input
                        type="text"
                        value={editFields.telefone || ''}
                        onChange={e => setEditFields({ ...editFields, telefone: e.target.value })}
                        placeholder="Telefone"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400">Função</label>
                      <input
                        type="text"
                        value={editFields.funcao || ''}
                        onChange={e => setEditFields({ ...editFields, funcao: e.target.value })}
                        placeholder="Função na Equipe"
                        className="w-full bg-slate-50 dark:bg-slate-700 border p-2 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDeleteEditItem}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Item
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: CENTRAL DE EXCLUSÃO DE DADOS */}
      {adminSubTab === 'exclusao' && (() => {
        interface MasterItem {
          id: string;
          collectionName: string;
          type: 'reunioes' | 'eventos' | 'aniversarios' | 'casais' | 'cardapio' | 'emails';
          categoryLabel: string;
          badgeColor: string;
          title: string;
          dateOrMonth: string;
          subtitle?: string;
          rawData: any;
        }

        const itemsList: MasterItem[] = [];

        // 1. Reuniões
        reunioes.forEach((r, idx) => {
          const id = r.id || (r.data ? `${r.data}-${r.tipo}` : r.tipo);
          const mNum = r.mes ? Number(r.mes) : (r.data ? extractMonthFromDate(r.data) : 0);
          const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
          itemsList.push({
            id,
            collectionName: 'reunioes',
            type: 'reunioes',
            categoryLabel: '📌 Reunião',
            badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
            title: r.tipo || 'Reunião de Equipe',
            dateOrMonth: r.data ? `${r.data} ${mName ? `(${mName})` : ''}` : (mName || 'Sem data'),
            subtitle: r.local ? `Local: ${r.local}` : (r.horario ? `Horário: ${r.horario}` : undefined),
            rawData: r
          });
        });

        // 2. Eventos
        eventos.forEach((e, idx) => {
          const id = e.id || (e.data ? `${e.data}-${e.evento}` : e.evento);
          const mNum = e.mes ? Number(e.mes) : (e.data ? extractMonthFromDate(e.data) : 0);
          const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
          itemsList.push({
            id,
            collectionName: 'eventos',
            type: 'eventos',
            categoryLabel: '📅 Evento',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
            title: e.evento || 'Evento da Equipe',
            dateOrMonth: e.data ? `${e.data} ${mName ? `(${mName})` : ''}` : (mName || 'Sem data'),
            subtitle: e.horario ? `Horário: ${e.horario}` : undefined,
            rawData: e
          });
        });

        // 3. Aniversários
        aniversarios.forEach((a, idx) => {
          const id = a.id || (a.dia ? `${a.dia}-${a.nome}` : a.nome);
          const mNum = a.mes ? Number(a.mes) : (a.dia ? extractMonthFromDate(a.dia) : 0);
          const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : '';
          itemsList.push({
            id,
            collectionName: 'aniversarios',
            type: 'aniversarios',
            categoryLabel: '🎉 Aniversário',
            badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
            title: `${a.nome || 'Aniversariante'} (${a.tipo || 'Aniversariante'})`,
            dateOrMonth: a.dia ? `${a.dia} ${mName ? `(${mName})` : ''}` : (mName || 'Sem data'),
            rawData: a
          });
        });

        // 4. Casais / Membros
        membros.forEach((m, idx) => {
          const id = m.id || m.casal;
          itemsList.push({
            id,
            collectionName: 'membros',
            type: 'casais',
            categoryLabel: '👥 Casal da Equipe',
            badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
            title: m.casal,
            dateOrMonth: m.funcao ? `Função: ${m.funcao}` : 'Membro da Equipe',
            subtitle: m.telefoneMarido || m.telefoneEsposa ? `Tel: ${m.telefoneMarido || m.telefoneEsposa}` : undefined,
            rawData: m
          });
        });

        // 5. Cardápio
        cardapioList.forEach((c, idx) => {
          const id = c.id || `${c.anfitriao}-${c.prato}`;
          const mNum = c.mes ? Number(c.mes) : 0;
          const mName = mNum > 0 && mNum <= 12 ? MONTHS[mNum - 1] : 'Geral';
          itemsList.push({
            id,
            collectionName: 'cardapio',
            type: 'cardapio',
            categoryLabel: '🍳 Cardápio',
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
            title: `${c.prato || 'Prato'} (${c.tipoMenu || 'Café da Manhã'})`,
            dateOrMonth: `Mês: ${mName}`,
            subtitle: `Anfitrião: ${c.anfitriao} | Trazido por: ${c.quem}`,
            rawData: c
          });
        });

        // 6. E-mails
        emails.forEach((em, idx) => {
          const id = em.id || em.email;
          itemsList.push({
            id,
            collectionName: 'emails',
            type: 'emails',
            categoryLabel: '📧 E-mail Cadastrado',
            badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            title: em.email,
            dateOrMonth: em.createdAt ? new Date(em.createdAt).toLocaleDateString('pt-BR') : 'Cadastrado',
            rawData: em
          });
        });

        // Filter items
        const filteredMasterItems = itemsList.filter(item => {
          if (masterCategoryFilter !== 'all' && item.type !== masterCategoryFilter) {
            return false;
          }
          if (masterSearch.trim()) {
            const query = masterSearch.toLowerCase().trim();
            const textMatch =
              item.title.toLowerCase().includes(query) ||
              item.dateOrMonth.toLowerCase().includes(query) ||
              (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
              item.categoryLabel.toLowerCase().includes(query);
            return textMatch;
          }
          return true;
        });

        const handleDeleteMasterItem = async (item: MasterItem) => {
          try {
            const docIdToTry = item.rawData?.id || item.id;
            let count = await deleteItemById(item.collectionName, docIdToTry);
            if (count === 0 && item.title) {
              count = await deleteItemById(item.collectionName, item.title);
            }
            if (count > 0) {
              onNotify(`✨ "${item.title}" foi excluído com sucesso!`, 's');
            } else {
              onNotify(`⚠️ Não foi possível localizar o item "${item.title}" no banco para excluir.`, 'e');
            }
            refreshData();
          } catch (err: any) {
            console.error('Erro ao excluir item master:', err);
            onNotify('Erro ao excluir item: ' + (err.message || String(err)), 'e');
          }
        };

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-serif font-bold text-lg text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Central de Exclusão Geral de Dados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Encontre e remova qualquer registro cadastrado no sistema (Reuniões, Eventos, Aniversários, Casais, Cardápios ou E-mails), independente de mês ou data.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800">
                  Total Encontrado: {filteredMasterItems.length} {filteredMasterItems.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="md:col-span-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={masterSearch}
                  onChange={e => setMasterSearch(e.target.value)}
                  placeholder="Pesquisar por nome, data, local..."
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category pills */}
              <div className="md:col-span-2 flex flex-wrap gap-1.5 items-center">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'reunioes', label: '📌 Reuniões' },
                  { id: 'eventos', label: '📅 Eventos' },
                  { id: 'aniversarios', label: '🎉 Aniversários' },
                  { id: 'casais', label: '👥 Casais' },
                  { id: 'cardapio', label: '🍳 Cardápio' },
                  { id: 'emails', label: '📧 E-mails' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setMasterCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      masterCategoryFilter === cat.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List / Table */}
            {filteredMasterItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-sm">Nenhum registro encontrado para estes filtros.</p>
                <p className="text-xs mt-1">Tente mudar o termo da busca ou selecione a categoria "Todos".</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredMasterItems.map((item, idx) => (
                  <div
                    key={`${item.collectionName}-${item.id}-${idx}`}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-300 dark:hover:border-rose-600 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shrink-0 border border-black/5 ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            📆 {item.dateOrMonth}
                          </span>
                          {item.subtitle && (
                            <span>{item.subtitle}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMasterItem(item)}
                      className="self-end sm:self-center bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/60 dark:hover:bg-rose-600 dark:text-rose-300 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* SUB TAB CARDÁPIO RECEPTIVO */}
      {adminSubTab === 'cardapio' && (
        <div className="space-y-6">
          {/* Main Card Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#C8952A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1C52A4] dark:text-amber-300">
                    Planilha do Cardápio Receptivo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Edite o nome dos pratos e os casais diretamente na tabela. Selecione quais casais são anfitriões ou desative quem não participa.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setNewDishName('');
                    setNewDishAssignments({});
                    setShowAddDishModal(true);
                  }}
                  className="bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" /> + Novo Prato / Item
                </button>

                <button
                  onClick={() => {
                    setNewMenuTypeName('');
                    setShowAddMenuTypeModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Utensils className="w-4 h-4" /> + Criar Tipo de Cardápio
                </button>

                <button
                  onClick={async () => {
                    const count = await cleanDuplicateCardapio();
                    if (count > 0) {
                      onNotify(`${count} item(ns) duplicado(s) removido(s) do cardápio com sucesso!`, 's');
                      refreshData();
                    } else {
                      onNotify('Nenhum item duplicado encontrado no banco!', 'i');
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-600 flex items-center gap-1.5"
                  title="Remove itens duplicados da base de dados"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Limpar Duplicados
                </button>
              </div>
            </div>

            {/* Menu Type & Month Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Menu Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  1. Selecione o Tipo de Cardápio:
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set([
                      'Café da Manhã',
                      'Almoço',
                      'Jantar',
                      ...cardapioList.map(c => c.tipoMenu || 'Café da Manhã').filter(Boolean)
                    ])
                  ).map(tipo => {
                    const isSel = cardapioTypeFilter.toLowerCase().trim() === tipo.toLowerCase().trim();
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setCardapioTypeFilter(tipo)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSel
                            ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/50'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        🍽️ {tipo}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  2. Mês do Cardápio:
                </label>
                <select
                  value={cardapioMonthFilter}
                  onChange={e => setCardapioMonthFilter(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500 outline-none"
                >
                  <option value={0}>🌟 Geral (Padrão para Todos os Meses)</option>
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      📅 Mês de {m}
                    </option>
                  ))}
                </select>
                {cardapioMonthFilter > 0 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">
                    ⚡ Editando cardápio específico para o mês de {MONTHS[cardapioMonthFilter - 1]}.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Matrix Spreadsheet View */}
          {(() => {
            // Master list of all couples in team
            const allTeamCouples = Array.from(
              new Set([
                'Luana e Thiago',
                'Thais e Lucas',
                'Camila e Luciano',
                'Danielle e Fabiano',
                'Pâmela e Gláucio',
                'Patrícia e Mota',
                'Natália e Júlio',
                ...membros.map(m => m.casal).filter(Boolean)
              ])
            );

            // Active hosts after applying excluded filter
            const activeHostCouples = allTeamCouples.filter(c => !excludedHosts.includes(c));

            // Compute active matrix rows from cardapioList or fallback
            const activeList = cardapioList.length > 0 ? cardapioList : INITIAL_CARDAPIO;

            // Filter by selected tipoMenu & month
            const filteredItems = activeList.filter(c => {
              const matchType = (c.tipoMenu || 'Café da Manhã').toLowerCase().trim() === cardapioTypeFilter.toLowerCase().trim();
              const itemMes = c.mes || 0;
              const matchMes = cardapioMonthFilter === 0 ? (itemMes === 0) : (itemMes === cardapioMonthFilter || itemMes === 0);
              return matchType && matchMes;
            });

            // Extract unique dish names (pratos)
            const uniquePratos = Array.from(
              new Set(filteredItems.map(c => c.prato).filter(Boolean))
            );

            // Also if type is Café da Manhã and no custom items exist yet, populate from official CARDAPIO_MATRIX
            const displayPratos = (uniquePratos.length === 0 && cardapioTypeFilter === 'Café da Manhã' && cardapioMonthFilter === 0)
              ? CARDAPIO_MATRIX.map(m => m.prato)
              : uniquePratos;

            // Map prato -> { host -> quem }
            const matrixMap: Record<string, Record<string, string>> = {};

            // Pre-fill from filteredItems
            filteredItems.forEach(item => {
              if (!matrixMap[item.prato]) {
                matrixMap[item.prato] = {};
              }
              matrixMap[item.prato][item.anfitriao] = item.quem;
            });

            // Fallback for missing cells using CARDAPIO_MATRIX if Café da Manhã
            if (cardapioTypeFilter === 'Café da Manhã' && cardapioMonthFilter === 0) {
              CARDAPIO_MATRIX.forEach(row => {
                if (!matrixMap[row.prato]) {
                  matrixMap[row.prato] = { ...row.atribuicoes };
                } else {
                  Object.entries(row.atribuicoes).forEach(([host, quem]) => {
                    if (!matrixMap[row.prato][host]) {
                      matrixMap[row.prato][host] = quem;
                    }
                  });
                }
              });
            }

            const uniqueCouplesOptions = [
              'Anfitrião',
              'Casal Animador',
              'Não participa',
              ...allTeamCouples
            ];

            return (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Couple Participation Filter Bar */}
                <div className="bg-amber-500/10 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      👥 Casais Anfitriões da Equipe ({activeHostCouples.length}/{allTeamCouples.length} ativos):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExcludedHosts([])}
                        className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline bg-white/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700"
                      >
                        ✅ Incluir Todos
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Clique em um casal para <strong>ativar ou desativar</strong> temporariamente como anfitrião no cardápio.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {allTeamCouples.map(couple => {
                      const isExcluded = excludedHosts.includes(couple);
                      return (
                        <button
                          key={couple}
                          type="button"
                          onClick={() => {
                            if (isExcluded) {
                              setExcludedHosts(excludedHosts.filter(c => c !== couple));
                            } else {
                              setExcludedHosts([...excludedHosts, couple]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
                            !isExcluded
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 line-through opacity-60'
                          }`}
                        >
                          {!isExcluded ? '✅' : '❌'} {couple}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300">
                      Matriz Interativa: {cardapioTypeFilter} {cardapioMonthFilter > 0 ? `(${MONTHS[cardapioMonthFilter - 1]})` : '(Geral)'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ✏️ Você pode alterar o nome de um prato digitando no campo, e escolher o casal que vai trazer o prato em cada coluna!
                    </p>
                  </div>

                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                    {displayPratos.length} Prato(s) Cadastrado(s)
                  </span>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-[#1C52A4] text-amber-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                        <th className="py-3 px-4 border-r border-slate-700 min-w-[240px]">
                          Item / Prato (Editável)
                        </th>
                        {activeHostCouples.map(host => (
                          <th key={host} className="py-3 px-3 text-center border-r border-slate-700 min-w-[150px]">
                            🏠 {host}
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center w-[80px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs">
                      {/* Quick Add Row at Top of Table */}
                      <tr className="bg-amber-500/10 dark:bg-amber-950/40 border-b-2 border-amber-300 dark:border-amber-700">
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                          <input
                            type="text"
                            placeholder="➕ Digite um novo prato..."
                            value={quickDishName}
                            onChange={e => setQuickDishName(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && quickDishName.trim()) {
                                const dish = quickDishName.trim();
                                const assignments: Record<string, string> = {};
                                activeHostCouples.forEach(h => {
                                  assignments[h] = 'Anfitrião';
                                });
                                await saveCardapioMatrixForDish(dish, assignments, cardapioTypeFilter, cardapioMonthFilter);
                                setQuickDishName('');
                                onNotify(`Prato "${dish}" adicionado à tabela!`, 's');
                                refreshData();
                              }
                            }}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td colSpan={activeHostCouples.length} className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs font-semibold border-r border-slate-200 dark:border-slate-700">
                          <span className="text-[11px]">Pressione <strong>Enter</strong> para criar este prato para todos os anfitriões.</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!quickDishName.trim()) {
                                onNotify('Digite o nome do prato no campo.', 'e');
                                return;
                              }
                              const dish = quickDishName.trim();
                              const assignments: Record<string, string> = {};
                              activeHostCouples.forEach(h => {
                                assignments[h] = 'Anfitrião';
                              });
                              await saveCardapioMatrixForDish(dish, assignments, cardapioTypeFilter, cardapioMonthFilter);
                              setQuickDishName('');
                              onNotify(`Prato "${dish}" adicionado!`, 's');
                              refreshData();
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                          >
                            + Adicionar
                          </button>
                        </td>
                      </tr>

                      {displayPratos.map((prato, pIdx) => {
                        const hostAssignments = matrixMap[prato] || {};

                        return (
                          <tr
                            key={prato}
                            className={pIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/70 dark:bg-slate-700/30'}
                          >
                            {/* Dish Name Field (Editable directly inline) */}
                            <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                              <input
                                type="text"
                                defaultValue={prato}
                                onBlur={async e => {
                                  const val = e.target.value.trim();
                                  if (val && val !== prato) {
                                    try {
                                      await updateCardapioDishName(prato, val, cardapioTypeFilter, cardapioMonthFilter);
                                      onNotify(`Prato renomeado para "${val}"!`, 's');
                                      refreshData();
                                    } catch (err: any) {
                                      onNotify('Erro ao renomear prato: ' + (err.message || String(err)), 'e');
                                    }
                                  }
                                }}
                                className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-700 border border-transparent focus:border-amber-500 rounded-lg px-2 py-1 font-bold text-slate-800 dark:text-slate-100 outline-none transition-all"
                                title="Clique para editar o nome deste prato"
                              />
                            </td>

                            {/* Active Host Columns */}
                            {activeHostCouples.map(host => {
                              const currentQuem = hostAssignments[host] || 'Anfitrião';

                              return (
                                <td
                                  key={host}
                                  className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center"
                                >
                                  <select
                                    value={currentQuem}
                                    onChange={async e => {
                                      const newQuem = e.target.value;
                                      try {
                                        await saveCardapioItem({
                                          anfitriao: host,
                                          prato,
                                          quem: newQuem,
                                          tipoMenu: cardapioTypeFilter,
                                          mes: cardapioMonthFilter
                                        });
                                        onNotify(`Atribuição salva: ${prato} (${host}) ➔ ${newQuem}`, 's');
                                        refreshData();
                                      } catch (err: any) {
                                        onNotify('Erro ao salvar no banco: ' + (err.message || String(err)), 'e');
                                      }
                                    }}
                                    className={`w-full border rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                      currentQuem === host || currentQuem === 'Anfitrião'
                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                                        : currentQuem === 'Casal Animador'
                                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800'
                                        : currentQuem === 'Não participa'
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-600'
                                    }`}
                                  >
                                    <option value="Anfitrião">🏠 Anfitrião ({host})</option>
                                    <option value="Casal Animador">✨ Casal Animador</option>
                                    <option value="Não participa">🚫 Não participa / Excluído</option>
                                    <hr />
                                    {allTeamCouples.map(c => (
                                      <option key={c} value={c}>
                                        {c === host ? `🏠 ${c} (Anfitrião)` : c}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            })}

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteCardapioDish(prato, cardapioTypeFilter, cardapioMonthFilter);
                                    onNotify(`Prato "${prato}" removido com sucesso!`, 's');
                                    refreshData();
                                  } catch (err: any) {
                                    onNotify('Erro ao excluir prato: ' + (err.message || String(err)), 'e');
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                                title="Excluir Prato"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Modal to Add New Dish */}
          {showAddDishModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h4 className="font-serif font-bold text-lg text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-amber-600" />
                    Novo Prato para "{cardapioTypeFilter}"
                  </h4>
                  <button
                    onClick={() => setShowAddDishModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!newDishName.trim()) {
                      onNotify('Por favor informe o nome do prato.', 'e');
                      return;
                    }
                    setIsSavingCardapio(true);
                    try {
                      {/* Save for all active hosts */}
                      const allCouplesModal = Array.from(
                        new Set([
                          'Luana e Thiago',
                          'Thais e Lucas',
                          'Camila e Luciano',
                          'Danielle e Fabiano',
                          'Pâmela e Gláucio',
                          'Patrícia e Mota',
                          'Natália e Júlio',
                          ...membros.map(m => m.casal).filter(Boolean)
                        ])
                      );
                      const finalAssignments = { ...newDishAssignments };
                      allCouplesModal.forEach(h => {
                        if (!finalAssignments[h]) finalAssignments[h] = 'Anfitrião';
                      });

                      await saveCardapioMatrixForDish(
                        newDishName.trim(),
                        finalAssignments,
                        cardapioTypeFilter,
                        cardapioMonthFilter
                      );

                      onNotify(`Prato "${newDishName}" cadastrado com sucesso!`, 's');
                      setShowAddDishModal(false);
                      setNewDishName('');
                      setNewDishAssignments({});
                      refreshData();
                    } catch (err: any) {
                      onNotify('Erro ao salvar prato: ' + (err.message || String(err)), 'e');
                    } finally {
                      setIsSavingCardapio(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Nome do Prato / Item *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Torta Salgada, Suco de Laranja, Sobremesa"
                      value={newDishName}
                      onChange={e => setNewDishName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Quem deve levar para cada Anfitrião?
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {Array.from(
                        new Set([
                          'Luana e Thiago',
                          'Thais e Lucas',
                          'Camila e Luciano',
                          'Danielle e Fabiano',
                          'Pâmela e Gláucio',
                          'Patrícia e Mota',
                          'Natália e Júlio',
                          ...membros.map(m => m.casal).filter(Boolean)
                        ])
                      ).map(host => (
                        <div
                          key={host}
                          className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                        >
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            🏠 {host}:
                          </span>
                          <select
                            value={newDishAssignments[host] || 'Anfitrião'}
                            onChange={e =>
                              setNewDishAssignments({
                                ...newDishAssignments,
                                [host]: e.target.value
                              })
                            }
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 text-xs font-semibold"
                          >
                            <option value="Anfitrião">Anfitrião ({host})</option>
                            <option value="Casal Animador">Casal Animador</option>
                            <option value="Não participa">Não participa</option>
                            {Array.from(
                              new Set([
                                'Luana e Thiago',
                                'Thais e Lucas',
                                'Camila e Luciano',
                                'Danielle e Fabiano',
                                'Pâmela e Gláucio',
                                'Patrícia e Mota',
                                'Natália e Júlio',
                                ...membros.map(m => m.casal).filter(Boolean)
                              ])
                            ).map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDishModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCardapio}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingCardapio ? 'Salvando...' : 'Salvar Prato'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal to Add New Menu Type */}
          {showAddMenuTypeModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h4 className="font-serif font-bold text-lg text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-amber-600" />
                    Criar Novo Tipo de Cardápio
                  </h4>
                  <button
                    onClick={() => setShowAddMenuTypeModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!newMenuTypeName.trim()) {
                      onNotify('Digite o nome do novo cardápio.', 'e');
                      return;
                    }
                    const nameFormatted = newMenuTypeName.trim();
                    setCardapioTypeFilter(nameFormatted);
                    setShowAddMenuTypeModal(false);
                    setNewMenuTypeName('');
                    onNotify(`Tipo de cardápio "${nameFormatted}" ativado! Agora adicione os pratos.`, 's');
                    setShowAddDishModal(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Nome do Cardápio *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Almoço, Jantar, Lanche da Tarde"
                      value={newMenuTypeName}
                      onChange={e => setNewMenuTypeName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMenuTypeModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Criar & Adicionar Pratos
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: RELATÓRIOS E LEITURA ON-SCREEN DE REFLEXÕES */}
      {adminSubTab === 'relatorio' && (
        <div className="space-y-6">
          {/* Main Card Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#C8952A]" />
                  Respostas do Estudo dos Temas (CRE / Conselheiro)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Acesso reservado para visualizar as respostas completas (R1 a R5) na tela ou gerar relatório em PDF para o Diretor Espiritual.
                </p>
              </div>

              <button
                onClick={() => onOpenReportModal(selectedReflexaoTheme, selectedReflexaoYear)}
                className="bg-[#C8952A] hover:bg-[#b08123] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
              >
                <FileText className="w-4 h-4" />
                Imprimir / PDF Tema {selectedReflexaoTheme}
              </button>
            </div>

            {/* Theme Selector Pills */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">
                Selecione o Tema para Leitura On-Screen:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
                {['0', '1', '2', '3', '4', '5', '6', '7', '8', 'Balanço'].map(t => {
                  const count = reflexoes.filter(r => String(r.theme) === String(t) && Number(r.year) === Number(selectedReflexaoYear)).length;
                  const isSelected = String(selectedReflexaoTheme) === String(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedReflexaoTheme(t)}
                      className={`p-2.5 rounded-xl text-center transition-all border ${
                        isSelected
                          ? 'bg-[#1C52A4] text-white border-[#1C52A4] dark:bg-amber-400 dark:text-[#1C52A4] dark:border-amber-400 shadow-md font-bold'
                          : 'bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Tema {t}</div>
                      <div className="text-[11px] font-extrabold mt-0.5">{count}/7</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchReflexaoText}
                  onChange={(e) => setSearchReflexaoText(e.target.value)}
                  placeholder="Buscar por nome do casal ou texto nas respostas..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1C52A4]"
                />
              </div>

              <select
                value={selectedReflexaoYear}
                onChange={(e) => setSelectedReflexaoYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value={2026}>Ano 2026</option>
                <option value={2025}>Ano 2025</option>
                <option value={2024}>Ano 2024</option>
              </select>
            </div>
          </div>

          {/* On-Screen Answers Display List */}
          {(() => {
            const filteredReflexoes = reflexoes.filter(r => {
              const matchTheme = String(r.theme) === String(selectedReflexaoTheme);
              const matchYear = Number(r.year) === Number(selectedReflexaoYear);
              const q = searchReflexaoText.toLowerCase().trim();
              const matchSearch = !q ||
                (r.coupleName && r.coupleName.toLowerCase().includes(q)) ||
                (r.answers && r.answers.some(a => a.toLowerCase().includes(q)));
              return matchTheme && matchYear && matchSearch;
            });

            const submittedNames = reflexoes
              .filter(r => String(r.theme) === String(selectedReflexaoTheme) && Number(r.year) === Number(selectedReflexaoYear))
              .map(r => r.coupleName.toLowerCase());

            const missingCouples = CASAIS_DA_EQUIPE.filter(
              c => !submittedNames.some(s => s.includes(c.toLowerCase()) || c.toLowerCase().includes(s))
            );

            return (
              <div className="space-y-4">
                {/* Header Summary */}
                <div className="bg-[#1C52A4] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-300">
                      Reflexões Registradas — Tema {selectedReflexaoTheme} ({selectedReflexaoYear})
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {filteredReflexoes.length} casais com respostas gravadas no sistema
                    </p>
                  </div>
                  {missingCouples.length > 0 ? (
                    <div className="text-[11px] text-amber-200 bg-amber-900/40 border border-amber-500/30 px-3 py-1.5 rounded-xl font-medium">
                      {missingCouples.length} casais pendentes: {missingCouples.join(', ')}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% da equipe respondeu!
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredReflexoes.length === 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-2">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      Nenhuma resposta de reflexão encontrada para o Tema {selectedReflexaoTheme} ({selectedReflexaoYear})
                      {searchReflexaoText ? ` com o termo "${searchReflexaoText}"` : ''}.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Você pode importar dados antigos da planilha na aba "📥 Importar Planilha" ou preencher o formulário na aba "📖 Estudo".
                    </p>
                  </div>
                )}

                {/* Cards for each couple */}
                {filteredReflexoes.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-[#1C52A4] text-amber-300 font-serif font-bold text-sm flex items-center justify-center border border-amber-400/30 shadow-sm">
                          {item.coupleName ? item.coupleName.charAt(0) : 'C'}
                        </span>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#1C52A4] dark:text-amber-300">
                            {item.coupleName}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Enviado em: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditReflexao(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar Respostas
                        </button>
                        <button
                          onClick={() => handleDeleteReflexao(item.id!)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                          title="Excluir reflexão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Answers R1 to R5 */}
                    <div className="space-y-3 pt-1">
                      {item.answers && item.answers.length > 0 ? (
                        item.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/80 space-y-1"
                          >
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#1C52A4] text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                              Resposta {idx + 1} (R{idx + 1})
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                              {ans}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs italic text-slate-400">
                          (Nenhuma resposta detalhada registrada para este casal)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Edit Reflexao Modal */}
          {editingReflexao && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 my-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#C8952A]" />
                    Editar Reflexão — {editingReflexao.coupleName}
                  </h3>
                  <button
                    onClick={() => setEditingReflexao(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEditedReflexao} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Nome do Casal
                    </label>
                    <input
                      type="text"
                      value={editingReflexao.coupleName}
                      onChange={(e) => setEditingReflexao({ ...editingReflexao, coupleName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Tema
                      </label>
                      <input
                        type="text"
                        value={editingReflexao.theme}
                        onChange={(e) => setEditingReflexao({ ...editingReflexao, theme: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Ano
                      </label>
                      <input
                        type="number"
                        value={editingReflexao.year}
                        onChange={(e) => setEditingReflexao({ ...editingReflexao, year: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Edit Answers R1 to R5 */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-[#C8952A]">
                        Respostas (R1 a R5)
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditRAnswers([...editRAnswers, ''])}
                        className="text-xs text-[#1C52A4] dark:text-amber-300 font-bold hover:underline flex items-center gap-1"
                      >
                        + Adicionar Resposta
                      </button>
                    </div>

                    {editRAnswers.map((ans, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Resposta {idx + 1} (R{idx + 1})
                        </label>
                        <textarea
                          rows={3}
                          value={ans}
                          onChange={(e) => {
                            const newArr = [...editRAnswers];
                            newArr[idx] = e.target.value;
                            setEditRAnswers(newArr);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEditingReflexao(null)}
                      className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1C52A4] text-white font-bold text-xs uppercase px-5 py-2 rounded-xl transition-all shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: NOTIFICAÇÕES & WHATSAPP */}
      {adminSubTab === 'emails' && (
        <div className="space-y-5">
          {/* Main Dispatch & WhatsApp Formatting Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  Gerar Notificação Formatada (WhatsApp & E-mail)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecione uma reunião/evento para gerar um texto com emojis e negrito (*texto*) pronto para copiar e colar no grupo da equipe no WhatsApp.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 shrink-0">
                Formatado p/ WhatsApp 📲
              </span>
            </div>

            {/* Event Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Selecione a Reunião ou Evento da Agenda (Hoje em diante):
              </label>
              <select
                value={selectedNotifyItem}
                onChange={e => setSelectedNotifyItem(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1C52A4] dark:focus:ring-amber-500"
              >
                <option value="">-- Escolha uma reunião ou evento para notificar --</option>
                {reunioes
                  .filter(r => isDateTodayOrFuture(r.data, Number(r.mes)))
                  .map(r => (
                    <option key={r.id} value={`Reunião ${r.data} (${r.tipo})${r.local ? ` - Anfitrião: ${r.local}` : ''}`}>
                      📌 Reunião {r.data}: {r.tipo} {r.local ? `[${r.local}]` : ''}
                    </option>
                  ))}
                {eventos
                  .filter(e => isDateTodayOrFuture(e.data, Number(e.mes)))
                  .map(e => (
                    <option key={e.id} value={`Evento ${e.data} (${e.evento})`}>
                      📅 Evento {e.data}: {e.evento}
                    </option>
                  ))}
              </select>
            </div>

            {/* Live WhatsApp Preview Box */}
            {selectedNotifyItem && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Pré-visualização do Texto p/ WhatsApp:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsAppFormattedText(selectedNotifyItem)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Texto
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3.5 font-sans text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
                  {getWhatsAppNotificationText(selectedNotifyItem)}
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleCopyWhatsAppFormattedText(selectedNotifyItem)}
                disabled={!selectedNotifyItem}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                📋 Copiar Texto Formatado
              </button>

              <button
                type="button"
                onClick={() => handleOpenWhatsAppWeb(selectedNotifyItem)}
                disabled={!selectedNotifyItem}
                className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                📲 Abrir no WhatsApp
              </button>

              <button
                type="button"
                onClick={handleDispatchNotification}
                disabled={!selectedNotifyItem}
                className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Mail className="w-4 h-4 text-amber-300" />
                📧 Abrir no App de E-mail
              </button>
            </div>
          </div>

          {/* Log History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-serif font-bold text-sm text-slate-700 dark:text-slate-200">
              Histórico de Notificações Registradas ({emailLogs.length})
            </h4>

            {emailLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma notificação registrada até o momento.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
                {emailLogs.map((log, idx) => (
                  <div key={log.id || idx} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{log.assunto}</p>
                      <p className="text-[10px] text-slate-400">{log.destinatarios} contato(s) da equipe</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{log.data}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 5: BANCO DE DADOS DE EMAILS */}
      {adminSubTab === 'dados' && (
        <div className="bg-[#1C52A4] text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#C8952A]" />
                Lista de E-mails Cadastrados
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Gerencie, edite ou remova duplicados da lista de distribuição de e-mails da equipe.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EFD89A] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {emails.length} contatos
              </span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRemoveDuplicateEmails}
              className="bg-amber-500 hover:bg-amber-600 text-[#1C52A4] font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              🧹 Limpar / Excluir Duplicados
            </button>

            <button
              onClick={handleCopyAllEmails}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-amber-300" />
              📋 Copiar Lista de E-mails
            </button>
          </div>

          {/* Direct Add Email Form */}
          <form onSubmit={handleAddEmailDirect} className="flex gap-2">
            <input
              type="email"
              placeholder="Adicionar novo e-mail (ex: casal@email.com)..."
              value={newEmailInput}
              onChange={e => setNewEmailInput(e.target.value)}
              required
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-[#C8952A]"
            />
            <button
              type="submit"
              className="bg-[#C8952A] hover:bg-[#b08123] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Cadastrar
            </button>
          </form>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar e-mail cadastrado..."
              value={emailQuery}
              onChange={e => setEmailQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-[#C8952A]"
            />
          </div>

          {/* Grid List with Inline Edit and Delete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredEmails.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center col-span-2">
                Nenhum e-mail encontrado.
              </p>
            ) : (
              filteredEmails.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 flex items-center justify-between gap-2"
                >
                  {editingEmailId === item.id ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="email"
                        value={editingEmailValue}
                        onChange={e => setEditingEmailValue(e.target.value)}
                        className="flex-1 bg-white/20 border border-amber-400/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => item.id && handleSaveEditedEmail(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-xs"
                        title="Salvar"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmailId(null);
                          setEditingEmailValue('');
                        }}
                        className="bg-slate-600 hover:bg-slate-700 text-white p-1.5 rounded-lg text-xs"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <Mail className="w-3.5 h-3.5 text-[#C8952A] shrink-0" />
                        <span className="truncate font-medium text-slate-100">{item.email}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmailId(item.id || null);
                            setEditingEmailValue(item.email);
                          }}
                          className="text-slate-300 hover:text-amber-300 p-1 hover:bg-white/10 rounded-md transition-all"
                          title="Editar e-mail"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => item.id && handleDeleteEmail(item.id, item.email)}
                          className="text-slate-300 hover:text-rose-400 p-1 hover:bg-white/10 rounded-md transition-all"
                          title="Excluir e-mail"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 6: IMPORTADOR DE PLANILHA REAL */}
      {adminSubTab === 'planilha' && (
        <SpreadsheetImporter
          onNotify={onNotify}
          refreshData={refreshData}
        />
      )}

      {/* SUB TAB: CONFIGURAÇÃO DE TEMAS DO ANO */}
      {adminSubTab === 'temasAno' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
                📖 Configuração dos Temas do Ano
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cadastre ou edite os títulos dos Temas (1 a 9 e Tema 0) para cada ano letivo.
              </p>
            </div>

            {/* Year selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-2xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Ano:
              </label>
              <input
                type="number"
                value={temaAnoSelectedYear}
                onChange={e => setTemaAnoSelectedYear(Number(e.target.value))}
                className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4]"
              />
            </div>
          </div>

          {/* Guidelines Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              💡 Ordem oficial dos temas de estudo:
            </p>
            <p className="text-[11px] leading-relaxed">
              Janeiro e Dezembro não possuem estudo de tema. Os temas vão de <strong>Fevereiro (Tema 0)</strong> até <strong>Novembro (Tema 9 - Balanço)</strong>.
            </p>
          </div>

          {/* Form Grid for Themes 0 to 9 */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingTemasAno(true);
              try {
                await saveTemaAno(temaAnoSelectedYear, temaAnoTitles);
                onNotify(`Títulos dos Temas para o ano ${temaAnoSelectedYear} salvos com sucesso!`, 's');
                refreshData();
              } catch (err) {
                onNotify('Erro ao salvar temas do ano.', 'e');
              } finally {
                setSavingTemasAno(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { code: '0', month: 'Fevereiro', defaultLabel: 'Tema 0' },
                { code: '1', month: 'Março', defaultLabel: 'Tema 1' },
                { code: '2', month: 'Abril', defaultLabel: 'Tema 2' },
                { code: '3', month: 'Maio', defaultLabel: 'Tema 3' },
                { code: '4', month: 'Junho', defaultLabel: 'Tema 4' },
                { code: '5', month: 'Julho', defaultLabel: 'Tema 5' },
                { code: '6', month: 'Agosto', defaultLabel: 'Tema 6' },
                { code: '7', month: 'Setembro', defaultLabel: 'Tema 7' },
                { code: '8', month: 'Outubro', defaultLabel: 'Tema 8' },
                { code: '9', month: 'Novembro (Balanço)', defaultLabel: 'Tema 9 - Balanço' }
              ].map(item => (
                <div key={item.code} className="bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C52A4] dark:text-amber-300">
                      {item.code === '9' ? 'Tema 9 (Balanço)' : `Tema ${item.code}`}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Mês: {item.month}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={temaAnoTitles[item.code] || ''}
                    onChange={e => {
                      setTemaAnoTitles({
                        ...temaAnoTitles,
                        [item.code]: e.target.value
                      });
                    }}
                    placeholder={`Título para ${item.defaultLabel}...`}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingTemasAno}
                className="bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingTemasAno ? 'Salvando...' : `Salvar Temas do Ano ${temaAnoSelectedYear}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB TAB: MUDAR SENHA DO SISTEMA */}
      {adminSubTab === 'senha' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-6 max-w-xl mx-auto">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="font-serif text-xl font-bold text-[#1C52A4] dark:text-amber-300 flex items-center gap-2">
              🔑 Mudar Senha do Sistema
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Altere a senha de acesso ao Painel Administrativo. A nova senha será salva com segurança no banco de dados.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (currentPassInput.trim() !== storedAdminPass && currentPassInput.trim() !== 'ens13') {
                onNotify('Senha atual incorreta!', 'e');
                return;
              }
              if (!newPassInput.trim()) {
                onNotify('A nova senha não pode ser vazia.', 'e');
                return;
              }
              if (newPassInput !== confirmPassInput) {
                onNotify('A confirmação da nova senha não confere.', 'e');
                return;
              }

              setChangingPass(true);
              try {
                await saveAdminPassword(newPassInput.trim());
                setStoredAdminPass(newPassInput.trim());
                setCurrentPassInput('');
                setNewPassInput('');
                setConfirmPassInput('');
                onNotify('Senha do sistema alterada com sucesso!', 's');
              } catch (err) {
                onNotify('Erro ao alterar senha. Tente novamente.', 'e');
              } finally {
                setChangingPass(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Senha Atual *
              </label>
              <input
                type="password"
                required
                value={currentPassInput}
                onChange={e => setCurrentPassInput(e.target.value)}
                placeholder="Digite a senha atual..."
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Nova Senha *
              </label>
              <input
                type="password"
                required
                value={newPassInput}
                onChange={e => setNewPassInput(e.target.value)}
                placeholder="Digite a nova senha..."
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                value={confirmPassInput}
                onChange={e => setConfirmPassInput(e.target.value)}
                placeholder="Confirme a nova senha..."
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPass}
                className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {changingPass ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB TAB: ROTEIRO DA REUNIÃO FORMAL (GERADOR DE PDF) */}
      {adminSubTab === 'roteiro' && (
        <RoteiroReuniaoTab
          reunioes={reunioes}
          eventos={eventos}
          aniversarios={aniversarios}
          casaisMesList={casaisMesList}
          temasAnoList={temasAnoList}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

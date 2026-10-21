import React, { useEffect, useState } from 'react';
import {
  entrarComGoogle,
  sair,
  enviarLinkDeLogin,
  abertoPeloLinkDeLogin,
  emailGuardadoParaLink,
  concluirLoginPorLink
} from '../lib/acesso';

interface LoginScreenProps {
  /** E-mail logado sem permissão (mostra a mensagem de acesso negado). */
  emailSemAcesso?: string | null;
  verificando?: boolean;
}

function mensagemDeErro(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Libere pop-ups para este site e tente de novo.';
    case 'auth/unauthorized-domain':
    case 'auth/unauthorized-continue-uri':
      return 'Este endereço ainda não está autorizado no Firebase. Avise o administrador.';
    case 'auth/operation-not-allowed':
      return 'O login por link no e-mail ainda não foi ativado. Avise o administrador.';
    case 'auth/invalid-email':
      return 'Esse e-mail não parece válido. Confira e tente de novo.';
    case 'auth/quota-exceeded':
      return 'Já foram enviados muitos links hoje. Tente amanhã ou entre com Google.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'Este link já foi usado ou expirou. Peça um novo link abaixo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Tente de novo.';
    default:
      return 'Não foi possível entrar. Tente de novo.';
  }
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ emailSemAcesso, verificando }) => {
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');

  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [linkEnviadoPara, setLinkEnviadoPara] = useState('');

  // Página aberta pelo link do e-mail
  const [concluindoLink, setConcluindoLink] = useState(false);
  const [pedirEmailDoLink, setPedirEmailDoLink] = useState(false);

  const concluir = async (emailDoLink: string) => {
    setErro('');
    setConcluindoLink(true);
    try {
      await concluirLoginPorLink(emailDoLink);
      // o App detecta o login e segue sozinho
    } catch (err: any) {
      setErro(
        err?.code === 'auth/invalid-email'
          ? 'Esse não é o e-mail para o qual o link foi enviado. Confira e tente de novo.'
          : mensagemDeErro(err)
      );
      if (err?.code !== 'auth/invalid-email') {
        setPedirEmailDoLink(false);
        window.history.replaceState(null, '', window.location.origin + window.location.pathname);
      }
    } finally {
      setConcluindoLink(false);
    }
  };

  useEffect(() => {
    if (verificando || emailSemAcesso || !abertoPeloLinkDeLogin()) return;
    const guardado = emailGuardadoParaLink();
    if (guardado) {
      concluir(guardado);
    } else {
      // link aberto em outro aparelho/navegador: confirmar o e-mail
      setPedirEmailDoLink(true);
    }
  }, [verificando, emailSemAcesso]);

  const handleGoogle = async () => {
    setErro('');
    setEntrando(true);
    try {
      await entrarComGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setErro(mensagemDeErro(err));
      }
    } finally {
      setEntrando(false);
    }
  };

  const handleEnviarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email.includes('@')) {
      setErro('Digite o seu e-mail.');
      return;
    }
    setEnviando(true);
    try {
      await enviarLinkDeLogin(email);
      setLinkEnviadoPara(email.trim().toLowerCase());
    } catch (err: any) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#1C52A4] dark:focus:border-amber-400';
  const primaryBtn =
    'w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md disabled:opacity-60';

  let conteudo: React.ReactNode;

  if (verificando || concluindoLink) {
    conteudo = (
      <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
        {concluindoLink ? 'Entrando…' : 'Verificando acesso…'}
      </p>
    );
  } else if (emailSemAcesso) {
    conteudo = (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
          O e-mail <strong className="break-all">{emailSemAcesso}</strong> ainda não está liberado no app. Peça ao
          administrador da equipe para incluí-lo, ou entre com o e-mail que está no seu cadastro.
        </div>
        <button onClick={() => sair()} className={primaryBtn}>
          Entrar com outra conta
        </button>
      </div>
    );
  } else if (pedirEmailDoLink) {
    conteudo = (
      <form
        onSubmit={e => {
          e.preventDefault();
          if (email.includes('@')) concluir(email);
        }}
        className="space-y-3 text-left"
      >
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Para terminar de entrar, confirme o e-mail para o qual o link foi enviado.
        </p>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu e-mail"
          className={inputClass}
        />
        <button type="submit" className={primaryBtn}>
          Entrar
        </button>
        {erro && <p className="text-xs text-rose-600 dark:text-rose-400">{erro}</p>}
      </form>
    );
  } else if (linkEnviadoPara) {
    conteudo = (
      <div className="space-y-4 text-left">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed space-y-2">
          <p>
            Enviamos um link de acesso para <strong className="break-all">{linkEnviadoPara}</strong>.
          </p>
          <p>
            Abra o e-mail <strong>neste mesmo aparelho</strong> e toque no link para entrar. Se não chegar em alguns
            minutos, olhe a caixa de spam ou lixo eletrônico.
          </p>
        </div>
        <button
          onClick={() => {
            setLinkEnviadoPara('');
            setErro('');
          }}
          className="w-full text-xs font-bold text-[#1C52A4] dark:text-amber-300 hover:underline"
        >
          Usar outro e-mail
        </button>
      </div>
    );
  } else {
    conteudo = (
      <div className="space-y-4">
        <button
          onClick={handleGoogle}
          disabled={entrando}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-[#1C52A4] dark:hover:border-amber-400 text-slate-800 dark:text-slate-100 font-bold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          {entrando ? 'Entrando…' : 'Entrar com Google'}
        </button>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          ou receba um link no e-mail
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        <form onSubmit={handleEnviarLink} className="space-y-2.5">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu e-mail (Hotmail, Outlook, qualquer um)"
            className={inputClass}
          />
          <button type="submit" disabled={enviando} className={primaryBtn}>
            {enviando ? 'Enviando…' : 'Enviar link de acesso'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Use o e-mail que está no seu cadastro da equipe.
        </p>
        {erro && <p className="text-xs text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#0F1623] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-5">
        <img
          src="https://i.imgur.com/xLZMAXl.png"
          alt="Logo da Equipe 13"
          className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-[#C8952A]"
        />
        <div>
          <h1 className="font-serif text-xl font-bold text-[#1C52A4] dark:text-amber-300">Equipe 13 · ENS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Agenda, estudo do tema e cardápio da equipe.</p>
        </div>
        {conteudo}
      </div>
    </div>
  );
};

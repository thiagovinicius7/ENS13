import React, { useState } from 'react';
import { entrarComGoogle, sair } from '../lib/acesso';

interface LoginScreenProps {
  /** E-mail logado sem permissão (mostra a mensagem de acesso negado). */
  emailSemAcesso?: string | null;
  verificando?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ emailSemAcesso, verificando }) => {
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');

  const handleEntrar = async () => {
    setErro('');
    setEntrando(true);
    try {
      await entrarComGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // a pessoa fechou a janela do Google; nada a fazer
      } else if (code === 'auth/popup-blocked') {
        setErro('O navegador bloqueou a janela de login. Libere pop-ups para este site e tente de novo.');
      } else if (code === 'auth/unauthorized-domain') {
        setErro('Este endereço ainda não está autorizado no Firebase. Avise o administrador.');
      } else {
        setErro('Não foi possível entrar. Tente de novo.');
      }
    } finally {
      setEntrando(false);
    }
  };

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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Agenda, estudo do tema e cardápio da equipe.
          </p>
        </div>

        {verificando ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-3">Verificando acesso…</p>
        ) : emailSemAcesso ? (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
              O e-mail <strong className="break-all">{emailSemAcesso}</strong> ainda não está liberado no app.
              Peça ao administrador da equipe para incluí-lo, ou entre com o e-mail que está no seu cadastro.
            </div>
            <button
              onClick={() => sair()}
              className="w-full bg-[#1C52A4] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md"
            >
              Entrar com outra conta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleEntrar}
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
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Use o e-mail que está no seu cadastro da equipe.
            </p>
            {erro && <p className="text-xs text-rose-600 dark:text-rose-400">{erro}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

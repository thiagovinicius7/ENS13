import React from 'react';
import { Calendar, BookOpen, Settings, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: 'agenda' | 'reflexoes' | 'admin';
  setActiveTab: (tab: 'agenda' | 'reflexoes' | 'admin') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  toggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1C52A4] text-white shadow-md border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="https://i.imgur.com/xLZMAXl.png"
            alt="Equipe 13 ENS Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#C8952A]/40 shadow-sm"
          />
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Equipe 13
              <span className="text-[10px] font-semibold uppercase bg-[#C8952A]/20 text-[#EFD89A] px-2 py-0.5 rounded-full border border-[#C8952A]/30">
                ENS
              </span>
            </h1>
            <p className="text-[11px] text-[#EFD89A] tracking-wider uppercase font-medium">
              Nossa Senhora Desatadora dos Nós
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'agenda'
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Agenda
          </button>
          <button
            onClick={() => setActiveTab('reflexoes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'reflexoes'
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Estudo
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Admin
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Alternar Modo Claro" : "Alternar Modo Escuro"}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-between p-2 transition-all border border-white/15 active:scale-95"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-300 mx-auto" />
            ) : (
              <Moon className="w-5 h-5 text-blue-100 mx-auto" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

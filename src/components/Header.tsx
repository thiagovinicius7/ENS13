import React from 'react';
import { Calendar, BookOpen, Settings, Moon, Sun } from 'lucide-react';

export function NossaSenhoraIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer Glow & Border */}
      <circle cx="50" cy="50" r="48" fill="#0E3269" stroke="#C8952A" strokeWidth="2.5" />
      
      {/* Golden Halo with Rays */}
      <circle cx="50" cy="38" r="21" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.9" />
      <circle cx="50" cy="38" r="18" fill="#FBF3D5" opacity="0.25" />

      {/* Halo Stars */}
      <circle cx="50" cy="18" r="1.5" fill="#FBBF24" />
      <circle cx="34" cy="23" r="1.5" fill="#FBBF24" />
      <circle cx="66" cy="23" r="1.5" fill="#FBBF24" />
      <circle cx="30" cy="37" r="1.5" fill="#FBBF24" />
      <circle cx="70" cy="37" r="1.5" fill="#FBBF24" />

      {/* Blue Mantle (Manto Sagrado) */}
      <path
        d="M50 22 C38 22, 30 32, 28 48 C26 64, 25 85, 23 95 L77 95 C75 85, 74 64, 72 48 C70 32, 62 22, 50 22 Z"
        fill="#1D4ED8"
      />
      
      {/* Gold Trim along mantle edge */}
      <path
        d="M32 45 C30 58, 28 80, 26 95 M68 45 C70 58, 72 80, 74 95"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />

      {/* Inner Robe */}
      <path d="M44 48 C44 48, 50 52, 56 48 L60 95 L40 95 Z" fill="#FAFAFA" />

      {/* Face & Veil framing */}
      <ellipse cx="50" cy="38" rx="8" ry="10" fill="#FDE68A" />
      
      {/* Hands Joined in Prayer */}
      <path
        d="M48 62 C48 57, 50 53, 50 53 C50 53, 52 57, 52 62 C51 65, 49 65, 48 62 Z"
        fill="#FDE68A"
        stroke="#D97706"
        strokeWidth="0.8"
      />

      {/* Golden Cross / Knot Emblem */}
      <path d="M50 67 L50 76 M46 71 L54 71" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
        {/* Brand Link */}
        <button
          onClick={() => setActiveTab('agenda')}
          className="flex items-center gap-3 text-left group focus:outline-none"
          title="Gestão Equipe 13 ENS - Início"
        >
          <div className="relative flex-shrink-0 transition-transform group-hover:scale-105">
            <NossaSenhoraIcon className="w-10 h-10 shadow-sm rounded-full" />
            <img
              src="https://i.imgur.com/xLZMAXl.png"
              alt="Logo secundário"
              className="w-4 h-4 rounded-full border border-white absolute -bottom-0.5 -right-0.5 object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 group-hover:text-[#EFD89A] transition-colors">
              Gestão Equipe 13
              <span className="text-[10px] font-semibold uppercase bg-[#C8952A]/20 text-[#EFD89A] px-2 py-0.5 rounded-full border border-[#C8952A]/30">
                ENS
              </span>
            </h1>
            <p className="text-[11px] text-[#EFD89A] tracking-wider uppercase font-medium">
              Nossa Senhora Desatadora dos Nós
            </p>
          </div>
        </button>

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

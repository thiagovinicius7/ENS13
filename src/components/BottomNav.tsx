import React from 'react';
import { Calendar, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'agenda' | 'reflexoes' | 'admin';
  setActiveTab: (tab: 'agenda' | 'reflexoes' | 'admin') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C52A4] border-t border-slate-700/60 shadow-lg px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'agenda' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'agenda'
                ? 'bg-[#C8952A]/20 text-[#C8952A] border border-[#C8952A]/30 scale-105'
                : 'bg-transparent'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('reflexoes')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'reflexoes' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'reflexoes'
                ? 'bg-[#C8952A]/20 text-[#C8952A] border border-[#C8952A]/30 scale-105'
                : 'bg-transparent'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Estudo</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'admin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'admin'
                ? 'bg-[#C8952A]/20 text-[#C8952A] border border-[#C8952A]/30 scale-105'
                : 'bg-transparent'
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Admin</span>
        </button>
      </div>
    </nav>
  );
};

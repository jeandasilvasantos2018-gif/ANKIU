import React from 'react';
import { ActiveTab } from '../types';
import { Home, Layers, Sparkles, Zap, Search, BarChart3, Settings, Headphones } from 'lucide-react';

interface NavbarProps { activeTab: ActiveTab; onSelectTab: (tab: ActiveTab) => void; }

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'decks', label: 'Decks', icon: <Layers className="w-5 h-5" /> },
    { id: 'fill_blank', label: 'Phrases', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'challenge', label: 'Défi', icon: <Zap className="w-5 h-5" /> },
    { id: 'podcasts', label: 'Podcasts', icon: <Headphones className="w-5 h-5" /> },
    { id: 'search', label: 'Chercher', icon: <Search className="w-5 h-5" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Réglages', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto rounded-[28px] border border-rose-200/70 dark:border-rose-900/30 bg-[#fffaf7]/92 dark:bg-[#30242a]/94 backdrop-blur-xl shadow-[0_16px_45px_rgba(116,65,80,.18)] px-2 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onSelectTab(tab.id)} aria-label={tab.label} className={`relative min-w-[52px] flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'text-[#7e69c5] dark:text-[#cbbcf3] font-bold -translate-y-1' : 'text-[#9a818a] dark:text-[#c9b3bb] hover:text-[#5c414c] dark:hover:text-white'}`}>
              <span className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-[#eee8ff] to-[#ffdce5] dark:from-[#4b3f60] dark:to-[#553946] shadow-[0_7px_16px_rgba(126,105,197,.16)]' : ''}`}>{tab.icon}</span>
              <span className="text-[8px] tracking-tight whitespace-nowrap">{tab.label}</span>
              {isActive && <span className="absolute -top-1 right-1.5 text-[#b59de7] text-[10px] ankiu-sparkle">✦</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

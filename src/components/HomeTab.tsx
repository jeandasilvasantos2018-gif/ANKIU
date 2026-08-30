import React from 'react';
import { FlashCard, UserStats } from '../types';
import { Play, Sparkles, Flame, Star, Heart, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { BunnyPeeking } from './BunnyPeeking';

interface HomeTabProps {
  cards: FlashCard[];
  stats: UserStats;
  onStartStudy: () => void;
  onOpenFillBlank?: () => void;
  onSelectFavoriteCard?: (card: FlashCard) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ cards, stats, onStartStudy, onOpenFillBlank, onSelectFavoriteCard }) => {
  const newCardsCount = cards.filter((c) => c.state === 'Novo').length;
  const reviewCardsCount = cards.filter((c) => c.state === 'Revisão' || c.state === 'Aprendendo').length;
  const totalDue = newCardsCount + reviewCardsCount;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTimeSec = stats.dailyHistory?.[todayStr]?.timeSeconds || 0;
  const todayMinutes = Math.round(todayTimeSec / 60);
  const favoriteCards = cards.filter((c) => c.isFavorite);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-7 min-h-[calc(100vh-80px)]">
      <header className="relative overflow-hidden rounded-[30px] border border-rose-200/60 dark:border-rose-900/30 bg-[#fffaf7]/80 dark:bg-[#34272d]/85 px-5 py-5 shadow-[0_14px_40px_rgba(116,65,80,.10)]">
        <span className="absolute right-5 top-3 text-[#ff9b85] text-xl ankiu-sparkle">✦</span>
        <span className="absolute right-12 bottom-3 text-[#f7b8c5] text-xs ankiu-sparkle">✦</span>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.16em] text-[#b18491] dark:text-[#d9aeba]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            <h1 className="mt-1 text-[38px] leading-none font-black text-[#3c2d34] dark:text-[#fff7f3] tracking-[-.04em]">Bonjour! ♡</h1>
            <p className="mt-2 text-sm text-[#8e747d] dark:text-[#cdb8c0]">Um pouquinho por dia, com carinho.</p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#fff0d8] dark:bg-[#4a372d] text-[#d57a45] border border-[#ffd8ac] dark:border-[#6c4d3d] text-xs font-black shadow-sm"><Flame className="w-4 h-4 fill-current" /><span>{stats.streakDays} dias</span></div>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center gap-5 w-full">
        <div className="relative w-full pt-9">
          <BunnyPeeking />
          <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={onStartStudy} className="relative z-10 w-full overflow-hidden rounded-[34px] px-6 py-8 text-white shadow-[0_20px_50px_rgba(226,88,117,.25)] bg-gradient-to-br from-[#ff7893] via-[#ff8e8d] to-[#ffb48d] flex flex-col items-center justify-center gap-3 border border-white/30">
            <span className="absolute -left-8 -top-10 w-36 h-36 rounded-full bg-white/12" /><span className="absolute right-5 top-5 text-white/70 text-lg">✦</span><span className="absolute right-12 bottom-8 text-white/45 text-xs">✦</span>
            <div className="w-16 h-16 rounded-[24px] bg-white/18 border border-white/25 flex items-center justify-center shadow-inner"><Play className="w-8 h-8 fill-white translate-x-0.5" /></div>
            <span className="text-2xl font-black tracking-[-.03em]">Começar Estudo</span>
            <span className="text-xs font-semibold text-white/85 text-center">{totalDue > 0 ? `${totalDue} cartões esperando por você hoje` : 'Tudo em dia! Que tal estudar livre?'}</span>
          </motion.button>
        </div>

        {onOpenFillBlank && <button onClick={onOpenFillBlank} className="w-full p-4 rounded-[26px] ankiu-surface flex items-center justify-between group transition-all hover:-translate-y-0.5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-[18px] bg-[#efe8ff] dark:bg-[#493d60] text-[#806cc3] dark:text-[#c9baf4] flex items-center justify-center"><Sparkles className="w-5 h-5" /></div><div className="text-left"><div className="text-sm font-black text-[#49363f] dark:text-[#fff7f3] flex items-center gap-2">Completar Frases <span className="text-[9px] bg-[#ffe1e7] dark:bg-[#633846] text-[#dc5b76] dark:text-[#ffafbd] px-2 py-0.5 rounded-full">NOVO</span></div><div className="text-xs text-[#9b838c] dark:text-[#c7b1b9]">Pratique francês de um jeito leve</div></div></div><span className="text-[#e95e79] text-lg group-hover:translate-x-1 transition-transform">→</span></button>}

        <div className="w-full grid grid-cols-3 gap-3">
          <div className="rounded-[24px] bg-[#fff5e8] dark:bg-[#43342e] border border-[#ffe1bd] dark:border-[#654c3e] p-4 text-center shadow-sm"><BookOpen className="w-4 h-4 mx-auto mb-1 text-[#d88b54]" /><span className="block text-2xl font-black text-[#5a4036] dark:text-[#ffe8d8]">{newCardsCount}</span><span className="text-[10px] font-bold text-[#b38b75]">Novos</span></div>
          <div className="rounded-[24px] bg-[#fff0f3] dark:bg-[#493039] border border-[#ffd4dc] dark:border-[#693c49] p-4 text-center shadow-sm"><Heart className="w-4 h-4 mx-auto mb-1 text-[#eb6680] fill-[#eb6680]/20" /><span className="block text-2xl font-black text-[#d95572] dark:text-[#ff9fb2]">{reviewCardsCount}</span><span className="text-[10px] font-bold text-[#bd8190]">Revisões</span></div>
          <div className="rounded-[24px] bg-[#eef9f3] dark:bg-[#2e4138] border border-[#ccebdc] dark:border-[#426052] p-4 text-center shadow-sm"><Sparkles className="w-4 h-4 mx-auto mb-1 text-[#55a77f]" /><span className="block text-2xl font-black text-[#438c6b] dark:text-[#9ce0bf]">{todayMinutes}m</span><span className="text-[10px] font-bold text-[#78a28e]">Tempo</span></div>
        </div>
      </section>

      {favoriteCards.length > 0 && <section className="flex flex-col gap-3"><div className="flex items-center justify-between px-1"><span className="text-[11px] font-black uppercase tracking-[.12em] text-[#a57e8a] dark:text-[#d1abb7] flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#f0ad52] fill-[#ffd67d]" /> Favoritos</span><span className="text-[10px] font-bold text-[#c49aa6]">{favoriteCards.length} salvos</span></div><div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{favoriteCards.map((card, index) => { const palettes = ['bg-[#fff0f3] border-[#ffd3dc]', 'bg-[#f2efff] border-[#ddd4ff]', 'bg-[#fff5e8] border-[#ffe1bd]', 'bg-[#eef9f3] border-[#ccebdc]']; return <button key={card.id} onClick={() => onSelectFavoriteCard && onSelectFavoriteCard(card)} className={`min-w-[150px] px-4 py-3 rounded-[22px] border text-left shrink-0 shadow-sm ${palettes[index % palettes.length]} dark:bg-[#382b31] dark:border-[#58424c]`}><span className="block text-sm font-black text-[#503942] dark:text-[#fff7f3]">{card.word}</span><span className="block mt-1 text-[10px] text-[#9c7f88] dark:text-[#c9b3bb] truncate">{card.translation}</span></button>; })}</div></section>}
    </div>
  );
};

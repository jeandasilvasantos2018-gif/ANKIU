import React from 'react';
import { FlashCard, UserStats } from '../types';
import { Play, Sparkles, Flame, Clock, Layers, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { BunnyPeeking } from './BunnyPeeking';

interface HomeTabProps {
  cards: FlashCard[];
  stats: UserStats;
  onStartStudy: () => void;
  onOpenFillBlank?: () => void;
  onSelectFavoriteCard?: (card: FlashCard) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  cards,
  stats,
  onStartStudy,
  onOpenFillBlank,
  onSelectFavoriteCard,
}) => {

  // Calculate today's due cards
  const newCardsCount = cards.filter((c) => c.state === 'Novo').length;
  const reviewCardsCount = cards.filter((c) => c.state === 'Revisão' || c.state === 'Aprendendo').length;
  const totalDue = newCardsCount + reviewCardsCount;

  // Minutes studied today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTimeSec = stats.dailyHistory?.[todayStr]?.timeSeconds || 0;
  const todayMinutes = Math.round(todayTimeSec / 60);

  const favoriteCards = cards.filter((c) => c.isFavorite);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col gap-8 min-h-[calc(100vh-80px)] justify-between">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 text-xs font-bold">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{stats.streakDays} dias</span>
          </div>
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Hoje
        </h1>
      </div>

      {/* Main Enormous CTA Button: Começar Estudo */}
      <div className="flex flex-col items-center justify-center my-auto gap-6 w-full">
        <div className="relative w-full pt-8">
          {/* Vector Bunny peeking out seamlessly from the top of the card with transparent background */}
          <BunnyPeeking />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartStudy}
            className="w-full py-8 px-6 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl transition-all shadow-xl shadow-blue-500/25 flex flex-col items-center justify-center gap-3 group relative overflow-hidden z-10"
          >
            {/* Subtle Ambient Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-4 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <Play className="w-10 h-10 fill-white translate-x-0.5" />
            </div>

            <span className="tracking-tight">Começar Estudo</span>

            <span className="text-xs font-normal text-blue-100 opacity-90">
              {totalDue > 0
                ? `${totalDue} cartões prontos para revisão hoje`
                : 'Todos os cartões de hoje concluídos! Estudar livre'}
            </span>
          </motion.button>
        </div>

        {/* Quick Mode: Completar Frases */}
        {onOpenFillBlank && (
          <button
            onClick={onOpenFillBlank}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:via-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between group hover:border-blue-500 transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  Completar Frases
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md font-semibold">Novo</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Preencha a lacuna em francês nas frases
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              Praticar →
            </div>
          </button>
        )}

        {/* Minimal Daily Stats Cards Grid */}

        <div className="w-full grid grid-cols-3 gap-3">
          {/* Cartões novos */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {newCardsCount}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 leading-tight">
              Novos
            </span>
          </div>

          {/* Revisões */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {reviewCardsCount}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 leading-tight">
              Revisões
            </span>
          </div>

          {/* Tempo estudado */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {todayMinutes}m
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 leading-tight">
              Tempo
            </span>
          </div>
        </div>
      </div>

      {/* Favorites Quick Access Section */}
      {favoriteCards.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Favoritos ({favoriteCards.length})
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {favoriteCards.map((card) => (
              <button
                key={card.id}
                onClick={() => onSelectFavoriteCard && onSelectFavoriteCard(card)}
                className="px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 hover:border-blue-500 transition-colors shrink-0"
              >
                <span>{card.word}</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {card.translation}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

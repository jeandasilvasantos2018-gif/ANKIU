import React, { useState } from 'react';
import { FlashCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Volume2, Star, Plus } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface ExplorarModeProps {
  card: FlashCard;
  allCards: FlashCard[];
  onSelectWord: (word: string) => void;
  onClose: () => void;
  onAddWordCard?: (wordStr: string) => void;
}

export const ExplorarMode: React.FC<ExplorarModeProps> = ({
  card,
  allCards,
  onSelectWord,
  onClose,
  onAddWordCard,
}) => {
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [filterType, setFilterType] = useState<'all' | 'family' | 'expressions' | 'synonyms'>('all');
  const voicesReady = useVoicesReady();

  // Collect all semantic connections
  const connections: { word: string; category: string; color: string }[] = [];

  card.family.forEach((w) => {
    if (w.toLowerCase() !== card.word.toLowerCase()) {
      connections.push({ word: w, category: 'Família', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' });
    }
  });

  card.expressions.forEach((w) => {
    connections.push({ word: w, category: 'Expressão', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' });
  });

  card.synonyms.forEach((w) => {
    connections.push({ word: w, category: 'Sinônimo', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' });
  });

  card.collocations.forEach((w) => {
    connections.push({ word: w, category: 'Colocação', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' });
  });

  card.related.forEach((w) => {
    if (!connections.some((c) => c.word.toLowerCase() === w.toLowerCase())) {
      connections.push({ word: w, category: 'Relacionada', color: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30' });
    }
  });

  // Filter connections
  const filteredConnections = connections.filter((conn) => {
    if (filterType === 'family') return conn.category === 'Família';
    if (filterType === 'expressions') return conn.category === 'Expressão' || conn.category === 'Colocação';
    if (filterType === 'synonyms') return conn.category === 'Sinônimo';
    return true;
  });

  const handlePlayAudio = () => {
    playAudio(card.word, card.language, audioSpeed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-black/50">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Estudo</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rede Semântica - Modo Explorar</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 pt-4 px-4 overflow-x-auto no-scrollbar">
        {(['all', 'family', 'expressions', 'synonyms'] as const).map((ft) => {
          const labels = { all: 'Todas', family: 'Família', expressions: 'Expressões', synonyms: 'Sinônimos' };
          return (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filterType === ft
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-medium shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {labels[ft]}
            </button>
          );
        })}
      </div>

      {/* Interactive Mind Map Area */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        {/* Background Subtle Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative w-full max-w-2xl h-[420px] flex items-center justify-center">
          {/* Central Word Node */}
          <motion.div
            layoutId={`card-center-${card.id}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-20 bg-white dark:bg-zinc-900 border-2 border-blue-500 dark:border-blue-400 shadow-xl rounded-3xl p-6 text-center max-w-xs flex flex-col items-center justify-center gap-2"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {card.word}
              </h2>
              <button
                disabled={!voicesReady}
                onClick={handlePlayAudio}
                className={`p-2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:scale-110 active:scale-95 transition-all ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={voicesReady ? "Pronunciar" : "Carregando vozes..."}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 italic">
              {card.partOfSpeech} • {card.pronunciation}
            </p>

            <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-1">
              {card.translation}
            </p>
          </motion.div>

          {/* Floating Connected Nodes */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-4 pointer-events-auto">
            <AnimatePresence>
              {filteredConnections.map((conn, idx) => {
                const existingCard = allCards.find(
                  (c) => c.word.toLowerCase() === conn.word.toLowerCase()
                );

                return (
                  <motion.div
                    key={`${conn.word}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`group relative px-3.5 py-2 rounded-2xl border text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${conn.color} bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm`}
                  >
                    <button
                      type="button"
                      disabled={!voicesReady}
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(conn.word, card.language || 'fr');
                      }}
                      className={`p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={voicesReady ? `Ouvir "${conn.word}"` : "Carregando vozes..."}
                    >
                      <Volume2 className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                    </button>
                    <span
                      onClick={() => {
                        if (existingCard) {
                          onSelectWord(existingCard.word);
                        } else if (onAddWordCard) {
                          onAddWordCard(conn.word);
                        } else {
                          onSelectWord(conn.word);
                        }
                      }}
                      className="cursor-pointer hover:underline"
                    >
                      {conn.word}
                    </span>
                    <span className="text-[10px] font-normal uppercase opacity-75 border-l border-current/20 pl-1.5">
                      {conn.category}
                    </span>
                    {!existingCard && (
                      <button
                        type="button"
                        onClick={() => onAddWordCard && onAddWordCard(conn.word)}
                        title={`Adicionar "${conn.word}"`}
                      >
                        <Plus className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-black/50 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Toque em qualquer cápsula para centralizar e navegar para essa palavra no seu deck.
      </div>
    </div>
  );
};

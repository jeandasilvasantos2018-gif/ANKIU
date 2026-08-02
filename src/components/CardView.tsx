import React, { useState } from 'react';
import { FlashCard, ReviewRating } from '../types';
import { getIntervalPreview } from '../lib/sm2';
import { playAudio } from '../lib/audio';
import { Volume2, Star, ChevronDown, ChevronUp, Network, Sparkles, Snail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardViewProps {
  card: FlashCard;
  isAnswerRevealed: boolean;
  onRevealAnswer: () => void;
  onRate: (rating: ReviewRating) => void;
  onToggleFavorite: (cardId: string) => void;
  onOpenExplorar: () => void;
  onSelectWord?: (word: string) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isAnswerRevealed,
  onRevealAnswer,
  onRate,
  onToggleFavorite,
  onOpenExplorar,
  onSelectWord,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [isSlowAudio, setIsSlowAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    const speed = isSlowAudio ? 0.75 : 1.0;
    playAudio(card.word, card.language, speed, () => setIsPlaying(false));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-between min-h-[520px] p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-sm transition-all duration-300 relative overflow-hidden">
      {/* Top Bar: Favorite & Tags & Redes Semânticas Quick Button */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {card.state}
          </span>
          {card.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenExplorar}
            className="p-2 rounded-xl text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Abrir Modo Explorar (Rede Semântica)"
          >
            <Network className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Explorar</span>
          </button>

          <button
            onClick={() => onToggleFavorite(card.id)}
            className={`p-2 rounded-xl transition-colors ${
              card.isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title="Favorito"
          >
            <Star className={`w-5 h-5 ${card.isFavorite ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
        {/* 1. Palavra (Fonte grande) */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {card.word}
        </h1>

        {/* 2. Audio button & Slow toggle & Pronunciation & Classe Gramatical */}
        <div className="flex items-center gap-2 justify-center flex-wrap my-1">
          <button
            onClick={handlePlayAudio}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              isPlaying
                ? 'bg-blue-600 text-white scale-110 shadow-md'
                : 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
            }`}
            title="Ouvir pronúncia"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSlowAudio(!isSlowAudio)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
              isSlowAudio
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300'
                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
            }`}
            title="Modo áudio lento"
          >
            <Snail className="w-3.5 h-3.5" />
            <span>0.75x</span>
          </button>

          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 italic">
            {card.partOfSpeech}
          </span>
          {card.pronunciation && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              {card.pronunciation}
            </span>
          )}
        </div>

        {/* 3. Tradução */}
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {card.translation}
        </div>

        {/* 4. Definição simples em inglês */}
        <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md font-medium leading-relaxed px-2">
          {card.definition}
        </p>

        {/* 5. Frase & 6. Tradução da frase */}
        <div className="mt-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 w-full text-left flex flex-col gap-1.5">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            "{card.example}"
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {card.exampleTranslation}
          </p>
        </div>

        {/* Mostrar Mais (Expandable details) */}
        <div className="w-full mt-2">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            <span>{showMore ? 'Mostrar Menos' : 'Mostrar Mais (Expressões, Sinônimos & Família)'}</span>
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-left flex flex-col gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800"
              >
                {/* Expressões & Phrasal Verbs */}
                {card.expressions.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Expressões / Phrasal Verbs
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {card.expressions.map((exp, i) => (
                        <span
                          key={i}
                          onClick={() => onSelectWord && onSelectWord(exp)}
                          className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50 cursor-pointer hover:underline"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colocações */}
                {card.collocations.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Colocações Comuns
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {card.collocations.map((col, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sinônimos & Antônimos */}
                {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {card.synonyms.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Sinônimos
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {card.synonyms.map((syn, i) => (
                            <span
                              key={i}
                              className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                            >
                              {syn}{i < card.synonyms.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {card.antonyms.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Antônimos
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {card.antonyms.map((ant, i) => (
                            <span
                              key={i}
                              className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                            >
                              {ant}{i < card.antonyms.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Família da palavra */}
                {card.family.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                      <span>Família da Palavra</span>
                      <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">(toque para ouvir)</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {card.family.map((fam, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(fam, card.language || 'fr');
                          }}
                          className="text-xs px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all flex items-center gap-1.5 font-medium group active:scale-95 cursor-pointer"
                          title={`Ouvir pronúncia de "${fam}"`}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{fam}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Notes */}
                {card.notes && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Notas Pessoais
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl">
                      {card.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Controls: Reveal Answer OR Rating Buttons */}
      <div className="w-full pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        {!isAnswerRevealed ? (
          <button
            onClick={onRevealAnswer}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-base transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>Mostrar Resposta</span>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {/* Again */}
            <button
              onClick={() => onRate('again')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition-all"
            >
              <span className="text-xs font-extrabold uppercase">Again</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getIntervalPreview(card, 'again')}
              </span>
            </button>

            {/* Hard */}
            <button
              onClick={() => onRate('hard')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              <span className="text-xs font-extrabold uppercase">Hard</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getIntervalPreview(card, 'hard')}
              </span>
            </button>

            {/* Good */}
            <button
              onClick={() => onRate('good')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <span className="text-xs font-extrabold uppercase">Good</span>
              <span className="text-[10px] opacity-90 mt-0.5">
                {getIntervalPreview(card, 'good')}
              </span>
            </button>

            {/* Easy */}
            <button
              onClick={() => onRate('easy')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 transition-all"
            >
              <span className="text-xs font-extrabold uppercase">Easy</span>
              <span className="text-[10px] opacity-80 mt-0.5">
                {getIntervalPreview(card, 'easy')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

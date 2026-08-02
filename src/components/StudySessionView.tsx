import React, { useState, useEffect } from 'react';
import { Deck, FlashCard, ReviewRating } from '../types';
import { CardView } from './CardView';
import { ExplorarMode } from './ExplorarMode';
import { recordReview, toggleFavorite } from '../lib/storage';
import { X, Trophy, Sparkles, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudySessionViewProps {
  sessionCards: FlashCard[];
  deck?: Deck;
  allCards: FlashCard[];
  onClose: () => void;
  onRefreshCards: () => void;
  onAddWordCard?: (wordStr: string) => void;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({
  sessionCards,
  deck,
  allCards,
  onClose,
  onRefreshCards,
  onAddWordCard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsQueue, setCardsQueue] = useState<FlashCard[]>(sessionCards);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplorar, setShowExplorar] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [startTime] = useState<number>(Date.now());
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    setCardsQueue(sessionCards);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setSessionCompleted(sessionCards.length === 0);
  }, [sessionCards]);

  const currentCard = cardsQueue[currentIndex];

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
  };

  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;

    // Calculate time spent
    const elapsedSeconds = Math.max(2, Math.round((Date.now() - startTime) / 1000));

    // Record review in storage
    const { card: updatedCard } = recordReview(currentCard.id, rating, elapsedSeconds);

    setReviewedCount((prev) => prev + 1);

    // If 'again', put card back at the end of queue for this session
    let nextQueue = [...cardsQueue];
    if (rating === 'again') {
      nextQueue.push(updatedCard);
    } else {
      nextQueue[currentIndex] = updatedCard;
    }

    if (currentIndex + 1 < nextQueue.length) {
      setCardsQueue(nextQueue);
      setCurrentIndex((prev) => prev + 1);
      setIsAnswerRevealed(false);
    } else {
      // Session Finished!
      setCardsQueue(nextQueue);
      setSessionCompleted(true);
      onRefreshCards();
    }
  };

  const handleToggleFav = (cardId: string) => {
    const updated = toggleFavorite(cardId);
    if (updated) {
      setCardsQueue((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, isFavorite: updated.isFavorite } : c))
      );
      onRefreshCards();
    }
  };

  const handleSelectWordInExplorar = (wordStr: string) => {
    const match = allCards.find((c) => c.word.toLowerCase() === wordStr.toLowerCase());
    if (match) {
      // Replace or insert current card in queue
      setCardsQueue((prev) => [match, ...prev.slice(currentIndex + 1)]);
      setIsAnswerRevealed(false);
      setShowExplorar(false);
    } else if (onAddWordCard) {
      onAddWordCard(wordStr);
      setShowExplorar(false);
    }
  };

  if (sessionCompleted || !currentCard) {
    const totalTimeSec = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTimeSec / 60);
    const seconds = totalTimeSec % 60;

    return (
      <div className="fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-lg flex flex-col items-center gap-4"
        >
          <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            Sessão Concluída!
          </h2>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Excelente trabalho! Você reforçou a sua rede de vocabulário semântico hoje.
          </p>

          <div className="w-full grid grid-cols-2 gap-3 my-2">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-center">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {reviewedCount}
              </span>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Cartões revisados
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-center">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {minutes}m {seconds}s
              </span>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Tempo de estudo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex) / cardsQueue.length) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-lg mx-auto p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          title="Fechar estudo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar & Counter */}
        <div className="flex-1 max-w-xs mx-4 flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>
              {deck ? `${deck.flag} ${deck.name}` : 'Estudo Diário'}
            </span>
            <span>
              {currentIndex + 1} de {cardsQueue.length}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowExplorar(true)}
          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Rede Semântica"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content View */}
      <div className="w-full max-w-lg mx-auto px-4 py-2 flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + currentIndex}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <CardView
              card={currentCard}
              isAnswerRevealed={isAnswerRevealed}
              onRevealAnswer={handleRevealAnswer}
              onRate={handleRate}
              onToggleFavorite={handleToggleFav}
              onOpenExplorar={() => setShowExplorar(true)}
              onSelectWord={handleSelectWordInExplorar}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="p-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Responda com honestidade para ajustar o algoritmo SM-2.
      </div>

      {/* Overlay Explorar / Mind Map */}
      {showExplorar && (
        <ExplorarMode
          card={currentCard}
          allCards={allCards}
          onSelectWord={handleSelectWordInExplorar}
          onClose={() => setShowExplorar(false)}
          onAddWordCard={onAddWordCard}
        />
      )}
    </div>
  );
};

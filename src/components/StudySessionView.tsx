import React, { useState, useEffect } from 'react';
import { Deck, FlashCard, ReviewRating } from '../types';
import { CardView } from './CardView';
import { ExplorarMode } from './ExplorarMode';
import { recordReview, toggleFavorite } from '../lib/storage';
import { X, Sparkles, CheckCircle2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudySessionViewProps {
  sessionCards: FlashCard[];
  deck?: Deck;
  allCards: FlashCard[];
  onClose: () => void;
  onRefreshCards: () => void;
  onAddWordCard?: (wordStr: string) => void;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({ sessionCards, deck, allCards, onClose, onRefreshCards, onAddWordCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsQueue, setCardsQueue] = useState<FlashCard[]>(sessionCards);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplorar, setShowExplorar] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [startTime] = useState<number>(Date.now());
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => { setCardsQueue(sessionCards); setCurrentIndex(0); setIsAnswerRevealed(false); setSessionCompleted(sessionCards.length === 0); }, [sessionCards]);
  const currentCard = cardsQueue[currentIndex];
  const handleRevealAnswer = () => setIsAnswerRevealed(true);
  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;
    const elapsedSeconds = Math.max(2, Math.round((Date.now() - startTime) / 1000));
    const { card: updatedCard } = recordReview(currentCard.id, rating, elapsedSeconds);
    setReviewedCount((prev) => prev + 1);
    const nextQueue = [...cardsQueue];
    if (rating === 'again') nextQueue.push(updatedCard); else nextQueue[currentIndex] = updatedCard;
    if (currentIndex + 1 < nextQueue.length) { setCardsQueue(nextQueue); setCurrentIndex((prev) => prev + 1); setIsAnswerRevealed(false); }
    else { setCardsQueue(nextQueue); setSessionCompleted(true); onRefreshCards(); }
  };
  const handleToggleFav = (cardId: string) => {
    const updated = toggleFavorite(cardId);
    if (updated) { setCardsQueue((prev) => prev.map((c) => c.id === cardId ? { ...c, isFavorite: updated.isFavorite } : c)); onRefreshCards(); }
  };
  const handleSelectWordInExplorar = (wordStr: string) => {
    const match = allCards.find((c) => c.word.toLowerCase() === wordStr.toLowerCase());
    if (match) { setCardsQueue((prev) => [match, ...prev.slice(currentIndex + 1)]); setIsAnswerRevealed(false); setShowExplorar(false); }
    else if (onAddWordCard) { onAddWordCard(wordStr); setShowExplorar(false); }
  };

  if (sessionCompleted || !currentCard) {
    const totalTimeSec = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTimeSec / 60);
    const seconds = totalTimeSec % 60;
    return (
      <div className="fixed inset-0 z-50 bg-[#fff8f3] dark:bg-[#241b20] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <span className="absolute left-[12%] top-[15%] text-[#ef9aae] text-xl ankiu-sparkle">✦</span><span className="absolute right-[15%] bottom-[18%] text-[#edc191] text-sm ankiu-sparkle">✦</span>
        <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[34px] p-8 max-w-sm w-full shadow-[0_26px_80px_rgba(80,45,57,.20)] flex flex-col items-center gap-4 overflow-hidden">
          <span className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#fff0f3] dark:bg-[#493039]" />
          <div className="relative z-10 p-4 rounded-[24px] bg-[#eef9f3] dark:bg-[#2f4138] text-[#58a47f]"><CheckCircle2 className="w-12 h-12" /></div>
          <h2 className="relative z-10 text-2xl font-black text-[#46343c] dark:text-[#fff8f5]">Sessão Concluída! ♡</h2>
          <p className="relative z-10 text-sm text-[#957b84] dark:text-[#c9b3bb]">Você cuidou do seu vocabulário hoje. Isso já é progresso.</p>
          <div className="relative z-10 w-full grid grid-cols-2 gap-3 my-2"><div className="p-4 rounded-[22px] bg-[#fff0f3] dark:bg-[#493039] text-center"><span className="text-2xl font-black text-[#e25d78]">{reviewedCount}</span><p className="text-[10px] font-bold text-[#a7828e]">Cartões revisados</p></div><div className="p-4 rounded-[22px] bg-[#eef9f3] dark:bg-[#2f4138] text-center"><span className="text-2xl font-black text-[#58a47f]">{minutes}m {seconds}s</span><p className="text-[10px] font-bold text-[#7e9f8f]">Tempo de estudo</p></div></div>
          <button onClick={onClose} className="relative z-10 w-full py-3.5 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black text-sm shadow-[0_9px_22px_rgba(236,91,119,.20)]">Voltar ao Início</button>
        </motion.div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentIndex / cardsQueue.length) * 100));
  return (
    <div className="fixed inset-0 z-50 bg-[#fff8f3]/96 dark:bg-[#241b20]/96 backdrop-blur-xl flex flex-col justify-between overflow-y-auto">
      <div className="w-full max-w-lg mx-auto p-4 flex items-center justify-between gap-3">
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] text-[#a27e89] flex items-center justify-center shadow-sm" title="Fechar estudo"><X className="w-5 h-5" /></button>
        <div className="flex-1 max-w-xs flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-black text-[#9b7d87] dark:text-[#c8b1b9] uppercase tracking-[.08em]"><span>{deck ? `${deck.flag} ${deck.name}` : 'Estudo Diário'}</span><span>{currentIndex + 1}/{cardsQueue.length}</span></div>
          <div className="w-full h-2 rounded-full bg-[#f2ddd7] dark:bg-[#4c3941] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#f36a85] to-[#ffb08c] transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <button onClick={() => setShowExplorar(true)} className="w-10 h-10 rounded-2xl bg-[#f3efff] dark:bg-[#403650] border border-[#ddd3ff] dark:border-[#5d4c73] text-[#8874c9] flex items-center justify-center shadow-sm" title="Rede Semântica"><Sparkles className="w-4 h-4" /></button>
      </div>

      <div className="w-full max-w-lg mx-auto px-4 py-2 flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait"><motion.div key={currentCard.id + currentIndex} initial={{ opacity: 0, x: 20, scale: .98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: .98 }} transition={{ duration: .2 }} className="w-full"><CardView card={currentCard} isAnswerRevealed={isAnswerRevealed} onRevealAnswer={handleRevealAnswer} onRate={handleRate} onToggleFavorite={handleToggleFav} onOpenExplorar={() => setShowExplorar(true)} onSelectWord={handleSelectWordInExplorar} /></motion.div></AnimatePresence>
      </div>

      <div className="p-3 text-center text-[10px] font-bold text-[#ae8c96] dark:text-[#c7afb8] flex items-center justify-center gap-1.5"><Heart className="w-3 h-3 fill-[#ef9aae]/25" /> Responda com honestidade para o SM-2 aprender seu ritmo.</div>
      {showExplorar && <ExplorarMode card={currentCard} allCards={allCards} onSelectWord={handleSelectWordInExplorar} onClose={() => setShowExplorar(false)} onAddWordCard={onAddWordCard} />}
    </div>
  );
};

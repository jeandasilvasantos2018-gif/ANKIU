import React, { useState, useEffect } from 'react';
import { Deck, FlashCard, ReviewRating } from '../types';
import { CardView } from './CardView';
import { ExplorarMode } from './ExplorarMode';
import { recordReview, toggleFavorite } from '../lib/storage';
import { X, Sparkles, CheckCircle2, Heart, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudySessionViewProps { sessionCards: FlashCard[]; deck?: Deck; allCards: FlashCard[]; onClose: () => void; onRefreshCards: () => void; onAddWordCard?: (wordStr: string) => void; }
type SessionStats = Record<ReviewRating, number>;
const emptyStats = (): SessionStats => ({ again: 0, hard: 0, good: 0, easy: 0 });

export const StudySessionView: React.FC<StudySessionViewProps> = ({ sessionCards, deck, allCards, onClose, onRefreshCards, onAddWordCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsQueue, setCardsQueue] = useState<FlashCard[]>(sessionCards);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplorar, setShowExplorar] = useState(false);
  const [stats, setStats] = useState<SessionStats>(emptyStats());
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const resetSession = () => { setCardsQueue([...sessionCards]); setCurrentIndex(0); setIsAnswerRevealed(false); setStats(emptyStats()); setStartTime(Date.now()); setSessionCompleted(sessionCards.length === 0); };
  useEffect(() => { resetSession(); }, [sessionCards]);
  const currentCard = cardsQueue[currentIndex];

  const handleRate = (rating: ReviewRating) => {
    if (!currentCard || !isAnswerRevealed) return;
    const elapsedSeconds = Math.max(2, Math.round((Date.now() - startTime) / 1000));
    const { card: updatedCard } = recordReview(currentCard.id, rating, elapsedSeconds);
    setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    const nextQueue = [...cardsQueue];
    if (rating === 'again') nextQueue.push(updatedCard); else nextQueue[currentIndex] = updatedCard;
    if (currentIndex + 1 < nextQueue.length) { setCardsQueue(nextQueue); setCurrentIndex((prev) => prev + 1); setIsAnswerRevealed(false); }
    else { setCardsQueue(nextQueue); setSessionCompleted(true); onRefreshCards(); }
  };

  const handleToggleFav = (cardId: string) => { const updated = toggleFavorite(cardId); if (updated) { setCardsQueue((prev) => prev.map((c) => c.id === cardId ? { ...c, isFavorite: updated.isFavorite } : c)); onRefreshCards(); } };
  const handleSelectWordInExplorar = (wordStr: string) => { const match = allCards.find((c) => c.word.toLowerCase() === wordStr.toLowerCase()); if (match) { setCardsQueue((prev) => [match, ...prev.slice(currentIndex + 1)]); setIsAnswerRevealed(false); setShowExplorar(false); } else if (onAddWordCard) { onAddWordCard(wordStr); setShowExplorar(false); } };

  if (sessionCompleted || !currentCard) {
    const totalRatings = stats.again + stats.hard + stats.good + stats.easy;
    return <div className="fixed inset-0 z-50 bg-[#fff8f3] dark:bg-[#241b20] flex items-center justify-center p-5 overflow-y-auto">
      <motion.div initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[34px] p-6 max-w-sm w-full shadow-[0_26px_80px_rgba(80,45,57,.20)] text-center">
        <div className="mx-auto w-20 h-20 rounded-[28px] bg-[#f3efff] dark:bg-[#403650] text-[#8874c9] flex items-center justify-center"><CheckCircle2 className="w-11 h-11" /></div>
        <h2 className="mt-4 text-2xl font-black text-[#46343c] dark:text-[#fff8f5]">Session complete! ♡</h2>
        <p className="mt-2 text-sm text-[#957b84] dark:text-[#c9b3bb]">Beautiful work. Every recall makes your French a little more automatic.</p>
        <div className="mt-5 p-4 rounded-[24px] bg-[#fff5e8] dark:bg-[#42352f]"><span className="text-3xl font-black text-[#49363f] dark:text-white">{totalRatings}</span><p className="text-[10px] font-bold text-[#a7828e]">answers reviewed</p></div>
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          {[['Again', stats.again, '#c45b64'], ['Hard', stats.hard, '#b77c31'], ['Good', stats.good, '#519878'], ['Easy', stats.easy, '#7e69c5']].map(([label, value, color]) => <div key={String(label)} className="p-2.5 rounded-[18px] bg-[#fff8f5] dark:bg-[#30242a] border border-[#f0ddd7] dark:border-[#57414a]"><span className="block text-xl font-black" style={{ color: String(color) }}>{value}</span><span className="text-[9px] font-bold text-[#9a818a]">{label}</span></div>)}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5"><button onClick={resetSession} className="min-h-12 rounded-[20px] bg-[#f3efff] dark:bg-[#403650] text-[#7e69c5] dark:text-[#cbbcf3] font-black text-sm flex items-center justify-center gap-1.5"><RotateCcw className="w-4 h-4" /> Restart deck</button><button onClick={onClose} className="min-h-12 rounded-[20px] bg-gradient-to-r from-[#8d79d6] to-[#b59de7] text-white font-black text-sm">Return</button></div>
      </motion.div>
    </div>;
  }

  const progressPercent = cardsQueue.length ? Math.min(100, Math.round(((currentIndex + 1) / cardsQueue.length) * 100)) : 0;
  return <div className="fixed inset-0 z-50 bg-[#fff8f3]/96 dark:bg-[#241b20]/96 backdrop-blur-xl flex flex-col justify-between overflow-y-auto">
    <div className="w-full max-w-lg mx-auto p-4 flex items-center justify-between gap-3">
      <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] text-[#a27e89] flex items-center justify-center" aria-label="Close study session"><X className="w-5 h-5" /></button>
      <div className="flex-1 max-w-xs flex flex-col gap-1.5"><div className="flex justify-between text-[10px] font-black text-[#9b7d87] dark:text-[#c8b1b9] uppercase tracking-[.08em]"><span>{deck ? `${deck.flag} ${deck.name}` : 'French study'}</span><span>{currentIndex + 1}/{cardsQueue.length}</span></div><div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} className="w-full h-2 rounded-full bg-[#f2ddd7] dark:bg-[#4c3941] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#8d79d6] to-[#f2a0b3] transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} /></div></div>
      <button onClick={() => setShowExplorar(true)} className="w-11 h-11 rounded-2xl bg-[#f3efff] dark:bg-[#403650] border border-[#ddd3ff] dark:border-[#5d4c73] text-[#8874c9] flex items-center justify-center" aria-label="Open semantic network"><Sparkles className="w-4 h-4" /></button>
    </div>
    <div className="w-full max-w-lg mx-auto px-4 py-2 flex-1 flex items-center justify-center"><AnimatePresence mode="wait"><motion.div key={currentCard.id + currentIndex} initial={{ opacity: 0, x: 20, scale: .98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: .98 }} transition={{ duration: .2 }} className="w-full"><CardView card={currentCard} isAnswerRevealed={isAnswerRevealed} onRevealAnswer={() => setIsAnswerRevealed(true)} onRate={handleRate} onToggleFavorite={handleToggleFav} onOpenExplorar={() => setShowExplorar(true)} onSelectWord={handleSelectWordInExplorar} /></motion.div></AnimatePresence></div>
    <div className="p-3 text-center text-[10px] font-bold text-[#ae8c96] dark:text-[#c7afb8] flex items-center justify-center gap-1.5"><Heart className="w-3 h-3 fill-[#ef9aae]/25" /> Recall first. Reveal second. Rate the effort, not yourself.</div>
    {showExplorar && <ExplorarMode card={currentCard} allCards={allCards} onSelectWord={handleSelectWordInExplorar} onClose={() => setShowExplorar(false)} onAddWordCard={onAddWordCard} />}
  </div>;
};

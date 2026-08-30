import React, { useEffect, useState } from 'react';
import { FlashCard, ReviewRating } from '../types';
import { getIntervalPreview } from '../lib/sm2';
import { playAudio, useVoicesReady } from '../lib/audio';
import { Volume2, Star, ChevronDown, ChevronUp, Network, Sparkles, Snail, Eye, EyeOff, Heart, RotateCcw, Gauge, CheckCircle2 } from 'lucide-react';
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

export const CardView: React.FC<CardViewProps> = ({ card, isAnswerRevealed, onRevealAnswer, onRate, onToggleFavorite, onOpenExplorar, onSelectWord }) => {
  const [showMore, setShowMore] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [isSlowAudio, setIsSlowAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const voicesReady = useVoicesReady();

  useEffect(() => {
    setShowMore(false);
    setShowPronunciation(false);
    setIsPlaying(false);
  }, [card.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!isAnswerRevealed) onRevealAnswer();
      }
      if (!isAnswerRevealed) return;
      if (event.key === '1') onRate('again');
      if (event.key === '2') onRate('hard');
      if (event.key === '3') onRate('good');
      if (event.key === '4') onRate('easy');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerRevealed, onRevealAnswer, onRate]);

  const play = (text: string) => {
    if (!text) return;
    setIsPlaying(true);
    playAudio(text, card.language || 'fr', isSlowAudio ? 0.75 : 0.9, () => setIsPlaying(false));
  };

  const hasDetails = card.expressions.length > 0 || card.collocations.length > 0 || card.synonyms.length > 0 || card.antonyms.length > 0 || card.related.length > 0 || card.family.length > 0 || Boolean(card.notes);

  return (
    <div
      className="w-full max-w-lg mx-auto min-h-[540px] p-5 sm:p-6 bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[34px] shadow-[0_24px_70px_rgba(116,65,80,.14)] relative overflow-hidden flex flex-col"
      onClick={() => !isAnswerRevealed && onRevealAnswer()}
    >
      <span className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#f4efff] dark:bg-[#453954]" />
      <span className="absolute right-8 top-8 text-[#b7a4e8] ankiu-sparkle">✦</span>

      <header className="relative z-10 flex items-center justify-between gap-2 pb-4 border-b border-[#f2ddd7] dark:border-[#58424c]">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#f3efff] dark:bg-[#403650] text-[#7e69c5] dark:text-[#cbbcf3] border border-[#ddd3ff] dark:border-[#5d4c73]">🇫🇷 {card.language?.toLowerCase().startsWith('fr') ? 'French' : 'French deck'}</span>
          {card.tags.filter(Boolean).slice(0, 2).map((tag, i) => <span key={i} className="text-[9px] font-black px-2 py-1 rounded-full bg-[#fff5e8] dark:bg-[#42352f] text-[#b37d57] dark:text-[#e9b78e] border border-[#ffe1bd] dark:border-[#654d40]">{tag}</span>)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onOpenExplorar(); }} className="min-w-11 min-h-11 p-2 rounded-2xl text-[#8874c9] bg-[#f3efff] dark:bg-[#403650] flex items-center justify-center" aria-label="Open semantic network"><Network className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(card.id); }} className={`min-w-11 min-h-11 p-2 rounded-2xl ${card.isFavorite ? 'text-[#e4a347] bg-[#fff5df] dark:bg-[#493a2c]' : 'text-[#c9a9b3] bg-[#fff8f5] dark:bg-[#403139]'}`} aria-label="Favorite card"><Star className={`w-5 h-5 ${card.isFavorite ? 'fill-current' : ''}`} /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#927fae] dark:text-[#c8b9e5]"><Sparkles className="w-3.5 h-3.5" /> Active recall</div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-[-.045em] text-[#44323a] dark:text-[#fff8f5] leading-tight">{card.word}</h1>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button disabled={!voicesReady} onClick={(e) => { e.stopPropagation(); play(card.word); }} className={`min-w-12 min-h-12 p-3 rounded-full flex items-center justify-center ${!voicesReady ? 'opacity-50 bg-[#f4e6e1]' : isPlaying ? 'bg-[#8d79d6] text-white scale-105' : 'bg-[#f3efff] dark:bg-[#403650] text-[#7e69c5] dark:text-[#cbbcf3]'}`} aria-label="Play French pronunciation"><Volume2 className="w-5 h-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); setIsSlowAudio(!isSlowAudio); }} className={`min-h-11 px-3 rounded-2xl text-xs font-black flex items-center gap-1.5 border ${isSlowAudio ? 'bg-[#fff5df] text-[#b77c31] border-[#f5d89d]' : 'bg-[#fff8f3] dark:bg-[#30242a] text-[#987b86] border-[#efd8d1] dark:border-[#57414a]'}`}><Snail className="w-3.5 h-3.5" /> Slow</button>
          {card.pronunciation && !isAnswerRevealed && <button onClick={(e) => { e.stopPropagation(); setShowPronunciation(!showPronunciation); }} className="min-h-11 px-3 rounded-2xl text-xs font-black bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878] dark:text-[#a5dec1] border border-[#ccebdc] dark:border-[#436052] flex items-center gap-1.5">{showPronunciation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{showPronunciation ? 'Hide pronunciation' : 'Show pronunciation'}</button>}
        </div>

        {!isAnswerRevealed ? (
          <div className="w-full flex flex-col items-center gap-4 mt-3">
            {showPronunciation && card.pronunciation && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-base font-bold text-[#8b77c8] dark:text-[#cbbcf3]">{card.pronunciation}</motion.p>}
            <div className="max-w-sm text-sm leading-relaxed text-[#9a818a] dark:text-[#c9b3bb]">Think of the French meaning, pronunciation and a natural context before revealing the answer.</div>
            <div className="text-[10px] font-bold text-[#b39aa3] dark:text-[#aa929b]">Tap the card or press Space to reveal</div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-3">
            {card.pronunciation && <p className="text-base font-bold text-[#8b77c8] dark:text-[#cbbcf3]">{card.pronunciation}</p>}
            {card.translation && <div className="text-2xl font-black text-[#49363f] dark:text-[#fff8f5]">{card.translation}</div>}
            {card.partOfSpeech && <span className="text-[10px] font-black uppercase tracking-[.12em] px-2.5 py-1 rounded-full bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878] dark:text-[#a5dec1]">{card.partOfSpeech}</span>}
            {card.definition && <p className="text-sm text-[#765d67] dark:text-[#d5c0c7] max-w-md font-medium leading-relaxed px-2">{card.definition}</p>}

            {card.example && <div className="mt-2 p-4 rounded-[24px] bg-[#fff5e8] dark:bg-[#42352f] border border-[#ffe1bd] dark:border-[#654d40] w-full text-left relative overflow-hidden">
              <Heart className="absolute right-3 top-3 w-3.5 h-3.5 text-[#e9a974] opacity-50" />
              <div className="flex items-start justify-between gap-3 pr-5"><p className="text-base font-black text-[#503c34] dark:text-[#ffe8d8]">“{card.example}”</p><button onClick={(e) => { e.stopPropagation(); play(card.example); }} className="shrink-0 min-w-11 min-h-11 rounded-2xl bg-white/70 dark:bg-[#554238] text-[#b77c55] flex items-center justify-center" aria-label="Play example sentence"><Volume2 className="w-4 h-4" /></button></div>
              {card.exampleTranslation && <p className="mt-1 text-xs text-[#9a7968] dark:text-[#d1aa91]">{card.exampleTranslation}</p>}
            </div>}

            {hasDetails && <div className="w-full mt-1">
              <button onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }} className="w-full min-h-11 py-2 flex items-center justify-center gap-1.5 text-xs font-black text-[#987b86] dark:text-[#c8b1b9]"><span>{showMore ? 'Hide learning details' : 'Show learning details'}</span>{showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
              <AnimatePresence>{showMore && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-left grid gap-3 pt-3 border-t border-[#f1ddd7] dark:border-[#57414a]">
                {card.expressions.length > 0 && <Detail title="Expressions & reusable patterns" values={card.expressions} tone="purple" onSelectWord={onSelectWord} />}
                {card.collocations.length > 0 && <Detail title="Common collocations" values={card.collocations} tone="yellow" />}
                {card.synonyms.length > 0 && <Detail title="Synonyms" values={card.synonyms} tone="pink" />}
                {card.antonyms.length > 0 && <Detail title="Antonyms" values={card.antonyms} tone="pink" />}
                {card.related.length > 0 && <Detail title="Related words" values={card.related} tone="blue" onSelectWord={onSelectWord} />}
                {card.family.length > 0 && <Detail title="Word family" values={card.family} tone="mint" />}
                {card.notes && <div><h4 className="detail-title">Personal notes</h4><p className="text-xs text-[#765d67] dark:text-[#d5c0c7] bg-[#fff8f3] dark:bg-[#30242a] p-3 rounded-2xl">{card.notes}</p></div>}
              </motion.div>}</AnimatePresence>
            </div>}
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 w-full pt-4 border-t border-[#f1ddd7] dark:border-[#57414a]" onClick={(e) => e.stopPropagation()}>
        {!isAnswerRevealed ? (
          <button onClick={onRevealAnswer} className="w-full min-h-12 py-3.5 px-6 rounded-[22px] bg-gradient-to-r from-[#8d79d6] to-[#b59de7] active:scale-[.99] text-white font-black text-base shadow-[0_9px_22px_rgba(126,105,197,.22)]">Show Answer</button>
        ) : (
          <div>
            <p className="mb-2 text-center text-[10px] font-bold text-[#a4868f] dark:text-[#c8b1b9]">How difficult was it to recall?</p>
            <div className="grid grid-cols-4 gap-2">
              <RatingButton label="Again" hint="1" icon={<RotateCcw className="w-4 h-4" />} preview={getIntervalPreview(card, 'again')} className="bg-[#fff0f0] dark:bg-[#493033] text-[#c45b64] dark:text-[#ffadb6] border-[#ffd2d2] dark:border-[#6d4146]" onClick={() => onRate('again')} />
              <RatingButton label="Hard" hint="2" icon={<Gauge className="w-4 h-4" />} preview={getIntervalPreview(card, 'hard')} className="bg-[#fff5df] dark:bg-[#493a2c] text-[#b77c31] dark:text-[#f3c980] border-[#f5d89d] dark:border-[#69513b]" onClick={() => onRate('hard')} />
              <RatingButton label="Good" hint="3" icon={<CheckCircle2 className="w-4 h-4" />} preview={getIntervalPreview(card, 'good')} className="bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878] dark:text-[#a5dec1] border-[#ccebdc] dark:border-[#436052]" onClick={() => onRate('good')} />
              <RatingButton label="Easy" hint="4" icon={<Sparkles className="w-4 h-4" />} preview={getIntervalPreview(card, 'easy')} className="bg-[#f3efff] dark:bg-[#403650] text-[#7e69c5] dark:text-[#cbbcf3] border-[#ddd3ff] dark:border-[#5d4c73]" onClick={() => onRate('easy')} />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

const Detail: React.FC<{ title: string; values: string[]; tone: 'purple' | 'yellow' | 'pink' | 'blue' | 'mint'; onSelectWord?: (word: string) => void }> = ({ title, values, tone, onSelectWord }) => {
  const tones = { purple: 'bg-[#f3efff] text-[#7e69c5] border-[#ddd3ff]', yellow: 'bg-[#fff5df] text-[#b77c31] border-[#f5d89d]', pink: 'bg-[#fff0f3] text-[#d95d78] border-[#ffd1da]', blue: 'bg-[#eef6ff] text-[#5f86bb] border-[#d5e6fb]', mint: 'bg-[#eef9f3] text-[#519878] border-[#ccebdc]' };
  return <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1.5">{title}</h4><div className="flex flex-wrap gap-1.5">{values.filter(Boolean).map((value, i) => <button key={`${value}-${i}`} type="button" onClick={() => onSelectWord?.(value)} className={`text-xs px-2.5 py-1.5 rounded-2xl border font-bold ${tones[tone]} dark:bg-[#403650] dark:border-[#5d4c73]`}>{value}</button>)}</div></div>;
};

const RatingButton: React.FC<{ label: string; hint: string; preview: string; icon: React.ReactNode; className: string; onClick: () => void }> = ({ label, hint, preview, icon, className, onClick }) => <button onClick={onClick} className={`min-h-[62px] flex flex-col items-center justify-center p-2 rounded-[20px] border active:scale-95 transition-all ${className}`} aria-label={`${label}, keyboard ${hint}`}><span className="flex items-center gap-1 text-[11px] font-black">{icon}{label}</span><span className="text-[9px] opacity-75 mt-0.5">{preview}</span><span className="hidden sm:block text-[8px] opacity-50">key {hint}</span></button>;

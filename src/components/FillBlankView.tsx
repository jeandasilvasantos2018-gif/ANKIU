import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FlashCard, Deck } from '../types';
import { fillBlankExercises, FillBlankExercise } from '../data/fillBlankExercises';
import { playAudio, useVoicesReady } from '../lib/audio';
import { Volume2, RotateCcw, CheckCircle2, XCircle, ArrowRight, Sparkles, Keyboard, Layers, Brain, Lightbulb, Trophy, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FillBlankViewProps {
  cards: FlashCard[];
  decks: Deck[];
  onOpenCardDetail?: (card: FlashCard) => void;
}

export const FillBlankView: React.FC<FillBlankViewProps> = ({ cards, decks, onOpenCardDetail }) => {
  const voicesReady = useVoicesReady();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const exercises = useMemo(() => {
    const source = fillBlankExercises.filter((ex) => selectedDeckId === 'all' || ex.deckId === selectedDeckId);
    return source.length > 0 ? source : fillBlankExercises;
  }, [selectedDeckId]);

  const currentExercise = exercises[currentIndex % exercises.length];

  useEffect(() => { setCurrentIndex(0); setAnswer(''); setSubmitted(false); setCorrect(false); setScore(0); setStreak(0); setFinished(false); }, [selectedDeckId]);

  const submit = useCallback(() => {
    if (!answer.trim() || submitted) return;
    const accepted = [currentExercise.answer, ...(currentExercise.alternatives || [])].map((v) => v.trim().toLowerCase());
    const isCorrect = accepted.includes(answer.trim().toLowerCase());
    setCorrect(isCorrect); setSubmitted(true);
    if (isCorrect) { setScore((s) => s + 1); setStreak((s) => s + 1); } else setStreak(0);
  }, [answer, currentExercise, submitted]);

  const next = () => {
    if (currentIndex + 1 >= exercises.length) { setFinished(true); return; }
    setCurrentIndex((i) => i + 1); setAnswer(''); setSubmitted(false); setCorrect(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submitted ? next() : submit();
      if (e.key === 'Control' && currentExercise) playAudio(currentExercise.fullSentence, 'fr');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitted, submit, currentExercise]);

  const linkedCard = currentExercise ? cards.find((c) => c.word.toLowerCase() === currentExercise.answer.toLowerCase()) : undefined;

  if (finished) {
    return <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28"><div className="rounded-[34px] ankiu-surface p-8 text-center flex flex-col items-center gap-4"><div className="w-16 h-16 rounded-[24px] bg-[#fff5df] dark:bg-[#493a2c] text-[#d39042] flex items-center justify-center"><Trophy className="w-8 h-8" /></div><h2 className="text-2xl font-black text-[#46343c] dark:text-[#fff8f5]">Prática concluída! ♡</h2><p className="text-sm text-[#957b84] dark:text-[#c9b3bb]">Você acertou {score} de {exercises.length} frases.</p><button onClick={() => { setCurrentIndex(0); setAnswer(''); setSubmitted(false); setCorrect(false); setScore(0); setStreak(0); setFinished(false); }} className="w-full py-3.5 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Praticar novamente</button></div></div>;
  }

  if (!currentExercise) return null;

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden"><span className="absolute right-5 top-4 text-[#f09aaf] ankiu-sparkle">✦</span><div className="text-[11px] font-black uppercase tracking-[.14em] text-[#aa8490] flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Prática guiada</div><div className="mt-1 flex items-end justify-between gap-3"><div><h1 className="text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Completar Frases</h1><p className="text-xs text-[#957b84] dark:text-[#c9b3bb] mt-1">Descubra a palavra que falta ♡</p></div><div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#fff5df] dark:bg-[#493a2c] text-[#d39042] text-[10px] font-black"><Zap className="w-3.5 h-3.5" />{streak}x</div></div></header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1"><button onClick={() => setSelectedDeckId('all')} className={`px-3 py-2 rounded-full text-xs font-black border shrink-0 ${selectedDeckId === 'all' ? 'bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white border-transparent' : 'bg-[#fffdfb] dark:bg-[#382b31] text-[#80646f] border-[#efd7d1] dark:border-[#5b444e]'}`}>Todos</button>{decks.map((deck) => <button key={deck.id} onClick={() => setSelectedDeckId(deck.id)} className={`px-3 py-2 rounded-full text-xs font-black border shrink-0 ${selectedDeckId === deck.id ? 'bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white border-transparent' : 'bg-[#fffdfb] dark:bg-[#382b31] text-[#80646f] border-[#efd7d1] dark:border-[#5b444e]'}`}>{deck.flag} {deck.name}</button>)}</div>

      <section className="rounded-[34px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] p-5 shadow-[0_20px_55px_rgba(116,65,80,.11)] flex flex-col gap-4 relative overflow-hidden">
        <span className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-[#f3efff] dark:bg-[#403650]" />
        <div className="relative z-10 flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f]">Frase {currentIndex + 1} de {exercises.length}</div><div className="text-[10px] font-black text-[#58a47f]">{score} acertos</div></div>
        <div className="relative z-10 rounded-[24px] bg-[#fff8f3] dark:bg-[#30242a] border border-[#efd8d1] dark:border-[#57414a] p-5"><p className="text-lg font-black text-[#49363f] dark:text-[#fff7f3] leading-relaxed">{currentExercise.sentence}</p>{currentExercise.translation && <p className="mt-2 text-xs text-[#987b86] dark:text-[#c8b1b9]">{currentExercise.translation}</p>}</div>
        <div className="relative z-10 flex gap-2"><input value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={submitted} placeholder="Digite a palavra..." className="flex-1 px-4 py-3.5 rounded-[20px] border text-sm font-bold" autoFocus /><button disabled={!voicesReady} onClick={() => playAudio(currentExercise.fullSentence, 'fr')} className={`w-12 rounded-[20px] bg-[#f3efff] dark:bg-[#403650] text-[#8874c9] flex items-center justify-center ${!voicesReady ? 'opacity-50' : ''}`} title="Ouvir frase"><Volume2 className="w-5 h-5" /></button></div>
        {!submitted ? <button onClick={submit} className="relative z-10 w-full py-3.5 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black">Conferir resposta</button> : <AnimatePresence><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`relative z-10 p-4 rounded-[22px] ${correct ? 'bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878]' : 'bg-[#fff0f0] dark:bg-[#493033] text-[#c45b64]'}`}><div className="font-black text-sm flex items-center gap-2">{correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{correct ? 'Muito bem! ✦' : `Resposta: ${currentExercise.answer}`}</div>{currentExercise.explanation && <p className="text-xs mt-2 opacity-80 flex gap-1.5"><Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />{currentExercise.explanation}</p>}{linkedCard && onOpenCardDetail && <button onClick={() => onOpenCardDetail(linkedCard)} className="mt-2 text-xs font-black underline">Abrir cartão</button>}<button onClick={next} className="mt-3 w-full py-2.5 rounded-2xl bg-white/65 dark:bg-black/10 font-black text-xs flex items-center justify-center gap-1.5">Próxima <ArrowRight className="w-3.5 h-3.5" /></button></motion.div></AnimatePresence>}
        <div className="relative z-10 flex items-center justify-center gap-2 text-[10px] text-[#ae8c96]"><Keyboard className="w-3 h-3" /> Enter = confirmar • Ctrl = ouvir <Heart className="w-3 h-3 fill-[#ef9aae]/20" /></div>
      </section>
    </div>
  );
};

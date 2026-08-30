import React, { useState, useEffect } from 'react';
import { FlashCard } from '../types';
import { Sparkles, Zap, Trophy, Volume2, RefreshCw, CheckCircle2, XCircle, ArrowRight, BrainCircuit, Heart } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface ChallengeTabProps { cards: FlashCard[]; }

type ChallengeQuestion = {
  id: string;
  promptSentence: string;
  promptTranslation?: string;
  answer: string;
  options: string[];
  explanation?: string;
};

export const ChallengeTab: React.FC<ChallengeTabProps> = ({ cards }) => {
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voicesReady = useVoicesReady();

  const generateChallenge = async () => {
    if (cards.length === 0) { setError('Adicione cartões primeiro para gerar um desafio.'); return; }
    setLoading(true); setError(null); setQuestions([]); setCurrentIndex(0); setSelectedAnswer(null); setIsCorrect(null); setScore(0);
    try {
      const sample = cards.slice(0, 20).map((c) => ({ word: c.word, translation: c.translation, example: c.example, language: c.language }));
      const res = await fetch('/api/gemini/generate-challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards: sample }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível gerar o desafio.');
      setQuestions(data.questions || []);
    } catch (err: any) { setError(err.message || 'Falha ao gerar desafio.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (cards.length > 0) generateChallenge(); }, []);

  const currentQ = questions[currentIndex];
  const handleSelect = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    const correct = option === currentQ.answer;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
  };
  const next = () => { setSelectedAnswer(null); setIsCorrect(null); setCurrentIndex((i) => i + 1); };
  const finished = questions.length > 0 && currentIndex >= questions.length;

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden">
        <span className="absolute right-5 top-4 text-[#f09aaf] ankiu-sparkle">✦</span>
        <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#aa8490] flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-[#e4a347]" /> Hora do jogo</div>
        <div className="mt-1 flex items-end justify-between gap-3"><div><h1 className="text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Desafio</h1><p className="text-xs text-[#957b84] dark:text-[#c9b3bb] mt-1">Teste suas conexões sem pressão ♡</p></div><div className="w-11 h-11 rounded-[18px] bg-[#fff5df] dark:bg-[#493a2c] text-[#d39042] flex items-center justify-center"><BrainCircuit className="w-5 h-5" /></div></div>
      </header>

      {loading && <div className="rounded-[30px] ankiu-surface p-8 text-center"><Sparkles className="w-7 h-7 mx-auto text-[#8874c9] animate-pulse" /><div className="mt-3 text-sm font-black text-[#5a424b] dark:text-[#fff7f3]">Criando seu desafio...</div><div className="text-xs text-[#9b7d87] mt-1">A IA está escolhendo boas perguntas.</div></div>}
      {error && <div className="rounded-[24px] bg-[#fff0f0] dark:bg-[#493033] border border-[#ffd2d2] dark:border-[#6d4146] p-4 text-xs font-bold text-[#c45b64] dark:text-[#ffadb6]">{error}<button onClick={generateChallenge} className="mt-3 w-full py-2.5 rounded-2xl bg-white/60 dark:bg-black/10 font-black flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Tentar novamente</button></div>}

      {!loading && !error && finished && <div className="rounded-[34px] ankiu-surface p-8 text-center flex flex-col items-center gap-4"><div className="w-16 h-16 rounded-[24px] bg-[#fff5df] dark:bg-[#493a2c] text-[#d39042] flex items-center justify-center"><Trophy className="w-8 h-8" /></div><div><h2 className="text-2xl font-black text-[#46343c] dark:text-[#fff8f5]">Você terminou! ♡</h2><p className="text-sm text-[#957b84] dark:text-[#c9b3bb] mt-1">{score} de {questions.length} respostas corretas</p></div><button onClick={generateChallenge} className="w-full py-3.5 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Novo desafio</button></div>}

      {!loading && !error && currentQ && !finished && (
        <section className="rounded-[34px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] p-5 shadow-[0_20px_55px_rgba(116,65,80,.11)] flex flex-col gap-4 relative overflow-hidden">
          <span className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-[#f3efff] dark:bg-[#403650]" />
          <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f]"><span>Pergunta {currentIndex + 1} de {questions.length}</span><span>{score} pontos</span></div>
          <div className="relative z-10 rounded-[24px] bg-[#fff8f3] dark:bg-[#30242a] border border-[#efd8d1] dark:border-[#57414a] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-[#49363f] dark:text-[#fff7f3] leading-snug">{currentQ.promptSentence}</p>{currentQ.promptTranslation && <p className="mt-1 text-xs text-[#987b86] dark:text-[#c8b1b9]">{currentQ.promptTranslation}</p>}</div><button disabled={!voicesReady} onClick={() => playAudio(currentQ.promptSentence, 'fr')} className={`w-10 h-10 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] text-[#e25d78] flex items-center justify-center shrink-0 ${!voicesReady ? 'opacity-50' : ''}`}><Volume2 className="w-4 h-4" /></button></div></div>
          <div className="relative z-10 grid gap-2.5">{currentQ.options.map((option, index) => { const chosen = selectedAnswer === option; const correct = selectedAnswer && option === currentQ.answer; let cls = 'bg-[#fffaf7] dark:bg-[#30242a] border-[#efd7d1] dark:border-[#5b444e] text-[#614953] dark:text-[#e5d1d8]'; if (selectedAnswer) { if (correct) cls = 'bg-[#eef9f3] dark:bg-[#2f4138] border-[#ccebdc] dark:border-[#436052] text-[#519878] dark:text-[#a5dec1]'; else if (chosen) cls = 'bg-[#fff0f0] dark:bg-[#493033] border-[#ffd2d2] dark:border-[#6d4146] text-[#c45b64] dark:text-[#ffadb6]'; } return <button key={option} onClick={() => handleSelect(option)} disabled={!!selectedAnswer} className={`p-3.5 rounded-[22px] border text-left text-sm font-black transition-all flex items-center gap-3 ${cls}`}><span className="w-7 h-7 rounded-xl bg-white/55 dark:bg-black/10 flex items-center justify-center text-[10px] shrink-0">{String.fromCharCode(65 + index)}</span><span className="flex-1">{option}</span>{selectedAnswer && correct && <CheckCircle2 className="w-4 h-4" />}{selectedAnswer && chosen && !correct && <XCircle className="w-4 h-4" />}</button>; })}</div>
          {selectedAnswer && <div className={`relative z-10 p-4 rounded-[22px] ${isCorrect ? 'bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878]' : 'bg-[#fff0f0] dark:bg-[#493033] text-[#c45b64]'}`}><div className="font-black text-sm flex items-center gap-1.5">{isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{isCorrect ? 'Acertou! ✦' : 'Quase!'}</div>{currentQ.explanation && <p className="text-xs mt-1 opacity-80">{currentQ.explanation}</p>}<button onClick={next} className="mt-3 w-full py-2.5 rounded-2xl bg-white/65 dark:bg-black/10 font-black text-xs flex items-center justify-center gap-1.5">Próxima <ArrowRight className="w-3.5 h-3.5" /></button></div>}
          <div className="relative z-10 flex items-center justify-center gap-1 text-[10px] text-[#b08d97]"><Heart className="w-3 h-3 fill-[#ef9aae]/20" /> Errar também faz parte do aprendizado.</div>
        </section>
      )}
    </div>
  );
};

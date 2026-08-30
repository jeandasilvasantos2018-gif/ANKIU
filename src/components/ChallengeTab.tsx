import React, { useState, useEffect } from 'react';
import { FlashCard, ChallengeQuestion } from '../types';
import { playAudio, useVoicesReady } from '../lib/audio';
import {
  Zap,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Brain,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChallengeTabProps {
  cards: FlashCard[];
  onStartStudyDifficult?: (cards: FlashCard[]) => void;
}

export const ChallengeTab: React.FC<ChallengeTabProps> = ({
  cards,
  onStartStudyDifficult,
}) => {
  // Config & state
  const [quizFocus, setQuizFocus] = useState<'difficult' | 'all' | 'quick'>('difficult');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const voicesReady = useVoicesReady();
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Quiz State
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<
    { question: ChallengeQuestion; userChoice: string; isCorrect: boolean }[]
  >([]);

  // Identify difficult cards (easeFactor < 2.5 or state in 'Aprendendo' / 'Revisão')
  const difficultCards = cards.filter(
    (c) => c.state === 'Aprendendo' || c.state === 'Revisão' || c.easeFactor < 2.4
  );

  const targetCardsList = difficultCards.length >= 3 ? difficultCards : cards;

  // Generate fallback local challenge questions when AI API is unavailable
  const generateLocalQuestions = (targetCards: FlashCard[], count = 5): ChallengeQuestion[] => {
    const pool = [...targetCards].sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, Math.min(count, pool.length));

    return selected.map((card, idx) => {
      const isFillBlank = idx % 2 === 0;
      const otherWords: string[] = cards.filter((c) => c.id !== card.id).map((c) => c.word);
      const otherTranslations: string[] = cards
        .filter((c) => c.id !== card.id && c.translation)
        .map((c) => c.translation);

      // Distractors
      const shuffle = (arr: string[]): string[] => [...arr].sort(() => Math.random() - 0.5);

      if (isFillBlank && card.example && card.example.toLowerCase().includes(card.word.toLowerCase())) {
        // Regex replace word with blank
        const regex = new RegExp(`\\b${card.word}\\b`, 'gi');
        const promptSentence = card.example.replace(regex, '______');
        const distractors = shuffle(otherWords).filter((w) => w.toLowerCase() !== card.word.toLowerCase()).slice(0, 3);
        const options: string[] = shuffle([card.word, ...distractors]);

        return {
          id: `local_q_${idx}_${Date.now()}`,
          type: 'fill_blank',
          word: card.word,
          promptSentence,
          translation: card.exampleTranslation || card.translation,
          options,
          correctAnswer: card.word,
          explanation: `A palavra "${card.word}" (${card.translation}) se encaixa no contexto desta frase em francês.`,
          difficultyTag: card.state === 'Aprendendo' ? 'Palavra em Aprendizado' : 'Revisão de Vocabulário',
        };
      } else {
        // Translation choice
        const distractors = shuffle(otherTranslations).filter((t) => t.toLowerCase() !== card.translation.toLowerCase()).slice(0, 3);
        const options: string[] = shuffle([card.translation, ...distractors]);

        return {
          id: `local_q_${idx}_${Date.now()}`,
          type: 'translation',
          word: card.word,
          promptSentence: card.example ? `"${card.example}"` : `Palavra: "${card.word}"`,
          translation: card.translation,
          options,
          correctAnswer: card.translation,
          explanation: `"${card.word}" significa "${card.translation}" em inglês.`,
          difficultyTag: 'Tradução no Contexto',
        };
      }
    });
  };

  // Generate Challenge via AI API (or fallback)
  const handleGenerateChallenge = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const countToGen = quizFocus === 'quick' ? 5 : questionCount;
    const cardsToUse = quizFocus === 'difficult' ? targetCardsList : cards;

    try {
      const response = await fetch('/api/gemini/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsToUse,
          count: countToGen,
          focus: quizFocus,
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        // Fallback local generation if AI returned empty or failed
        const local = generateLocalQuestions(cardsToUse, countToGen);
        setQuestions(local);
      }
    } catch (err) {
      console.warn('AI Challenge API unavailable, switching to dynamic local generator:', err);
      const local = generateLocalQuestions(cardsToUse, countToGen);
      setQuestions(local);
    } finally {
      setIsLoading(false);
      setQuizStarted(true);
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setUserAnswers([]);
      setQuizFinished(false);
      setIsAnswered(false);
      setSelectedOption(null);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    setSelectedOption(option);
    setIsAnswered(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        question: currentQ,
        userChoice: option,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            Desafio IA <Zap className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Quizzes dinâmicos com IA focados nas suas palavras mais difíceis.
          </p>
        </div>
      </div>

      {/* QUIZ CONFIG SCREEN */}
      {!quizStarted && (
        <div className="flex flex-col gap-5">
          {/* Target Stats Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              <Brain className="w-4 h-4" />
              <span>Diagnóstico da Coleção</span>
            </div>

            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-3xl font-black">{targetCardsList.length}</span>
                <span className="text-xs text-blue-100 ml-1.5 font-medium">
                  {difficultCards.length >= 3 ? 'palavras que exigem treino' : 'palavras na coleção'}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-bold backdrop-blur-sm">
                AI Powered
              </span>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed">
              O motor de IA analiza suas estatísticas e cria frases com lacunas e testes de tradução em contexto para acelerar sua memorização.
            </p>
          </div>

          {/* Config Options */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Escolha o Foco do Desafio</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setQuizFocus('difficult')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  quizFocus === 'difficult'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-100 font-bold ring-2 ring-amber-400/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Flame className="w-5 h-5 fill-amber-500/20" />
                  </div>
                  <div>
                    <div className="text-sm">Palavras Mais Difíceis</div>
                    <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      Prioriza palavras em aprendizado ou com baixa facilidade.
                    </div>
                  </div>
                </div>
                {quizFocus === 'difficult' && <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setQuizFocus('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  quizFocus === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-400/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm">Toda a Coleção</div>
                    <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      Mistura aleatória de todos os seus cartões de vocabulário.
                    </div>
                  </div>
                </div>
                {quizFocus === 'all' && <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setQuizFocus('quick')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  quizFocus === 'quick'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/80 text-purple-900 dark:text-purple-100 font-bold ring-2 ring-purple-400/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm">Desafio Rápido (5 Pergunta)</div>
                    <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      Ideal para uma rodada rápida de 2 minutos.
                    </div>
                  </div>
                </div>
                {quizFocus === 'quick' && <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />}
              </button>
            </div>

            {/* Questions count selector if not quick */}
            {quizFocus !== 'quick' && (
              <div className="pt-2">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 block">
                  Quantidade de Perguntas
                </label>
                <div className="flex gap-2">
                  {[5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        questionCount === num
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {num} Perguntas
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleGenerateChallenge}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gerando Desafio com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Iniciar Desafio com IA</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* QUIZ IN PROGRESS */}
      {quizStarted && !quizFinished && currentQ && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Progress & Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Questão {currentIndex + 1} / {questions.length}
              </span>
              {currentQ.difficultyTag && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {currentQ.difficultyTag}
                </span>
              )}
            </div>

            {/* Streak Counter */}
            {streak > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{streak}x Combo</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {currentQ.type === 'fill_blank'
                    ? 'Preencha a Lacuna em Francês'
                    : currentQ.type === 'translation'
                    ? 'Qual a Tradução Correta?'
                    : 'Escolha de Contexto'}
                </span>
                <button
                  type="button"
                  disabled={!voicesReady}
                  onClick={() => playAudio(currentQ.promptSentence, 'fr')}
                  className={`p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center gap-1.5 text-xs font-semibold ${!voicesReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={voicesReady ? "Ouvir frase em francês" : "Carregando vozes..."}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Main Prompt Sentence */}
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
                {currentQ.promptSentence}
              </div>

              {/* Context Translation Hint */}
              {currentQ.translation && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                  Tradução: "{currentQ.translation}"
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectOpt = opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                  let buttonStyle =
                    'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800';

                  if (isAnswered) {
                    if (isCorrectOpt) {
                      buttonStyle =
                        'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/50';
                    } else if (isSelected && !isCorrectOpt) {
                      buttonStyle =
                        'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100 font-bold ring-2 ring-rose-500/50';
                    } else {
                      buttonStyle =
                        'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/40 dark:border-zinc-800/40 text-zinc-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-3.5 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between text-left cursor-pointer ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-extrabold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isAnswered && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AI Context Explanation Box */}
              {isAnswered && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-950 dark:text-blue-100 flex items-start gap-3 text-xs leading-relaxed mt-1"
                >
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Explicação Contextual da IA:</span>
                    <span>{currentQ.explanation}</span>
                  </div>
                </motion.div>
              )}

              {/* Action / Next Button */}
              {isAnswered && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Próxima Pergunta' : 'Ver Resultado'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* QUIZ FINISHED RESULTS SCREEN */}
      {quizFinished && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Main Score Banner */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-md text-center flex flex-col items-center gap-3">
            <div className="p-3.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-500 border border-amber-200 dark:border-amber-800">
              <Trophy className="w-8 h-8 fill-amber-500/20" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                Desafio Concluído!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Você acertou {score} de {questions.length} perguntas (
                {Math.round((score / questions.length) * 100)}%)
              </p>
            </div>

            <div className="flex items-center gap-6 py-2 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 mt-1">
              <div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  +{score * 15} XP
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Pontuação</div>
              </div>
              <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="text-xl font-black text-amber-500">
                  {streak}x
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Melhor Combo</div>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              Revisão das Palavras do Desafio
            </h3>

            <div className="flex flex-col gap-2.5">
              {userAnswers.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                    item.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {item.question.word}
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {item.question.promptSentence}
                      </div>
                    </div>
                  </div>

                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                    {item.question.correctAnswer}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleGenerateChallenge}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Novo Desafio com IA</span>
            </button>

            <button
              type="button"
              onClick={() => setQuizStarted(false)}
              className="w-full py-3 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Voltar à Seleção de Desafio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

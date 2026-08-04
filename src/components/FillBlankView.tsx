import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Deck, FillBlankExercise, FlashCard } from '../types';
import { BUILTIN_FILL_BLANK_EXERCISES, generateExercisesFromCards } from '../data/fillBlankExercises';
import { playAudio, stopAudio } from '../lib/audio';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  Lightbulb,
  Star,
  ChevronLeft,
  ChevronRight,
  Tv,
  Radio,
  Heart,
  Share2,
  Gift,
  ThumbsUp,
  Flame,
  Zap,
  CornerDownLeft,
  Command,
} from 'lucide-react';

interface FillBlankViewProps {
  cards: FlashCard[];
  decks: Deck[];
  onOpenCardDetail?: (card: FlashCard) => void;
}

export const FillBlankView: React.FC<FillBlankViewProps> = ({ cards, decks }) => {
  // Mode selection: 'live' (Interactive Live Sentence Builder like screenshot) vs 'classic' (Fill in single blank)
  const [viewMode, setViewMode] = useState<'live' | 'classic'>('live');

  // Deck & Exercise state
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [exercises, setExercises] = useState<FillBlankExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Statistics
  const [correctCount, setCorrectCount] = useState<number>(304);
  const [wrongCount, setWrongCount] = useState<number>(57);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  // Previous question tracking (matching screenshot "上一题 It's freezing cold! ✓ 冷死了!")
  const [prevQuestion, setPrevQuestion] = useState<{
    fullSentence: string;
    translation: string;
    isCorrect: boolean;
  } | null>({
    fullSentence: "It's freezing cold!",
    translation: '冷死了! (Está congelando!)',
    isCorrect: true,
  });

  // Live Stream overlay toggle (simulates live broadcast atmosphere from screenshot)
  const [enableLiveStreamOverlay, setEnableLiveStreamOverlay] = useState<boolean>(true);

  // ----- LIVE MODE WORD-BY-WORD BUILDER STATE -----
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [candidateWords, setCandidateWords] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');

  // ----- CLASSIC MODE STATE -----
  const [classicUserInput, setClassicUserInput] = useState<string>('');
  const [classicMistakes, setClassicMistakes] = useState<number>(0);
  const [classicStatus, setClassicStatus] = useState<'unanswered' | 'correct' | 'incorrect' | 'given_up'>('unanswered');
  const [classicSelectedOption, setClassicSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  const classicInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reload exercises
  useEffect(() => {
    let combined = [...BUILTIN_FILL_BLANK_EXERCISES];

    if (cards && cards.length > 0) {
      const dynamic = generateExercisesFromCards(cards);
      combined = [...combined, ...dynamic];
    }

    if (selectedDeckId !== 'all') {
      combined = combined.filter((ex) => !ex.deckId || ex.deckId === selectedDeckId);
    }

    const shuffled = [...combined].sort(() => 0.5 - Math.random());
    const finalExercises = shuffled.length > 0 ? shuffled : BUILTIN_FILL_BLANK_EXERCISES;
    setExercises(finalExercises);
    setCurrentIndex(0);
  }, [selectedDeckId, cards]);

  const currentExercise = exercises[currentIndex] || BUILTIN_FILL_BLANK_EXERCISES[0];

  // Helper to split full target sentence into individual clean tokens
  const getSentenceTokens = useCallback((exercise: FillBlankExercise): string[] => {
    const raw = exercise.fullSentence || exercise.sentenceWithBlank.replace('______', exercise.targetWord);
    return raw.trim().split(/\s+/);
  }, []);

  // Setup current question for Live Mode
  const initLiveQuestion = useCallback((exercise: FillBlankExercise) => {
    if (!exercise) return;
    const tokens = getSentenceTokens(exercise);
    setSelectedWords([]);
    setLiveStatus('unanswered');
    setIsFavorited(false);

    // Create candidate pool: correct tokens + 3 random distractor words
    const distractors = ['beaucoup', 'toujours', 'maintenant', 'jamais', 'avec', 'sans', 'pour', 'ici', 'très']
      .filter((w) => !tokens.map((t) => t.toLowerCase()).includes(w.toLowerCase()))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const pool = [...tokens, ...distractors].sort(() => 0.5 - Math.random());
    setCandidateWords(pool);
  }, [getSentenceTokens]);

  useEffect(() => {
    if (currentExercise) {
      initLiveQuestion(currentExercise);
      setClassicUserInput('');
      setClassicMistakes(0);
      setClassicStatus('unanswered');
      setClassicSelectedOption(null);
      setShowHint(false);
    }
  }, [currentIndex, currentExercise, initLiveQuestion]);

  // Total accuracy rate calculation
  const totalAttempts = correctCount + wrongCount;
  const accuracyRate = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 84;

  // Live Mode: Handle clicking candidate word chip
  const handleSelectWordTile = (word: string, indexInCandidates: number) => {
    if (liveStatus === 'correct') return;

    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);

    const newCandidates = [...candidateWords];
    newCandidates.splice(indexInCandidates, 1);
    setCandidateWords(newCandidates);

    const targetTokens = getSentenceTokens(currentExercise);
    if (newSelected.length === targetTokens.length) {
      checkLiveAnswer(newSelected, targetTokens);
    }
  };

  // Live Mode: Click placed word in sentence to remove it
  const handleRemoveSelectedWord = (indexInSelected: number) => {
    if (liveStatus === 'correct') return;

    const removedWord = selectedWords[indexInSelected];
    const newSelected = selectedWords.filter((_, i) => i !== indexInSelected);
    setSelectedWords(newSelected);
    setCandidateWords([...candidateWords, removedWord]);
    if (liveStatus === 'incorrect') setLiveStatus('unanswered');
  };

  const normalizeStr = (s: string) => {
    return s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['".,!?:;]/g, '');
  };

  // Check live mode answer
  const checkLiveAnswer = (userWords: string[], targetTokens: string[]) => {
    const userStr = userWords.map(normalizeStr).join(' ');
    const targetStr = targetTokens.map(normalizeStr).join(' ');

    if (userStr === targetStr) {
      setLiveStatus('correct');
      setCorrectCount((prev) => prev + 1);
      playAudio(currentExercise.fullSentence, 'fr');
    } else {
      setLiveStatus('incorrect');
      setWrongCount((prev) => prev + 1);
    }
  };

  // Check classic mode answer
  const handleClassicCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classicUserInput.trim()) return;

    const userNorm = normalizeStr(classicUserInput);
    const targetNorm = normalizeStr(currentExercise.targetWord);

    if (userNorm === targetNorm) {
      setClassicStatus('correct');
      setCorrectCount((prev) => prev + 1);
      playAudio(currentExercise.fullSentence, 'fr');
    } else {
      setClassicStatus('incorrect');
      setWrongCount((prev) => prev + 1);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (!currentExercise) return;
    setPrevQuestion({
      fullSentence: currentExercise.fullSentence,
      translation: currentExercise.translation,
      isCorrect: liveStatus === 'correct' || classicStatus === 'correct',
    });

    stopAudio();
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const reshuffled = [...exercises].sort(() => 0.5 - Math.random());
      setExercises(reshuffled);
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    stopAudio();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkipWord = () => {
    const targetTokens = getSentenceTokens(currentExercise);
    if (selectedWords.length < targetTokens.length) {
      const nextNeededToken = targetTokens[selectedWords.length];
      const matchIdx = candidateWords.findIndex(
        (w) => w.toLowerCase() === nextNeededToken.toLowerCase()
      );
      if (matchIdx !== -1) {
        handleSelectWordTile(candidateWords[matchIdx], matchIdx);
      } else {
        setSelectedWords([...selectedWords, nextNeededToken]);
      }
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter') return;
      }

      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleSkipWord();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (viewMode === 'live') {
          if (liveStatus === 'correct') {
            handleNext();
          } else {
            checkLiveAnswer(selectedWords, getSentenceTokens(currentExercise));
          }
        } else {
          if (classicStatus === 'correct') {
            handleNext();
          } else {
            handleClassicCheckAnswer();
          }
        }
      } else if (e.key === 'Control' || e.key === 'c') {
        e.preventDefault();
        playAudio(currentExercise.fullSentence, 'fr');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWords, liveStatus, classicStatus, viewMode, currentExercise, currentIndex, exercises, getSentenceTokens]);

  const targetTokens = getSentenceTokens(currentExercise);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 pb-28 min-h-screen flex flex-col justify-between">
      {/* Top Main Navigation & Mode Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-red-500/30 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
                <span>Kiwi Français 900</span>
                <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase">
                  EN DIRECT
                </span>
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Pratique de la Prononciation & Oral en Français
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setViewMode('live')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'live'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Mode Direct</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('classic')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'classic'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lacune</span>
              </button>
            </div>
          </div>
        </div>

        {/* Deck Selector & Overlay Toggle */}
        <div className="flex items-center justify-between gap-2 px-1">
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          >
            <option value="all">🇫🇷 Toutes les phrases ({exercises.length})</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.flag} {deck.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEnableLiveStreamOverlay(!enableLiveStreamOverlay)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              enableLiveStreamOverlay
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
            }`}
            title="Activer/désactiver l'ambiance du chat en direct"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effet Chat Direct</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: LIVE SENTENCE BUILDER                                             */}
        {/* ========================================================================= */}
        {viewMode === 'live' && (
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xl shadow-zinc-200/40 dark:shadow-none overflow-hidden flex flex-col gap-5 transition-all">
            {/* Top Glowing Green Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
                style={{
                  width: `${Math.min(100, Math.max(5, ((currentIndex + 1) / exercises.length) * 100))}%`,
                }}
              />
            </div>

            {/* Top Bar Stats & Navigation Counter */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <div className="font-bold text-zinc-800 dark:text-zinc-200">
                900 Phrases Utiles en Français
              </div>
              <div className="font-semibold tracking-wide bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
                Question <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentIndex + 1}</span> / {exercises.length}
              </div>
            </div>

            {/* Previous Question Banner */}
            {prevQuestion && (
              <div className="flex items-center justify-center gap-2 text-xs py-1.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 animate-fadeIn">
                <span className="text-zinc-400 font-medium">Précédente:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{prevQuestion.fullSentence}</span>
                {prevQuestion.isCorrect ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓</span>
                ) : (
                  <span className="text-rose-500 font-extrabold">✕</span>
                )}
                <span className="text-zinc-500">"{prevQuestion.translation}"</span>
              </div>
            )}

            {/* Main Prompt Sentence */}
            <div className="text-center py-2">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                "{currentExercise.translation}"
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sélectionnez les mots dans le bon ordre pour former la phrase en français
              </p>
            </div>

            {/* Hint view in Live Mode */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{showHint ? 'Masquer la Dica' : 'Voir la Dica (Indication)'}</span>
              </button>
            </div>

            {showHint && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-fadeIn">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Indication / Dica:</span>
                  <span>
                    {currentExercise.hint ||
                      `La phrase commence par "${currentExercise.fullSentence.split(' ')[0]}" et contient ${targetTokens.length} mots.`}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Word Slots Container */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[72px] p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
              {targetTokens.map((_, slotIdx) => {
                const filledWord = selectedWords[slotIdx];
                const isActive = slotIdx === selectedWords.length;

                return (
                  <div
                    key={slotIdx}
                    onClick={() => filledWord && handleRemoveSelectedWord(slotIdx)}
                    className={`relative px-4 py-2.5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-200 flex items-center justify-center cursor-pointer min-w-[70px] ${
                      filledWord
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600'
                        : 'border-b-4 border-dashed border-zinc-300 dark:border-zinc-700 text-transparent bg-zinc-100/50 dark:bg-zinc-900/50'
                    } ${
                      isActive
                        ? 'border-b-4 border-b-emerald-500 dark:border-b-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
                        : ''
                    }`}
                  >
                    {filledWord || '____'}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Candidate Word Tiles Bank */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-semibold">
                <span>Cliquez sur les mots pour remplir la phrase:</span>
                {selectedWords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => initLiveQuestion(currentExercise)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Réinitialiser les mots
                  </button>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {candidateWords.map((word, idx) => (
                  <button
                    key={`${word}_${idx}`}
                    type="button"
                    onClick={() => handleSelectWordTile(word, idx)}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm sm:text-base border border-zinc-200/80 dark:border-zinc-700/80 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Result Feedback Banner */}
            {liveStatus === 'correct' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex flex-col gap-2 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Bravo ! Réponse Correcte ! 🎉</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playAudio(currentExercise.fullSentence, 'fr')}
                    className="p-1.5 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Écouter la Prononciation</span>
                  </button>
                </div>

                <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                  "{currentExercise.fullSentence}"
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Question Suivante (Appuyer sur Entrée)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {liveStatus === 'incorrect' && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs font-semibold animate-shake">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Ordre incorrect. Réessayez ou appuyez sur Espace pour sauter.</span>
                </div>
                <button
                  type="button"
                  onClick={() => initLiveQuestion(currentExercise)}
                  className="px-2.5 py-1 rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-bold cursor-pointer"
                >
                  Recommencer
                </button>
              </div>
            )}

            {/* REAL-TIME STATS BAR */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Réponses Correctes
                </div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {correctCount}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Réponses Incorrectes
                </div>
                <div className="text-lg font-black text-rose-700 dark:text-rose-300">
                  {wrongCount}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Taux de Précision
                </div>
                <div className="text-lg font-black text-blue-700 dark:text-blue-300">
                  {accuracyRate}%
                </div>
              </div>
            </div>

            {/* KEYBOARD SHORTCUTS DOCK */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pt-2 pb-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 scrollbar-none">
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Shift + Flèche Gauche"
              >
                <span className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 text-[9px] font-mono border border-zinc-300 dark:border-zinc-700">
                  Shift ←
                </span>
                <span>Précédente</span>
              </button>

              <button
                type="button"
                onClick={handleSkipWord}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Espace pour sauter un mot"
              >
                <span className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 text-[9px] font-mono border border-zinc-300 dark:border-zinc-700">
                  Space
                </span>
                <span>Sauter Mot</span>
              </button>

              <button
                type="button"
                onClick={() => checkLiveAnswer(selectedWords, targetTokens)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Entrée pour valider"
              >
                <span className="px-1 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono">
                  Enter
                </span>
                <span>Valider</span>
              </button>

              <button
                type="button"
                onClick={() => playAudio(currentExercise.fullSentence, 'fr')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 hover:bg-blue-200 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Ctrl pour écouter"
              >
                <span className="px-1 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono">
                  Ctrl
                </span>
                <span>Écouter</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFavorited(!isFavorited)}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  isFavorited
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>Favoris</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Shift + Flèche Droite"
              >
                <span>Suivante</span>
                <span className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 text-[9px] font-mono border border-zinc-300 dark:border-zinc-700">
                  Shift →
                </span>
              </button>
            </div>

            {/* LIVE STREAM OVERLAY FEED */}
            {enableLiveStreamOverlay && (
              <div className="mt-2 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50/50 to-zinc-100/80 dark:from-zinc-950/40 dark:to-zinc-900/80 rounded-2xl p-3 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5">
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-black">
                        🥝
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Kiwi Français (Direct)
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-black">
                          Suivre
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">1,088 j'aime • 70 personnes en direct</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                    <Flame className="w-3 h-3 fill-amber-500" />
                    <span>Direct Populaires</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900/80 text-white text-[11px] font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-[9px] font-black uppercase">
                      Direct
                    </span>
                    <span className="truncate max-w-[280px] sm:max-w-none">
                      Pratiquez le français oral du niveau débutant au niveau avancé !
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto scrollbar-none text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-[9px]">
                      Julien_FR
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Très bonne phrase !</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold text-[9px]">
                      Sophie
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">J'adore ce cours en direct !</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="font-bold text-zinc-600 dark:text-zinc-300">Antoine_Paris</span>
                    <span>a aimé le direct ❤️</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="font-bold text-zinc-600 dark:text-zinc-300">Claire_M</span>
                    <span>s'est abonnée 🔔</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CLASSIC FILL-IN-THE-BLANK MODE                                    */}
        {/* ========================================================================= */}
        {viewMode === 'classic' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300 flex flex-col gap-5">
            {/* Audio & Hint Bar */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <button
                type="button"
                onClick={() => playAudio(currentExercise.fullSentence, 'fr')}
                className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Écouter la Prononciation</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{showHint ? 'Masquer la Dica' : 'Voir la Dica (Indication)'}</span>
              </button>
            </div>

            {/* Hint Box in Classic Mode */}
            {showHint && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-fadeIn">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Indication / Dica:</span>
                  <span>
                    {currentExercise.hint ||
                      `Le mot manquant commence par "${currentExercise.targetWord.charAt(0)}" et contient ${currentExercise.targetWord.length} lettres.`}
                  </span>
                </div>
              </div>
            )}

            {/* Sentence Display - FIXED: Word is HIDDEN initially! */}
            <div className="text-2xl sm:text-3xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 text-center my-2 leading-relaxed">
              {currentExercise.sentenceWithBlank.split('______')[0]}
              <span className="inline-block px-3.5 py-1 mx-1.5 rounded-xl border-b-4 border-blue-500 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-extrabold min-w-[90px] text-center shadow-xs">
                {classicUserInput ? (
                  classicUserInput
                ) : (classicStatus === 'correct' || classicStatus === 'given_up') ? (
                  currentExercise.targetWord
                ) : (
                  '______'
                )}
              </span>
              {currentExercise.sentenceWithBlank.split('______')[1]}
            </div>

            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 italic">
              "{currentExercise.translation}"
            </div>

            {/* Typing input form */}
            <form onSubmit={handleClassicCheckAnswer} className="space-y-4">
              <input
                ref={classicInputRef}
                type="text"
                value={classicUserInput}
                onChange={(e) => {
                  setClassicUserInput(e.target.value);
                  if (classicStatus === 'incorrect') setClassicStatus('unanswered');
                }}
                placeholder="Tapez le mot manquant en français..."
                className={`w-full text-center text-lg font-medium py-3.5 px-4 rounded-2xl border-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none transition-all ${
                  classicStatus === 'incorrect'
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50'
                    : 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500'
                }`}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck="false"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Verificar Resposta (Valider)
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Pular (Sauter)
                </button>
              </div>
            </form>

            {/* Feedback Banners in Classic Mode */}
            {classicStatus === 'correct' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex flex-col gap-2 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Bravo ! Réponse Correcte ! 🎉</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playAudio(currentExercise.fullSentence, 'fr')}
                    className="p-1.5 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Écouter</span>
                  </button>
                </div>

                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  "{currentExercise.fullSentence}"
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Prochaine Phrase (Suivante)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {classicStatus === 'incorrect' && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs font-semibold animate-shake">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Réponse incorrecte. La bonne réponse est : <strong className="underline">{currentExercise.targetWord}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClassicUserInput(currentExercise.targetWord);
                    setClassicStatus('given_up');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-bold cursor-pointer shrink-0"
                >
                  Remplir
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


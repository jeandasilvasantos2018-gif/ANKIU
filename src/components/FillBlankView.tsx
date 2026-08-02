import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Check,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface FillBlankViewProps {
  cards: FlashCard[];
  decks: Deck[];
  onOpenCardDetail?: (card: FlashCard) => void;
}

export const FillBlankView: React.FC<FillBlankViewProps> = ({ cards, decks }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [exercises, setExercises] = useState<FillBlankExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Interaction State for current exercise
  const [userInput, setUserInput] = useState<string>('');
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [status, setStatus] = useState<'unanswered' | 'correct' | 'incorrect' | 'given_up'>('unanswered');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Overall Score Stats
  const [stats, setStats] = useState({
    correct: 0,
    attempts: 0,
    streak: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reload exercises
  useEffect(() => {
    let combined = [...BUILTIN_FILL_BLANK_EXERCISES];

    if (cards && cards.length > 0) {
      const dynamic = generateExercisesFromCards(cards);
      combined = [...combined, ...dynamic];
    }

    // Filter by selected deck if applicable
    if (selectedDeckId !== 'all') {
      combined = combined.filter((ex) => !ex.deckId || ex.deckId === selectedDeckId);
    }

    // Shuffle exercises for variety
    const shuffled = [...combined].sort(() => 0.5 - Math.random());
    setExercises(shuffled.length > 0 ? shuffled : BUILTIN_FILL_BLANK_EXERCISES);
    setCurrentIndex(0);
    resetCurrentState();
  }, [selectedDeckId, cards]);

  const currentExercise = exercises[currentIndex] || BUILTIN_FILL_BLANK_EXERCISES[0];

  const resetCurrentState = () => {
    setUserInput('');
    setMistakesCount(0);
    setStatus('unanswered');
    setSelectedOption(null);
    setShowHint(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // French accent buttons helper
  const frenchAccents = ['é', 'è', 'ê', 'à', 'ç', 'ù', 'â', 'î', 'ô', 'œ', "'"];

  const handleInsertAccent = (char: string) => {
    setUserInput((prev) => prev + char);
    inputRef.current?.focus();
  };

  const normalizeText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Submit text input answer
  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || status === 'correct' || status === 'given_up') return;

    const userNorm = normalizeText(userInput);
    const targetNorm = normalizeText(currentExercise.targetWord);

    if (userNorm === targetNorm) {
      // Correct!
      setStatus('correct');
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        attempts: prev.attempts + 1,
        streak: prev.streak + 1,
      }));
      playAudio(currentExercise.fullSentence, 'fr');
    } else {
      // Incorrect attempt
      const nextMistakes = mistakesCount + 1;
      setMistakesCount(nextMistakes);
      setStatus('incorrect');
      setStats((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        streak: 0,
      }));

      // Focus back to input if options aren't shown yet
      if (nextMistakes <= 2) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }
    }
  };

  // Multiple choice selection (when mistakesCount > 2 or when user chooses option)
  const handleSelectOption = (option: string) => {
    if (status === 'correct' || selectedOption !== null) return;

    setSelectedOption(option);
    const isRight = normalizeText(option) === normalizeText(currentExercise.targetWord);

    if (isRight) {
      setStatus('correct');
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        attempts: prev.attempts + 1,
        streak: prev.streak + 1,
      }));
      playAudio(currentExercise.fullSentence, 'fr');
    } else {
      setStatus('given_up');
      setStats((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        streak: 0,
      }));
    }
  };

  const handleNextSentence = () => {
    stopAudio();
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop back to start with reshuffled exercises
      const reshuffled = [...exercises].sort(() => 0.5 - Math.random());
      setExercises(reshuffled);
      setCurrentIndex(0);
    }
    resetCurrentState();
  };

  // Render parts of sentence with blank
  const renderSentence = () => {
    const parts = currentExercise.sentenceWithBlank.split('______');
    const isRevealed = status === 'correct' || status === 'given_up';

    return (
      <div className="text-2xl md:text-3xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 text-center my-4 leading-relaxed">
        {parts[0]}
        <span
          className={`inline-block px-3 py-1 mx-1 rounded-xl border-b-4 transition-all duration-300 ${
            status === 'correct'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-bold'
              : status === 'given_up'
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-500 line-through'
              : status === 'incorrect'
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-500 animate-shake'
              : 'bg-blue-50 dark:bg-zinc-800/90 text-blue-600 dark:text-blue-400 border-blue-500'
          }`}
        >
          {isRevealed
            ? currentExercise.targetWord
            : userInput || '______'}
        </span>
        {parts[1]}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 min-h-screen flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Completar Frases
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pratique o francês no contexto
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
              🔥 {stats.streak}
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60">
              ✓ {stats.correct}
            </div>
          </div>
        </div>

        {/* Deck Selector & Progress */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">🇫🇷 Todas as Frases ({exercises.length})</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.flag} {deck.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {currentIndex + 1} / {exercises.length}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300">
          {/* Audio & Hint Bar */}
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
            <button
              onClick={() => playAudio(currentExercise.fullSentence, 'fr')}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-full transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Ouvir Pronúncia
            </button>

            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              {showHint ? 'Ocultar Dica' : 'Ver Dica'}
            </button>
          </div>

          {/* Hint view if requested */}
          {showHint && currentExercise.hint && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 animate-fadeIn">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Dica:</strong> {currentExercise.hint}
              </span>
            </div>
          )}

          {/* Sentence display */}
          {renderSentence()}

          {/* Translation */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mb-6 italic">
            "{currentExercise.translation}"
          </div>

          {/* SECTION A: Standard Typing Input (shown if mistakesCount <= 2 and unanswered/incorrect) */}
          {status !== 'correct' && status !== 'given_up' && mistakesCount <= 2 && (
            <form onSubmit={handleCheckAnswer} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (status === 'incorrect') setStatus('unanswered');
                  }}
                  placeholder="Digite a palavra que falta em francês..."
                  className={`w-full text-center text-lg font-medium py-3.5 px-4 rounded-2xl border-2 transition-all duration-200 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 focus:outline-none ${
                    status === 'incorrect'
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* French Accent Quick Toolbar */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1">
                    Acentos:
                  </span>
                  {frenchAccents.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleInsertAccent(char)}
                      className="w-7 h-7 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-zinc-200/60 dark:border-zinc-700/60"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Banner when incorrect */}
              {status === 'incorrect' && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between animate-shake">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>
                      Incorreto. Tentativa <strong>{mistakesCount}/2</strong>. Tente novamente!
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="flex-1 py-3 px-6 rounded-2xl font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Verificar
                </button>
              </div>
            </form>
          )}

          {/* SECTION B: Multiple Choice Options (Triggered automatically after >2 mistakes OR when user errs 2+ times) */}
          {(mistakesCount > 2 || (status !== 'correct' && status !== 'given_up' && mistakesCount === 2 && status === 'incorrect')) && status !== 'correct' && status !== 'given_up' && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Você errou {mistakesCount} vezes! Escolha uma das opções abaixo:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentExercise.options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isRightOption =
                    normalizeText(opt) === normalizeText(currentExercise.targetWord);

                  let btnStyle =
                    'bg-zinc-50 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30';

                  if (selectedOption !== null) {
                    if (isRightOption) {
                      btnStyle =
                        'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 scale-[1.02]';
                    } else if (isSelected && !isRightOption) {
                      btnStyle = 'bg-rose-500 text-white border-rose-600';
                    } else {
                      btnStyle = 'opacity-40 bg-zinc-100 dark:bg-zinc-800 border-transparent';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(opt)}
                      disabled={selectedOption !== null}
                      className={`p-3.5 rounded-2xl font-semibold text-center text-sm border-2 transition-all duration-200 ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION C: Feedback & Explanation when finished/correct */}
          {(status === 'correct' || status === 'given_up') && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {status === 'correct' ? 'C\'est exact ! Muito Bem! 🎉' : 'A resposta correta era:'}
              </div>

              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 my-1">
                "{currentExercise.fullSentence}"
              </div>

              {currentExercise.explanation && (
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-2">
                  💡 {currentExercise.explanation}
                </p>
              )}

              <button
                onClick={handleNextSentence}
                className="w-full mt-4 py-3 px-6 rounded-2xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Próxima Frase
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="mt-6 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <button
          onClick={() => {
            const reshuffled = [...exercises].sort(() => 0.5 - Math.random());
            setExercises(reshuffled);
            setCurrentIndex(0);
            resetCurrentState();
          }}
          className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Embaralhar Frases
        </button>

        {status !== 'correct' && status !== 'given_up' && (
          <button
            onClick={() => {
              setMistakesCount(3);
              setStatus('incorrect');
            }}
            className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Mostrar Opções
          </button>
        )}
      </div>
    </div>
  );
};

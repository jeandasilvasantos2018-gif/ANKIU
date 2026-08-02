export type CardState = 'Novo' | 'Aprendendo' | 'Revisão' | 'Dominado';

export interface FlashCard {
  id: string;
  word: string;
  language: string; // 'en', 'fr', 'zh', 'ja', 'es', etc.
  deckId: string;
  pronunciation: string;
  audio?: string;
  partOfSpeech: string;
  translation: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  synonyms: string[];
  antonyms: string[];
  related: string[];
  expressions: string[];
  collocations: string[];
  family: string[];
  tags: string[];
  isFavorite?: boolean;
  notes?: string;

  // SM-2 Spaced Repetition parameters
  state: CardState;
  interval: number; // in days (0 for learning)
  easeFactor: number; // default 2.5
  repetitions: number;
  lastReview?: string; // ISO date string
  nextReview: string; // ISO date string
}

export interface Deck {
  id: string;
  name: string;
  language: string; // 'en', 'fr', 'zh', 'ja', 'es'
  flag: string; // emoji e.g., '🇺🇸'
  description?: string;
  createdAt: string;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface UserStats {
  streakDays: number;
  lastStudyDate?: string; // YYYY-MM-DD
  totalWordsLearned: number; // Cards in 'Dominado' state
  totalReviews: number;
  correctReviews: number; // Good + Easy
  totalTimeSeconds: number;
  dailyHistory: {
    [dateIso: string]: {
      cardsReviewed: number;
      timeSeconds: number;
    };
  };
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  interfaceLanguage: 'pt' | 'en';
  audioSpeed: number; // 1.0 or 0.75
  autoPlayAudio: boolean;
  enableAi: boolean;
}

export type ActiveTab = 'home' | 'decks' | 'fill_blank' | 'challenge' | 'search' | 'stats' | 'settings';

export type ChallengeType = 'fill_blank' | 'translation' | 'context_choice';

export interface ChallengeQuestion {
  id: string;
  type: ChallengeType;
  word: string;
  promptSentence: string;
  translation: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficultyTag?: string;
}

export interface FillBlankExercise {
  id: string;
  sentenceWithBlank: string; // e.g. "Comme tu ______ ?"
  targetWord: string; // e.g. "vas"
  fullSentence: string; // e.g. "Comme tu vas ?"
  translation: string; // e.g. "Como vai você?"
  options: string[]; // e.g. ["vas", "fais", "es", "appelles"]
  explanation?: string; // e.g. "Verbe aller à la 2ème personne"
  deckId?: string;
  hint?: string;
}


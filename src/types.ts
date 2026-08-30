export type CardState = 'Novo' | 'Aprendendo' | 'Revisão' | 'Dominado';

export interface FlashCard {
  id: string;
  word: string;
  language: string;
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
  state: CardState;
  interval: number;
  easeFactor: number;
  repetitions: number;
  lastReview?: string;
  nextReview: string;
}

export interface Deck { id: string; name: string; language: string; flag: string; description?: string; createdAt: string; }
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export interface UserStats { streakDays: number; lastStudyDate?: string; totalWordsLearned: number; totalReviews: number; correctReviews: number; totalTimeSeconds: number; dailyHistory: { [dateIso: string]: { cardsReviewed: number; timeSeconds: number } } }
export interface UserSettings { theme: 'light' | 'dark' | 'system'; interfaceLanguage: 'pt' | 'en'; audioSpeed: number; autoPlayAudio: boolean; enableAi: boolean; }

export type PodcastLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  podcastName: string;
  audioUrl: string;
  imageUrl?: string;
  level: PodcastLevel;
  category: string;
  duration?: number;
  vocabulary: string[];
  objective: string;
  sourceUrl?: string;
  license?: string;
}
export interface PodcastProgress {
  podcastId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  updatedAt: string;
}

export type ActiveTab = 'home' | 'decks' | 'fill_blank' | 'challenge' | 'podcasts' | 'search' | 'stats' | 'settings';
export type ChallengeType = 'fill_blank' | 'translation' | 'context_choice';
export interface ChallengeQuestion { id: string; type: ChallengeType; word: string; promptSentence: string; translation: string; options: string[]; correctAnswer: string; explanation: string; difficultyTag?: string; }
export interface FillBlankExercise { id: string; sentenceWithBlank: string; targetWord: string; fullSentence: string; translation: string; options: string[]; explanation?: string; deckId?: string; hint?: string; }

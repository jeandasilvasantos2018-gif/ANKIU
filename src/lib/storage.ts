import { INITIAL_CARDS, INITIAL_DECKS } from '../data/initialDecks';
import { Deck, FlashCard, ReviewRating, UserSettings, UserStats } from '../types';
import { calculateSM2 } from './sm2';

const KEYS = {
  DECKS: 'anki_french_decks_v3',
  CARDS: 'anki_french_cards_v3',
  STATS: 'anki_french_stats_v3',
  SETTINGS: 'anki_french_settings_v3',
};

// Default Settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  interfaceLanguage: 'pt',
  audioSpeed: 1.0,
  autoPlayAudio: true,
  enableAi: true,
};

// Default Stats
export const DEFAULT_STATS: UserStats = {
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  totalWordsLearned: 0,
  totalReviews: 0,
  correctReviews: 0,
  totalTimeSeconds: 0,
  dailyHistory: {
    [new Date().toISOString().split('T')[0]]: {
      cardsReviewed: 0,
      timeSeconds: 0,
    },
  },
};

/**
 * Get all decks
 */
export function getDecks(): Deck[] {
  try {
    const data = localStorage.getItem(KEYS.DECKS);
    if (!data) {
      localStorage.setItem(KEYS.DECKS, JSON.stringify(INITIAL_DECKS));
      return INITIAL_DECKS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading decks:', err);
    return INITIAL_DECKS;
  }
}

/**
 * Save decks list
 */
export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(KEYS.DECKS, JSON.stringify(decks));
}

/**
 * Get all cards
 */
export function getCards(): FlashCard[] {
  try {
    const data = localStorage.getItem(KEYS.CARDS);
    if (!data) {
      localStorage.setItem(KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
      return INITIAL_CARDS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading cards:', err);
    return INITIAL_CARDS;
  }
}

/**
 * Save cards list
 */
export function saveCards(cards: FlashCard[]): void {
  localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
}

/**
 * Get User Stats
 */
export function getStats(): UserStats {
  try {
    const data = localStorage.getItem(KEYS.STATS);
    if (!data) {
      localStorage.setItem(KEYS.STATS, JSON.stringify(DEFAULT_STATS));
      return DEFAULT_STATS;
    }
    const stats: UserStats = JSON.parse(data);

    // Update streak if needed
    const todayStr = new Date().toISOString().split('T')[0];
    if (stats.lastStudyDate) {
      const lastDate = new Date(stats.lastStudyDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays > 1) {
        stats.streakDays = 0; // Streak broken
      }
    }

    return stats;
  } catch (err) {
    return DEFAULT_STATS;
  }
}

/**
 * Save User Stats
 */
export function saveStats(stats: UserStats): void {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
}

/**
 * Get User Settings
 */
export function getSettings(): UserSettings {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save User Settings
 */
export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * Record a Card Review with SM-2 updates and stats updates
 */
export function recordReview(
  cardId: string,
  rating: ReviewRating,
  timeSpentSeconds: number = 5
): { card: FlashCard; stats: UserStats } {
  const cards = getCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error('Card not found');

  const currentCard = cards[cardIndex];
  const sm2Res = calculateSM2(currentCard, rating);

  const updatedCard: FlashCard = {
    ...currentCard,
    interval: sm2Res.interval,
    easeFactor: sm2Res.easeFactor,
    repetitions: sm2Res.repetitions,
    state: sm2Res.state,
    lastReview: new Date().toISOString(),
    nextReview: sm2Res.nextReview,
  };

  cards[cardIndex] = updatedCard;
  saveCards(cards);

  // Update Stats
  const stats = getStats();
  const todayStr = new Date().toISOString().split('T')[0];

  // Streak calculation
  if (stats.lastStudyDate !== todayStr) {
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    const todayDate = new Date(todayStr);
    if (lastDate) {
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays === 1) {
        stats.streakDays += 1;
      } else if (diffDays > 1) {
        stats.streakDays = 1;
      }
    } else {
      stats.streakDays = 1;
    }
    stats.lastStudyDate = todayStr;
  }

  stats.totalReviews += 1;
  if (rating === 'good' || rating === 'easy') {
    stats.correctReviews += 1;
  }

  stats.totalTimeSeconds += timeSpentSeconds;

  // Mastered count
  stats.totalWordsLearned = cards.filter((c) => c.state === 'Dominado').length;

  if (!stats.dailyHistory) stats.dailyHistory = {};
  if (!stats.dailyHistory[todayStr]) {
    stats.dailyHistory[todayStr] = { cardsReviewed: 0, timeSeconds: 0 };
  }
  stats.dailyHistory[todayStr].cardsReviewed += 1;
  stats.dailyHistory[todayStr].timeSeconds += timeSpentSeconds;

  saveStats(stats);

  return { card: updatedCard, stats };
}

/**
 * Toggle Card Favorite ⭐
 */
export function toggleFavorite(cardId: string): FlashCard | null {
  const cards = getCards();
  const card = cards.find((c) => c.id === cardId);
  if (!card) return null;
  card.isFavorite = !card.isFavorite;
  saveCards(cards);
  return card;
}

/**
 * Reset all app data to default initial state
 */
export function resetAppData(): void {
  localStorage.setItem(KEYS.DECKS, JSON.stringify(INITIAL_DECKS));
  localStorage.setItem(KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
  localStorage.setItem(KEYS.STATS, JSON.stringify(DEFAULT_STATS));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
}

/**
 * Export a single deck with its cards as JSON
 */
export function exportDeckJSON(deckId: string): string {
  const deck = getDecks().find((d) => d.id === deckId);
  const cards = getCards().filter((c) => c.deckId === deckId);
  return JSON.stringify(
    {
      type: 'anki_deck_export',
      version: '1.0',
      exportDate: new Date().toISOString(),
      deck,
      cards,
    },
    null,
    2
  );
}

/**
 * Export a single deck as CSV (compatible with Anki/Excel)
 */
export function exportDeckCSV(deckId: string): string {
  const cards = getCards().filter((c) => c.deckId === deckId);
  const header =
    'Palavra,Tradução,Frase de Exemplo,Tradução do Exemplo,Pronúncia,Classe Gramatical,Tags\n';
  const rows = cards
    .map((c) => {
      const escapeCsv = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        escapeCsv(c.word),
        escapeCsv(c.translation),
        escapeCsv(c.example),
        escapeCsv(c.exampleTranslation),
        escapeCsv(c.pronunciation),
        escapeCsv(c.partOfSpeech),
        escapeCsv(c.tags?.join('; ')),
      ].join(',');
    })
    .join('\n');

  return header + rows;
}

/**
 * Import a single deck JSON or full backup JSON
 */
export function importDeckJSON(jsonStr: string): {
  success: boolean;
  importedCardsCount: number;
  deckName?: string;
} {
  try {
    const data = JSON.parse(jsonStr);

    // If full app backup format
    if (data.decks && Array.isArray(data.decks) && data.cards && Array.isArray(data.cards)) {
      const existingDecks = getDecks();
      const existingCards = getCards();

      const newDecks = [...existingDecks];
      data.decks.forEach((d: Deck) => {
        if (!newDecks.some((ed) => ed.id === d.id)) {
          newDecks.push(d);
        }
      });

      const newCards = [...existingCards];
      let importedCount = 0;
      data.cards.forEach((c: FlashCard) => {
        const idx = newCards.findIndex((ec) => ec.id === c.id);
        if (idx >= 0) {
          newCards[idx] = c;
        } else {
          newCards.push(c);
          importedCount++;
        }
      });

      saveDecks(newDecks);
      saveCards(newCards);
      return { success: true, importedCardsCount: importedCount || data.cards.length };
    }

    // If single deck export format
    if (data.deck && data.cards && Array.isArray(data.cards)) {
      const existingDecks = getDecks();
      const existingCards = getCards();

      let targetDeck = existingDecks.find(
        (d) => d.id === data.deck.id || d.name === data.deck.name
      );
      if (!targetDeck) {
        targetDeck = {
          id: data.deck.id || `deck_${Date.now()}`,
          name: data.deck.name || 'Deck Importado',
          description: data.deck.description || 'Importado via arquivo JSON',
          language: data.deck.language || 'fr',
          flag: data.deck.flag || '🇫🇷',
          createdAt: new Date().toISOString(),
        };
        existingDecks.push(targetDeck);
        saveDecks(existingDecks);
      }

      const newCards = [...existingCards];
      let importedCount = 0;

      data.cards.forEach((c: FlashCard) => {
        const cardToSave: FlashCard = {
          ...c,
          id: c.id || `card_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          deckId: targetDeck!.id,
        };
        const idx = newCards.findIndex((ec) => ec.id === cardToSave.id);
        if (idx >= 0) {
          newCards[idx] = cardToSave;
        } else {
          newCards.push(cardToSave);
          importedCount++;
        }
      });

      saveCards(newCards);
      return { success: true, importedCardsCount: importedCount, deckName: targetDeck.name };
    }

    return { success: false, importedCardsCount: 0 };
  } catch (err) {
    console.error('Import deck JSON error:', err);
    return { success: false, importedCardsCount: 0 };
  }
}

/**
 * Import cards from CSV text into a deck
 */
export function importDeckCSV(
  deckName: string,
  csvStr: string,
  language = 'fr',
  flag = '🇫🇷'
): { success: boolean; importedCardsCount: number; deckName: string } {
  try {
    const lines = csvStr.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 1) return { success: false, importedCardsCount: 0, deckName };

    const parseCSVRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      const delimiter = row.includes('\t') ? '\t' : row.includes(';') ? ';' : ',';

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const existingDecks = getDecks();
    let deck = existingDecks.find((d) => d.name.toLowerCase() === deckName.toLowerCase());
    if (!deck) {
      deck = {
        id: `deck_csv_${Date.now()}`,
        name: deckName,
        description: 'Importado de arquivo CSV',
        language,
        flag,
        createdAt: new Date().toISOString(),
      };
      existingDecks.push(deck);
      saveDecks(existingDecks);
    }

    const existingCards = getCards();
    const newCards = [...existingCards];
    let importedCount = 0;

    const firstRow = parseCSVRow(lines[0]);
    const startIndex =
      firstRow[0]?.toLowerCase().includes('palavra') ||
      firstRow[0]?.toLowerCase().includes('word')
        ? 1
        : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      if (!cols[0]) continue;

      const word = cols[0];
      const translation = cols[1] || '';
      const example = cols[2] || '';
      const exampleTranslation = cols[3] || '';
      const pronunciation = cols[4] || '';
      const partOfSpeech = cols[5] || 'Noun';
      const tags = cols[6] ? cols[6].split(';').map((s) => s.trim()) : ['CSV Import'];

      const newCard: FlashCard = {
        id: `card_csv_${Date.now()}_${i}`,
        deckId: deck.id,
        word,
        translation,
        example,
        exampleTranslation,
        pronunciation,
        partOfSpeech,
        definition: '',
        synonyms: [],
        antonyms: [],
        related: [],
        expressions: [],
        family: [],
        collocations: [],
        tags,
        language,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        state: 'Novo',
        nextReview: new Date().toISOString(),
      };

      newCards.push(newCard);
      importedCount++;
    }

    saveCards(newCards);
    return { success: true, importedCardsCount: importedCount, deckName: deck.name };
  } catch (err) {
    console.error('CSV import error:', err);
    return { success: false, importedCardsCount: 0, deckName };
  }
}

/**
 * Export all app data as JSON string
 */
export function exportAppDataJSON(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    decks: getDecks(),
    cards: getCards(),
    stats: getStats(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import app data from JSON string
 */
export function importAppDataJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.decks && Array.isArray(data.decks)) saveDecks(data.decks);
    if (data.cards && Array.isArray(data.cards)) saveCards(data.cards);
    if (data.stats) saveStats(data.stats);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

import React, { useState, useEffect } from 'react';
import { ActiveTab, Deck, FlashCard, UserSettings, UserStats } from './types';
import {
  getCards,
  getDecks,
  getSettings,
  getStats,
  saveCards,
  saveDecks,
  saveSettings,
  saveStats,
  toggleFavorite,
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { HomeTab } from './components/HomeTab';
import { DecksTab } from './components/DecksTab';
import { SearchTab } from './components/SearchTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { FillBlankView } from './components/FillBlankView';
import { ChallengeTab } from './components/ChallengeTab';
import { StudySessionView } from './components/StudySessionView';

import { ExplorarMode } from './components/ExplorarMode';
import { AddEditCardModal } from './components/AddEditCardModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<UserStats>(getStats());
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  // Active study session state
  const [isStudying, setIsStudying] = useState(false);
  const [studyDeck, setStudyDeck] = useState<Deck | undefined>(undefined);
  const [sessionCards, setSessionCards] = useState<FlashCard[]>([]);

  // Explorar (Mind Map) mode standalone overlay
  const [explorarCard, setExplorarCard] = useState<FlashCard | null>(null);

  // Add Card modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDeckId, setAddModalDeckId] = useState<string | undefined>(undefined);
  const [addModalInitialWord, setAddModalInitialWord] = useState<string>('');

  // Refresh all state from localStorage
  const refreshAllState = () => {
    setCards(getCards());
    setDecks(getDecks());
    setStats(getStats());
    setSettings(getSettings());
  };

  useEffect(() => {
    refreshAllState();
  }, []);

  // Theme handling
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Start study session
  const handleStartStudy = (deck?: Deck) => {
    let targetCards = cards;
    if (deck) {
      targetCards = cards.filter((c) => c.deckId === deck.id);
    }

    // Prioritize due cards (Novo & Revisão/Aprendendo)
    const due = targetCards.filter(
      (c) => c.state === 'Novo' || c.state === 'Revisão' || c.state === 'Aprendendo'
    );

    const queue = due.length > 0 ? due : targetCards;

    setStudyDeck(deck);
    setSessionCards(queue);
    setIsStudying(true);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleCreateDeck = (
    name: string,
    language: string,
    flag: string,
    description?: string
  ) => {
    const newDeck: Deck = {
      id: `deck_${Date.now()}`,
      name,
      language,
      flag,
      description,
      createdAt: new Date().toISOString(),
    };
    const updated = [...decks, newDeck];
    setDecks(updated);
    saveDecks(updated);
  };

  const handleSaveNewCard = (cardData: Partial<FlashCard>) => {
    const activeDeck = decks.find((d) => d.id === cardData.deckId) || decks[0];

    const newCard: FlashCard = {
      id: `card_${Date.now()}`,
      word: cardData.word || 'Word',
      language: cardData.language || activeDeck?.language || 'en',
      deckId: cardData.deckId || activeDeck?.id || 'deck_en',
      pronunciation: cardData.pronunciation || '',
      partOfSpeech: cardData.partOfSpeech || 'Noun',
      translation: cardData.translation || '',
      definition: cardData.definition || '',
      example: cardData.example || '',
      exampleTranslation: cardData.exampleTranslation || '',
      synonyms: cardData.synonyms || [],
      antonyms: cardData.antonyms || [],
      related: cardData.related || [],
      expressions: cardData.expressions || [],
      collocations: cardData.collocations || [],
      family: cardData.family || [],
      tags: cardData.tags || ['General'],
      state: 'Novo',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: new Date().toISOString(),
    };

    const updatedCards = [newCard, ...cards];
    setCards(updatedCards);
    saveCards(updatedCards);
    setShowAddModal(false);
  };

  const handleToggleFavoriteCard = (cardId: string) => {
    toggleFavorite(cardId);
    setCards(getCards());
  };

  const handleOpenAddCardModal = (deckId?: string, initialWord: string = '') => {
    setAddModalDeckId(deckId);
    setAddModalInitialWord(initialWord);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Active Tab Screen */}
      <main className="w-full">
        {activeTab === 'home' && (
          <HomeTab
            cards={cards}
            stats={stats}
            onStartStudy={() => handleStartStudy()}
            onOpenFillBlank={() => setActiveTab('fill_blank')}
            onSelectFavoriteCard={(card) => setExplorarCard(card)}
          />
        )}

        {activeTab === 'decks' && (
          <DecksTab
            decks={decks}
            cards={cards}
            onSelectDeckToStudy={(deck) => handleStartStudy(deck)}
            onOpenAddCardModal={(deckId) => handleOpenAddCardModal(deckId)}
            onCreateDeck={handleCreateDeck}
            onRefreshAll={refreshAllState}
          />
        )}

        {activeTab === 'fill_blank' && (
          <FillBlankView
            cards={cards}
            decks={decks}
            onOpenCardDetail={(card) => {
              setSessionCards([card]);
              setIsStudying(true);
            }}
          />
        )}

        {activeTab === 'challenge' && <ChallengeTab cards={cards} />}


        {activeTab === 'search' && (
          <SearchTab
            cards={cards}
            onOpenCardDetail={(card) => {
              setSessionCards([card]);
              setIsStudying(true);
            }}
            onOpenExplorar={(card) => setExplorarCard(card)}
            onToggleFavorite={handleToggleFavoriteCard}
          />
        )}

        {activeTab === 'stats' && <StatsTab stats={stats} cards={cards} />}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRefreshAll={refreshAllState}
          />
        )}
      </main>

      {/* Navigation Bar */}
      {!isStudying && (
        <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
      )}

      {/* Full-Screen Study Mode Overlay */}
      {isStudying && (
        <StudySessionView
          sessionCards={sessionCards}
          deck={studyDeck}
          allCards={cards}
          onClose={() => {
            setIsStudying(false);
            refreshAllState();
          }}
          onRefreshCards={refreshAllState}
          onAddWordCard={(wordStr) => handleOpenAddCardModal(undefined, wordStr)}
        />
      )}

      {/* Standalone Explorar / Mind Map Overlay */}
      {explorarCard && (
        <ExplorarMode
          card={explorarCard}
          allCards={cards}
          onSelectWord={(word) => {
            const found = cards.find((c) => c.word.toLowerCase() === word.toLowerCase());
            if (found) {
              setExplorarCard(found);
            } else {
              handleOpenAddCardModal(undefined, word);
            }
          }}
          onClose={() => setExplorarCard(null)}
          onAddWordCard={(wordStr) => handleOpenAddCardModal(undefined, wordStr)}
        />
      )}

      {/* Add / Edit Card Modal */}
      {showAddModal && (
        <AddEditCardModal
          decks={decks}
          selectedDeckId={addModalDeckId}
          initialWord={addModalInitialWord}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewCard}
        />
      )}
    </div>
  );
}

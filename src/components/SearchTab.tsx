import React, { useState } from 'react';
import { FlashCard } from '../types';
import { Search, Star, Volume2, Sparkles, Network, Filter } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface SearchTabProps {
  cards: FlashCard[];
  onOpenCardDetail: (card: FlashCard) => void;
  onOpenExplorar: (card: FlashCard) => void;
  onToggleFavorite: (cardId: string) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  cards,
  onOpenCardDetail,
  onOpenExplorar,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Todos');
  const voicesReady = useVoicesReady();

  const tagsList = [
    'Todos',
    '⭐ Favoritos',
    'CEFR B1',
    'CEFR B2',
    'CEFR C1',
    'JLPT N2',
    'HSK 1',
    'Business',
    'Travel',
    'Academic',
    'Daily',
  ];

  const filteredCards = cards.filter((card) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      card.word.toLowerCase().includes(q) ||
      card.translation.toLowerCase().includes(q) ||
      card.definition.toLowerCase().includes(q) ||
      card.example.toLowerCase().includes(q) ||
      card.synonyms.some((s) => s.toLowerCase().includes(q)) ||
      card.family.some((f) => f.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (selectedTag === '⭐ Favoritos') {
      return card.isFavorite;
    }
    if (selectedTag !== 'Todos') {
      return card.tags.includes(selectedTag);
    }

    return true;
  });

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
        Buscar
      </h1>

      {/* Search Input Box */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar palavra, tradução ou expressão..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500 shadow-xs transition-all placeholder:text-zinc-400"
        />
      </div>

      {/* Filter Tag Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tagsList.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-all shrink-0 font-medium ${
              selectedTag === tag
                ? 'bg-blue-600 text-white border-transparent shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {filteredCards.length} {filteredCards.length === 1 ? 'palavra encontrada' : 'palavras encontradas'}
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group hover:border-blue-500/50 transition-all"
          >
            <div
              onClick={() => onOpenCardDetail(card)}
              className="flex-1 cursor-pointer flex flex-col gap-1 pr-3"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {card.word}
                </h3>
                <span className="text-xs font-semibold text-zinc-400 italic">
                  {card.partOfSpeech}
                </span>
              </div>

              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {card.translation}
              </p>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {card.definition}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={!voicesReady}
                onClick={() => playAudio(card.word, card.language)}
                className={`p-2 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={voicesReady ? "Pronúncia" : "Carregando vozes..."}
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenExplorar(card)}
                className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                title="Rede Semântica"
              >
                <Network className="w-4 h-4 text-indigo-500" />
              </button>

              <button
                onClick={() => onToggleFavorite(card.id)}
                className={`p-2 rounded-xl transition-colors ${
                  card.isFavorite
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-500'
                }`}
              >
                <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-sm">
            Nenhuma palavra encontrada com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { FlashCard } from '../types';
import { Search, Star, Volume2, Network, Sparkles } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface SearchTabProps {
  cards: FlashCard[];
  onOpenCardDetail: (card: FlashCard) => void;
  onOpenExplorar: (card: FlashCard) => void;
  onToggleFavorite: (cardId: string) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ cards, onOpenCardDetail, onOpenExplorar, onToggleFavorite }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Todos');
  const voicesReady = useVoicesReady();
  const tagsList = ['Todos', '⭐ Favoritos', 'CEFR B1', 'CEFR B2', 'CEFR C1', 'JLPT N2', 'HSK 1', 'Business', 'Travel', 'Academic', 'Daily'];

  const filteredCards = cards.filter((card) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || card.word.toLowerCase().includes(q) || card.translation.toLowerCase().includes(q) || card.definition.toLowerCase().includes(q) || card.example.toLowerCase().includes(q) || card.synonyms.some((s) => s.toLowerCase().includes(q)) || card.family.some((f) => f.toLowerCase().includes(q));
    if (!matchesQuery) return false;
    if (selectedTag === '⭐ Favoritos') return card.isFavorite;
    if (selectedTag !== 'Todos') return card.tags.includes(selectedTag);
    return true;
  });

  const pastel = ['#fff0f3', '#f3efff', '#fff5e8', '#eef9f3'];

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden">
        <span className="absolute right-5 top-4 text-[#f09aaf] ankiu-sparkle">✦</span>
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.14em] text-[#b18491]"><Sparkles className="w-3.5 h-3.5" /> Descobrir</div>
        <h1 className="mt-1 text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Buscar palavras</h1>
        <p className="mt-1 text-sm text-[#957b84] dark:text-[#c9b3bb]">Encontre um cartão e siga as conexões dele.</p>
      </header>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c08e9c]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Palavra, tradução ou expressão..." className="w-full pl-11 pr-4 py-4 rounded-[24px] ankiu-surface text-sm placeholder:text-[#bda3aa] focus:outline-none" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tagsList.map((tag) => (
          <button key={tag} onClick={() => setSelectedTag(tag)} className={`text-xs px-3.5 py-2 rounded-full border transition-all shrink-0 font-bold ${selectedTag === tag ? 'bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white border-transparent shadow-[0_8px_18px_rgba(236,91,119,.18)]' : 'bg-[#fffaf7]/90 dark:bg-[#382b31] text-[#80646f] dark:text-[#d4bcc4] border-[#efd5cf] dark:border-[#5b434d]'}`}>{tag}</button>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-black text-[#b08b96] uppercase tracking-[.15em]">{filteredCards.length} {filteredCards.length === 1 ? 'resultado' : 'resultados'}</div>
        <span className="text-[#ef9bae] text-xs">♡</span>
      </div>

      <div className="flex flex-col gap-3">
        {filteredCards.map((card, index) => (
          <div key={card.id} className="relative overflow-hidden bg-[#fffdfb]/94 dark:bg-[#382b31] border border-[#efd8d1] dark:border-[#58424c] rounded-[28px] p-5 shadow-[0_12px_34px_rgba(116,65,80,.08)] flex items-center justify-between group transition-all hover:-translate-y-0.5">
            <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: pastel[index % pastel.length] === '#fff0f3' ? '#f38aa0' : pastel[index % pastel.length] === '#f3efff' ? '#a997df' : pastel[index % pastel.length] === '#fff5e8' ? '#edb576' : '#79c19d' }} />
            <div onClick={() => onOpenCardDetail(card)} className="flex-1 cursor-pointer flex flex-col gap-1 pr-3 pl-1">
              <div className="flex items-center gap-2 flex-wrap"><h3 className="text-xl font-black text-[#46343c] dark:text-[#fff8f5]">{card.word}</h3><span className="text-[10px] font-bold text-[#b08f99] italic bg-[#fff3f0] dark:bg-[#4a363e] px-2 py-0.5 rounded-full">{card.partOfSpeech}</span></div>
              <p className="text-sm font-bold text-[#e35f79] dark:text-[#ff9eb0]">{card.translation}</p>
              <p className="text-xs text-[#957b84] dark:text-[#c8b0b9] line-clamp-1">{card.definition}</p>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={!voicesReady} onClick={() => playAudio(card.word, card.language)} className={`w-9 h-9 rounded-2xl bg-[#fff1e9] dark:bg-[#49372f] text-[#db8a5f] flex items-center justify-center transition-transform hover:scale-105 ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`} title={voicesReady ? 'Pronúncia' : 'Carregando vozes...'}><Volume2 className="w-4 h-4" /></button>
              <button onClick={() => onOpenExplorar(card)} className="w-9 h-9 rounded-2xl bg-[#f2efff] dark:bg-[#433956] text-[#8874c9] flex items-center justify-center transition-transform hover:scale-105" title="Rede Semântica"><Network className="w-4 h-4" /></button>
              <button onClick={() => onToggleFavorite(card.id)} className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 ${card.isFavorite ? 'text-[#e7a34a] bg-[#fff5db] dark:bg-[#4b3b2d]' : 'text-[#d6b7bf] bg-[#fff7f5] dark:bg-[#45343b]'}`}><Star className={`w-4 h-4 ${card.isFavorite ? 'fill-current' : ''}`} /></button>
            </div>
          </div>
        ))}
        {filteredCards.length === 0 && <div className="text-center py-12 rounded-[28px] border border-dashed border-[#eccfc8] text-[#ad8d96] text-sm bg-[#fffaf7]/50">Nenhuma palavra encontrada. Tente outro filtro ♡</div>}
      </div>
    </div>
  );
};

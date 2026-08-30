import React, { useState, useRef, useEffect } from 'react';
import { FlashCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Volume2, Plus } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface ExplorarModeProps {
  card: FlashCard;
  allCards: FlashCard[];
  onSelectWord: (word: string) => void;
  onClose: () => void;
  onAddWordCard?: (wordStr: string) => void;
}

export const ExplorarMode: React.FC<ExplorarModeProps> = ({ card, allCards, onSelectWord, onClose, onAddWordCard }) => {
  const [audioSpeed] = useState<number>(1.0);
  const [filterType, setFilterType] = useState<'all' | 'family' | 'expressions' | 'synonyms'>('all');
  const voicesReady = useVoicesReady();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 500 });
  const [cardSize, setCardSize] = useState({ width: 240, height: 160 });

  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) setContainerSize({ width: rect.width, height: rect.height });
      }
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) setCardSize({ width: rect.width, height: rect.height });
      }
    };
    updateSizes();
    const ro = new ResizeObserver(updateSizes);
    if (containerRef.current) ro.observe(containerRef.current);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener('resize', updateSizes);
    return () => { ro.disconnect(); window.removeEventListener('resize', updateSizes); };
  }, [card.id, filterType]);

  const connections: { word: string; category: string; color: string }[] = [];
  card.family.forEach((w) => {
    if (w.toLowerCase() !== card.word.toLowerCase()) connections.push({ word: w, category: 'Família', color: 'bg-[#eef9f3] text-[#4d9574] border-[#bee6d2] dark:bg-[#2f463a] dark:text-[#a6dfc2] dark:border-[#466553]' });
  });
  card.expressions.forEach((w) => connections.push({ word: w, category: 'Expressão', color: 'bg-[#f3efff] text-[#7f69bd] border-[#d9cff8] dark:bg-[#423650] dark:text-[#cdbef5] dark:border-[#5d4b72]' }));
  card.synonyms.forEach((w) => connections.push({ word: w, category: 'Sinônimo', color: 'bg-[#fff0f3] text-[#df5f79] border-[#ffd0da] dark:bg-[#4a303a] dark:text-[#ff9fb2] dark:border-[#6a404c]' }));
  card.collocations.forEach((w) => connections.push({ word: w, category: 'Colocação', color: 'bg-[#fff5df] text-[#ca8738] border-[#f5d89d] dark:bg-[#493a2c] dark:text-[#f3c980] dark:border-[#69513b]' }));
  card.related.forEach((w) => {
    if (!connections.some((c) => c.word.toLowerCase() === w.toLowerCase())) connections.push({ word: w, category: 'Relacionada', color: 'bg-[#fff6ef] text-[#a66f62] border-[#f0d4c8] dark:bg-[#42332f] dark:text-[#e3b5a7] dark:border-[#60483f]' });
  });

  const filteredConnections = connections.filter((conn) => {
    if (filterType === 'family') return conn.category === 'Família';
    if (filterType === 'expressions') return conn.category === 'Expressão' || conn.category === 'Colocação';
    if (filterType === 'synonyms') return conn.category === 'Sinônimo';
    return true;
  });

  const handlePlayAudio = () => playAudio(card.word, card.language, audioSpeed);

  const getNodePosition = (index: number, totalNodes: number) => {
    if (totalNodes === 0) return { x: 0, y: 0 };
    const cardW = cardSize.width || 240;
    const cardH = cardSize.height || 160;
    const nodeW = 125;
    const nodeH = 38;
    const gap = 36;
    const rx = cardW / 2 + nodeW / 2 + gap;
    const ry = cardH / 2 + nodeH / 2 + gap;
    const angle = (index * 2 * Math.PI) / totalNodes - Math.PI / 2;
    const isStaggered = totalNodes > 6 && index % 2 === 1;
    const staggerFactor = isStaggered ? 1.35 : 1.0;
    const densityScale = totalNodes > 10 ? 1.15 : 1.0;
    return { x: Math.round(rx * staggerFactor * densityScale * Math.cos(angle)), y: Math.round(ry * staggerFactor * densityScale * Math.sin(angle)) };
  };

  const cx = containerSize.width / 2;
  const cy = containerSize.height / 2;
  const labels = { all: 'Todas', family: 'Família', expressions: 'Expressões', synonyms: 'Sinônimos' };

  return (
    <div className="fixed inset-0 z-50 bg-[#fff8f3]/96 dark:bg-[#241b20]/96 backdrop-blur-xl flex flex-col justify-between overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-[#f0d8d1] dark:border-[#5a414b] bg-[#fffdfb]/78 dark:bg-[#30242a]/82 backdrop-blur-xl">
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-[#80646f] dark:text-[#d4bdc5] px-3 py-2 rounded-2xl hover:bg-[#fff0f3] dark:hover:bg-[#49313a] transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Voltar ao Estudo</span>
        </button>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.13em] text-[#df5d78] dark:text-[#ff9caf] bg-[#fff0f3] dark:bg-[#4a3039] px-3 py-1.5 rounded-full border border-[#ffd1da] dark:border-[#6a404d]">
          <Sparkles className="w-3.5 h-3.5" /><span>Rede Semântica</span>
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-4 px-4 overflow-x-auto no-scrollbar shrink-0">
        {(['all', 'family', 'expressions', 'synonyms'] as const).map((ft) => (
          <button key={ft} onClick={() => setFilterType(ft)} className={`text-xs px-3.5 py-2 rounded-full border transition-all font-bold ${filterType === ft ? 'bg-gradient-to-r from-[#f36b85] to-[#ff9b87] text-white border-transparent shadow-[0_8px_18px_rgba(236,91,119,.18)]' : 'bg-[#fffdfb]/85 dark:bg-[#382b31] text-[#80646f] dark:text-[#d4bdc5] border-[#eed5cf] dark:border-[#58424c]'}`}>{labels[ft]}</button>
        ))}
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-x-auto overflow-y-auto">
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(234,169,177,.55) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <span className="absolute top-8 left-[12%] text-[#f2b0bd] text-xl ankiu-sparkle pointer-events-none">✦</span>
        <span className="absolute bottom-10 right-[12%] text-[#e4c09b] text-sm ankiu-sparkle pointer-events-none">✦</span>

        <div ref={containerRef} className="relative w-full max-w-3xl min-h-[500px] sm:min-h-[560px] flex items-center justify-center my-auto">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {filteredConnections.map((conn, idx) => {
              const pos = getNodePosition(idx, filteredConnections.length);
              return <line key={`line-${conn.word}-${idx}`} x1={cx} y1={cy} x2={cx + pos.x} y2={cy + pos.y} stroke="#e7a1ae" strokeWidth="1.5" strokeDasharray="5 6" opacity="0.55" />;
            })}
          </svg>

          <motion.div ref={cardRef} layoutId={`card-center-${card.id}`} initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-20 bg-[#fffdfb] dark:bg-[#382b31] border-2 border-[#f28aa0] dark:border-[#d96f87] shadow-[0_22px_60px_rgba(132,74,91,.18)] rounded-[32px] p-5 text-center max-w-[270px] sm:max-w-xs flex flex-col items-center justify-center gap-1.5 shrink-0 relative overflow-hidden">
            <span className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-[#fff0f3] dark:bg-[#4b323b]" />
            <span className="absolute right-4 top-3 text-[#ef9aae] text-sm ankiu-sparkle">✦</span>
            <div className="flex items-center gap-2 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-[-.04em] text-[#44323a] dark:text-[#fff8f5]">{card.word}</h2>
              <button disabled={!voicesReady} onClick={handlePlayAudio} className={`p-2 rounded-full bg-[#fff0f3] dark:bg-[#4b323b] text-[#e45f79] dark:text-[#ff9caf] hover:scale-110 active:scale-95 transition-all ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`} title={voicesReady ? 'Pronunciar' : 'Carregando vozes...'}><Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#a0848d] dark:text-[#c9b1b9] italic relative z-10">{card.partOfSpeech} • {card.pronunciation}</p>
            <p className="text-sm sm:text-base font-black text-[#e05d78] dark:text-[#ff9daf] mt-0.5 relative z-10">{card.translation}</p>
          </motion.div>

          <AnimatePresence>
            {filteredConnections.map((conn, idx) => {
              const pos = getNodePosition(idx, filteredConnections.length);
              const existingCard = allCards.find((c) => c.word.toLowerCase() === conn.word.toLowerCase());
              return (
                <motion.div key={`${conn.word}-${idx}`} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }} transition={{ delay: idx * .03 }} style={{ position: 'absolute', left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`, transform: 'translate(-50%, -50%)' }} className={`z-30 group relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-[20px] border text-xs sm:text-sm font-bold transition-all shadow-[0_10px_28px_rgba(112,66,80,.10)] hover:shadow-[0_14px_34px_rgba(112,66,80,.16)] hover:scale-105 flex items-center gap-1.5 sm:gap-2 ${conn.color} backdrop-blur-md whitespace-nowrap`}>
                  <button type="button" disabled={!voicesReady} onClick={(e) => { e.stopPropagation(); playAudio(conn.word, card.language || 'fr'); }} className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${!voicesReady ? 'opacity-50 cursor-not-allowed' : ''}`} title={voicesReady ? `Ouvir "${conn.word}"` : 'Carregando vozes...'}><Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70 group-hover:opacity-100 shrink-0" /></button>
                  <span onClick={() => existingCard ? onSelectWord(existingCard.word) : onAddWordCard ? onAddWordCard(conn.word) : onSelectWord(conn.word)} className="cursor-pointer hover:underline">{conn.word}</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase opacity-65 border-l border-current/20 pl-1.5">{conn.category}</span>
                  {!existingCard && <button type="button" onClick={() => onAddWordCard && onAddWordCard(conn.word)} title={`Adicionar "${conn.word}"`}><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" /></button>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-3 sm:p-4 border-t border-[#efd8d1] dark:border-[#5a414b] bg-[#fffdfb]/78 dark:bg-[#30242a]/82 text-center text-xs text-[#9a7e87] dark:text-[#c8b0b8] shrink-0 backdrop-blur-xl">Toque em uma cápsula para explorar novas conexões ♡</div>
    </div>
  );
};

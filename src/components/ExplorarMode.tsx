import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FlashCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Volume2, Plus } from 'lucide-react';
import { playAudio, useVoicesReady } from '../lib/audio';

interface ExplorarModeProps { card: FlashCard; allCards: FlashCard[]; onSelectWord: (word: string) => void; onClose: () => void; onAddWordCard?: (wordStr: string) => void; }
type Connection = { word: string; category: string; color: string };
type PositionedConnection = Connection & { x: number; y: number };

export const ExplorarMode: React.FC<ExplorarModeProps> = ({ card, allCards, onSelectWord, onClose, onAddWordCard }) => {
  const [filterType, setFilterType] = useState<'all' | 'family' | 'expressions' | 'synonyms'>('all');
  const voicesReady = useVoicesReady();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 620 });
  const [cardSize, setCardSize] = useState({ width: 300, height: 180 });

  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setContainerSize({ width: r.width, height: r.height }); }
      if (cardRef.current) { const r = cardRef.current.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setCardSize({ width: r.width, height: r.height }); }
    };
    updateSizes(); const ro = new ResizeObserver(updateSizes); if (containerRef.current) ro.observe(containerRef.current); if (cardRef.current) ro.observe(cardRef.current); window.addEventListener('resize', updateSizes);
    return () => { ro.disconnect(); window.removeEventListener('resize', updateSizes); };
  }, [card.id, filterType]);

  const connections: Connection[] = [];
  card.family.forEach((w) => { if (w.toLowerCase() !== card.word.toLowerCase()) connections.push({ word: w, category: 'Família', color: 'bg-[#eef9f3] text-[#4d9574] border-[#bee6d2] dark:bg-[#2f463a] dark:text-[#a6dfc2] dark:border-[#466553]' }); });
  card.expressions.forEach((w) => connections.push({ word: w, category: 'Expressão', color: 'bg-[#f3efff] text-[#7f69bd] border-[#d9cff8] dark:bg-[#423650] dark:text-[#cdbef5] dark:border-[#5d4b72]' }));
  card.synonyms.forEach((w) => connections.push({ word: w, category: 'Sinônimo', color: 'bg-[#fff0f3] text-[#df5f79] border-[#ffd0da] dark:bg-[#4a303a] dark:text-[#ff9fb2] dark:border-[#6a404c]' }));
  card.collocations.forEach((w) => connections.push({ word: w, category: 'Colocação', color: 'bg-[#fff5df] text-[#ca8738] border-[#f5d89d] dark:bg-[#493a2c] dark:text-[#f3c980] dark:border-[#69513b]' }));
  card.related.forEach((w) => { if (!connections.some((c) => c.word.toLowerCase() === w.toLowerCase())) connections.push({ word: w, category: 'Relacionada', color: 'bg-[#fff6ef] text-[#a66f62] border-[#f0d4c8] dark:bg-[#42332f] dark:text-[#e3b5a7] dark:border-[#60483f]' }); });

  const filteredConnections = connections.filter((c) => filterType === 'family' ? c.category === 'Família' : filterType === 'expressions' ? c.category === 'Expressão' || c.category === 'Colocação' : filterType === 'synonyms' ? c.category === 'Sinônimo' : true);

  const positionedConnections = useMemo<PositionedConnection[]>(() => {
    const count = filteredConnections.length; if (!count) return [];
    const mobile = containerSize.width < 640;
    const estimatedNodeW = mobile ? 150 : 210;
    const estimatedNodeH = mobile ? 48 : 52;
    const safeX = cardSize.width / 2 + estimatedNodeW / 2 + (mobile ? 34 : 70);
    const safeY = cardSize.height / 2 + estimatedNodeH / 2 + (mobile ? 34 : 58);
    const maxX = Math.max(safeX, containerSize.width / 2 - estimatedNodeW / 2 - 24);
    const maxY = Math.max(safeY, containerSize.height / 2 - estimatedNodeH / 2 - 24);
    const baseRadiusX = Math.min(maxX, Math.max(safeX, mobile ? 190 : 330));
    const baseRadiusY = Math.min(maxY, Math.max(safeY, mobile ? 180 : 235));
    const candidates = filteredConnections.map((conn, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      const ring = count > 7 && index % 2 ? 1.16 : 1;
      return { ...conn, x: Math.cos(angle) * baseRadiusX * ring, y: Math.sin(angle) * baseRadiusY * ring };
    });
    const minDX = estimatedNodeW + (mobile ? 14 : 28); const minDY = estimatedNodeH + (mobile ? 12 : 22);
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j]; const dx = b.x - a.x, dy = b.y - a.y;
        const overlapX = minDX - Math.abs(dx), overlapY = minDY - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const pushX = overlapX / 2 + 5, pushY = overlapY / 2 + 5;
          if (Math.abs(dx) > Math.abs(dy)) { const dir = dx >= 0 ? 1 : -1; a.x -= pushX * dir; b.x += pushX * dir; }
          else { const dir = dy >= 0 ? 1 : -1; a.y -= pushY * dir; b.y += pushY * dir; }
        }
      }
      candidates.forEach((n) => { n.x = Math.max(-maxX, Math.min(maxX, n.x)); n.y = Math.max(-maxY, Math.min(maxY, n.y)); const inCenter = Math.abs(n.x) < safeX && Math.abs(n.y) < safeY; if (inCenter) { const nx = Math.abs(n.x) / safeX, ny = Math.abs(n.y) / safeY; if (nx > ny) n.x = (n.x >= 0 ? 1 : -1) * safeX; else n.y = (n.y >= 0 ? 1 : -1) * safeY; } });
    }
    return candidates.map((n) => ({ ...n, x: Math.round(n.x), y: Math.round(n.y) }));
  }, [filteredConnections, containerSize, cardSize]);

  const cx = containerSize.width / 2, cy = containerSize.height / 2;
  const labels = { all: 'Todas', family: 'Família', expressions: 'Expressões', synonyms: 'Sinônimos' };

  return <div className="fixed inset-0 z-50 bg-[#fff8f3]/96 dark:bg-[#241b20]/96 backdrop-blur-xl flex flex-col overflow-hidden">
    <div className="p-4 flex items-center justify-between border-b border-[#f0d8d1] dark:border-[#5a414b] bg-[#fffdfb]/78 dark:bg-[#30242a]/82"><button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-[#80646f] dark:text-[#d4bdc5] px-3 py-2 rounded-2xl"><ArrowLeft className="w-4 h-4" /><span>Voltar ao Estudo</span></button><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.13em] text-[#df5d78] dark:text-[#ff9caf] bg-[#fff0f3] dark:bg-[#4a3039] px-3 py-1.5 rounded-full border border-[#ffd1da] dark:border-[#6a404d]"><Sparkles className="w-3.5 h-3.5" /><span>Rede Semântica</span></div></div>
    <div className="flex justify-center gap-2 py-4 px-4 overflow-x-auto no-scrollbar shrink-0">{(['all','family','expressions','synonyms'] as const).map((ft) => <button key={ft} onClick={() => setFilterType(ft)} className={`text-xs px-3.5 py-2 rounded-full border font-bold ${filterType === ft ? 'bg-gradient-to-r from-[#f36b85] to-[#ff9b87] text-white border-transparent' : 'bg-[#fffdfb]/85 dark:bg-[#382b31] text-[#80646f] dark:text-[#d4bdc5] border-[#eed5cf] dark:border-[#58424c]'}`}>{labels[ft]}</button>)}</div>
    <div className="relative flex-1 overflow-auto px-4 pb-4"><div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(234,169,177,.55) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div ref={containerRef} className="relative mx-auto w-full max-w-[1100px] min-w-[760px] min-h-[640px] h-full flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">{positionedConnections.map((conn, idx) => <line key={`line-${conn.word}-${idx}`} x1={cx} y1={cy} x2={cx + conn.x} y2={cy + conn.y} stroke="#e7a1ae" strokeWidth="1.5" strokeDasharray="5 7" opacity="0.48" />)}</svg>
        <motion.div ref={cardRef} layoutId={`card-center-${card.id}`} initial={{ scale:.9,opacity:0 }} animate={{scale:1,opacity:1}} className="z-20 bg-[#fffdfb] dark:bg-[#382b31] border-2 border-[#f28aa0] dark:border-[#d96f87] shadow-[0_22px_60px_rgba(132,74,91,.18)] rounded-[32px] p-5 text-center w-[300px] min-h-[170px] flex flex-col items-center justify-center gap-1.5 shrink-0 relative overflow-hidden"><span className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-[#fff0f3] dark:bg-[#4b323b]" /><div className="flex items-center gap-2 relative z-10"><h2 className="text-2xl sm:text-3xl font-black tracking-[-.04em] text-[#44323a] dark:text-[#fff8f5]">{card.word}</h2><button disabled={!voicesReady} onClick={() => playAudio(card.word, card.language, 1)} className="p-2 rounded-full bg-[#fff0f3] dark:bg-[#4b323b] text-[#e45f79]" aria-label="Play pronunciation"><Volume2 className="w-5 h-5" /></button></div>{card.pronunciation && <p className="text-sm font-medium text-[#a0848d] dark:text-[#c9b1b9] italic">{card.partOfSpeech} • {card.pronunciation}</p>}{card.translation && <p className="text-base font-black text-[#e05d78] dark:text-[#ff9daf]">{card.translation}</p>}</motion.div>
        <AnimatePresence>{positionedConnections.map((conn, idx) => { const existingCard = allCards.find((c) => c.word.toLowerCase() === conn.word.toLowerCase()); return <motion.div key={`${conn.word}-${idx}`} initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} transition={{delay:idx*.025}} style={{position:'absolute',left:`calc(50% + ${conn.x}px)`,top:`calc(50% + ${conn.y}px)`,transform:'translate(-50%, -50%)',maxWidth:'250px'}} className={`z-30 px-3.5 py-2.5 rounded-[20px] border text-sm font-bold shadow-[0_10px_28px_rgba(112,66,80,.10)] flex items-center gap-2 ${conn.color} backdrop-blur-md`}><button type="button" disabled={!voicesReady} onClick={(e)=>{e.stopPropagation();playAudio(conn.word,card.language||'fr')}} className="shrink-0 p-1 rounded-lg" aria-label={`Play ${conn.word}`}><Volume2 className="w-3.5 h-3.5 opacity-70" /></button><span onClick={()=>existingCard?onSelectWord(existingCard.word):onAddWordCard?onAddWordCard(conn.word):onSelectWord(conn.word)} className="cursor-pointer hover:underline leading-tight text-left">{conn.word}</span><span className="text-[9px] font-semibold uppercase opacity-65 border-l border-current/20 pl-1.5 shrink-0">{conn.category}</span>{!existingCard&&<button type="button" onClick={()=>onAddWordCard&&onAddWordCard(conn.word)} aria-label={`Add ${conn.word}`}><Plus className="w-3.5 h-3.5 opacity-55" /></button>}</motion.div>})}</AnimatePresence>
      </div>
    </div>
    <div className="p-3 border-t border-[#efd8d1] dark:border-[#5a414b] bg-[#fffdfb]/78 dark:bg-[#30242a]/82 text-center text-xs text-[#9a7e87] dark:text-[#c8b0b8] shrink-0">Toque em uma cápsula para explorar novas conexões ♡</div>
  </div>;
};

import React, { useState } from 'react';
import { FlashCard, ReviewRating } from '../types';
import { getIntervalPreview } from '../lib/sm2';
import { playAudio, useVoicesReady } from '../lib/audio';
import { Volume2, Star, ChevronDown, ChevronUp, Network, Sparkles, Snail, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardViewProps {
  card: FlashCard;
  isAnswerRevealed: boolean;
  onRevealAnswer: () => void;
  onRate: (rating: ReviewRating) => void;
  onToggleFavorite: (cardId: string) => void;
  onOpenExplorar: () => void;
  onSelectWord?: (word: string) => void;
}

export const CardView: React.FC<CardViewProps> = ({ card, isAnswerRevealed, onRevealAnswer, onRate, onToggleFavorite, onOpenExplorar, onSelectWord }) => {
  const [showMore, setShowMore] = useState(false);
  const [isSlowAudio, setIsSlowAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const voicesReady = useVoicesReady();

  const handlePlayAudio = () => {
    setIsPlaying(true);
    playAudio(card.word, card.language, isSlowAudio ? 0.75 : 1.0, () => setIsPlaying(false));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-between min-h-[520px] p-6 bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[34px] shadow-[0_24px_70px_rgba(116,65,80,.14)] transition-all duration-300 relative overflow-hidden">
      <span className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#fff0f3] dark:bg-[#493039]" />
      <span className="absolute right-8 top-8 text-[#ef9aae] ankiu-sparkle">✦</span>
      <span className="absolute left-7 bottom-24 text-[#e9bd8b] text-xs ankiu-sparkle">✦</span>

      <div className="relative z-10 w-full flex items-center justify-between pb-4 border-b border-[#f2ddd7] dark:border-[#58424c]">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#fff5e8] dark:bg-[#42352f] text-[#b37d57] dark:text-[#e9b78e] border border-[#ffe1bd] dark:border-[#654d40]">{card.state}</span>
          {card.tags.map((tag, i) => <span key={i} className="text-[9px] font-black px-2 py-1 rounded-full bg-[#fff0f3] dark:bg-[#493039] text-[#df5d78] dark:text-[#ff9caf] border border-[#ffd1da] dark:border-[#693c49]">{tag}</span>)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenExplorar} className="p-2 rounded-2xl text-[#8874c9] bg-[#f3efff] dark:bg-[#403650] dark:text-[#cbbcf3] flex items-center gap-1 text-xs font-black" title="Abrir Rede Semântica"><Network className="w-4 h-4" /><span className="hidden sm:inline">Explorar</span></button>
          <button onClick={() => onToggleFavorite(card.id)} className={`p-2 rounded-2xl transition-colors ${card.isFavorite ? 'text-[#e4a347] bg-[#fff5df] dark:bg-[#493a2c]' : 'text-[#c9a9b3] bg-[#fff8f5] dark:bg-[#403139]'}`} title="Favorito"><Star className={`w-5 h-5 ${card.isFavorite ? 'fill-current' : ''}`} /></button>
        </div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#aa8490]"><Sparkles className="w-3.5 h-3.5" /> Palavra do momento</div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-[-.05em] text-[#44323a] dark:text-[#fff8f5]">{card.word}</h1>
        <div className="flex items-center gap-2 justify-center flex-wrap my-1">
          <button disabled={!voicesReady} onClick={handlePlayAudio} className={`p-3 rounded-full transition-all flex items-center justify-center ${!voicesReady ? 'bg-[#f4e6e1] dark:bg-[#493840] text-[#bca0aa] cursor-not-allowed opacity-60' : isPlaying ? 'bg-gradient-to-br from-[#f36a85] to-[#ff9b87] text-white scale-110 shadow-[0_8px_20px_rgba(236,91,119,.25)]' : 'bg-[#fff0f3] dark:bg-[#493039] text-[#e25d78] dark:text-[#ff9caf] hover:scale-105'}`} title={voicesReady ? 'Ouvir pronúncia' : 'Carregando vozes...'}><Volume2 className="w-5 h-5" /></button>
          <button onClick={() => setIsSlowAudio(!isSlowAudio)} className={`p-2 rounded-2xl text-xs font-black flex items-center gap-1 border transition-colors ${isSlowAudio ? 'bg-[#f3efff] text-[#7e69c5] dark:bg-[#403650] dark:text-[#cbbcf3] border-[#d9cff8] dark:border-[#5d4c73]' : 'bg-[#fff8f3] dark:bg-[#30242a] text-[#987b86] border-[#efd8d1] dark:border-[#57414a]'}`} title="Áudio lento"><Snail className="w-3.5 h-3.5" /><span>0.75x</span></button>
          <span className="text-sm font-bold text-[#987b86] dark:text-[#c8b1b9] italic">{card.partOfSpeech}</span>
          {card.pronunciation && <span className="text-xs text-[#b3969f] dark:text-[#ae949d] font-mono">{card.pronunciation}</span>}
        </div>
        <div className="text-2xl font-black text-[#e25d78] dark:text-[#ff9caf] mt-1">{card.translation}</div>
        <p className="text-sm text-[#765d67] dark:text-[#d5c0c7] max-w-md font-medium leading-relaxed px-2">{card.definition}</p>

        <div className="mt-3 p-4 rounded-[24px] bg-[#fff5e8] dark:bg-[#42352f] border border-[#ffe1bd] dark:border-[#654d40] w-full text-left flex flex-col gap-1.5 relative overflow-hidden">
          <Heart className="absolute right-3 top-3 w-3.5 h-3.5 text-[#e9a974] opacity-50" />
          <p className="text-base font-black text-[#503c34] dark:text-[#ffe8d8]">“{card.example}”</p>
          <p className="text-xs text-[#9a7968] dark:text-[#d1aa91]">{card.exampleTranslation}</p>
        </div>

        <div className="w-full mt-2">
          <button onClick={() => setShowMore(!showMore)} className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-black text-[#987b86] dark:text-[#c8b1b9] transition-colors"><span>{showMore ? 'Mostrar Menos' : 'Mostrar Mais • conexões e família'}</span>{showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
          <AnimatePresence>
            {showMore && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-left flex flex-col gap-3 pt-3 border-t border-[#f1ddd7] dark:border-[#57414a]">
                {card.expressions.length > 0 && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1.5">Expressões / Phrasal Verbs</h4><div className="flex flex-wrap gap-1.5">{card.expressions.map((exp, i) => <span key={i} onClick={() => onSelectWord && onSelectWord(exp)} className="text-xs px-2.5 py-1.5 rounded-2xl bg-[#f3efff] dark:bg-[#403650] text-[#7e69c5] dark:text-[#cbbcf3] border border-[#d9cff8] dark:border-[#5d4c73] cursor-pointer hover:underline">{exp}</span>)}</div></div>}
                {card.collocations.length > 0 && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1.5">Colocações Comuns</h4><div className="flex flex-wrap gap-1.5">{card.collocations.map((col, i) => <span key={i} className="text-xs px-2.5 py-1.5 rounded-2xl bg-[#fff5df] dark:bg-[#493a2c] text-[#c88938] dark:text-[#f3c980] border border-[#f5d89d] dark:border-[#69513b]">{col}</span>)}</div></div>}
                {(card.synonyms.length > 0 || card.antonyms.length > 0) && <div className="grid grid-cols-2 gap-2">{card.synonyms.length > 0 && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1">Sinônimos</h4><div className="flex flex-wrap gap-1">{card.synonyms.map((syn, i) => <span key={i} className="text-xs text-[#e25d78] dark:text-[#ff9caf] font-bold">{syn}{i < card.synonyms.length - 1 ? ',' : ''}</span>)}</div></div>}{card.antonyms.length > 0 && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1">Antônimos</h4><div className="flex flex-wrap gap-1">{card.antonyms.map((ant, i) => <span key={i} className="text-xs text-[#c45b64] dark:text-[#ff9da7] font-bold">{ant}{i < card.antonyms.length - 1 ? ',' : ''}</span>)}</div></div>}</div>}
                {card.family.length > 0 && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1.5">Família da Palavra <span className="normal-case tracking-normal text-[#58a47f]">• toque para ouvir</span></h4><div className="flex flex-wrap gap-1.5">{card.family.map((fam, i) => <button key={i} type="button" disabled={!voicesReady} onClick={(e) => { e.stopPropagation(); playAudio(fam, card.language || 'fr'); }} className={`text-xs px-2.5 py-1.5 rounded-2xl bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878] dark:text-[#a5dec1] border border-[#ccebdc] dark:border-[#436052] flex items-center gap-1.5 font-bold active:scale-95 ${!voicesReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Volume2 className="w-3.5 h-3.5" /><span>{fam}</span></button>)}</div></div>}
                {card.notes && <div><h4 className="text-[10px] font-black uppercase tracking-[.12em] text-[#a4868f] mb-1">Notas Pessoais</h4><p className="text-xs text-[#765d67] dark:text-[#d5c0c7] italic bg-[#fff8f3] dark:bg-[#30242a] p-3 rounded-2xl">{card.notes}</p></div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 w-full pt-4 border-t border-[#f1ddd7] dark:border-[#57414a]">
        {!isAnswerRevealed ? (
          <button onClick={onRevealAnswer} className="w-full py-3.5 px-6 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] active:scale-[.99] text-white font-black text-base transition-all shadow-[0_9px_22px_rgba(236,91,119,.20)]">Mostrar Resposta</button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => onRate('again')} className="flex flex-col items-center justify-center p-2.5 rounded-[20px] border border-[#ffd2d2] dark:border-[#6d4146] bg-[#fff0f0] dark:bg-[#493033] text-[#c45b64] dark:text-[#ffadb6] active:scale-95 transition-all"><span className="text-xs font-black uppercase">Again</span><span className="text-[10px] opacity-80 mt-0.5">{getIntervalPreview(card, 'again')}</span></button>
            <button onClick={() => onRate('hard')} className="flex flex-col items-center justify-center p-2.5 rounded-[20px] border border-[#ead8d5] dark:border-[#5b444e] bg-[#fff8f3] dark:bg-[#30242a] text-[#765d67] dark:text-[#d4bcc4] active:scale-95 transition-all"><span className="text-xs font-black uppercase">Hard</span><span className="text-[10px] opacity-80 mt-0.5">{getIntervalPreview(card, 'hard')}</span></button>
            <button onClick={() => onRate('good')} className="flex flex-col items-center justify-center p-2.5 rounded-[20px] bg-gradient-to-br from-[#f36a85] to-[#ff9b87] text-white active:scale-95 transition-all shadow-sm"><span className="text-xs font-black uppercase">Good</span><span className="text-[10px] opacity-90 mt-0.5">{getIntervalPreview(card, 'good')}</span></button>
            <button onClick={() => onRate('easy')} className="flex flex-col items-center justify-center p-2.5 rounded-[20px] border border-[#ccebdc] dark:border-[#436052] bg-[#eef9f3] dark:bg-[#2f4138] text-[#519878] dark:text-[#a5dec1] active:scale-95 transition-all"><span className="text-xs font-black uppercase">Easy</span><span className="text-[10px] opacity-80 mt-0.5">{getIntervalPreview(card, 'easy')}</span></button>
          </div>
        )}
      </div>
    </div>
  );
};

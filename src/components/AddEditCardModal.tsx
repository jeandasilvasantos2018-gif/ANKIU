import React, { useState } from 'react';
import { Deck, FlashCard } from '../types';
import { X, Sparkles, Loader2, Heart } from 'lucide-react';

interface AddEditCardModalProps {
  decks: Deck[];
  selectedDeckId?: string;
  initialWord?: string;
  onClose: () => void;
  onSave: (card: Partial<FlashCard>) => void;
}

export const AddEditCardModal: React.FC<AddEditCardModalProps> = ({ decks, selectedDeckId, initialWord = '', onClose, onSave }) => {
  const [word, setWord] = useState(initialWord);
  const [deckId, setDeckId] = useState(selectedDeckId || decks[0]?.id || 'deck_fr_essential');
  const [partOfSpeech, setPartOfSpeech] = useState('Verb');
  const [translation, setTranslation] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [expressions, setExpressions] = useState('');
  const [family, setFamily] = useState('');
  const [tags, setTags] = useState('Daily');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiAutoFill = async () => {
    if (!word.trim()) { setAiError('Digite a palavra primeiro para preencher com a IA.'); return; }
    setIsAiGenerating(true); setAiError(null);
    const activeDeck = decks.find((d) => d.id === deckId);
    const targetLang = activeDeck?.language || 'en';
    try {
      const res = await fetch('/api/gemini/generate-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: word.trim(), language: targetLang, userLanguage: 'en' }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar cartão com IA.');
      const c = data.card;
      if (c.word) setWord(c.word); if (c.partOfSpeech) setPartOfSpeech(c.partOfSpeech); if (c.translation) setTranslation(c.translation); if (c.definition) setDefinition(c.definition); if (c.example) setExample(c.example); if (c.exampleTranslation) setExampleTranslation(c.exampleTranslation); if (c.pronunciation) setPronunciation(c.pronunciation); if (c.synonyms) setSynonyms(c.synonyms.join(', ')); if (c.antonyms) setAntonyms(c.antonyms.join(', ')); if (c.expressions) setExpressions(c.expressions.join(', ')); if (c.family) setFamily(c.family.join(', ')); if (c.tags) setTags(c.tags.join(', '));
    } catch (err: any) { setAiError(err.message || 'Falha na geração automática.'); }
    finally { setIsAiGenerating(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!word.trim() || !translation.trim()) return;
    const activeDeck = decks.find((d) => d.id === deckId);
    onSave({ word: word.trim(), deckId, language: activeDeck?.language || 'en', partOfSpeech, translation: translation.trim(), definition: definition.trim(), example: example.trim(), exampleTranslation: exampleTranslation.trim(), pronunciation: pronunciation.trim(), synonyms: synonyms ? synonyms.split(',').map((s) => s.trim()).filter(Boolean) : [], antonyms: antonyms ? antonyms.split(',').map((s) => s.trim()).filter(Boolean) : [], related: [], expressions: expressions ? expressions.split(',').map((s) => s.trim()).filter(Boolean) : [], collocations: [], family: family ? family.split(',').map((s) => s.trim()).filter(Boolean) : [], tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : ['General'] });
  };

  const fieldClass = 'w-full mt-1 p-3 rounded-[18px] bg-[#fffaf7] dark:bg-[#30242a] border border-[#efd7d1] dark:border-[#5b444e] text-sm focus:outline-none focus:border-[#ef879c]';
  const labelClass = 'font-black text-[#927782] dark:text-[#c9b3bb] text-[11px]';

  return (
    <div className="fixed inset-0 z-50 bg-[#3b2931]/52 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[34px] p-6 max-w-lg w-full shadow-[0_28px_90px_rgba(69,39,49,.28)] flex flex-col gap-4 my-8 overflow-hidden">
        <span className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#fff0f3] dark:bg-[#493039]" />
        <span className="absolute right-10 top-6 text-[#ef9aae] ankiu-sparkle">✦</span>
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[#f2ddd7] dark:border-[#58424c]">
          <div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#a9828e] flex items-center gap-1.5"><Heart className="w-3 h-3 fill-[#ef9aae]/30" /> Nova descoberta</div><h3 className="text-xl font-black text-[#46343c] dark:text-[#fff8f5]">Adicionar Palavra</h3></div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] text-[#a47886] flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="relative z-10 p-4 rounded-[24px] bg-gradient-to-r from-[#fff0f3] via-[#fff4ec] to-[#f3efff] dark:from-[#493039] dark:via-[#43342f] dark:to-[#403650] border border-[#efd4dc] dark:border-[#604654] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#73525e] dark:text-[#ecd6de]"><div className="w-9 h-9 rounded-2xl bg-white/70 dark:bg-black/10 flex items-center justify-center"><Sparkles className="w-4 h-4 text-[#8b75c8]" /></div><span>Digite a palavra e deixe a IA montar a ficha ♡</span></div>
          <button type="button" onClick={handleAiAutoFill} disabled={isAiGenerating} className="px-3 py-2 rounded-2xl bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black text-xs shrink-0 flex items-center gap-1.5 shadow-[0_8px_18px_rgba(236,91,119,.18)] disabled:opacity-50">{isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}<span>Preencher com IA</span></button>
        </div>

        {aiError && <p className="relative z-10 text-xs text-[#c45663] font-bold bg-[#fff0f0] dark:bg-[#493033] px-3 py-2 rounded-2xl">{aiError}</p>}

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Palavra</label><input type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Ex: resilient" className={`${fieldClass} font-black`} required /></div><div><label className={labelClass}>Deck</label><select value={deckId} onChange={(e) => setDeckId(e.target.value)} className={fieldClass}>{decks.map((d) => <option key={d.id} value={d.id}>{d.flag} {d.name}</option>)}</select></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Tradução (Inglês)</label><input type="text" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Ex: resilient" className={fieldClass} required /></div><div><label className={labelClass}>Classe Gramatical</label><input type="text" value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} placeholder="Ex: Adjective" className={fieldClass} /></div></div>
          <div><label className={labelClass}>Definição Simples</label><input type="text" value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Ex: Able to withstand difficult conditions." className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Frase de Exemplo</label><input type="text" value={example} onChange={(e) => setExample(e.target.value)} placeholder="Ex: Elle est très résiliente." className={fieldClass} /></div><div><label className={labelClass}>Tradução da Frase</label><input type="text" value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} placeholder="Ex: She is remarkably resilient." className={fieldClass} /></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Pronúncia</label><input type="text" value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="/ʁe.zi.ljɑ̃/" className={fieldClass} /></div><div><label className={labelClass}>Tags</label><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Daily, CEFR B1" className={fieldClass} /></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Sinônimos</label><input type="text" value={synonyms} onChange={(e) => setSynonyms(e.target.value)} placeholder="tough, adaptable" className={fieldClass} /></div><div><label className={labelClass}>Antônimos</label><input type="text" value={antonyms} onChange={(e) => setAntonyms(e.target.value)} placeholder="fragile" className={fieldClass} /></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Expressões</label><input type="text" value={expressions} onChange={(e) => setExpressions(e.target.value)} placeholder="expressions..." className={fieldClass} /></div><div><label className={labelClass}>Família da Palavra</label><input type="text" value={family} onChange={(e) => setFamily(e.target.value)} placeholder="resilience, resiliently" className={fieldClass} /></div></div>
          <div className="flex gap-2 mt-3"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-[22px] border border-[#efd7d1] dark:border-[#5b444e] text-xs font-black text-[#8a6d77] dark:text-[#ceb6be] bg-[#fffaf7] dark:bg-[#30242a]">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black text-xs shadow-[0_9px_22px_rgba(236,91,119,.20)]">Salvar Cartão ♡</button></div>
        </form>
      </div>
    </div>
  );
};

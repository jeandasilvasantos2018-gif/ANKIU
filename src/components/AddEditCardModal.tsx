import React, { useState } from 'react';
import { Deck, FlashCard } from '../types';
import { X, Sparkles, Loader2, Plus } from 'lucide-react';

interface AddEditCardModalProps {
  decks: Deck[];
  selectedDeckId?: string;
  initialWord?: string;
  onClose: () => void;
  onSave: (card: Partial<FlashCard>) => void;
}

export const AddEditCardModal: React.FC<AddEditCardModalProps> = ({
  decks,
  selectedDeckId,
  initialWord = '',
  onClose,
  onSave,
}) => {
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
    if (!word.trim()) {
      setAiError('Digite a palavra primeiro para preencher com a IA.');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    const activeDeck = decks.find((d) => d.id === deckId);
    const targetLang = activeDeck?.language || 'en';

    try {
      const res = await fetch('/api/gemini/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          language: targetLang,
          userLanguage: 'en',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar cartão com IA.');
      }

      const c = data.card;
      if (c.word) setWord(c.word);
      if (c.partOfSpeech) setPartOfSpeech(c.partOfSpeech);
      if (c.translation) setTranslation(c.translation);
      if (c.definition) setDefinition(c.definition);
      if (c.example) setExample(c.example);
      if (c.exampleTranslation) setExampleTranslation(c.exampleTranslation);
      if (c.pronunciation) setPronunciation(c.pronunciation);
      if (c.synonyms) setSynonyms(c.synonyms.join(', '));
      if (c.antonyms) setAntonyms(c.antonyms.join(', '));
      if (c.expressions) setExpressions(c.expressions.join(', '));
      if (c.family) setFamily(c.family.join(', '));
      if (c.tags) setTags(c.tags.join(', '));
    } catch (err: any) {
      setAiError(err.message || 'Falha na geração automática.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    const activeDeck = decks.find((d) => d.id === deckId);

    const newCardData: Partial<FlashCard> = {
      word: word.trim(),
      deckId,
      language: activeDeck?.language || 'en',
      partOfSpeech,
      translation: translation.trim(),
      definition: definition.trim(),
      example: example.trim(),
      exampleTranslation: exampleTranslation.trim(),
      pronunciation: pronunciation.trim(),
      synonyms: synonyms ? synonyms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      antonyms: antonyms ? antonyms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      related: [],
      expressions: expressions ? expressions.split(',').map((s) => s.trim()).filter(Boolean) : [],
      collocations: [],
      family: family ? family.split(',').map((s) => s.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : ['General'],
    };

    onSave(newCardData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 my-8">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            Adicionar Nova Palavra
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Auto Fill Banner */}
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Digite a palavra e preencha a ficha inteira com Gemini IA!</span>
          </div>

          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isAiGenerating}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
          >
            {isAiGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Preencher com IA</span>
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-rose-500 font-medium">{aiError}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {/* Deck & Word */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-zinc-500">Palavra</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ex: resilient"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-500">Deck</label>
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.flag} {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tradução & Gramática */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-zinc-500">Tradução (Inglês)</label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Ex: resilient"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-500">Classe Gramatical</label>
              <input
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="Ex: Adjective"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Definição */}
          <div>
            <label className="font-semibold text-zinc-500">Definição Simples</label>
            <input
              type="text"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Ex: Able to withstand difficult conditions."
              className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Frase e Tradução da frase */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-zinc-500">Frase de Exemplo (Francês)</label>
              <input
                type="text"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Ex: Elle est très résiliente."
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-500">Tradução da Frase (Inglês)</label>
              <input
                type="text"
                value={exampleTranslation}
                onChange={(e) => setExampleTranslation(e.target.value)}
                placeholder="Ex: She is remarkably resilient."
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sinônimos & Família */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-zinc-500">Sinônimos (separados por vírgula)</label>
              <input
                type="text"
                value={synonyms}
                onChange={(e) => setSynonyms(e.target.value)}
                placeholder="tough, adaptable"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-500">Família da Palavra</label>
              <input
                type="text"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder="resilience, resiliently"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

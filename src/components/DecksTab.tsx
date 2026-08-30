import React, { useState, useRef } from 'react';
import { Deck, FlashCard } from '../types';
import { Plus, Play, Sparkles, Download, Upload, FileText, FileJson, MoreVertical, CheckCircle2, AlertCircle, X, FileCode, Share2 } from 'lucide-react';
import { exportDeckJSON, exportDeckCSV, exportAppDataJSON, importDeckJSON, importDeckCSV } from '../lib/storage';

interface DecksTabProps {
  decks: Deck[];
  cards: FlashCard[];
  onSelectDeckToStudy: (deck: Deck) => void;
  onOpenAddCardModal: (deckId?: string) => void;
  onCreateDeck: (name: string, language: string, flag: string, description?: string) => void;
  onRefreshAll?: () => void;
}

export const DecksTab: React.FC<DecksTabProps> = ({ decks, cards, onSelectDeckToStudy, onOpenAddCardModal, onCreateDeck, onRefreshAll }) => {
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeMenuDeckId, setActiveMenuDeckId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLang, setNewDeckLang] = useState('fr');
  const [newDeckFlag, setNewDeckFlag] = useState('🇫🇷');
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  const [importCsvDeckName, setImportCsvDeckName] = useState('');
  const [importCsvLang, setImportCsvLang] = useState('fr');
  const [importCsvFlag, setImportCsvFlag] = useState('🇫🇷');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const handleExportDeckJSON = (deck: Deck) => { downloadFile(exportDeckJSON(deck.id), `deck-${deck.name.toLowerCase().replace(/\s+/g, '-')}.json`, 'application/json'); setActiveMenuDeckId(null); };
  const handleExportDeckCSV = (deck: Deck) => { downloadFile(exportDeckCSV(deck.id), `deck-${deck.name.toLowerCase().replace(/\s+/g, '-')}.csv`, 'text/csv;charset=utf-8;'); setActiveMenuDeckId(null); };
  const handleExportAll = () => downloadFile(exportAppDataJSON(), `backup-baralhos-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  const handleCreateDeckSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!newDeckName.trim()) return; onCreateDeck(newDeckName.trim(), newDeckLang, newDeckFlag); setNewDeckName(''); setShowNewDeckModal(false); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string; if (!content) return;
      if (importType === 'json' || file.name.endsWith('.json')) {
        const res = importDeckJSON(content);
        if (res.success) { setImportStatus({ type: 'success', message: `Importação realizada com sucesso! ${res.importedCardsCount} palavras importadas.` }); onRefreshAll?.(); setTimeout(() => { setShowImportModal(false); setImportStatus(null); }, 1500); }
        else setImportStatus({ type: 'error', message: 'Erro ao importar arquivo JSON. Verifique a estrutura do arquivo.' });
      } else {
        const deckTitle = importCsvDeckName.trim() || file.name.replace(/\.[^/.]+$/, '');
        const res = importDeckCSV(deckTitle, content, importCsvLang, importCsvFlag);
        if (res.success && res.importedCardsCount > 0) { setImportStatus({ type: 'success', message: `Sucesso! Baralho "${res.deckName}" criado/atualizado com ${res.importedCardsCount} palavras.` }); onRefreshAll?.(); setTimeout(() => { setShowImportModal(false); setImportStatus(null); }, 1500); }
        else setImportStatus({ type: 'error', message: 'Erro ao ler arquivo CSV. Certifique-se de que possui ao menos uma coluna com palavras.' });
      }
    };
    reader.readAsText(file); if (e.target) e.target.value = '';
  };

  const palette = [
    { bg: 'bg-[#fff0f3] dark:bg-[#493039]', border: 'border-[#ffd3dc] dark:border-[#693c49]', accent: 'text-[#e25d78]' },
    { bg: 'bg-[#f3efff] dark:bg-[#403650]', border: 'border-[#ddd3ff] dark:border-[#5d4c73]', accent: 'text-[#8874c9]' },
    { bg: 'bg-[#fff5e8] dark:bg-[#42352f]', border: 'border-[#ffe0b8] dark:border-[#654d40]', accent: 'text-[#d68a55]' },
    { bg: 'bg-[#eef9f3] dark:bg-[#2f4138]', border: 'border-[#ccebdc] dark:border-[#436052]', accent: 'text-[#58a47f]' },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden">
        <span className="absolute right-5 top-4 text-[#f09aaf] ankiu-sparkle">✦</span>
        <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#aa8490] flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Sua coleção</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div><h1 className="text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Decks</h1><p className="text-xs text-[#957b84] dark:text-[#c9b3bb] mt-1">Organize palavras por idioma ou objetivo.</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setImportStatus(null); setShowImportModal(true); }} className="w-10 h-10 rounded-2xl bg-[#f3efff] dark:bg-[#403650] border border-[#ddd3ff] dark:border-[#5d4c73] text-[#8874c9] flex items-center justify-center" title="Importar"><Upload className="w-4 h-4" /></button>
            <button type="button" onClick={() => setShowNewDeckModal(true)} className="h-10 px-3 rounded-2xl bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white text-xs font-black flex items-center gap-1.5 shadow-[0_8px_18px_rgba(236,91,119,.18)]"><Plus className="w-4 h-4" /> Novo</button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between p-4 rounded-[24px] bg-gradient-to-r from-[#fff0f3] to-[#f3efff] dark:from-[#493039] dark:to-[#403650] border border-[#ead1df] dark:border-[#5e4354] text-xs shadow-sm">
        <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-[#e25d78]" /><span className="font-black text-[#5b414b] dark:text-[#fff0f5]">Backup dos seus decks</span></div>
        <button type="button" onClick={handleExportAll} className="px-3 py-2 rounded-2xl bg-white/75 dark:bg-[#34272d] text-[#df5e78] font-black text-[10px] flex items-center gap-1"><Download className="w-3.5 h-3.5" /> JSON</button>
      </div>

      <div className="flex flex-col gap-3">
        {decks.map((deck, index) => {
          const deckCards = cards.filter((c) => c.deckId === deck.id);
          const dueCards = deckCards.filter((c) => c.state === 'Novo' || c.state === 'Revisão' || c.state === 'Aprendendo').length;
          const isMenuOpen = activeMenuDeckId === deck.id;
          const tone = palette[index % palette.length];
          return (
            <div key={deck.id} className={`rounded-[30px] border p-5 shadow-[0_12px_34px_rgba(116,65,80,.08)] flex flex-col gap-3 relative ${tone.bg} ${tone.border}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-3xl w-14 h-14 rounded-[22px] bg-white/65 dark:bg-black/10 border border-white/50 dark:border-white/5 flex items-center justify-center shrink-0">{deck.flag}</div>
                  <div className="min-w-0"><h3 className="text-lg font-black text-[#4b373f] dark:text-[#fff7f3] truncate">{deck.name}</h3><p className="text-xs text-[#957b84] dark:text-[#c8b1b9]">{deckCards.length} palavras • {dueCards} para revisar</p></div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onOpenAddCardModal(deck.id)} className="w-9 h-9 rounded-2xl bg-white/60 dark:bg-black/10 text-[#9d7d87] flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setActiveMenuDeckId(isMenuOpen ? null : deck.id)} className="w-9 h-9 rounded-2xl bg-white/60 dark:bg-black/10 text-[#9d7d87] flex items-center justify-center"><MoreVertical className="w-4 h-4" /></button>
                  <button type="button" onClick={() => onSelectDeckToStudy(deck)} className="h-9 px-3 rounded-2xl bg-[#fffdfb] dark:bg-[#34272d] text-[#e05d78] dark:text-[#ff9caf] font-black text-xs flex items-center gap-1.5 shadow-sm"><Play className="w-3.5 h-3.5 fill-current" /> Estudar</button>
                </div>
              </div>
              {isMenuOpen && <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-[#a4868f]">Exportar</span><div className="flex gap-2"><button type="button" onClick={() => handleExportDeckJSON(deck)} className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/10 text-xs font-black flex items-center gap-1.5"><FileJson className="w-3.5 h-3.5 text-[#e25d78]" /> JSON</button><button type="button" onClick={() => handleExportDeckCSV(deck)} className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/10 text-xs font-black flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#58a47f]" /> CSV</button></div></div>}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={() => onOpenAddCardModal()} className="p-4 rounded-[26px] border border-dashed border-[#e8c8c4] dark:border-[#5b434c] bg-[#fffaf7]/60 dark:bg-[#30242a]/60 text-[#9c7b85] dark:text-[#d2b7c0] font-black text-xs flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"><Sparkles className="w-4 h-4 text-[#e46c85]" /> Adicionar palavra com IA</button>

      {showNewDeckModal && (
        <div className="fixed inset-0 z-50 bg-[#3a2830]/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#aa8490]">Novo começo</div><h2 className="text-xl font-black text-[#49363f] dark:text-[#fff7f3]">Criar Deck</h2></div><button onClick={() => setShowNewDeckModal(false)} className="w-9 h-9 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleCreateDeckSubmit} className="flex flex-col gap-3">
              <input value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Nome do deck" className="w-full px-4 py-3 border rounded-2xl" autoFocus />
              <div className="grid grid-cols-2 gap-2"><select value={newDeckLang} onChange={(e) => setNewDeckLang(e.target.value)} className="px-3 py-3 border rounded-2xl"><option value="fr">Francês</option><option value="en">Inglês</option><option value="es">Espanhol</option><option value="de">Alemão</option><option value="it">Italiano</option><option value="pt">Português</option><option value="ja">Japonês</option><option value="zh">Chinês</option></select><input value={newDeckFlag} onChange={(e) => setNewDeckFlag(e.target.value)} placeholder="🇫🇷" className="px-3 py-3 border rounded-2xl text-center" /></div>
              <button type="submit" className="mt-1 py-3.5 rounded-[22px] bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white font-black">Criar Deck</button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-[#3a2830]/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm max-h-[88vh] overflow-y-auto rounded-[32px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#aa8490]">Trazer conteúdo</div><h2 className="text-xl font-black text-[#49363f] dark:text-[#fff7f3]">Importar</h2></div><button onClick={() => setShowImportModal(false)} className="w-9 h-9 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-2 gap-2 mb-4"><button onClick={() => setImportType('json')} className={`p-3 rounded-2xl border text-xs font-black ${importType === 'json' ? 'bg-[#fff0f3] text-[#e25d78] border-[#ffcbd6]' : 'border-[#efd7d1]'}`}><FileJson className="w-4 h-4 mx-auto mb-1" /> JSON</button><button onClick={() => setImportType('csv')} className={`p-3 rounded-2xl border text-xs font-black ${importType === 'csv' ? 'bg-[#eef9f3] text-[#58a47f] border-[#ccebdc]' : 'border-[#efd7d1]'}`}><FileCode className="w-4 h-4 mx-auto mb-1" /> CSV</button></div>
            {importType === 'csv' && <div className="grid gap-2 mb-3"><input value={importCsvDeckName} onChange={(e) => setImportCsvDeckName(e.target.value)} placeholder="Nome do deck" className="px-3 py-3 border rounded-2xl" /><div className="grid grid-cols-2 gap-2"><select value={importCsvLang} onChange={(e) => setImportCsvLang(e.target.value)} className="px-3 py-3 border rounded-2xl"><option value="fr">Francês</option><option value="en">Inglês</option><option value="es">Espanhol</option><option value="de">Alemão</option><option value="it">Italiano</option><option value="pt">Português</option><option value="ja">Japonês</option><option value="zh">Chinês</option></select><input value={importCsvFlag} onChange={(e) => setImportCsvFlag(e.target.value)} className="px-3 py-3 border rounded-2xl text-center" /></div></div>}
            <input ref={fileInputRef} type="file" accept={importType === 'json' ? '.json' : '.csv,.txt'} onChange={handleFileUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-5 rounded-[24px] border border-dashed border-[#dfbfc0] bg-[#fff8f3] dark:bg-[#30242a] text-[#8e707a] font-black text-xs flex flex-col items-center gap-2"><Upload className="w-6 h-6 text-[#e46c85]" /> Selecionar arquivo</button>
            {importStatus && <div className={`mt-3 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${importStatus.type === 'success' ? 'bg-[#eef9f3] text-[#4f9675]' : 'bg-[#fff0f0] text-[#c45b64]'}`}>{importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}{importStatus.message}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

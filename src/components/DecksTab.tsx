import React, { useState, useRef } from 'react';
import { Deck, FlashCard } from '../types';
import {
  Plus,
  Play,
  Layers,
  Sparkles,
  Download,
  Upload,
  FileText,
  FileJson,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Share2,
} from 'lucide-react';
import {
  exportDeckJSON,
  exportDeckCSV,
  exportAppDataJSON,
  importDeckJSON,
  importDeckCSV,
} from '../lib/storage';

interface DecksTabProps {
  decks: Deck[];
  cards: FlashCard[];
  onSelectDeckToStudy: (deck: Deck) => void;
  onOpenAddCardModal: (deckId?: string) => void;
  onCreateDeck: (name: string, language: string, flag: string, description?: string) => void;
  onRefreshAll?: () => void;
}

export const DecksTab: React.FC<DecksTabProps> = ({
  decks,
  cards,
  onSelectDeckToStudy,
  onOpenAddCardModal,
  onCreateDeck,
  onRefreshAll,
}) => {
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
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDeckJSON = (deck: Deck) => {
    const jsonStr = exportDeckJSON(deck.id);
    const cleanName = deck.name.toLowerCase().replace(/\s+/g, '-');
    downloadFile(jsonStr, `deck-${cleanName}.json`, 'application/json');
    setActiveMenuDeckId(null);
  };

  const handleExportDeckCSV = (deck: Deck) => {
    const csvStr = exportDeckCSV(deck.id);
    const cleanName = deck.name.toLowerCase().replace(/\s+/g, '-');
    downloadFile(csvStr, `deck-${cleanName}.csv`, 'text/csv;charset=utf-8;');
    setActiveMenuDeckId(null);
  };

  const handleExportAll = () => {
    const jsonStr = exportAppDataJSON();
    downloadFile(jsonStr, `backup-baralhos-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    onCreateDeck(newDeckName.trim(), newDeckLang, newDeckFlag);
    setNewDeckName('');
    setShowNewDeckModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      if (importType === 'json' || file.name.endsWith('.json')) {
        const res = importDeckJSON(content);
        if (res.success) {
          setImportStatus({ type: 'success', message: `Importação realizada com sucesso! ${res.importedCardsCount} palavras importadas.` });
          onRefreshAll?.();
          setTimeout(() => { setShowImportModal(false); setImportStatus(null); }, 1500);
        } else {
          setImportStatus({ type: 'error', message: 'Erro ao importar arquivo JSON. Verifique a estrutura do arquivo.' });
        }
      } else {
        const deckTitle = importCsvDeckName.trim() || file.name.replace(/\.[^/.]+$/, '');
        const res = importDeckCSV(deckTitle, content, importCsvLang, importCsvFlag);
        if (res.success && res.importedCardsCount > 0) {
          setImportStatus({ type: 'success', message: `Sucesso! Baralho "${res.deckName}" criado/atualizado com ${res.importedCardsCount} palavras.` });
          onRefreshAll?.();
          setTimeout(() => { setShowImportModal(false); setImportStatus(null); }, 1500);
        } else {
          setImportStatus({ type: 'error', message: 'Erro ao ler arquivo CSV. Certifique-se de que possui ao menos uma coluna com palavras.' });
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Decks</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Gerencie, exporte e importe seus baralhos</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setImportStatus(null); setShowImportModal(true); }} className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Importar Baralho ou Cartões (JSON / CSV)"><Upload className="w-4 h-4 text-indigo-500" /><span className="hidden sm:inline">Importar</span></button>
          <button type="button" onClick={() => setShowNewDeckModal(true)} className="p-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"><Plus className="w-4 h-4" /><span>Novo Deck</span></button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-900/60 text-xs">
        <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /><span className="font-semibold text-zinc-800 dark:text-zinc-200">Exportar Todos os Baralhos (Backup)</span></div>
        <button type="button" onClick={handleExportAll} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Baixar Backup JSON</span></button>
      </div>

      <div className="flex flex-col gap-3">
        {decks.map((deck) => {
          const deckCards = cards.filter((c) => c.deckId === deck.id);
          const dueCards = deckCards.filter((c) => c.state === 'Novo' || c.state === 'Revisão' || c.state === 'Aprendendo').length;
          const isMenuOpen = activeMenuDeckId === deck.id;
          return (
            <div key={deck.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3 relative group hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="text-3xl p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">{deck.flag}</div><div className="flex flex-col gap-0.5"><h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{deck.name}</h3><p className="text-xs text-zinc-500 dark:text-zinc-400">{deckCards.length} palavras • {dueCards} para revisar</p></div></div>
                <div className="flex items-center gap-1.5"><button type="button" onClick={() => onOpenAddCardModal(deck.id)} className="p-2 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer" title="Adicionar palavra neste deck"><Plus className="w-4 h-4" /></button><button type="button" onClick={() => setActiveMenuDeckId(isMenuOpen ? null : deck.id)} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" title="Opções de Exportação"><MoreVertical className="w-4 h-4" /></button><button type="button" onClick={() => onSelectDeckToStudy(deck)} className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer ml-1"><Play className="w-3.5 h-3.5 fill-white" /><span>Estudar</span></button></div>
              </div>
              {isMenuOpen && <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 animate-fadeIn"><span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Exportar Baralho:</span><div className="flex gap-2"><button type="button" onClick={() => handleExportDeckJSON(deck)} className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"><FileJson className="w-3.5 h-3.5 text-blue-500" /><span>JSON</span></button><button type="button" onClick={() => handleExportDeckCSV(deck)} className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"><FileText className="w-3.5 h-3.5 text-emerald-500" /><span>CSV / Anki</span></button></div></div>}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={() => onOpenAddCardModal()} className="p-4 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer"><Sparkles className="w-4 h-4 text-blue-500" /><span>Adicionar nova palavra com IA Assistente</span></button>

      {showImportModal && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 relative animate-scaleUp"><button type="button" onClick={() => setShowImportModal(false)} className="absolute top-5 right-5 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button><div><h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-500" /><span>Importar Baralho</span></h3><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Carregue um arquivo JSON de backup ou uma planilha CSV (estilo Anki).</p></div><div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl"><button type="button" onClick={() => setImportType('json')} className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${importType === 'json' ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}><FileJson className="w-4 h-4" /><span>Arquivo JSON</span></button><button type="button" onClick={() => setImportType('csv')} className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${importType === 'csv' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}><FileText className="w-4 h-4" /><span>Planilha CSV / Anki</span></button></div>{importType === 'csv' && <div className="flex flex-col gap-2.5 pt-1"><div><label className="text-xs font-semibold text-zinc-500">Nome do Baralho de Destino</label><input type="text" value={importCsvDeckName} onChange={(e) => setImportCsvDeckName(e.target.value)} placeholder="Ex: Vocabulário Francês Avançado" className="w-full mt-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-semibold text-zinc-500">Emoji</label><input type="text" value={importCsvFlag} onChange={(e) => setImportCsvFlag(e.target.value)} className="w-full mt-1 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500 text-center" /></div><div><label className="text-xs font-semibold text-zinc-500">Idioma</label><select value={importCsvLang} onChange={(e) => setImportCsvLang(e.target.value)} className="w-full mt-1 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"><option value="fr">Francês (fr)</option><option value="en">Inglês (en)</option><option value="es">Espanhol (es)</option><option value="de">Alemão (de)</option><option value="it">Italiano (it)</option></select></div></div></div>}<div onClick={() => fileInputRef.current?.click()} className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/40 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"><Upload className="w-8 h-8 text-blue-500" /><div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Clique para selecionar o arquivo ({importType.toUpperCase()})</div><div className="text-[10px] text-zinc-400">{importType === 'json' ? 'Formatos aceitos: Baralho .json ou Backup .json' : 'Formatos aceitos: Planilha .csv ou .txt separada por vírgula ou tabulação'}</div></div><input ref={fileInputRef} type="file" accept={importType === 'json' ? '.json' : '.csv,.txt'} onChange={handleFileUpload} className="hidden" />{importStatus && <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${importStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'}`}>{importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}<span>{importStatus.message}</span></div>}</div></div>}

      {showNewDeckModal && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"><h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Criar Novo Deck</h3><form onSubmit={handleCreateDeckSubmit} className="flex flex-col gap-3"><div><label className="text-xs font-semibold text-zinc-500">Nome do Deck</label><input type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Ex: Italiano para Viagem" className="w-full mt-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500" required /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-semibold text-zinc-500">Bandeira Emoji</label><input type="text" value={newDeckFlag} onChange={(e) => setNewDeckFlag(e.target.value)} className="w-full mt-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500 text-center" required /></div><div><label className="text-xs font-semibold text-zinc-500">Código Idioma</label><select value={newDeckLang} onChange={(e) => setNewDeckLang(e.target.value)} className="w-full mt-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-blue-500"><option value="en">Inglês (en)</option><option value="fr">Francês (fr)</option><option value="zh">Mandarim (zh)</option><option value="ja">Japonês (ja)</option><option value="es">Espanhol (es)</option><option value="de">Alemão (de)</option><option value="it">Italiano (it)</option></select></div></div><div className="flex gap-2 mt-2"><button type="button" onClick={() => setShowNewDeckModal(false)} className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs cursor-pointer">Criar Deck</button></div></form></div></div>}
    </div>
  );
};

import React, { useRef } from 'react';
import { UserSettings } from '../types';
import { exportAppDataJSON, importAppDataJSON, importDeckJSON, importDeckCSV, resetAppData } from '../lib/storage';
import { Sparkles, Download, Upload, RotateCcw, Palette, Volume2, Database, MoonStar } from 'lucide-react';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRefreshAll: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onUpdateSettings, onRefreshAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportAppDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki-deep-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const deckTitle = file.name.replace(/\.[^/.]+$/, '');
        const res = importDeckCSV(deckTitle, content);
        if (res.success && res.importedCardsCount > 0) {
          alert(`Baralho "${res.deckName}" importado/atualizado com ${res.importedCardsCount} palavras!`);
          onRefreshAll();
        } else alert('Erro ao importar arquivo CSV.');
      } else {
        const deckRes = importDeckJSON(content);
        if (deckRes.success) {
          alert(`Importação concluída com sucesso! (${deckRes.importedCardsCount} palavras)`);
          onRefreshAll();
        } else {
          const success = importAppDataJSON(content);
          if (success) { alert('Dados de backup importados com sucesso!'); onRefreshAll(); }
          else alert('Erro ao importar arquivo. Verifique o formato do JSON ou CSV.');
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Tem certeza de que deseja restaurar os dados iniciais? Seu progresso atual será substituído.')) {
      resetAppData(); onRefreshAll(); alert('Dados restaurados para o estado padrão com sucesso.');
    }
  };

  const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.14em] text-[#a77f8b] dark:text-[#d4acb8]">{icon}{children}</div>
  );

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-7 pb-32 flex flex-col gap-5">
      <header className="rounded-[30px] ankiu-surface px-5 py-5 relative overflow-hidden">
        <span className="absolute right-5 top-4 text-[#f19caf] ankiu-sparkle">✦</span>
        <SectionTitle icon={<MoonStar className="w-3.5 h-3.5" />}>Seu cantinho</SectionTitle>
        <h1 className="mt-1 text-3xl font-black text-[#3d2d34] dark:text-[#fff7f3] tracking-[-.04em]">Configurações</h1>
        <p className="mt-1 text-sm text-[#957b84] dark:text-[#c9b3bb]">Deixe o ANKIU com a sua cara ♡</p>
      </header>

      <section className="rounded-[30px] ankiu-surface p-5 flex flex-col gap-4">
        <SectionTitle icon={<Palette className="w-4 h-4 text-[#e46d85]" />}>Aparência e tema</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => {
            const labels = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };
            const isActive = settings.theme === t;
            return <button key={t} onClick={() => onUpdateSettings({ ...settings, theme: t })} className={`py-3 px-3 rounded-[20px] border text-xs font-black transition-all ${isActive ? 'bg-gradient-to-br from-[#f36a85] to-[#ff9b87] text-white border-transparent shadow-[0_8px_20px_rgba(236,91,119,.18)]' : 'bg-[#fff7f3] dark:bg-[#403038] text-[#80646f] dark:text-[#d9c1c9] border-[#efd7d1] dark:border-[#5b444e]'}`}>{labels[t]}</button>;
          })}
        </div>
      </section>

      <section className="rounded-[30px] ankiu-surface p-5 flex flex-col gap-4">
        <SectionTitle icon={<Volume2 className="w-4 h-4 text-[#d99063]" />}>Áudio & IA</SectionTitle>
        <div className="flex items-center justify-between gap-4">
          <div><div className="text-sm font-black text-[#4b373f] dark:text-[#fff7f3]">Velocidade do áudio</div><div className="text-xs text-[#9c818a] dark:text-[#c5afb7]">Escolha o ritmo da pronúncia</div></div>
          <div className="flex gap-1.5">
            {[1, .75].map((speed) => <button key={speed} onClick={() => onUpdateSettings({ ...settings, audioSpeed: speed })} className={`px-3 py-2 rounded-2xl border text-xs font-black ${settings.audioSpeed === speed ? 'bg-[#fff0f3] text-[#e25d78] border-[#ffcbd6]' : 'bg-[#fffaf7] dark:bg-[#403038] text-[#8b7079] dark:text-[#ccb5bd] border-[#efd7d1] dark:border-[#5b444e]'}`}>{speed === 1 ? '1.0x' : '0.75x'}</button>)}
          </div>
        </div>
        <div className="h-px bg-[#f4dfd9] dark:bg-[#5a414a]" />
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div><div className="text-sm font-black text-[#4b373f] dark:text-[#fff7f3] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#8a77cb]" /> IA Assistente (Gemini)</div><div className="text-xs text-[#9c818a] dark:text-[#c5afb7]">Gera exemplos e conexões automaticamente</div></div>
          <div className={`relative w-12 h-7 rounded-full transition-colors ${settings.enableAi ? 'bg-[#f17088]' : 'bg-[#ead8d5] dark:bg-[#5a464e]'}`}>
            <input type="checkbox" checked={settings.enableAi} onChange={(e) => onUpdateSettings({ ...settings, enableAi: e.target.checked })} className="sr-only" />
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.enableAi ? 'left-6' : 'left-1'}`} />
          </div>
        </label>
      </section>

      <section className="rounded-[30px] ankiu-surface p-5 flex flex-col gap-4">
        <SectionTitle icon={<Database className="w-4 h-4 text-[#63aa86]" />}>Backup & dados</SectionTitle>
        <div className="flex flex-col gap-2.5">
          <button onClick={handleExport} className="p-4 rounded-[22px] bg-[#fff5e8] dark:bg-[#42352f] border border-[#ffe0b8] dark:border-[#654d40] text-[#5b4338] dark:text-[#ffe7d7] text-xs font-black flex items-center justify-between transition-transform hover:-translate-y-0.5"><span className="flex items-center gap-2"><Download className="w-4 h-4 text-[#d78b57]" />Exportar Backup</span><span className="text-[10px] text-[#b38974] font-bold">JSON</span></button>
          <button onClick={handleImportClick} className="p-4 rounded-[22px] bg-[#f3efff] dark:bg-[#403650] border border-[#ddd3ff] dark:border-[#5d4c73] text-[#514369] dark:text-[#e5dcff] text-xs font-black flex items-center justify-between transition-transform hover:-translate-y-0.5"><span className="flex items-center gap-2"><Upload className="w-4 h-4 text-[#8b75c8]" />Importar Baralho / Backup</span><span className="text-[10px] text-[#9c8bbc] font-bold">JSON / CSV</span></button>
          <input ref={fileInputRef} type="file" accept=".json,.csv,.txt" onChange={handleFileChange} className="hidden" />
          <button onClick={handleReset} className="p-4 rounded-[22px] bg-[#fff0f0] dark:bg-[#493033] border border-[#ffd3d3] dark:border-[#6d4146] text-[#b84f5b] dark:text-[#ffafb7] text-xs font-black flex items-center justify-between transition-transform hover:-translate-y-0.5"><span className="flex items-center gap-2"><RotateCcw className="w-4 h-4" />Restaurar dados iniciais</span><span className="text-[10px] opacity-70">RESET</span></button>
        </div>
      </section>
    </div>
  );
};

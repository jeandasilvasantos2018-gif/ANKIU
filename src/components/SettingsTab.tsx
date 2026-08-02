import React, { useRef } from 'react';
import { UserSettings } from '../types';
import {
  exportAppDataJSON,
  importAppDataJSON,
  importDeckJSON,
  importDeckCSV,
  resetAppData,
} from '../lib/storage';
import { Sun, Moon, Volume2, Sparkles, Download, Upload, RotateCcw, ShieldCheck, FileText } from 'lucide-react';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRefreshAll: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onRefreshAll,
}) => {
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
        } else {
          alert('Erro ao importar arquivo CSV.');
        }
      } else {
        const deckRes = importDeckJSON(content);
        if (deckRes.success) {
          alert(`Importação concluída com sucesso! (${deckRes.importedCardsCount} palavras)`);
          onRefreshAll();
        } else {
          const success = importAppDataJSON(content);
          if (success) {
            alert('Dados de backup importados com sucesso!');
            onRefreshAll();
          } else {
            alert('Erro ao importar arquivo. Verifique o formato do JSON ou CSV.');
          }
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Tem certeza de que deseja restaurar os dados iniciais? Seu progresso atual será substituído.')) {
      resetAppData();
      onRefreshAll();
      alert('Dados restaurados para o estado padrão com sucesso.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
        Configurações
      </h1>

      {/* Theme Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Aparência e Tema
        </span>

        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => {
            const isActive = settings.theme === t;
            const labels = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };
            return (
              <button
                key={t}
                onClick={() => onUpdateSettings({ ...settings, theme: t })}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border-transparent shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio & AI Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Áudio & Inteligência Artificial
        </span>

        {/* Audio Speed */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Velocidade Padrão do Áudio
            </span>
            <span className="text-xs text-zinc-400">
              Velocidade de pronúncia da voz
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onUpdateSettings({ ...settings, audioSpeed: 1.0 })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                settings.audioSpeed === 1.0
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              1.0x
            </button>

            <button
              onClick={() => onUpdateSettings({ ...settings, audioSpeed: 0.75 })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                settings.audioSpeed === 0.75
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              0.75x Lento
            </button>
          </div>
        </div>

        {/* Enable AI Toggle */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
              IA Assistente (Gemini)
            </span>
            <span className="text-xs text-zinc-400">
              Gerar exemplos e expansões semânticas automáticas
            </span>
          </div>

          <input
            type="checkbox"
            checked={settings.enableAi}
            onChange={(e) => onUpdateSettings({ ...settings, enableAi: e.target.checked })}
            className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Backup, Import & Export */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Backup & Dados
        </span>

        <div className="flex flex-col gap-2">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              <span>Exportar Backup (JSON)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-normal">Baixar arquivo</span>
          </button>

          {/* Import JSON / CSV */}
          <button
            onClick={handleImportClick}
            className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>Importar Baralho / Backup (JSON / CSV)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-normal">Carregar arquivo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Restaurar Dados Iniciais</span>
            </div>
            <span className="text-[10px] text-rose-400 font-normal">Resetar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

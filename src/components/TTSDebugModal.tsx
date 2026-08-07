import React, { useState } from 'react';
import {
  useTtsLogs,
  clearTtsLogs,
  playAudio,
  playButtonSound,
  useVoicesReady,
  TTSLogEntry,
} from '../lib/audio';
import {
  Bug,
  X,
  Copy,
  Trash2,
  Volume2,
  Check,
  Info,
  AlertTriangle,
  XCircle,
  Play,
  Cpu,
} from 'lucide-react';

export const TTSDebugModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const logs = useTtsLogs();
  const voicesReady = useVoicesReady();

  const isSpeechSynthesisAvailable =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  let nativeVoicesCount = 0;
  if (isSpeechSynthesisAvailable) {
    try {
      nativeVoicesCount = window.speechSynthesis.getVoices().length;
    } catch (e) {}
  }

  const handleCopy = () => {
    if (logs.length === 0) return;
    const textToCopy = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy logs:', err);
      });
  };

  const testFrench = () => {
    playAudio('Bonjour tout le monde! C’est un test de prononciation.', 'fr');
  };

  const testEnglish = () => {
    playAudio('Hello everyone! This is a speech pronunciation test.', 'en');
  };

  const testButtonEffect = () => {
    playButtonSound();
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900/90 text-amber-400 hover:bg-slate-900 border border-amber-500/30 rounded-full shadow-lg backdrop-blur text-xs font-mono transition-transform hover:scale-105 active:scale-95"
        title="Abrir Painel de Debug do TTS"
      >
        <Bug className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="font-semibold">Debug TTS</span>
        {logs.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 font-bold rounded-full">
            {logs.length}
          </span>
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100 font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Painel de Debug TTS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Diagnóstico do motor de áudio e logs em tempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* System Status Banner */}
            <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">SpeechSynthesis:</span>
                  <span
                    className={
                      isSpeechSynthesisAvailable
                        ? 'text-emerald-400 font-semibold'
                        : 'text-rose-400 font-semibold'
                    }
                  >
                    {isSpeechSynthesisAvailable ? 'Disponível' : 'Ausente'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Vozes do Sistema:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {nativeVoicesCount}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Status Vozes:</span>
                  <span
                    className={
                      voicesReady
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    {voicesReady ? 'Pronto' : 'Carregando...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Test Actions */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 font-medium mr-1">
                Testes rápidos:
              </span>
              <button
                onClick={testFrench}
                className="px-2.5 py-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Français ("Bonjour")</span>
              </button>
              <button
                onClick={testEnglish}
                className="px-2.5 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>English ("Hello")</span>
              </button>
              <button
                onClick={testButtonEffect}
                className="px-2.5 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Som do Botão</span>
              </button>
            </div>

            {/* Logs Viewer */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950/90 font-mono text-xs space-y-1.5 min-h-[220px]">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <Bug className="w-8 h-8 mb-2 opacity-40" />
                  <p>Nenhum log gravado ainda.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Clique em um botão de áudio na aplicação ou nos testes rápidos acima.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg border text-left flex items-start gap-2 break-all ${
                      log.level === 'error'
                        ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                        : log.level === 'warn'
                        ? 'bg-amber-950/40 border-amber-900/50 text-amber-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0 pt-0.5">
                      {log.timestamp}
                    </span>
                    <span className="shrink-0 pt-0.5">
                      {log.level === 'error' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : log.level === 'warn' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </span>
                    <span className="flex-1 leading-relaxed">{log.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                {logs.length} entrada(s) de log
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearTtsLogs}
                  disabled={logs.length === 0}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar logs</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={logs.length === 0}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-950" />
                      <span>Copiar logs</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

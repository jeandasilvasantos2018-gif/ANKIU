import React, { useState } from 'react';
import { useTtsLogs, clearTtsLogs, playAudio, playVercelTts, playButtonSound, useVoicesReady } from '../lib/audio';
import { Bug, X, Copy, Trash2, Volume2, Check, Info, AlertTriangle, XCircle, Play, Cpu, Server } from 'lucide-react';

export const TTSDebugModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const logs = useTtsLogs();
  const voicesReady = useVoicesReady();
  const isSpeechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  let nativeVoicesCount = 0;
  if (isSpeechSynthesisAvailable) { try { nativeVoicesCount = window.speechSynthesis.getVoices().length; } catch {} }

  const handleCopy = () => {
    if (logs.length === 0) return;
    const textToCopy = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch((err) => console.error('Failed to copy logs:', err));
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-[#fffdfb]/92 dark:bg-[#382b31]/94 text-[#a27e89] dark:text-[#d4bdc5] border border-[#efd7d1] dark:border-[#5b444e] rounded-full shadow-[0_12px_30px_rgba(116,65,80,.14)] backdrop-blur text-xs font-black transition-transform hover:scale-105 active:scale-95" title="Abrir Painel de Debug do TTS"><Bug className="w-4 h-4 text-[#e46c85]" /><span>Debug TTS</span>{logs.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-[#f36a85] text-white font-black rounded-full">{logs.length}</span>}</button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3b2931]/55 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#fffdfb] dark:bg-[#382b31] border border-[#efd7d1] dark:border-[#5b444e] rounded-[32px] shadow-[0_28px_90px_rgba(69,39,49,.28)] overflow-hidden flex flex-col max-h-[85vh] text-[#49363f] dark:text-[#fff7f3]">
            <div className="p-4 border-b border-[#efd7d1] dark:border-[#5b444e] flex items-center justify-between">
              <div className="flex items-center gap-2.5"><div className="p-2 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] text-[#e25d78]"><Bug className="w-5 h-5" /></div><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#aa8490]">Diagnóstico</div><h3 className="font-black text-base">Painel de Debug TTS</h3></div></div>
              <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-2xl bg-[#fff0f3] dark:bg-[#493039] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-4 py-3 bg-[#fff8f3] dark:bg-[#30242a] border-b border-[#efd7d1] dark:border-[#5b444e] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4"><div className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-[#a7838e]" /><span className="text-[#957b84]">SpeechSynthesis:</span><span className={isSpeechSynthesisAvailable ? 'text-[#58a47f] font-black' : 'text-[#c45b64] font-black'}>{isSpeechSynthesisAvailable ? 'Disponível' : 'Ausente'}</span></div><div className="flex items-center gap-1.5"><span className="text-[#957b84]">Vozes:</span><span className="font-mono text-[#d68a55] font-black">{nativeVoicesCount}</span></div><div className="flex items-center gap-1.5"><span className="text-[#957b84]">Status:</span><span className={voicesReady ? 'text-[#58a47f] font-black' : 'text-[#d68a55] font-black'}>{voicesReady ? 'Pronto' : 'Carregando...'}</span></div></div>
            </div>

            <div className="p-3 border-b border-[#efd7d1] dark:border-[#5b444e] flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-[#a48790] font-black uppercase tracking-[.1em] mr-1">Testes rápidos</span>
              <button onClick={() => playAudio('Bonjour tout le monde! C’est un test de prononciation.', 'fr')} className="px-2.5 py-1.5 bg-[#fff0f3] dark:bg-[#493039] text-[#e25d78] border border-[#ffd3dc] dark:border-[#693c49] rounded-xl text-xs font-black flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Français</button>
              <button onClick={() => playVercelTts('Bonjour, ceci est un test de l’API Vercel TTS.', 'fr')} className="px-2.5 py-1.5 bg-[#eef9f3] dark:bg-[#2f4138] text-[#58a47f] border border-[#ccebdc] dark:border-[#436052] rounded-xl text-xs font-black flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> Vercel TTS</button>
              <button onClick={() => playAudio('Hello everyone! This is a speech pronunciation test.', 'en')} className="px-2.5 py-1.5 bg-[#f3efff] dark:bg-[#403650] text-[#8874c9] border border-[#ddd3ff] dark:border-[#5d4c73] rounded-xl text-xs font-black flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> English</button>
              <button onClick={() => playButtonSound()} className="px-2.5 py-1.5 bg-[#fff5e8] dark:bg-[#42352f] text-[#d68a55] border border-[#ffe0b8] dark:border-[#654d40] rounded-xl text-xs font-black flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Botão</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-[#2b2226] font-mono text-xs space-y-1.5 min-h-[220px]">
              {logs.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-[#a88893] py-12"><Bug className="w-8 h-8 mb-2 opacity-40" /><p>Nenhum log gravado ainda.</p><p className="text-[11px] mt-1">Teste um botão de áudio acima.</p></div> : logs.map((log) => <div key={log.id} className={`p-2 rounded-xl border text-left flex items-start gap-2 break-all ${log.level === 'error' ? 'bg-[#4a2930] border-[#6f3944] text-[#ffb0bb]' : log.level === 'warn' ? 'bg-[#493a2c] border-[#69513b] text-[#f2ca83]' : 'bg-[#382c32] border-[#4e3b44] text-[#e7d4db]'}`}><span className="text-[10px] text-[#9b7d87] font-black shrink-0 pt-0.5">{log.timestamp}</span><span className="shrink-0 pt-0.5">{log.level === 'error' ? <XCircle className="w-3.5 h-3.5 text-[#ff8f9d]" /> : log.level === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 text-[#efb85f]" /> : <Info className="w-3.5 h-3.5 text-[#b8a9ee]" />}</span><span className="flex-1 leading-relaxed">{log.message}</span></div>)}
            </div>

            <div className="p-3 bg-[#fff8f3] dark:bg-[#30242a] border-t border-[#efd7d1] dark:border-[#5b444e] flex items-center justify-between"><div className="text-[10px] text-[#a48790] font-mono">{logs.length} entrada(s)</div><div className="flex items-center gap-2"><button onClick={clearTtsLogs} disabled={logs.length === 0} className="px-3 py-1.5 bg-[#fff5e8] dark:bg-[#42352f] text-[#c17b50] disabled:opacity-40 rounded-xl text-xs font-black flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Limpar</button><button onClick={handleCopy} disabled={logs.length === 0} className="px-3.5 py-1.5 bg-gradient-to-r from-[#f36a85] to-[#ff9b87] text-white disabled:opacity-40 font-black rounded-xl text-xs flex items-center gap-1.5">{copied ? <><Check className="w-3.5 h-3.5" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar logs</>}</button></div></div>
          </div>
        </div>
      )}
    </>
  );
};

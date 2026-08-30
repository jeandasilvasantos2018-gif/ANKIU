import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PodcastEpisode, PodcastLevel, PodcastProgress, PodcastStudyData } from '../types';
import { getPodcastProgressMap, markPodcastCompleted, savePodcastProgress } from '../lib/podcastProgress';
import { Search, Play, Pause, RotateCcw, RotateCw, CheckCircle2, Headphones, Clock3, Loader2, FileText, Languages, Brain, X } from 'lucide-react';

const levels: Array<'Tous' | PodcastLevel> = ['Tous', 'A1', 'A2', 'B1', 'B2', 'C1'];
const categories = ['Tous', 'Vie quotidienne', 'Voyage', 'Culture', 'Actualités', 'Histoires', 'Conversations', 'Travail', 'Études'];
const STUDY_CACHE_KEY = 'ankiu_podcast_study_v1';
const formatTime = (seconds = 0) => `${Math.floor(Math.max(0, seconds) / 60)}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0')}`;
const formatDuration = (seconds?: number) => !seconds ? '—' : seconds < 60 ? `${Math.round(seconds)} s` : `${Math.round(seconds / 60)} min`;
const readStudyCache = (): Record<string, PodcastStudyData> => { try { return JSON.parse(localStorage.getItem(STUDY_CACHE_KEY) || '{}'); } catch { return {}; } };

export const PodcastsTabV2: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);
  const [searchInput, setSearchInput] = useState('');
  const [term, setTerm] = useState('français');
  const [level, setLevel] = useState<'Tous' | PodcastLevel>('Tous');
  const [category, setCategory] = useState('Tous');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, PodcastProgress>>(() => getPodcastProgressMap());
  const [studyMap, setStudyMap] = useState<Record<string, PodcastStudyData>>(() => readStudyCache());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [studyEpisode, setStudyEpisode] = useState<PodcastEpisode | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(`/api/podcasts/search?q=${encodeURIComponent(term)}`)
      .then(async (r) => { const data = await r.json(); if (!r.ok || !data.success) throw new Error(data.error || 'Listen Notes indisponible.'); return data; })
      .then((data) => { if (!cancelled) setEpisodes(data.episodes || []); })
      .catch((e) => { if (!cancelled) { setError(e.message); setEpisodes([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [term]);

  const filtered = useMemo(() => episodes.filter((episode) => {
    const study = studyMap[episode.id];
    if (level !== 'Tous' && study?.level !== level) return false;
    if (category !== 'Tous' && study?.category !== category) return false;
    return true;
  }), [episodes, studyMap, level, category]);

  const startEpisode = (episode: PodcastEpisode) => {
    setActiveEpisode(episode);
    const saved = progressMap[episode.id];
    const resumeAt = saved && !saved.completed && saved.currentTime >= 5 ? saved.currentTime : 0;
    setCurrentTime(resumeAt); setDuration(saved?.duration || episode.duration || 0);
    setTimeout(() => {
      const audio = audioRef.current; if (!audio) return;
      audio.src = episode.audioUrl; audio.load();
      const resume = () => { audio.currentTime = Math.min(resumeAt, Math.max(0, (audio.duration || resumeAt) - .25)); audio.play().catch(() => setIsPlaying(false)); };
      audio.readyState >= 1 ? resume() : audio.addEventListener('loadedmetadata', resume, { once: true });
    }, 0);
  };

  const saveProgressTick = () => {
    const audio = audioRef.current; if (!audio || !activeEpisode) return;
    setCurrentTime(audio.currentTime); if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    if (Math.abs(audio.currentTime - lastSavedRef.current) >= 5) {
      lastSavedRef.current = audio.currentTime;
      const previous = progressMap[activeEpisode.id];
      const saved = savePodcastProgress(activeEpisode.id, { currentTime: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : activeEpisode.duration || 0, completed: previous?.completed || false });
      setProgressMap((prev) => ({ ...prev, [activeEpisode.id]: saved }));
    }
  };

  const finishEpisode = () => {
    if (!activeEpisode) return;
    const finalDuration = audioRef.current?.duration || duration || activeEpisode.duration || 0;
    const saved = markPodcastCompleted(activeEpisode.id, finalDuration);
    setProgressMap((prev) => ({ ...prev, [activeEpisode.id]: saved })); setCurrentTime(finalDuration); setIsPlaying(false);
  };

  const prepareStudy = async (episode: PodcastEpisode) => {
    if (studyMap[episode.id]) { setStudyEpisode(episode); return; }
    setProcessingId(episode.id); setError(null);
    try {
      const response = await fetch('/api/podcasts/study', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episode }) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.detail || data.error || 'Transcription impossible.');
      const next = { ...studyMap, [episode.id]: data.study }; setStudyMap(next); localStorage.setItem(STUDY_CACHE_KEY, JSON.stringify(next)); setStudyEpisode(episode);
    } catch (e: any) { setError(e.message || 'Transcription impossible.'); }
    finally { setProcessingId(null); }
  };

  return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-40 flex flex-col gap-6">
    <header className="rounded-[32px] p-5 sm:p-7 bg-gradient-to-br from-[#f3efff] via-[#fff7fb] to-[#fff0e9] border border-[#ded4ff] dark:border-[#5d4c73]">
      <div className="flex items-start gap-4"><div className="w-14 h-14 rounded-[22px] bg-[#8d79d6] text-white flex items-center justify-center"><Headphones className="w-7 h-7" /></div><div><h1 className="text-3xl sm:text-4xl font-black text-[#43333b] dark:text-white">Podcasts</h1><p className="mt-1 text-sm font-bold text-[#796689]">Français réel, transcription et étude guidée.</p><p className="mt-2 text-xs sm:text-sm text-[#927e88]">Listen Notes → Groq Whisper → Gemini.</p></div></div>
    </header>

    <form onSubmit={(e) => { e.preventDefault(); setTerm(searchInput.trim() || 'français'); }} className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a9919b]" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher un podcast ou un sujet..." className="w-full pl-11 pr-28 py-3.5 rounded-[20px] border border-[#ecd8d2] bg-[#fffdfb] text-sm" /><button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl bg-[#8d79d6] text-white text-xs font-black">Rechercher</button></form>

    <div className="flex gap-2 overflow-x-auto no-scrollbar">{levels.map((item) => <button key={item} onClick={() => setLevel(item)} className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-black border ${level === item ? 'bg-[#8d79d6] text-white' : 'bg-white text-[#80646f] border-[#eed5cf]'}`}>{item}</button>)}</div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border ${category === item ? 'bg-[#fff0f3] text-[#d95d78] border-[#ffd1da]' : 'bg-white text-[#9a818a] border-[#eedbd5]'}`}>{item}</button>)}</div>
    {(level !== 'Tous' || category !== 'Tous') && <p className="text-[10px] text-[#9a818a]">Les filtres pédagogiques s'appliquent après l'analyse Gemini d'un épisode.</p>}

    {loading && <div className="py-20 flex flex-col items-center gap-3 text-[#8d79d6]"><Loader2 className="w-7 h-7 animate-spin" /><span className="text-sm font-bold">Recherche dans Listen Notes...</span></div>}
    {error && <div className="p-4 rounded-2xl bg-[#fff0f0] text-[#b95461] border border-[#ffd2d2] text-xs font-bold">{error}</div>}

    {!loading && <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((episode) => {
      const progress = progressMap[episode.id]; const study = studyMap[episode.id]; const total = progress?.duration || episode.duration || 0;
      const percent = progress?.completed ? 100 : total ? Math.min(100, Math.round(((progress?.currentTime || 0) / total) * 100)) : 0; const started = !progress?.completed && (progress?.currentTime || 0) >= 5;
      return <article key={episode.id} className="rounded-[28px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#ecd8d2] overflow-hidden shadow-[0_12px_35px_rgba(112,66,80,.09)] flex flex-col">
        <div className="h-44 bg-gradient-to-br from-[#b8a9ee] to-[#f4aec0] relative overflow-hidden">{episode.imageUrl ? <img src={episode.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Headphones className="w-10 h-10 text-white absolute left-5 top-5" />}<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" /><span className="absolute bottom-4 left-4 right-4 text-white text-xs font-black line-clamp-1">{episode.podcastName}</span></div>
        <div className="p-5 flex flex-col gap-3 flex-1"><div className="flex items-center gap-2 text-[10px] font-black">{study?.level && <span className="px-2 py-1 rounded-full bg-[#f3efff] text-[#7e69c5]">{study.level}</span>}<span className="flex items-center gap-1 text-[#a08690]"><Clock3 className="w-3 h-3" />{formatDuration(total || episode.duration)}</span>{study?.category && <span className="text-[#519878] truncate">{study.category}</span>}</div><div><h2 className="text-xl font-black text-[#44323a] dark:text-white leading-tight line-clamp-2">{episode.title}</h2><p className="mt-1 text-[11px] font-bold text-[#b18491]">{episode.podcastName}</p></div><p className="text-sm text-[#80666f] dark:text-[#d3bec5] line-clamp-3">{episode.description || 'Épisode en français.'}</p>
        {(started || progress?.completed) && <div><div className="flex justify-between text-[10px] font-bold text-[#9b818a] mb-1"><span>{progress?.completed ? 'Écouté' : 'Votre progression'}</span><span>{percent}%</span></div><div className="h-2 rounded-full bg-[#f2ddd7] overflow-hidden"><div className={`h-full ${progress?.completed ? 'bg-[#72bd99]' : 'bg-[#8d79d6]'}`} style={{ width: `${percent}%` }} /></div></div>}
        <div className="grid grid-cols-2 gap-2 mt-auto"><button onClick={() => startEpisode(episode)} className={`min-h-12 rounded-[20px] font-black text-xs flex items-center justify-center gap-2 ${progress?.completed ? 'bg-[#eef9f3] text-[#519878]' : 'bg-[#8d79d6] text-white'}`}>{progress?.completed ? <><CheckCircle2 className="w-4 h-4" />Réécouter</> : started ? <><Play className="w-4 h-4" />Continuer</> : <><Play className="w-4 h-4" />Écouter</>}</button><button onClick={() => prepareStudy(episode)} disabled={processingId === episode.id} className="min-h-12 rounded-[20px] bg-[#fff5df] text-[#ad7934] border border-[#f5d89d] font-black text-xs flex items-center justify-center gap-2">{processingId === episode.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}{study ? 'Transcription' : 'Étudier'}</button></div></div>
      </article>;
    })}</section>}

    <audio ref={audioRef} preload="metadata" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={saveProgressTick} onEnded={finishEpisode} onLoadedMetadata={() => { const d = audioRef.current?.duration || 0; if (Number.isFinite(d)) setDuration(d); }} />
    {activeEpisode && <div className="fixed left-3 right-3 bottom-[92px] z-30 max-w-3xl mx-auto rounded-[28px] bg-[#fffdfb]/96 border border-[#ddcff9] backdrop-blur-xl shadow-xl p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="text-[10px] font-black text-[#927fae]">EN ÉCOUTE</div><div className="font-black text-sm text-[#44323a] truncate">{activeEpisode.title}</div></div><button onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause(); }} className="w-12 h-12 rounded-full bg-[#8d79d6] text-white flex items-center justify-center">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button></div><div className="mt-3 flex items-center gap-2"><span className="text-[10px] w-9">{formatTime(currentTime)}</span><input type="range" min={0} max={duration || 1} value={Math.min(currentTime, duration || 1)} onChange={(e) => { const v = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = v; setCurrentTime(v); }} className="flex-1 accent-[#8d79d6]" /><span className="text-[10px] w-9 text-right">{formatTime(duration)}</span></div><div className="mt-2 flex justify-center gap-2"><button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }} className="px-3 py-1.5 rounded-full bg-[#f3efff] text-[#7e69c5] text-xs font-black flex items-center gap-1"><RotateCcw className="w-4 h-4" />10s</button><button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + 10); }} className="px-3 py-1.5 rounded-full bg-[#f3efff] text-[#7e69c5] text-xs font-black flex items-center gap-1">10s<RotateCw className="w-4 h-4" /></button><button onClick={() => prepareStudy(activeEpisode)} className="px-3 py-1.5 rounded-full bg-[#fff5df] text-[#ad7934] text-xs font-black flex items-center gap-1"><FileText className="w-4 h-4" />Transcription</button></div></div>}

    {studyEpisode && studyMap[studyEpisode.id] && <StudyModal episode={studyEpisode} study={studyMap[studyEpisode.id]} onClose={() => setStudyEpisode(null)} />}
  </div>;
};

const StudyModal: React.FC<{ episode: PodcastEpisode; study: PodcastStudyData; onClose: () => void }> = ({ episode, study, onClose }) => {
  const [view, setView] = useState<'transcript' | 'translation' | 'study'>('transcript');
  return <div className="fixed inset-0 z-[60] bg-[#2d2026]/45 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"><div className="max-w-4xl mx-auto bg-[#fffdfb] dark:bg-[#382b31] rounded-[32px] overflow-hidden"><div className="p-5 flex justify-between border-b border-[#efe1dc]"><div><span className="text-[10px] font-black text-[#8874c9]">{study.level} · {study.category}</span><h2 className="text-2xl font-black text-[#44323a] dark:text-white">{episode.title}</h2><p className="text-xs text-[#9a818a]">Groq Whisper + Gemini</p></div><button onClick={onClose} className="w-11 h-11 rounded-2xl bg-[#fff0f3] text-[#d95d78] flex items-center justify-center"><X className="w-5 h-5" /></button></div><div className="p-4 flex gap-2 overflow-x-auto">{([['transcript','Transcription',FileText],['translation','English translation',Languages],['study','Study notes',Brain]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setView(id)} className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1 ${view === id ? 'bg-[#8d79d6] text-white' : 'bg-[#f3efff] text-[#7e69c5]'}`}><Icon className="w-4 h-4" />{label}</button>)}</div><div className="p-5 sm:p-7 pt-2 max-h-[70vh] overflow-y-auto">{view === 'transcript' && <div className="space-y-3">{study.segments.length ? study.segments.map((s,i) => <div key={i} className="grid grid-cols-[52px_1fr] gap-3"><span className="text-[10px] font-black text-[#8d79d6]">{formatTime(s.start)}</span><p className="text-sm leading-7 text-[#57424b] dark:text-[#ead8df]">{s.text}</p></div>) : <p className="leading-8 whitespace-pre-wrap">{study.transcript}</p>}</div>}{view === 'translation' && <p className="leading-8 whitespace-pre-wrap text-[#57424b] dark:text-[#ead8df]">{study.translationEn}</p>}{view === 'study' && <div className="grid gap-5"><div className="p-4 rounded-2xl bg-[#f3efff]"><strong className="text-[#7e69c5]">Listening objective</strong><p className="text-sm mt-1">{study.objective}</p></div><p className="text-sm leading-7">{study.summaryEn}</p><div className="flex flex-wrap gap-2">{study.vocabulary.map((w) => <span key={w} className="px-3 py-1 rounded-full bg-[#eef9f3] text-[#519878] text-xs font-bold">{w}</span>)}</div><div className="grid sm:grid-cols-2 gap-2">{study.keyExpressions.map((x,i) => <div key={i} className="p-3 rounded-2xl bg-[#fff5e8]"><strong>{x.french}</strong><p className="text-xs mt-1">{x.english}</p></div>)}</div></div>}</div></div></div>;
};

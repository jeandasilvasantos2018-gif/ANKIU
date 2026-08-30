import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PodcastEpisode, PodcastLevel, PodcastProgress, PodcastStudyData } from '../types';
import { getPodcastProgressMap, markPodcastCompleted, savePodcastProgress } from '../lib/podcastProgress';
import { Search, Play, Pause, RotateCcw, RotateCw, CheckCircle2, Headphones, Clock3, Sparkles, Loader2, FileText, Languages, GraduationCap, X } from 'lucide-react';

const levels: Array<'Tous' | PodcastLevel> = ['Tous', 'A1', 'A2', 'B1', 'B2', 'C1'];
const categories = ['Tous', 'Vie quotidienne', 'Voyage', 'Culture', 'Actualités', 'Histoires', 'Conversations', 'Travail', 'Études'];
const categorySearchTerms: Record<string, string> = {
  Tous: 'français facile',
  'Vie quotidienne': 'vie quotidienne français',
  Voyage: 'voyage français',
  Culture: 'culture française',
  'Actualités': 'actualités France français',
  Histoires: 'histoires français',
  Conversations: 'conversation français',
  Travail: 'travail français',
  'Études': 'études français',
};
const STUDY_CACHE_KEY = 'ankiu_podcast_study_v1';

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};
const formatDuration = (seconds?: number) => !seconds || !Number.isFinite(seconds) ? '—' : seconds < 60 ? `${Math.round(seconds)} s` : `${Math.round(seconds / 60)} min`;
const readStudyCache = (): Record<string, PodcastStudyData> => {
  try { return JSON.parse(localStorage.getItem(STUDY_CACHE_KEY) || '{}'); } catch { return {}; }
};

export const PodcastsTab: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);
  const [query, setQuery] = useState('français facile');
  const [level, setLevel] = useState<'Tous' | PodcastLevel>('Tous');
  const [category, setCategory] = useState('Tous');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, PodcastProgress>>(() => getPodcastProgressMap());
  const [studyMap, setStudyMap] = useState<Record<string, PodcastStudyData>>(() => readStudyCache());
  const [studyingId, setStudyingId] = useState<string | null>(null);
  const [studyEpisode, setStudyEpisode] = useState<PodcastEpisode | null>(null);
  const [studyTab, setStudyTab] = useState<'transcript' | 'translation' | 'notes'>('transcript');
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const searchPodcasts = async (term = query) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/podcasts/search?q=${encodeURIComponent(term.trim() || 'français')}&limit=18`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'Impossible de charger les podcasts.');
      setEpisodes(data.episodes || []);
    } catch (err: any) { setEpisodes([]); setError(err?.message || 'Impossible de charger les podcasts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { searchPodcasts('français facile'); }, []);

  const handleCategoryChange = (item: string) => {
    setCategory(item);
    searchPodcasts(categorySearchTerms[item] || item);
  };

  const filtered = useMemo(() => episodes.filter((episode) => {
    const study = studyMap[episode.id];
    const matchesLevel = level === 'Tous' || !study?.level || study.level === level;
    const matchesCategory = category === 'Tous' || !study?.category || study.category === category;
    return matchesLevel && matchesCategory;
  }), [episodes, level, category, studyMap]);

  const updateProgressState = (episodeId: string, next: PodcastProgress) => setProgressMap((prev) => ({ ...prev, [episodeId]: next }));

  const loadEpisode = (episode: PodcastEpisode) => {
    setAudioError(null); setActiveEpisode(episode);
    const saved = progressMap[episode.id];
    const resumeAt = saved && !saved.completed && saved.currentTime >= 5 ? saved.currentTime : 0;
    lastSavedRef.current = resumeAt;
    setCurrentTime(resumeAt); setDuration(saved?.duration || episode.duration || 0);
    setTimeout(() => {
      const audio = audioRef.current; if (!audio) return;
      audio.src = episode.audioUrl; audio.load();
      const resume = () => {
        const max = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - .25) : resumeAt;
        audio.currentTime = Math.min(resumeAt, max || resumeAt);
        audio.play().catch(() => setIsPlaying(false));
      };
      if (audio.readyState >= 1) resume(); else audio.addEventListener('loadedmetadata', resume, { once: true });
    }, 0);
  };

  const togglePlay = () => { const audio = audioRef.current; if (!audio || !activeEpisode) return; audio.paused ? audio.play().catch(() => setAudioError('Touchez à nouveau sur lecture.')) : audio.pause(); };
  const seekBy = (delta: number) => { const audio = audioRef.current; if (!audio) return; audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + delta)); };
  const handleTimeUpdate = () => {
    const audio = audioRef.current; if (!audio || !activeEpisode) return;
    setCurrentTime(audio.currentTime); if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    if (Math.abs(audio.currentTime - lastSavedRef.current) >= 5) {
      lastSavedRef.current = audio.currentTime;
      const saved = savePodcastProgress(activeEpisode.id, { currentTime: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : activeEpisode.duration || 0, completed: progressMap[activeEpisode.id]?.completed || false });
      updateProgressState(activeEpisode.id, saved);
    }
  };
  const handleEnded = () => { if (!activeEpisode) return; const d = audioRef.current?.duration || duration || activeEpisode.duration || 0; updateProgressState(activeEpisode.id, markPodcastCompleted(activeEpisode.id, d)); setCurrentTime(d); setIsPlaying(false); };

  const processEpisode = async (episode: PodcastEpisode) => {
    const cached = studyMap[episode.id];
    if (cached) { setStudyEpisode(episode); setStudyTab('transcript'); return; }
    setStudyingId(episode.id); setError(null);
    try {
      const response = await fetch('/api/podcasts/study', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'La transcription a échoué.');
      const study = data.study as PodcastStudyData;
      const next = { ...studyMap, [episode.id]: study };
      setStudyMap(next); localStorage.setItem(STUDY_CACHE_KEY, JSON.stringify(next));
      setStudyEpisode(episode); setStudyTab('transcript');
    } catch (err: any) { setError(err?.message || 'La transcription a échoué.'); }
    finally { setStudyingId(null); }
  };

  const activeStudy = studyEpisode ? studyMap[studyEpisode.id] : null;

  return <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-44 flex flex-col gap-6">
    <header className="rounded-[32px] p-5 sm:p-7 bg-gradient-to-br from-[#f3efff] via-[#fff7fb] to-[#fff0e9] dark:from-[#403650] dark:via-[#392c34] dark:to-[#42322f] border border-[#ded4ff] dark:border-[#5d4c73] relative overflow-hidden">
      <span className="absolute right-6 top-4 text-[#b39ee8] text-xl ankiu-sparkle">✦</span>
      <div className="flex items-start gap-4 relative z-10"><div className="w-14 h-14 rounded-[22px] bg-[#8d79d6] text-white flex items-center justify-center"><Headphones className="w-7 h-7" /></div><div><h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em] text-[#43333b] dark:text-[#fff8f5]">Podcasts</h1><p className="mt-1 text-sm font-bold text-[#796689] dark:text-[#d1c2e8]">Français réel, transcription et étude guidée.</p><p className="mt-2 text-xs text-[#927e88] dark:text-[#c8b5bd]">Taddy → Groq Whisper → Gemini.</p></div></div>
    </header>

    <section className="grid gap-3">
      <form onSubmit={(e) => { e.preventDefault(); setCategory('Tous'); searchPodcasts(); }} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a9919b]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un podcast ou un sujet..." className="w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-[#ecd8d2] bg-[#fffdfb] dark:bg-[#382b31] dark:border-[#5b444e] text-sm" /></div><button className="px-5 rounded-[20px] bg-[#8d79d6] text-white text-xs font-black">Rechercher</button></form>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">{levels.map((item) => <button key={item} onClick={() => setLevel(item)} className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-black border ${level === item ? 'bg-[#8d79d6] text-white border-transparent' : 'bg-[#fffdfb] text-[#80646f] border-[#eed5cf]'}`}>{item}</button>)}</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map((item) => <button key={item} onClick={() => handleCategoryChange(item)} disabled={loading} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border disabled:opacity-60 ${category === item ? 'bg-[#fff0f3] text-[#d95d78] border-[#ffd1da]' : 'bg-[#fffaf7] text-[#9a818a] border-[#eedbd5]'}`}>{item}</button>)}</div>
      {category !== 'Tous' && <p className="text-[10px] text-[#9a818a]">Le thème lance maintenant une nouvelle recherche de podcasts sur Taddy.</p>}
      {level !== 'Tous' && <p className="text-[10px] text-[#9a818a]">Le niveau CEFR filtre les épisodes déjà analysés par Gemini; les épisodes non analysés restent visibles jusqu’à leur classification.</p>}
    </section>

    {error && <div className="rounded-[20px] border border-[#ffcfd5] bg-[#fff0f2] px-4 py-3 text-xs font-bold text-[#c45b64]">{error}</div>}
    {loading && <div className="py-16 flex items-center justify-center gap-2 text-[#8874c9] font-bold"><Loader2 className="w-5 h-5 animate-spin" /> Recherche de podcasts français sur Taddy…</div>}

    {!loading && <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((episode) => {
        const progress = progressMap[episode.id]; const study = studyMap[episode.id]; const total = progress?.duration || episode.duration || 0;
        const percent = progress?.completed ? 100 : total > 0 ? Math.min(100, Math.round((progress?.currentTime || 0) / total * 100)) : 0;
        const started = !progress?.completed && (progress?.currentTime || 0) >= 5;
        return <article key={episode.id} className="rounded-[28px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#ecd8d2] dark:border-[#5b444e] overflow-hidden shadow-[0_12px_35px_rgba(112,66,80,.09)] flex flex-col">
          <div className="h-44 bg-gradient-to-br from-[#b8a9ee] to-[#f4aec0] relative overflow-hidden">{episode.imageUrl ? <img src={episode.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Headphones className="w-12 h-12 text-white" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" /><div className="absolute left-4 bottom-3 text-white text-xs font-black">{episode.podcastName}</div></div>
          <div className="p-5 flex flex-col gap-3 flex-1"><div className="flex items-center gap-2 text-[10px] font-black">{study?.level && <span className="px-2.5 py-1 rounded-full bg-[#f3efff] text-[#7e69c5]">{study.level}</span>}<span className="flex items-center gap-1 text-[#a08690]"><Clock3 className="w-3 h-3" /> {formatDuration(total || episode.duration)}</span>{study?.category && <span className="truncate text-[#b18491]">{study.category}</span>}</div><h2 className="text-xl font-black text-[#44323a] dark:text-[#fff8f5] leading-tight">{episode.title}</h2><p className="text-sm leading-relaxed text-[#80666f] dark:text-[#d3bec5] line-clamp-3">{episode.description}</p>
          {study && <div className="rounded-[18px] p-3 bg-[#fff8f3] dark:bg-[#30242a]"><span className="text-[9px] font-black uppercase text-[#9d8290]">Objectif</span><p className="text-xs text-[#6e5862] dark:text-[#d5c0c7]">{study.objective}</p></div>}
          {(started || progress?.completed) && <div><div className="flex justify-between text-[10px] font-bold text-[#9b818a] mb-1"><span>{progress?.completed ? 'Écouté' : 'Votre progression'}</span><span>{percent}%</span></div><div className="h-2 rounded-full bg-[#f2ddd7] overflow-hidden"><div className={`h-full ${progress?.completed ? 'bg-[#72bd99]' : 'bg-gradient-to-r from-[#8d79d6] to-[#ef9aae]'}`} style={{ width: `${percent}%` }} /></div></div>}
          <div className="grid grid-cols-2 gap-2 mt-auto"><button onClick={() => loadEpisode(episode)} className={`min-h-12 rounded-[20px] font-black text-xs flex items-center justify-center gap-1.5 ${progress?.completed ? 'bg-[#eef9f3] text-[#519878]' : 'bg-[#8d79d6] text-white'}`}>{progress?.completed ? <><CheckCircle2 className="w-4 h-4" /> Réécouter</> : started ? <><Play className="w-4 h-4 fill-current" /> Continuer</> : <><Play className="w-4 h-4 fill-current" /> Écouter</>}</button><button onClick={() => processEpisode(episode)} disabled={studyingId === episode.id} className="min-h-12 rounded-[20px] bg-[#fff5df] text-[#b77c31] text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-60">{studyingId === episode.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{study ? 'Ouvrir l’étude' : 'Transcrire & étudier'}</button></div></div>
        </article>;
      })}
    </section>}

    {!loading && filtered.length === 0 && !error && <div className="text-center py-16 text-[#9a818a]">Aucun épisode à afficher avec ces filtres.</div>}

    <audio ref={audioRef} preload="metadata" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => { const d = audioRef.current?.duration || 0; if (Number.isFinite(d)) setDuration(d); }} onEnded={handleEnded} onError={() => { setAudioError('Impossible de lire cet épisode.'); setIsPlaying(false); }} />

    {activeEpisode && <div className="fixed left-3 right-3 bottom-[92px] z-30 max-w-3xl mx-auto rounded-[28px] bg-[#fffdfb]/96 dark:bg-[#35282e]/96 border border-[#ddcff9] dark:border-[#5d4c73] backdrop-blur-xl shadow-[0_18px_55px_rgba(78,55,96,.22)] p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="text-[10px] font-black text-[#927fae]">EN ÉCOUTE</div><div className="font-black text-sm truncate">{activeEpisode.title}</div></div><button onClick={togglePlay} className="w-12 h-12 rounded-full bg-[#8d79d6] text-white flex items-center justify-center">{isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}</button></div><div className="mt-3 flex items-center gap-2"><span className="text-[10px] w-9">{formatTime(currentTime)}</span><input type="range" min={0} max={duration || 1} step={.1} value={Math.min(currentTime, duration || 1)} onChange={(e) => { const v = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = v; setCurrentTime(v); }} className="flex-1 accent-[#8d79d6]" /><span className="text-[10px] w-9 text-right">{formatTime(duration)}</span></div><div className="flex justify-center gap-3 mt-2"><button onClick={() => seekBy(-10)} className="px-3 py-2 rounded-2xl bg-[#f3efff] text-[#7e69c5] text-xs font-black flex gap-1"><RotateCcw className="w-4 h-4" />10s</button><button onClick={() => seekBy(10)} className="px-3 py-2 rounded-2xl bg-[#f3efff] text-[#7e69c5] text-xs font-black flex gap-1">10s<RotateCw className="w-4 h-4" /></button></div>{audioError && <div className="mt-2 text-center text-[10px] text-[#c45b64]">{audioError}</div>}</div>}

    {studyEpisode && activeStudy && <div className="fixed inset-0 z-50 bg-[#fff8f3]/96 dark:bg-[#241b20]/96 backdrop-blur-xl overflow-y-auto"><div className="max-w-4xl mx-auto p-4 sm:p-6"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-black uppercase text-[#8874c9]">Étude guidée · {activeStudy.level} · {activeStudy.category}</span><h2 className="text-2xl sm:text-3xl font-black mt-1">{studyEpisode.title}</h2><p className="mt-2 text-sm text-[#80666f]">{activeStudy.summaryEn}</p></div><button onClick={() => setStudyEpisode(null)} className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center"><X className="w-5 h-5" /></button></div><div className="flex gap-2 mt-5 overflow-x-auto">{([['transcript','Transcription',FileText],['translation','English translation',Languages],['notes','Study notes',GraduationCap]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setStudyTab(id)} className={`px-4 py-2.5 rounded-full text-xs font-black flex gap-1.5 ${studyTab === id ? 'bg-[#8d79d6] text-white' : 'bg-white text-[#80646f]'}`}><Icon className="w-4 h-4" />{label}</button>)}</div><div className="mt-4 rounded-[28px] bg-white dark:bg-[#382b31] border border-[#ecd8d2] p-5 sm:p-7">
      {studyTab === 'transcript' && <div className="space-y-3">{activeStudy.segments?.length ? activeStudy.segments.map((s, i) => <div key={i} className="grid grid-cols-[52px_1fr] gap-3"><span className="text-[10px] font-black text-[#8874c9] pt-1">{formatTime(s.start)}</span><p className="text-sm sm:text-base leading-relaxed">{s.text}</p></div>) : <p className="leading-relaxed whitespace-pre-wrap">{activeStudy.transcript}</p>}</div>}
      {studyTab === 'translation' && <p className="text-sm sm:text-base leading-7 whitespace-pre-wrap">{activeStudy.translationEn}</p>}
      {studyTab === 'notes' && <div className="space-y-5"><div><h3 className="text-xs font-black uppercase text-[#8874c9]">Listening objective</h3><p className="mt-1">{activeStudy.objective}</p></div><div><h3 className="text-xs font-black uppercase text-[#519878]">Vocabulary</h3><div className="flex flex-wrap gap-2 mt-2">{activeStudy.vocabulary.map((w) => <span key={w} className="px-3 py-1.5 rounded-full bg-[#eef9f3] text-[#519878] text-xs font-bold">{w}</span>)}</div></div><div><h3 className="text-xs font-black uppercase text-[#b77c31]">Key expressions</h3><div className="grid gap-2 mt-2">{activeStudy.keyExpressions.map((x, i) => <div key={i} className="p-3 rounded-2xl bg-[#fff5df]"><b>{x.french}</b><span className="text-sm"> — {x.english}</span></div>)}</div></div></div>}
    </div></div></div>}
  </div>;
};
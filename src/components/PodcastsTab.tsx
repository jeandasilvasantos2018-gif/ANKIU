import React, { useMemo, useRef, useState } from 'react';
import { PodcastEpisode, PodcastLevel, PodcastProgress } from '../types';
import { PODCAST_CATEGORIES, PODCAST_EPISODES } from '../data/podcasts';
import { getPodcastProgressMap, markPodcastCompleted, savePodcastProgress } from '../lib/podcastProgress';
import { Search, Play, Pause, RotateCcw, RotateCw, CheckCircle2, Headphones, BookOpen, Clock3, Sparkles } from 'lucide-react';

const levels: Array<'Tous' | PodcastLevel> = ['Tous', 'A1', 'A2', 'B1', 'B2', 'C1'];

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

const formatDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const min = Math.round(seconds / 60);
  return `${min} min`;
};

export const PodcastsTab: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'Tous' | PodcastLevel>('Tous');
  const [category, setCategory] = useState<string>('Tous');
  const [progressMap, setProgressMap] = useState<Record<string, PodcastProgress>>(() => getPodcastProgressMap());
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return PODCAST_EPISODES.filter((episode) => {
      const matchesLevel = level === 'Tous' || episode.level === level;
      const matchesCategory = category === 'Tous' || episode.category === category;
      const haystack = `${episode.title} ${episode.description} ${episode.category} ${episode.podcastName} ${episode.objective} ${episode.vocabulary.join(' ')}`.toLowerCase();
      return matchesLevel && matchesCategory && (!q || haystack.includes(q));
    });
  }, [query, level, category]);

  const updateProgressState = (episodeId: string, next: PodcastProgress) => {
    setProgressMap((prev) => ({ ...prev, [episodeId]: next }));
  };

  const loadEpisode = async (episode: PodcastEpisode, autoPlay = true) => {
    setAudioError(null);
    setActiveEpisode(episode);
    const saved = progressMap[episode.id];
    const resumeAt = saved && !saved.completed && saved.currentTime >= 5 ? saved.currentTime : 0;
    setCurrentTime(resumeAt);
    setDuration(saved?.duration || episode.duration || 0);
    setTimeout(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        if (audio.src !== episode.audioUrl) audio.src = episode.audioUrl;
        audio.load();
        const applyResume = () => {
          const max = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.25) : resumeAt;
          audio.currentTime = Math.min(resumeAt, max || resumeAt);
          if (autoPlay) audio.play().catch(() => setIsPlaying(false));
        };
        if (audio.readyState >= 1) applyResume(); else audio.addEventListener('loadedmetadata', applyResume, { once: true });
      } catch {
        setAudioError('Impossible de charger cet audio pour le moment.');
      }
    }, 0);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !activeEpisode) return;
    if (audio.paused) audio.play().catch(() => setAudioError('La lecture a été bloquée. Touchez à nouveau sur lecture.'));
    else audio.pause();
  };

  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + delta));
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !activeEpisode) return;
    setCurrentTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    if (audio.currentTime - lastSavedRef.current >= 5) {
      lastSavedRef.current = audio.currentTime;
      const previous = progressMap[activeEpisode.id];
      const saved = savePodcastProgress(activeEpisode.id, {
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : activeEpisode.duration || 0,
        completed: previous?.completed || false,
      });
      updateProgressState(activeEpisode.id, saved);
    }
  };

  const handleEnded = () => {
    if (!activeEpisode) return;
    const finalDuration = audioRef.current?.duration || duration || activeEpisode.duration || 0;
    const saved = markPodcastCompleted(activeEpisode.id, finalDuration);
    updateProgressState(activeEpisode.id, saved);
    setCurrentTime(finalDuration);
    setIsPlaying(false);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-40 flex flex-col gap-6">
      <header className="rounded-[32px] p-5 sm:p-7 bg-gradient-to-br from-[#f3efff] via-[#fff7fb] to-[#fff0e9] dark:from-[#403650] dark:via-[#392c34] dark:to-[#42322f] border border-[#ded4ff] dark:border-[#5d4c73] relative overflow-hidden">
        <span className="absolute right-6 top-4 text-[#b39ee8] text-xl ankiu-sparkle">✦</span>
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-14 h-14 rounded-[22px] bg-[#8d79d6] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(126,105,197,.22)]"><Headphones className="w-7 h-7" /></div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em] text-[#43333b] dark:text-[#fff8f5]">Podcasts</h1>
            <p className="mt-1 text-sm font-bold text-[#796689] dark:text-[#d1c2e8]">Entraînez votre compréhension orale avec du français réel.</p>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#927e88] dark:text-[#c8b5bd] leading-relaxed">Écoutez des contenus en français, suivez votre progression et reprenez exactement là où vous vous êtes arrêté.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3">
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a9919b]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un podcast..." className="w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-[#ecd8d2] bg-[#fffdfb] dark:bg-[#382b31] dark:border-[#5b444e] text-sm" /></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{levels.map((item) => <button key={item} onClick={() => setLevel(item)} className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-black border ${level === item ? 'bg-[#8d79d6] text-white border-transparent' : 'bg-[#fffdfb] dark:bg-[#382b31] text-[#80646f] dark:text-[#d4bdc5] border-[#eed5cf] dark:border-[#58424c]'}`}>{item}</button>)}</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{PODCAST_CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border ${category === item ? 'bg-[#fff0f3] text-[#d95d78] border-[#ffd1da]' : 'bg-[#fffaf7] dark:bg-[#33272d] text-[#9a818a] border-[#eedbd5] dark:border-[#544049]'}`}>{item}</button>)}</div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((episode, index) => {
          const progress = progressMap[episode.id];
          const total = progress?.duration || episode.duration || 0;
          const percent = progress?.completed ? 100 : total > 0 ? Math.min(100, Math.round((progress?.currentTime || 0) / total * 100)) : 0;
          const started = !progress?.completed && (progress?.currentTime || 0) >= 5;
          return <article key={episode.id} className="rounded-[28px] bg-[#fffdfb] dark:bg-[#382b31] border border-[#ecd8d2] dark:border-[#5b444e] overflow-hidden shadow-[0_12px_35px_rgba(112,66,80,.09)] flex flex-col">
            <div className={`h-36 p-5 relative overflow-hidden ${index % 2 === 0 ? 'bg-gradient-to-br from-[#b8a9ee] to-[#f4aec0]' : 'bg-gradient-to-br from-[#91d7b4] to-[#ffe0a2]'}`}>
              <div className="absolute -right-5 -bottom-10 w-36 h-36 rounded-full bg-white/25" /><Headphones className="w-9 h-9 text-white relative z-10" /><div className="absolute bottom-4 left-5 text-white/95 text-xs font-black uppercase tracking-[.12em]">{episode.category}</div>
            </div>
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-black"><span className="px-2.5 py-1 rounded-full bg-[#f3efff] text-[#7e69c5]">{episode.level}</span><span className="flex items-center gap-1 text-[#a08690]"><Clock3 className="w-3 h-3" /> {formatDuration(total || episode.duration)}</span></div>
              <div><h2 className="text-xl font-black text-[#44323a] dark:text-[#fff8f5] leading-tight">{episode.title}</h2><p className="mt-1 text-[11px] font-bold text-[#b18491]">{episode.podcastName}</p></div>
              <p className="text-sm leading-relaxed text-[#80666f] dark:text-[#d3bec5] line-clamp-3">{episode.description}</p>
              <div className="rounded-[18px] p-3 bg-[#fff8f3] dark:bg-[#30242a]"><div className="flex gap-2"><BookOpen className="w-4 h-4 text-[#8874c9] shrink-0 mt-0.5" /><div><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#9d8290]">Objectif</span><p className="text-xs text-[#6e5862] dark:text-[#d5c0c7]">{episode.objective}</p></div></div></div>
              {episode.vocabulary.length > 0 && <div className="flex flex-wrap gap-1.5">{episode.vocabulary.slice(0, 5).map((word) => <span key={word} className="px-2 py-1 rounded-full bg-[#eef9f3] text-[#519878] text-[9px] font-bold">{word}</span>)}</div>}
              {(started || progress?.completed) && <div><div className="flex justify-between text-[10px] font-bold text-[#9b818a] mb-1"><span>{progress?.completed ? 'Écouté' : 'Votre progression'}</span><span>{percent}%</span></div><div className="h-2 rounded-full bg-[#f2ddd7] dark:bg-[#4c3941] overflow-hidden"><div className={`h-full rounded-full ${progress?.completed ? 'bg-[#72bd99]' : 'bg-gradient-to-r from-[#8d79d6] to-[#ef9aae]'}`} style={{ width: `${percent}%` }} /></div></div>}
              <button onClick={() => loadEpisode(episode)} className={`mt-auto min-h-12 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 ${progress?.completed ? 'bg-[#eef9f3] text-[#519878] border border-[#ccebdc]' : 'bg-gradient-to-r from-[#8d79d6] to-[#b59de7] text-white shadow-[0_8px_20px_rgba(126,105,197,.18)]'}`}>{progress?.completed ? <><CheckCircle2 className="w-4 h-4" /> Réécouter</> : started ? <><Play className="w-4 h-4 fill-current" /> Continuer</> : <><Play className="w-4 h-4 fill-current" /> Écouter</>}</button>
            </div>
          </article>;
        })}
      </section>

      {filtered.length === 0 && <div className="text-center py-16 text-[#9a818a]">Aucun podcast ne correspond à vos filtres.</div>}

      <audio ref={audioRef} preload="metadata" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => { const d = audioRef.current?.duration || 0; if (Number.isFinite(d)) setDuration(d); }} onEnded={handleEnded} onError={() => { setAudioError('Impossible de lire cet épisode. Vérifiez votre connexion.'); setIsPlaying(false); }} />

      {activeEpisode && <div className="fixed left-3 right-3 bottom-[92px] z-30 max-w-3xl mx-auto rounded-[28px] bg-[#fffdfb]/96 dark:bg-[#35282e]/96 border border-[#ddcff9] dark:border-[#5d4c73] backdrop-blur-xl shadow-[0_18px_55px_rgba(78,55,96,.22)] p-4">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#8d79d6] to-[#ef9aae] text-white flex items-center justify-center shrink-0"><Headphones className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="text-[10px] font-black text-[#927fae]">EN ÉCOUTE</div><div className="font-black text-sm text-[#44323a] dark:text-[#fff8f5] truncate">{activeEpisode.title}</div></div><button onClick={togglePlay} className="w-12 h-12 rounded-full bg-[#8d79d6] text-white flex items-center justify-center shrink-0" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}</button></div>
        <div className="mt-3 flex items-center gap-2"><span className="text-[10px] font-bold text-[#9a818a] w-9">{formatTime(currentTime)}</span><input aria-label="Progression audio" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 1)} onChange={(e) => handleSeek(Number(e.target.value))} className="flex-1 accent-[#8d79d6]" /><span className="text-[10px] font-bold text-[#9a818a] w-9 text-right">{formatTime(duration)}</span></div>
        <div className="flex items-center justify-center gap-3 mt-2"><button onClick={() => seekBy(-10)} className="min-h-10 px-3 rounded-2xl bg-[#f3efff] text-[#7e69c5] text-xs font-black flex items-center gap-1"><RotateCcw className="w-4 h-4" /> 10s</button><button onClick={() => seekBy(10)} className="min-h-10 px-3 rounded-2xl bg-[#f3efff] text-[#7e69c5] text-xs font-black flex items-center gap-1">10s <RotateCw className="w-4 h-4" /></button></div>
        {audioError && <div className="mt-2 text-center text-[10px] font-bold text-[#c45b64]">{audioError}</div>}
      </div>}
    </div>
  );
};

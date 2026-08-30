import { PodcastProgress } from '../types';

const STORAGE_KEY = 'ankiu_podcast_progress_v1';

const readAll = (): Record<string, PodcastProgress> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (data: Record<string, PodcastProgress>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getPodcastProgressMap = (): Record<string, PodcastProgress> => readAll();

export const getPodcastProgress = (podcastId: string): PodcastProgress | undefined => readAll()[podcastId];

export const savePodcastProgress = (podcastId: string, patch: Partial<PodcastProgress>): PodcastProgress => {
  const all = readAll();
  const previous = all[podcastId];
  const next: PodcastProgress = {
    podcastId,
    currentTime: patch.currentTime ?? previous?.currentTime ?? 0,
    duration: patch.duration ?? previous?.duration ?? 0,
    completed: patch.completed ?? previous?.completed ?? false,
    updatedAt: new Date().toISOString(),
  };
  all[podcastId] = next;
  writeAll(all);
  return next;
};

export const markPodcastCompleted = (podcastId: string, duration: number): PodcastProgress => {
  return savePodcastProgress(podcastId, { currentTime: duration, duration, completed: true });
};

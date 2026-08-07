/**
 * Multi-Tier Audio Player for Web, Vercel & Mobile (Median / GoNative WebView)
 * Solves Vercel CORS restrictions, hotlinking blocks, Median native WebView origin blocks, and browser autoplay policies.
 */
import { useState, useEffect } from 'react';

export interface TTSLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

let ttsLogs: TTSLogEntry[] = [];
const logSubscribers: Set<(logs: TTSLogEntry[]) => void> = new Set();

const addTtsLog = (level: 'info' | 'warn' | 'error', msg: string, details?: any) => {
  let detailStr = '';
  if (details !== undefined) {
    try {
      if (typeof details === 'object' && details !== null) {
        if (Array.isArray(details)) {
          detailStr = ` (${details.length} item(s): ${details.slice(0, 5).map((d) => d?.name || d?.lang || JSON.stringify(d)).join(', ')})`;
        } else if (details.name || details.lang) {
          detailStr = ` {voice: "${details.name || 'N/A'}", lang: "${details.lang || 'N/A'}"}`;
        } else {
          detailStr = ` ${JSON.stringify(details)}`;
        }
      } else {
        detailStr = ` ${String(details)}`;
      }
    } catch (e) {
      detailStr = ` [object]`;
    }
  }

  const fullMsg = `${msg}${detailStr}`;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

  const entry: TTSLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: timeStr,
    level,
    message: fullMsg,
  };

  ttsLogs = [entry, ...ttsLogs].slice(0, 150); // Keep last 150 entries

  // Also log to console
  if (level === 'info') console.log(`[TTS] ${fullMsg}`);
  else if (level === 'warn') console.warn(`[TTS] ${fullMsg}`);
  else console.error(`[TTS] ${fullMsg}`);

  logSubscribers.forEach((fn) => fn([...ttsLogs]));
};

export const getTtsLogs = (): TTSLogEntry[] => [...ttsLogs];

export const clearTtsLogs = () => {
  ttsLogs = [];
  logSubscribers.forEach((fn) => fn([...ttsLogs]));
};

export const subscribeTtsLogs = (callback: (logs: TTSLogEntry[]) => void) => {
  logSubscribers.add(callback);
  callback([...ttsLogs]);
  return () => {
    logSubscribers.delete(callback);
  };
};

export const useTtsLogs = (): TTSLogEntry[] => {
  const [logs, setLogs] = useState<TTSLogEntry[]>(() => getTtsLogs());

  useEffect(() => {
    return subscribeTtsLogs((newLogs) => {
      setLogs(newLogs);
    });
  }, []);

  return logs;
};

let voicesReady = false;
let voicesLoaded: SpeechSynthesisVoice[] = [];
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let audioTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let nativeStartTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

const listeners: Set<(ready: boolean) => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((fn) => fn(voicesReady));
};

/**
 * Checks if SpeechSynthesis voices are loaded or available immediately
 */
export const checkVoicesReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!('speechSynthesis' in window)) {
    voicesReady = true;
    return true; // Web Speech API not present; treat as ready so fallback audio works
  }

  if (voicesReady) return true;

  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      voicesLoaded = voices;
      voicesReady = true;
      addTtsLog('info', `Voices loaded successfully: ${voices.length} voice(s) available`);
      notifyListeners();
      return true;
    }
  } catch (e) {
    // ignore
  }

  return false;
};

// Initialize voice listener for Web Speech API
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const initVoices = () => {
    checkVoicesReady();
  };

  initVoices();

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = initVoices;
  }
  window.speechSynthesis.addEventListener('voiceschanged', initVoices);

  // Periodic checks for WebViews (Android/iOS Median) that delay loading voices without triggering onvoiceschanged
  setTimeout(initVoices, 50);
  setTimeout(initVoices, 250);
  setTimeout(initVoices, 1000);
}

export const isVoicesReady = (): boolean => {
  return checkVoicesReady();
};

export const subscribeVoicesReady = (callback: (ready: boolean) => void) => {
  listeners.add(callback);
  callback(checkVoicesReady());
  return () => {
    listeners.delete(callback);
  };
};

/**
 * React Hook to track if audio voices are loaded and ready in WebView / Browser
 */
export const useVoicesReady = (): boolean => {
  const [ready, setReady] = useState(() => checkVoicesReady());

  useEffect(() => {
    if (ready) return;

    const unsubscribe = subscribeVoicesReady((isReady) => {
      if (isReady) {
        setReady(true);
      }
    });

    return unsubscribe;
  }, [ready]);

  return ready;
};

/**
 * Maps language code to standard 2-letter ISO code
 */
const getLangCode = (lang: string = 'fr'): string => {
  const code = lang.toLowerCase().substring(0, 2);
  const map: Record<string, string> = {
    fr: 'fr',
    en: 'en',
    es: 'es',
    de: 'de',
    it: 'it',
    pt: 'pt',
    ja: 'ja',
    zh: 'zh',
    ru: 'ru',
  };
  return map[code] || 'fr';
};

/**
 * Maps ISO language code to Amazon Polly Voice Name for StreamElements
 */
const getPollyVoice = (lang: string = 'fr'): string => {
  const code = getLangCode(lang);
  switch (code) {
    case 'fr':
      return 'Mathieu';
    case 'en':
      return 'Brian';
    case 'es':
      return 'Conchita';
    case 'de':
      return 'Marlene';
    case 'it':
      return 'Carla';
    case 'pt':
      return 'Vitoria';
    case 'ja':
      return 'Mizuki';
    case 'zh':
      return 'Zhiyu';
    case 'ru':
      return 'Tatyana';
    default:
      return 'Mathieu';
  }
};

/**
 * Builds the URL for our own Vercel TTS serverless endpoint
 */
export const getVercelTtsUrl = (text: string, language: string = 'fr'): string => {
  const cleanText = text.replace(/______/g, '').trim().substring(0, 300);
  const langCode = getLangCode(language);
  const params = new URLSearchParams({
    text: cleanText,
    lang: langCode,
  });

  let baseUrl = 'https://ankiu.vercel.app/api/tts';
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    window.location.origin.includes('ankiu.vercel.app')
  ) {
    baseUrl = '/api/tts';
  }

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Explicit test function to play directly via Vercel TTS API
 */
export const playVercelTts = (
  text: string,
  language: string = 'fr',
  rate: number = 1.0,
  onEnd?: () => void
): boolean => {
  stopAudio();
  const cleanText = text.replace(/______/g, '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return false;
  }

  const url = getVercelTtsUrl(cleanText, language);
  console.log('[TTS] Trying Vercel TTS API');
  addTtsLog('info', `Trying Vercel TTS API (${url})`);

  try {
    const audio = new Audio();
    activeAudio = audio;
    audio.playbackRate = rate;

    let settled = false;
    const finishOnce = () => {
      if (!settled) {
        settled = true;
        stopAudio();
        if (onEnd) onEnd();
      }
    };

    audio.onplay = () => {
      if (settled) return;
      console.log('[TTS] Vercel TTS started');
      addTtsLog('info', 'Vercel TTS started');
    };

    audio.onended = () => {
      if (settled) return;
      console.log('[TTS] Vercel TTS ended');
      addTtsLog('info', 'Vercel TTS ended');
      finishOnce();
    };

    audio.onerror = (e) => {
      if (settled) return;
      console.warn('[TTS] Vercel TTS failed', e);
      addTtsLog('warn', 'Vercel TTS failed', e);
      finishOnce();
    };

    audio.src = url;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (settled) return;
        console.warn('[TTS] Vercel TTS failed', err);
        addTtsLog('warn', 'Vercel TTS failed', err?.message || err);
        finishOnce();
      });
    }
    return true;
  } catch (err) {
    console.warn('[TTS] Vercel TTS failed', err);
    addTtsLog('warn', 'Vercel TTS exception', err);
    if (onEnd) onEnd();
    return false;
  }
};

/**
 * Stop any active audio playback immediately
 */
export const stopAudio = () => {
  if (audioTimeoutTimer) {
    clearTimeout(audioTimeoutTimer);
    audioTimeoutTimer = null;
  }
  if (nativeStartTimeoutTimer) {
    clearTimeout(nativeStartTimeoutTimer);
    nativeStartTimeoutTimer = null;
  }

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
    } catch (e) {
      // Ignore pause errors
    }
    activeAudio = null;
  }

  if (activeUtterance) {
    activeUtterance = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore cancel errors
    }
  }
};

/**
 * Native Browser Web Speech Synthesis fallback
 */
export const playSpeechSynthesis = (
  text: string,
  language: string = 'fr',
  rate: number = 1.0,
  onStartCallback: () => void,
  onEndCallback: () => void,
  onErrorCallback: (err?: any) => void
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    addTtsLog('warn', 'Native speech not supported in this environment');
    onErrorCallback('speechSynthesis not supported');
    return;
  }

  addTtsLog('info', 'Request', { text, language, rate });

  try {
    let wasCancelled = false;
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      wasCancelled = true;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    activeUtterance = utterance;

    const langCodeMap: Record<string, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-BR',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ru: 'ru-RU',
    };

    const baseLang = language.toLowerCase().substring(0, 2);
    const targetLang = langCodeMap[baseLang] || 'fr-FR';
    utterance.lang = targetLang;

    const voices = voicesLoaded.length > 0 ? voicesLoaded : window.speechSynthesis.getVoices();
    addTtsLog('info', 'Available voices', voices);

    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (voices && voices.length > 0) {
      // 1. Exact locale match
      selectedVoice = voices.find(
        (v) => v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase()
      );
      // 2. Base language match
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) => v.lang.replace('_', '-').toLowerCase().startsWith(baseLang)
        );
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    addTtsLog('info', 'Selected voice', selectedVoice ? { name: selectedVoice.name, lang: selectedVoice.lang } : 'Default system voice');

    let hasStarted = false;
    let hasFinished = false;

    const cleanup = () => {
      if (nativeStartTimeoutTimer) {
        clearTimeout(nativeStartTimeoutTimer);
        nativeStartTimeoutTimer = null;
      }
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };

    utterance.onstart = () => {
      if (hasFinished) return;
      hasStarted = true;
      addTtsLog('info', 'Native speech started');
      cleanup();
      onStartCallback();
    };

    utterance.onend = () => {
      if (hasFinished) return;
      hasFinished = true;
      addTtsLog('info', 'Native speech ended');
      cleanup();
      onEndCallback();
    };

    utterance.onerror = (event) => {
      if (hasFinished) return;
      hasFinished = true;
      addTtsLog('warn', 'Native speech error', event?.error || event);
      cleanup();
      if (!hasStarted) {
        onErrorCallback(event);
      } else {
        onEndCallback();
      }
    };

    nativeStartTimeoutTimer = setTimeout(() => {
      if (!hasStarted && !hasFinished) {
        hasFinished = true;
        addTtsLog('warn', 'Native speech did not start within 1.8s, triggering Tier 2 fallback');
        cleanup();
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
        onErrorCallback('timeout');
      }
    }, 1800);

    const executeSpeak = () => {
      addTtsLog('info', 'Native speak requested');
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        addTtsLog('warn', 'Native speak exception', e);
        if (!hasStarted && !hasFinished) {
          hasFinished = true;
          cleanup();
          onErrorCallback(e);
        }
      }
    };

    if (wasCancelled) {
      setTimeout(executeSpeak, 80);
    } else {
      executeSpeak();
    }
  } catch (e) {
    addTtsLog('warn', 'Native speech setup error', e);
    activeUtterance = null;
    onErrorCallback(e);
  }
};

/**
 * Play text-to-speech audio with multi-tier failover
 * Tier 1: Web Speech API (with active onstart validation & timeout)
 * Tier 2: StreamElements -> Google TTS
 */
export const playAudio = (
  text: string,
  language: string = 'fr',
  rate: number = 1.0,
  onEnd?: () => void
): boolean => {
  if (!text || typeof text !== 'string') {
    if (onEnd) onEnd();
    return false;
  }

  const cleanText = text.replace(/______/g, '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return false;
  }

  stopAudio();

  let hasFinished = false;
  const finishOnce = () => {
    if (!hasFinished) {
      hasFinished = true;
      stopAudio();
      if (onEnd) onEnd();
    }
  };

  const playFallbackAudio = () => {
    if (hasFinished) return;

    const langCode = getLangCode(language);
    const pollyVoice = getPollyVoice(language);
    const encodedText = encodeURIComponent(cleanText.substring(0, 200));

    const audioSources = [
      {
        name: 'Vercel TTS API',
        url: getVercelTtsUrl(cleanText, language),
      },
      {
        name: 'StreamElements',
        url: `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(pollyVoice)}&text=${encodedText}`,
      },
      {
        name: 'Google TTS (gtx)',
        url: `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&q=${encodedText}&tl=${langCode}`,
      },
      {
        name: 'Google TTS (tw-ob)',
        url: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${langCode}`,
      },
    ];

    let currentSourceIndex = 0;

    const tryNextSource = () => {
      if (audioTimeoutTimer) {
        clearTimeout(audioTimeoutTimer);
        audioTimeoutTimer = null;
      }

      if (hasFinished) return;

      if (currentSourceIndex >= audioSources.length) {
        addTtsLog('error', 'All audio methods failed');
        finishOnce();
        return;
      }

      const source = audioSources[currentSourceIndex];
      currentSourceIndex++;

      let settled = false;

      if (source.name === 'Vercel TTS API') {
        console.log('[TTS] Trying Vercel TTS API');
      }
      addTtsLog('info', `Trying fallback source: ${source.name}`);

      try {
        const audio = new Audio();
        activeAudio = audio;
        audio.playbackRate = rate;
        // Do NOT set crossOrigin = 'anonymous' as it causes CORS preflight block on public audio URLs

        audio.onplay = () => {
          if (settled || hasFinished) return;
          if (source.name === 'Vercel TTS API') {
            console.log('[TTS] Vercel TTS started');
          }
        };

        audio.onended = () => {
          if (settled || hasFinished) return;
          settled = true;
          if (source.name === 'Vercel TTS API') {
            console.log('[TTS] Vercel TTS ended');
          }
          addTtsLog('info', `Audio playback completed using ${source.name}`);
          finishOnce();
        };

        audio.onerror = (e) => {
          if (settled || hasFinished) return;
          settled = true;
          if (source.name === 'Vercel TTS API') {
            console.warn('[TTS] Vercel TTS failed', e);
          }
          addTtsLog('warn', `Audio source failed (${source.name})`, e);
          tryNextSource();
        };

        audioTimeoutTimer = setTimeout(() => {
          if (!settled && !hasFinished && activeAudio === audio && audio.paused) {
            settled = true;
            addTtsLog('warn', `Audio playback stalled on ${source.name}, trying next source`);
            tryNextSource();
          }
        }, 3500);

        audio.src = source.url;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (settled || hasFinished) return;
            settled = true;
            if (source.name === 'Vercel TTS API') {
              console.warn('[TTS] Vercel TTS failed', err);
            }
            addTtsLog('warn', `Play promise rejected for ${source.name}`, err?.message || err);
            tryNextSource();
          });
        }
      } catch (err) {
        if (settled || hasFinished) return;
        settled = true;
        if (source.name === 'Vercel TTS API') {
          console.warn('[TTS] Vercel TTS failed', err);
        }
        addTtsLog('warn', `Exception playing audio source ${source.name}`, err);
        tryNextSource();
      }
    };

    tryNextSource();
  };

  // Tier 1: Try Native SpeechSynthesis with active onstart check
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    playSpeechSynthesis(
      cleanText,
      language,
      rate,
      () => {
        // onStart: Native Speech successfully started speaking
      },
      () => {
        // onEnd: Native Speech successfully finished
        finishOnce();
      },
      (err) => {
        // onError or timeout: Fallback to Tier 2
        addTtsLog('warn', 'Native speech failed or timed out, switching to Tier 2 fallback', err);
        playFallbackAudio();
      }
    );
  } else {
    // Web Speech API unavailable, go straight to Tier 2
    addTtsLog('warn', 'Web Speech API unavailable, going straight to Tier 2 fallback');
    playFallbackAudio();
  }

  return true;
};

/**
 * Plays a button click sound effect
 */
export const playButtonSound = () => {
  try {
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
    audio.play().catch((err) => {
      console.warn('[Audio] Button sound play prevented:', err);
    });
  } catch (e) {
    console.warn('[Audio] Error playing button sound:', e);
  }
};

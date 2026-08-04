/**
 * Multi-Tier Audio Player for Web, Vercel & Mobile (Median / GoNative WebView)
 * Solves Vercel CORS restrictions, hotlinking blocks, Median native WebView origin blocks, and browser autoplay policies.
 */
import { useState, useEffect } from 'react';

let voicesReady = false;
let voicesLoaded: SpeechSynthesisVoice[] = [];
let activeAudio: HTMLAudioElement | null = null;
let audioTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

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
    default:
      return 'Mathieu';
  }
};

/**
 * Native Browser Web Speech Synthesis fallback for offline or restricted environments (Median / Android / iOS WebViews)
 * MUST be executed synchronously within user gesture event loops in WebViews!
 */
export const playSpeechSynthesis = (
  text: string,
  language: string = 'fr',
  rate: number = 1.0,
  onEnd?: () => void
): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;

    const langCodeMap: Record<string, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-BR',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };

    utterance.lang = langCodeMap[language.substring(0, 2)] || 'fr-FR';

    const voices = voicesLoaded.length > 0 ? voicesLoaded : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchVoice = voices.find(
        (v) => v.lang.startsWith(utterance.lang) || v.lang.toLowerCase().includes(language.toLowerCase())
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    // Synchronous execution inside gesture loop
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('SpeechSynthesis error:', e);
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

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {
      // Ignore pause errors
    }
    activeAudio = null;
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
 * Play text-to-speech audio with multi-tier failover
 * Optimized for Vercel + Median (GoNative) Android & iOS WebViews!
 * Triggers speechSynthesis SYNCHRONOUSLY within user gesture event context.
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
    if (audioTimeoutTimer) {
      clearTimeout(audioTimeoutTimer);
      audioTimeoutTimer = null;
    }
    if (!hasFinished) {
      hasFinished = true;
      activeAudio = null;
      if (onEnd) onEnd();
    }
  };

  // Tier 1: Try Web Speech API synchronously first if available in browser/WebView
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const success = playSpeechSynthesis(cleanText, language, rate, finishOnce);
    if (success) {
      return true;
    }
  }

  // Tier 2: StreamElements / Google TTS MP3 Fallback
  const langCode = getLangCode(language);
  const pollyVoice = getPollyVoice(language);
  const encodedText = encodeURIComponent(cleanText.substring(0, 200));

  const audioUrls = [
    `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(pollyVoice)}&text=${encodedText}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&q=${encodedText}&tl=${langCode}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${langCode}`,
  ];

  let currentUrlIndex = 0;

  const tryNextSource = () => {
    if (audioTimeoutTimer) {
      clearTimeout(audioTimeoutTimer);
      audioTimeoutTimer = null;
    }

    if (currentUrlIndex >= audioUrls.length) {
      finishOnce();
      return;
    }

    const url = audioUrls[currentUrlIndex];
    currentUrlIndex++;

    try {
      const audio = new Audio();
      activeAudio = audio;
      audio.playbackRate = rate;
      audio.crossOrigin = 'anonymous';

      audio.onended = finishOnce;

      audio.onerror = () => {
        tryNextSource();
      };

      audioTimeoutTimer = setTimeout(() => {
        if (!hasFinished && activeAudio === audio && audio.paused) {
          tryNextSource();
        }
      }, 3000);

      audio.src = url;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          tryNextSource();
        });
      }
    } catch (err) {
      tryNextSource();
    }
  };

  tryNextSource();
  return true;
};




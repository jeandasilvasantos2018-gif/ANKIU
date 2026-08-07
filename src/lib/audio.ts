/**
 * Multi-Tier Audio Player for Web, Vercel & Mobile (Median / GoNative WebView)
 * Solves Vercel CORS restrictions, hotlinking blocks, Median native WebView origin blocks, and browser autoplay policies.
 */
import { useState, useEffect } from 'react';

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
    console.warn('[TTS] Native speech not supported in this environment');
    onErrorCallback('speechSynthesis not supported');
    return;
  }

  console.log('[TTS] Request:', { text, language, rate });

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
    console.log('[TTS] Available voices:', voices);

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

    console.log('[TTS] Selected voice:', selectedVoice?.name, selectedVoice?.lang);

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
      console.log('[TTS] Native speech started');
      cleanup();
      onStartCallback();
    };

    utterance.onend = () => {
      if (hasFinished) return;
      hasFinished = true;
      console.log('[TTS] Native speech ended');
      cleanup();
      onEndCallback();
    };

    utterance.onerror = (event) => {
      if (hasFinished) return;
      hasFinished = true;
      console.warn('[TTS] Native speech error:', event);
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
        console.warn('[TTS] Native speech did not start, using fallback');
        cleanup();
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
        onErrorCallback('timeout');
      }
    }, 1800);

    const executeSpeak = () => {
      console.log('[TTS] Native speak requested');
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[TTS] Native speak exception:', e);
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
    console.warn('[TTS] Native speech setup error:', e);
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

      if (currentSourceIndex >= audioSources.length) {
        console.error('[TTS] All audio methods failed');
        finishOnce();
        return;
      }

      const source = audioSources[currentSourceIndex];
      currentSourceIndex++;

      if (source.name.includes('StreamElements')) {
        console.log('[TTS] Trying StreamElements');
      } else if (source.name.includes('Google TTS')) {
        console.log('[TTS] Trying Google TTS');
      }

      try {
        const audio = new Audio();
        activeAudio = audio;
        audio.playbackRate = rate;
        // Do NOT set crossOrigin = 'anonymous' as it causes CORS preflight block on public audio URLs

        audio.onended = finishOnce;

        audio.onerror = (e) => {
          console.warn(`[TTS] Audio source failed (${source.name}):`, e);
          tryNextSource();
        };

        audioTimeoutTimer = setTimeout(() => {
          if (!hasFinished && activeAudio === audio && audio.paused) {
            console.warn(`[TTS] Audio playback stalled on ${source.name}, trying next source`);
            tryNextSource();
          }
        }, 3500);

        audio.src = source.url;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(`[TTS] Play promise rejected for ${source.name}:`, err);
            tryNextSource();
          });
        }
      } catch (err) {
        console.warn(`[TTS] Exception playing audio source ${source.name}:`, err);
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
        console.warn('[TTS] Native speech failed or timed out, switching to Tier 2 fallback:', err);
        playFallbackAudio();
      }
    );
  } else {
    // Web Speech API unavailable, go straight to Tier 2
    playFallbackAudio();
  }

  return true;
};

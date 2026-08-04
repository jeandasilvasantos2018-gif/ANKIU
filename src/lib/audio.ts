/**
 * Multi-Tier Audio Player for Web, Vercel & Mobile (Median / GoNative WebView)
 * Solves Vercel CORS restrictions, hotlinking blocks, Median native WebView origin blocks, and browser autoplay policies.
 */

let activeAudio: HTMLAudioElement | null = null;
let voicesLoaded: SpeechSynthesisVoice[] = [];
let audioTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

// Pre-load voices for SpeechSynthesis in browser environment
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      voicesLoaded = window.speechSynthesis.getVoices();
    } catch (e) {
      // ignore
    }
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

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
    const matchVoice = voices.find(
      (v) => v.lang.startsWith(utterance.lang) || v.lang.toLowerCase().includes(language.toLowerCase())
    );
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

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

  const langCode = getLangCode(language);
  const pollyVoice = getPollyVoice(language);
  const encodedText = encodeURIComponent(cleanText.substring(0, 200));

  // Multi-tier Audio Sources
  // StreamElements (Amazon Polly) provides CORS-open MP3 streams that work everywhere including Median/GoNative WebViews & Vercel
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
      // Fallback to native Web Speech API if all remote streams fail (e.g., offline or restricted WebView)
      console.warn('All remote audio streams failed on Median/WebView/Web, using Web Speech API fallback...');
      playSpeechSynthesis(cleanText, language, rate, finishOnce);
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
        console.warn(`Audio stream failed (${url}), trying next audio source...`);
        tryNextSource();
      };

      // Set safety timeout (3s) for WebViews in case audio loads infinitely without error
      audioTimeoutTimer = setTimeout(() => {
        if (!hasFinished && activeAudio === audio && audio.paused) {
          console.warn(`Audio playback stalled or timed out on ${url}, trying next source...`);
          tryNextSource();
        }
      }, 3000);

      audio.src = url;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`Audio play promise rejected for ${url}:`, err);
          tryNextSource();
        });
      }
    } catch (err) {
      console.warn('HTMLAudioElement error:', err);
      tryNextSource();
    }
  };

  tryNextSource();
  return true;
};



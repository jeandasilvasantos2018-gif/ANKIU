/**
 * Audio Player for Android WebView (Median) & Web Browsers (Vercel compatible)
 * Uses high-quality MP3 TTS stream (StreamElements / Amazon Polly) with SpeechSynthesis fallback.
 */

let activeAudio: HTMLAudioElement | null = null;

/**
 * Maps ISO language code to natural Amazon Polly voice names
 */
const getPollyVoice = (lang: string = 'fr'): string => {
  const code = lang.toLowerCase().substring(0, 2);
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
 * Fallback Web Speech Synthesis for offline or fallback environments
 */
const playSpeechSynthesis = (
  text: string,
  language: string,
  rate: number,
  onEnd?: () => void
): boolean => {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
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

    const voices = window.speechSynthesis.getVoices();
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
    console.warn('SpeechSynthesis fallback error:', e);
    if (onEnd) onEnd();
    return false;
  }
};

/**
 * Play text-to-speech audio using real MP3 endpoint or Web Speech API fallback
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
      activeAudio = null;
      if (onEnd) onEnd();
    }
  };

  try {
    const voice = getPollyVoice(language);
    // Real MP3 audio endpoint (Amazon Polly via StreamElements API)
    const mp3Url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(
      voice
    )}&text=${encodeURIComponent(cleanText.substring(0, 250))}`;

    const audio = new Audio(mp3Url);
    activeAudio = audio;
    audio.playbackRate = rate;

    audio.onended = finishOnce;

    audio.onerror = (err) => {
      console.warn('MP3 Audio stream error, trying SpeechSynthesis fallback...', err);
      activeAudio = null;
      playSpeechSynthesis(cleanText, language, rate, finishOnce);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('HTML5 Audio play rejected, falling back to Web Speech Synthesis:', err);
        activeAudio = null;
        playSpeechSynthesis(cleanText, language, rate, finishOnce);
      });
    }

    return true;
  } catch (err) {
    console.warn('HTMLAudioElement initialization error, falling back to Web Speech Synthesis:', err);
    return playSpeechSynthesis(cleanText, language, rate, finishOnce);
  }
};

/**
 * Stop any active audio playback immediately
 */
export const stopAudio = () => {
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


/**
 * Web Speech API Audio Player with speed and voice detection support
 */

export const playAudio = (
  text: string,
  language: string = 'en',
  rate: number = 1.0,
  onEnd?: () => void
): boolean => {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser.');
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate; // 1.0 for normal, 0.75 for slow

  // Match voice code based on language tag
  const langCodeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    zh: 'zh-CN',
    ja: 'ja-JP',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
  };

  utterance.lang = langCodeMap[language] || language || 'en-US';

  // Find best matching voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(
    (v) => v.lang.startsWith(utterance.lang) || v.lang.includes(language)
  );

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
};

export const stopAudio = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

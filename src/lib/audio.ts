/**
 * Audio Player for Android WebView & Web Browsers using MP3 audio files / HTML5 Audio API
 */

let activeAudio: HTMLAudioElement | null = null;

export const playAudio = (
  text: string,
  language: string = 'fr',
  rate: number = 1.0,
  onEnd?: () => void
): boolean => {
  if (!text || typeof text !== 'string') return false;

  const cleanText = text.replace(/______/g, '').trim();
  if (!cleanText) return false;

  // Stop any currently playing audio
  stopAudio();

  try {
    // Primary URL: Server-side proxy returning MP3 audio
    const primaryUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(language)}`;
    // Fallback URL: Direct Google Translate TTS endpoint
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${encodeURIComponent(language)}&client=tw-ob`;

    const audio = new Audio(primaryUrl);
    activeAudio = audio;

    // Apply playback speed rate
    audio.playbackRate = rate;

    let hasEnded = false;
    const cleanupAndFinish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (activeAudio === audio) {
          activeAudio = null;
        }
        if (onEnd) onEnd();
      }
    };

    audio.onended = cleanupAndFinish;

    // Fallback handler if server endpoint fails
    audio.onerror = () => {
      console.warn('Primary TTS audio failed, trying fallback direct stream...');
      if (activeAudio === audio) {
        const fallbackAudio = new Audio(fallbackUrl);
        activeAudio = fallbackAudio;
        fallbackAudio.playbackRate = rate;
        fallbackAudio.onended = cleanupAndFinish;
        fallbackAudio.onerror = cleanupAndFinish;
        fallbackAudio.play().catch((err) => {
          console.warn('Fallback TTS audio play failed:', err);
          cleanupAndFinish();
        });
      } else {
        cleanupAndFinish();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio playback prevented or failed:', err);
        // Try fallback directly
        if (activeAudio === audio) {
          audio.src = fallbackUrl;
          audio.play().catch(() => cleanupAndFinish());
        } else {
          cleanupAndFinish();
        }
      });
    }

    return true;
  } catch (err) {
    console.error('Error initializing audio player:', err);
    if (onEnd) onEnd();
    return false;
  }
};

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
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const textRaw = req.query?.text;
    const langRaw = req.query?.lang;

    if (!textRaw || typeof textRaw !== 'string' || !textRaw.trim()) {
      return res.status(400).json({ error: 'Missing required query parameter: text' });
    }

    const cleanText = textRaw.trim().substring(0, 300);

    const langMap: Record<string, string> = {
      fr: 'fr',
      en: 'en',
      pt: 'pt-BR',
      es: 'es',
      de: 'de',
      it: 'it',
      ja: 'ja',
      zh: 'zh-CN',
    };

    const userLang = typeof langRaw === 'string' ? langRaw.toLowerCase().substring(0, 2) : 'fr';
    const targetLang = langMap[userLang] || 'fr';

    console.log('[TTS API] Request', { lang: targetLang, textLength: cleanText.length });

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      targetLang
    )}&q=${encodeURIComponent(cleanText)}`;

    const providerResponse = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    console.log('[TTS API] Provider status', providerResponse.status);

    if (!providerResponse.ok) {
      return res.status(502).json({ error: 'TTS provider failed' });
    }

    const audioBuffer = await providerResponse.arrayBuffer();
    console.log('[TTS API] Audio bytes returned', audioBuffer.byteLength);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('[TTS API] Error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

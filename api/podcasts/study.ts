import { GoogleGenAI, Type } from '@google/genai';

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

async function downloadAudio(audioUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(audioUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ANKIU/1.0 podcast transcription' },
    });
    if (!response.ok) throw new Error(`Audio download failed with HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength) throw new Error('Podcast audio download returned an empty file.');
    if (buffer.byteLength > MAX_AUDIO_BYTES) throw new Error('Podcast audio is larger than the transcription limit.');
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const ext = contentType.includes('ogg') ? 'ogg' : contentType.includes('wav') ? 'wav' : contentType.includes('mp4') || contentType.includes('m4a') ? 'm4a' : 'mp3';
    return { buffer, contentType, filename: `episode.${ext}` };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const episode = body.episode || {};
    if (!episode.id || !episode.audioUrl) return res.status(400).json({ error: 'Episode id and audioUrl are required.' });

    // Podcast enclosure URLs frequently answer with 301/302 redirects. Groq's remote URL
    // ingestion does not reliably follow those redirects, so ANKIU resolves/downloads the
    // media server-side and uploads the actual audio bytes to Whisper.
    const audio = await downloadAudio(String(episode.audioUrl));
    const form = new FormData();
    form.append('file', new Blob([audio.buffer], { type: audio.contentType }), audio.filename);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('language', 'fr');
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');
    form.append('timestamp_granularities[]', 'segment');
    form.append('prompt', `Transcription fidèle en français. Titre: ${episode.title || ''}. Podcast: ${episode.podcastName || ''}.`);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      console.error('[Groq Whisper] failed', groqResponse.status, detail.slice(0, 600));
      return res.status(502).json({ error: 'Groq transcription failed.', detail: detail.slice(0, 300) });
    }

    const transcription = await groqResponse.json();
    const transcript = String(transcription.text || '').trim();
    if (!transcript) return res.status(502).json({ error: 'Groq returned an empty transcript.' });

    const segments = Array.isArray(transcription.segments)
      ? transcription.segments.map((s: any) => ({ start: Number(s.start || 0), end: Number(s.end || 0), text: String(s.text || '').trim() })).filter((s: any) => s.text)
      : [];

    const gemini = getGemini();
    if (!gemini) {
      return res.status(200).json({ success: true, study: { episodeId: episode.id, transcript, segments, translationEn: '', summaryEn: '', level: 'B1', category: 'Conversations', objective: 'Understand the main ideas and key expressions in this French episode.', vocabulary: [], keyExpressions: [], generatedAt: new Date().toISOString() }, warning: 'GEMINI_API_KEY is not configured; transcription is available without AI enrichment.' });
    }

    const prompt = `You are processing a real French podcast episode for a language-learning app.\nReturn accurate educational metadata based ONLY on the transcript.\nAll explanations, summaries and translations must be in English. French vocabulary and expressions must remain in French.\nDo not invent content that is not supported by the transcript.\n\nEpisode title: ${episode.title || ''}\nPodcast: ${episode.podcastName || ''}\nTranscript:\n${transcript.slice(0, 60000)}\n\nTasks:\n1. Translate the full transcript into natural English.\n2. Write a concise English summary.\n3. Estimate CEFR listening level: A1, A2, B1, B2, or C1.\n4. Choose one category from: Vie quotidienne, Voyage, Culture, Actualités, Histoires, Conversations, Travail, Études.\n5. Write one specific listening objective in English.\n6. Extract 6-12 useful French vocabulary items from the transcript.\n7. Extract 4-8 useful French expressions with concise English meanings.`;

    const aiResponse = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translationEn: { type: Type.STRING }, summaryEn: { type: Type.STRING },
            level: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
            category: { type: Type.STRING, enum: ['Vie quotidienne', 'Voyage', 'Culture', 'Actualités', 'Histoires', 'Conversations', 'Travail', 'Études'] },
            objective: { type: Type.STRING }, vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyExpressions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { french: { type: Type.STRING }, english: { type: Type.STRING } }, required: ['french', 'english'] } },
          },
          required: ['translationEn', 'summaryEn', 'level', 'category', 'objective', 'vocabulary', 'keyExpressions'],
        },
      },
    });

    const enrichment = JSON.parse(aiResponse.text || '{}');
    return res.status(200).json({ success: true, study: { episodeId: episode.id, transcript, segments, ...enrichment, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    console.error('[Podcast study pipeline] error', error);
    return res.status(500).json({ error: error?.message || 'Podcast study processing failed.' });
  }
}

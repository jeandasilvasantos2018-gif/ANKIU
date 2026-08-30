import { GoogleGenAI, Type } from '@google/genai';
import ffmpegPath from 'ffmpeg-static';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export const config = { maxDuration: 300 };

const execFileAsync = promisify(execFile);
const DIRECT_UPLOAD_LIMIT = 20 * 1024 * 1024;
const CHUNK_SECONDS = 12 * 60;
const DOWNLOAD_TIMEOUT_MS = 90_000;

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

async function downloadEpisode(audioUrl: string, targetPath: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(audioUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ANKIU/1.0 podcast transcription' },
    });
    if (!response.ok || !response.body) throw new Error(`Audio download failed with HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(targetPath));
    const fileStat = await stat(targetPath);
    if (!fileStat.size) throw new Error('Podcast audio download returned an empty file.');
    return { size: fileStat.size, contentType: response.headers.get('content-type') || 'audio/mpeg', finalUrl: response.url || audioUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function extensionForContentType(contentType = '') {
  if (contentType.includes('ogg')) return 'ogg';
  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('mp4') || contentType.includes('m4a')) return 'm4a';
  return 'mp3';
}

async function segmentAudio(inputPath: string, workDir: string) {
  if (!ffmpegPath) throw new Error('FFmpeg is unavailable in this deployment.');
  const outputPattern = path.join(workDir, 'chunk-%03d.mp3');
  await execFileAsync(ffmpegPath, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', inputPath,
    '-map', '0:a:0',
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '48k',
    '-f', 'segment',
    '-segment_time', String(CHUNK_SECONDS),
    '-reset_timestamps', '1',
    outputPattern,
  ], { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });

  const chunks = (await readdir(workDir))
    .filter((name) => /^chunk-\d{3}\.mp3$/.test(name))
    .sort()
    .map((name) => path.join(workDir, name));
  if (!chunks.length) throw new Error('FFmpeg could not create podcast segments.');
  return chunks;
}

async function callGroq(groqKey: string, filePath: string, episode: any, attempt = 0): Promise<any> {
  const buffer = await readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'audio/mpeg' }), path.basename(filePath));
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'fr');
  form.append('response_format', 'verbose_json');
  form.append('temperature', '0');
  form.append('timestamp_granularities[]', 'segment');
  form.append('prompt', `Transcription fidèle en français. Titre: ${episode.title || ''}. Podcast: ${episode.podcastName || ''}.`);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body: form,
  });

  if (response.status === 429 && attempt < 2) {
    const retryAfter = Math.max(2, Number(response.headers.get('retry-after') || 2));
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return callGroq(groqKey, filePath, episode, attempt + 1);
  }

  if (!response.ok) {
    const detail = await response.text();
    console.error('[Groq Whisper] failed', response.status, detail.slice(0, 600));
    throw new Error(`Groq transcription failed: ${detail.slice(0, 260)}`);
  }
  return response.json();
}

async function transcribeEpisode(groqKey: string, episode: any) {
  const workDir = path.join(tmpdir(), `ankiu-podcast-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });
  const inputPath = path.join(workDir, 'episode.bin');

  try {
    const downloaded = await downloadEpisode(String(episode.audioUrl), inputPath);
    let files: string[];
    let chunked = false;

    if (downloaded.size <= DIRECT_UPLOAD_LIMIT) {
      const ext = extensionForContentType(downloaded.contentType);
      const renamedPath = path.join(workDir, `episode.${ext}`);
      const original = await readFile(inputPath);
      await import('node:fs/promises').then(({ writeFile }) => writeFile(renamedPath, original));
      files = [renamedPath];
    } else {
      files = await segmentAudio(inputPath, workDir);
      chunked = true;
    }

    const transcriptParts: string[] = [];
    const allSegments: Array<{ start: number; end: number; text: string }> = [];

    for (let index = 0; index < files.length; index += 1) {
      const part = await callGroq(groqKey, files[index], episode);
      const text = String(part.text || '').trim();
      if (text) transcriptParts.push(text);

      const offset = chunked ? index * CHUNK_SECONDS : 0;
      if (Array.isArray(part.segments) && part.segments.length) {
        for (const segment of part.segments) {
          const segmentText = String(segment.text || '').trim();
          if (!segmentText) continue;
          allSegments.push({
            start: offset + Number(segment.start || 0),
            end: offset + Number(segment.end || 0),
            text: segmentText,
          });
        }
      } else if (text) {
        const duration = Number(part.duration || (chunked ? CHUNK_SECONDS : episode.duration || 0));
        allSegments.push({ start: offset, end: offset + Math.max(0, duration), text });
      }
    }

    return {
      text: transcriptParts.join('\n\n').trim(),
      segments: allSegments,
      chunkCount: files.length,
      chunked,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
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

    const transcription = await transcribeEpisode(groqKey, episode);
    const transcript = transcription.text;
    if (!transcript) return res.status(502).json({ error: 'Groq returned an empty transcript.' });

    const segments = transcription.segments;
    const gemini = getGemini();
    if (!gemini) {
      return res.status(200).json({
        success: true,
        study: {
          episodeId: episode.id, transcript, segments, translationEn: '', summaryEn: '', level: 'B1', category: 'Conversations',
          objective: 'Understand the main ideas and key expressions in this French episode.', vocabulary: [], keyExpressions: [],
          generatedAt: new Date().toISOString(),
        },
        processing: { chunked: transcription.chunked, chunkCount: transcription.chunkCount },
        warning: 'GEMINI_API_KEY is not configured; transcription is available without AI enrichment.',
      });
    }

    const prompt = `You are processing a real French podcast episode for a language-learning app.\nReturn accurate educational metadata based ONLY on the transcript.\nAll explanations, summaries and translations must be in English. French vocabulary and expressions must remain in French.\nDo not invent content that is not supported by the transcript.\n\nEpisode title: ${episode.title || ''}\nPodcast: ${episode.podcastName || ''}\nTranscript:\n${transcript.slice(0, 120000)}\n\nTasks:\n1. Translate the transcript into natural English as completely as possible.\n2. Write a concise English summary.\n3. Estimate CEFR listening level: A1, A2, B1, B2, or C1.\n4. Choose one category from: Vie quotidienne, Voyage, Culture, Actualités, Histoires, Conversations, Travail, Études.\n5. Write one specific listening objective in English.\n6. Extract 6-12 useful French vocabulary items from the transcript.\n7. Extract 4-8 useful French expressions with concise English meanings.`;

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
    return res.status(200).json({
      success: true,
      study: { episodeId: episode.id, transcript, segments, ...enrichment, generatedAt: new Date().toISOString() },
      processing: { chunked: transcription.chunked, chunkCount: transcription.chunkCount },
    });
  } catch (error: any) {
    console.error('[Podcast study pipeline] error', error);
    return res.status(500).json({ error: error?.message || 'Podcast study processing failed.' });
  }
}

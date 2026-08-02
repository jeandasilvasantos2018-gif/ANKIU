import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI on the server
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Route: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Route: Text-To-Speech MP3 Audio Stream for Android WebView & Web Browsers
app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text as string) || '';
    const lang = (req.query.lang as string) || 'fr';
    if (!text.trim()) {
      return res.status(400).send('Text parameter is required.');
    }

    const cleanText = text.replace(/______/g, '').substring(0, 200);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`TTS server response error: ${response.status}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error serving TTS audio stream:', err);
    res.status(500).send('Error generating TTS audio file.');
  }
});

// API Route: Generate complete FlashCard using Gemini AI
app.post('/api/gemini/generate-card', async (req, res) => {
  try {
    const ai = getAi();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { word, language = 'fr', userLanguage = 'en' } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Palavra é obrigatória.' });
    }

    const prompt = `Gere os dados completos de um cartão de memória de idiomas para a palavra/expressão em francês "${word}".
AS TRADUÇÕES (campo 'translation' e 'exampleTranslation') DEVEM SER OBRIGATORIAMENTE EM INGLÊS (tradução do Francês para o Inglês).
Forneça pronúncia IPA, classe gramatical (Verb, Noun, Adjective, etc.), tradução direta para o inglês, definição simples, frase de exemplo em francês, tradução da frase de exemplo para o inglês, sinônimos, antônimos, palavras relacionadas, expressões idiomáticas, colocações comuns, e família de palavras.
Adicione também 2 a 3 tags adequadas (ex: CEFR B1, Travel, Business, Daily).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            translation: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            related: { type: Type.ARRAY, items: { type: Type.STRING } },
            expressions: { type: Type.ARRAY, items: { type: Type.STRING } },
            collocations: { type: Type.ARRAY, items: { type: Type.STRING } },
            family: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'word',
            'partOfSpeech',
            'translation',
            'definition',
            'example',
            'exampleTranslation',
          ],
        },
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: 'Não foi possível gerar a palavra.' });
    }

    const cardData = JSON.parse(response.text.trim());
    res.json({ success: true, card: cardData });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-card:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar cartão com IA.' });
  }
});

// API Route: Generate contextual examples using Gemini
app.post('/api/gemini/generate-examples', async (req, res) => {
  try {
    const ai = getAi();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { word, context = 'geral', count = 3 } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Gere ${count} frases curtas de exemplo com a palavra "${word}" em contexto de "${context}", com tradução para o português.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING },
              translation: { type: Type.STRING },
            },
            required: ['sentence', 'translation'],
          },
        },
      },
    });

    const examples = JSON.parse(response.text?.trim() || '[]');
    res.json({ success: true, examples });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao gerar exemplos com IA.' });
  }
});

// API Route: Generate Dynamic Quiz Challenge using Gemini AI
app.post('/api/gemini/generate-challenge', async (req, res) => {
  try {
    const ai = getAi();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { cards = [], count = 5, focus = 'difficult' } = req.body;

    const cardsPrompt = cards
      .slice(0, 15)
      .map(
        (c: any) =>
          `- Palavra: "${c.word}", Tradução: "${c.translation}", Exemplo: "${c.example}", Estado: "${c.state}", Facilidade: ${c.easeFactor}`
      )
      .join('\n');

    const prompt = `Você é um tutor especialista de francês.
Crie um conjunto de ${count} questões de desafio (quiz) interativo para um estudante de francês.
Use como base principalmente as seguintes palavras da coleção do usuário, dando prioridade para as palavras mais difíceis ou em aprendizado:
${cardsPrompt}

Instruções para os tipos de perguntas:
- 'fill_blank': Frase contextual em francês contendo '______' para preencher com a palavra correta em francês.
- 'translation': Teste de tradução da palavra/frase em contexto (Francês -> Inglês).
- 'context_choice': Escolha da palavra mais adequada para o contexto gramatical/semântico em francês.

Regras importantes:
1. Crie exatamente 4 opções distintas para cada pergunta.
2. A 'correctAnswer' DEVE corresponder exatamente a uma das 4 'options'.
3. 'translation' deve ser a tradução precisa da frase/resposta em Inglês.
4. 'explanation' deve explicar brevemente e claramente o porquê da resposta.
5. Torne as perguntas desafiadoras porém justas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              word: { type: Type.STRING },
              promptSentence: { type: Type.STRING },
              translation: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              difficultyTag: { type: Type.STRING },
            },
            required: [
              'type',
              'word',
              'promptSentence',
              'translation',
              'options',
              'correctAnswer',
              'explanation',
            ],
          },
        },
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: 'Não foi possível gerar as perguntas do desafio.' });
    }

    const questions = JSON.parse(response.text.trim());
    res.json({ success: true, questions });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-challenge:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar desafio com IA.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

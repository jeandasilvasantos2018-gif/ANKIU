import { GoogleGenAI, Type } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { word, language = 'fr', userLanguage = 'en' } = body;

    console.log('[Gemini API] generate-card request', { word, language, userLanguage });

    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Palavra é obrigatória.' });
    }

    const ai = getAi();
    if (!ai) {
      console.error('[Gemini API] error: GEMINI_API_KEY missing');
      return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const cleanWord = word.trim();
    const prompt = `Gere os dados completos de um cartão de memória de idiomas para a palavra/expressão em francês "${cleanWord}".
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

    console.log('[Gemini API] response received');

    if (!response.text) {
      console.error('[Gemini API] error: empty response text');
      return res.status(500).json({ error: 'Não foi possível gerar a palavra.' });
    }

    const cardData = JSON.parse(response.text.trim());
    console.log('[Gemini API] parsing completed');

    return res.status(200).json({ success: true, card: cardData });
  } catch (err: any) {
    console.error('[Gemini API] error', err);
    return res.status(500).json({ error: err?.message || 'Erro ao gerar cartão com IA.' });
  }
}

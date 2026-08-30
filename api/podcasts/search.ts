const LISTEN_NOTES_BASE = 'https://listen-api.listennotes.com/api/v2';

const cleanHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.LISTEN_NOTES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'LISTEN_NOTES_API_KEY is not configured.' });

  try {
    const q = String(req.query?.q || 'français').trim();
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const params = new URLSearchParams({
      q: q || 'français',
      type: 'episode',
      language: 'French',
      safe_mode: '1',
      sort_by_date: '1',
      offset: String(offset),
    });

    const response = await fetch(`${LISTEN_NOTES_BASE}/search?${params.toString()}`, {
      headers: { 'X-ListenAPI-Key': apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Listen Notes] search failed', response.status, text.slice(0, 500));
      return res.status(response.status).json({ error: 'Listen Notes search failed.' });
    }

    const data = await response.json();
    const episodes = (data.results || [])
      .filter((item: any) => item?.id && item?.audio)
      .map((item: any) => ({
        id: item.id,
        title: cleanHtml(item.title_original || item.title_highlighted || item.title || 'Episode'),
        description: cleanHtml(item.description_original || item.description_highlighted || item.description || ''),
        podcastName: cleanHtml(item.podcast?.title_original || item.podcast_title_original || item.publisher_original || 'Podcast'),
        audioUrl: item.audio,
        imageUrl: item.thumbnail || item.image || item.podcast?.thumbnail || item.podcast?.image,
        duration: Number(item.audio_length_sec || 0) || undefined,
        sourceUrl: item.listennotes_url || item.link,
        publishedAt: item.pub_date_ms ? new Date(item.pub_date_ms).toISOString() : undefined,
        explicit: Boolean(item.explicit_content),
      }));

    return res.status(200).json({
      success: true,
      episodes,
      total: data.total || episodes.length,
      nextOffset: offset + episodes.length,
    });
  } catch (error: any) {
    console.error('[Listen Notes] error', error);
    return res.status(500).json({ error: error?.message || 'Unable to load podcasts.' });
  }
}

const TADDY_API_URL = 'https://api.taddy.org';

const cleanHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = process.env.TADDY_USER_ID;
  const apiKey = process.env.TADDY_API_KEY;
  if (!userId || !apiKey) return res.status(500).json({ error: 'TADDY_USER_ID or TADDY_API_KEY is not configured.' });

  try {
    const rawTerm = String(req.query?.q || '').trim();
    const term = rawTerm || 'français facile';
    const page = Math.min(20, Math.max(1, Number(req.query?.page || 1)));
    const limit = Math.min(25, Math.max(1, Number(req.query?.limit || 18)));

    const query = `
      query SearchFrenchEpisodes($term: String!, $page: Int!, $limit: Int!) {
        search(
          term: $term,
          page: $page,
          limitPerPage: $limit,
          filterForTypes: PODCASTEPISODE,
          filterForLanguages: FRENCH,
          filterForPodcastContentType: AUDIO,
          sortBy: POPULARITY,
          matchBy: MOST_TERMS,
          isSafeMode: true
        ) {
          searchId
          podcastEpisodes {
            uuid
            name
            description(shouldStripHtmlTags: true)
            imageUrl
            audioUrl
            duration
            datePublished
            websiteUrl
            isExplicitContent
            podcastSeries {
              uuid
              name
              imageUrl
              language
            }
          }
        }
      }
    `;

    const response = await fetch(TADDY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId,
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ query, variables: { term, page, limit } }),
    });

    const raw = await response.text();
    let payload: any = {};
    try { payload = JSON.parse(raw); } catch { payload = {}; }

    if (!response.ok || payload?.errors?.length) {
      const detail = payload?.errors?.map((e: any) => e?.message).filter(Boolean).join(' | ') || raw.slice(0, 500) || `HTTP ${response.status}`;
      console.error('[Taddy] search failed', response.status, detail);
      return res.status(response.ok ? 502 : response.status).json({ error: 'Taddy podcast search failed.', detail });
    }

    const items = payload?.data?.search?.podcastEpisodes || [];
    const episodes = items
      .filter((item: any) => item?.uuid && item?.audioUrl && item?.podcastSeries?.language === 'FRENCH')
      .map((item: any) => ({
        id: item.uuid,
        title: cleanHtml(item.name || 'Episode'),
        description: cleanHtml(item.description || ''),
        podcastName: cleanHtml(item.podcastSeries?.name || 'Podcast'),
        audioUrl: item.audioUrl,
        imageUrl: item.imageUrl || item.podcastSeries?.imageUrl,
        duration: Number(item.duration || 0) || undefined,
        sourceUrl: item.websiteUrl || undefined,
        publishedAt: item.datePublished ? new Date(Number(item.datePublished) * 1000).toISOString() : undefined,
        explicit: Boolean(item.isExplicitContent),
        language: 'fr',
      }));

    return res.status(200).json({ success: true, provider: 'taddy', language: 'fr', episodes, page, nextPage: page + 1 });
  } catch (error: any) {
    console.error('[Taddy] error', error);
    return res.status(500).json({ error: error?.message || 'Unable to load podcasts.' });
  }
}

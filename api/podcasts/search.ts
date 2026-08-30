const TADDY_API_URL = 'https://api.taddy.org';

const cleanHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = process.env.TADDY_USER_ID;
  const apiKey = process.env.TADDY_API_KEY;
  if (!userId || !apiKey) {
    return res.status(500).json({ error: 'TADDY_USER_ID or TADDY_API_KEY is not configured.' });
  }

  try {
    const term = String(req.query?.q || 'français').trim() || 'français';
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
          sortBy: POPULARITY,
          matchBy: MOST_TERMS
        ) {
          searchId
          podcastEpisodes {
            uuid
            name
            subtitle
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
            }
          }
          responseDetails {
            totalResults
            totalPages
            currentPage
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

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.errors?.length) {
      const detail = payload?.errors?.map((e: any) => e?.message).filter(Boolean).join(' | ') || `HTTP ${response.status}`;
      console.error('[Taddy] search failed', detail);
      return res.status(response.ok ? 502 : response.status).json({ error: 'Taddy podcast search failed.', detail });
    }

    const search = payload?.data?.search || {};
    const episodes = (search.podcastEpisodes || [])
      .filter((item: any) => item?.uuid && item?.audioUrl)
      .map((item: any) => ({
        id: item.uuid,
        title: cleanHtml(item.name || 'Episode'),
        description: cleanHtml(item.subtitle || item.description || ''),
        podcastName: cleanHtml(item.podcastSeries?.name || 'Podcast'),
        audioUrl: item.audioUrl,
        imageUrl: item.imageUrl || item.podcastSeries?.imageUrl,
        duration: Number(item.duration || 0) || undefined,
        sourceUrl: item.websiteUrl || undefined,
        publishedAt: item.datePublished ? new Date(Number(item.datePublished) * 1000).toISOString() : undefined,
        explicit: Boolean(item.isExplicitContent),
      }));

    const details = Array.isArray(search.responseDetails) ? search.responseDetails[0] : search.responseDetails;
    return res.status(200).json({
      success: true,
      provider: 'taddy',
      episodes,
      page,
      total: Number(details?.totalResults || episodes.length),
      totalPages: Number(details?.totalPages || 1),
      nextPage: page + 1,
    });
  } catch (error: any) {
    console.error('[Taddy] error', error);
    return res.status(500).json({ error: error?.message || 'Unable to load podcasts.' });
  }
}

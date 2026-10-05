import { AnimeItem, Episode, PodcastShow } from '../types';
import { stripHtml } from './format';

// ---------- Jikan (MyAnimeList data, free, no key) ----------
const JIKAN = 'https://api.jikan.moe/v4';

async function jikan(path: string): Promise<any> {
  const r = await fetch(JIKAN + path);
  if (!r.ok) throw new Error(`Anime API error ${r.status}`);
  return r.json();
}

export function normAnime(a: any): AnimeItem {
  return {
    id: a.mal_id,
    title: a.title_english || a.title || 'Unknown',
    image: a.images?.jpg?.image_url || a.images?.jpg?.small_image_url || '',
    score: a.score ?? undefined,
    scoredBy: a.scored_by ?? undefined,
    synopsis: (a.synopsis || 'No synopsis available.')
      .replace(/\[Written by MAL Rewrite\]/g, '').trim(),
    genres: (a.genres || []).map((g: any) => g.name),
    episodes: a.episodes ?? undefined,
    status: a.status || 'Unknown',
    year: a.year ?? a.aired?.prop?.from?.year ?? undefined,
  };
}

export async function topAiring(): Promise<AnimeItem[]> {
  const j = await jikan('/top/anime?filter=airing&limit=12&sfw=true');
  return (j.data || []).map(normAnime);
}

export async function seasonNow(): Promise<AnimeItem[]> {
  const j = await jikan('/seasons/now?limit=12&sfw=true');
  return (j.data || []).map(normAnime);
}

export async function searchAnime(q: string): Promise<AnimeItem[]> {
  const j = await jikan(
    `/anime?q=${encodeURIComponent(q)}&limit=15&order_by=members&sort=desc&sfw=true`
  );
  return (j.data || []).map(normAnime);
}

export async function animeFull(id: number): Promise<AnimeItem> {
  const j = await jikan(`/anime/${id}/full`);
  return normAnime(j.data);
}

// ---------- Podcasts via iTunes Search (feedUrl -> real RSS) ----------
export async function searchPodcasts(term: string): Promise<PodcastShow[]> {
  const r = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=25`
  );
  if (!r.ok) throw new Error(`Podcast search error ${r.status}`);
  const j = await r.json();
  return (j.results || [])
    .filter((x: any) => x.feedUrl)
    .map((x: any) => ({
      id: x.collectionId,
      name: x.collectionName,
      artist: x.artistName,
      art: (x.artworkUrl600 || x.artworkUrl100 || '').replace('100x100', '600x600'),
      feedUrl: x.feedUrl,
      episodeCount: x.trackCount,
      genre: x.primaryGenreName || 'Podcasts',
    }));
}

// ---------- Minimal RSS parser for episode lists ----------
function unescapeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function tagText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? unescapeXml(m[1]).trim() : '';
}

export async function fetchEpisodes(feedUrl: string, limit = 40): Promise<Episode[]> {
  const r = await fetch(feedUrl);
  if (!r.ok) throw new Error(`Feed error ${r.status}`);
  const xml = await r.text();
  const items = xml.split(/<item[\s>]/i).slice(1);
  const eps: Episode[] = [];
  for (const raw of items) {
    const itemXml = raw.split(/<\/item>/i)[0];
    const enc = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);
    const audioUrl = enc ? unescapeXml(enc[1]) : '';
    if (!audioUrl) continue;
    const title = tagText(itemXml, 'title') || 'Untitled episode';
    const pubDate = tagText(itemXml, 'pubDate');
    const duration = tagText(itemXml, 'itunes:duration') || tagText(itemXml, 'duration');
    const description = stripHtml(
      tagText(itemXml, 'itunes:summary') || tagText(itemXml, 'description')
    ).slice(0, 300);
    eps.push({ id: audioUrl, title, pubDate, duration, audioUrl, description });
    if (eps.length >= limit) break;
  }
  return eps;
}

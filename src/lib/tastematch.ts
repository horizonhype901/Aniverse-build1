/**
 * On-device taste-match recommender — no servers, no popularity contest.
 * Scores the bundled catalog against YOUR watchlist by genre overlap, so
 * recommendations reflect your taste instead of MAL's score-band suggestions.
 * (MAL's own "suggestions" are just unrated anime in a score band — see CHANGELOG.)
 */
import { AnimeItem, WatchEntry } from '../types';

export interface TastePick {
  anime: AnimeItem;
  score: number;
  becauseOf: string; // watchlist title driving the pick
  sharedGenres: string[];
}

const STATUS_WEIGHT: Record<WatchEntry['status'], number> = {
  watching: 1,
  completed: 1,
  plan: 0.5,
  onhold: 0.5,
  dropped: 0, // dropped = dislike signal, never recommend from it
};

export function tasteMatches(
  watchlist: WatchEntry[],
  catalog: AnimeItem[],
  limit = 8
): TastePick[] {
  const inList = new Set(watchlist.map((w) => w.anime.id));
  const usable = watchlist.filter((w) => STATUS_WEIGHT[w.status] > 0);
  if (usable.length === 0) return [];

  const picks: TastePick[] = [];
  for (const cand of catalog) {
    if (inList.has(cand.id)) continue;
    let best: TastePick | null = null;
    for (const w of usable) {
      const shared = cand.genres.filter((g) => w.anime.genres.includes(g));
      if (shared.length === 0) continue;
      // genre overlap × status weight, tie-broken toward higher-scored titles
      const score =
        shared.length * STATUS_WEIGHT[w.status] + (cand.score ?? 0) / 100;
      if (!best || score > best.score) {
        best = { anime: cand, score, becauseOf: w.anime.title, sharedGenres: shared };
      }
    }
    if (best) picks.push(best);
  }
  picks.sort((a, b) => b.score - a.score);
  return picks.slice(0, limit);
}

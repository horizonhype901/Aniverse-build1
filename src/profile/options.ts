import { FALLBACK_ANIME } from '../data/seed';

export const BANNERS: [string, string][] = [  ['#FF4D6D', '#8B5CF6'],
  ['#0D0A1A', '#4A3B8C'],
  ['#22D3EE', '#1B3B8C'],
  ['#FFC94D', '#FF6A3D'],
  ['#4ADE80', '#0E7C5B'],
  ['#F472B6', '#7C3AED'],
  ['#23232B', '#5B5B6E'],
  ['#FF9A8B', '#B565D8'],
];
export const BANNER_NAMES = ['Sunset Pop', 'Midnight', 'Abyss', 'Ember', 'Forest', 'Neon Bloom', 'Mono', 'Dream'];

export interface ProfileTheme { name: string; card: string; accent: string; chip: string; }
export const THEMES: ProfileTheme[] = [
  { name: 'Midnight', card: '#1B1533', accent: '#FF4D6D', chip: '#2C2350' },
  { name: 'Sakura', card: '#2E1A28', accent: '#F472B6', chip: '#3D1A2E' },
  { name: 'Ocean', card: '#10293F', accent: '#22D3EE', chip: '#0A1B2B' },
  { name: 'Matcha', card: '#1A2B14', accent: '#4ADE80', chip: '#101B0A' },
  { name: 'Ember', card: '#2B1A10', accent: '#FF9A3D', chip: '#3D2415' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SEED_BIOS = [
  'Professional episode-one judger. I decide in 24 minutes.',
  'Dub enjoyer. Sub purists, we can still be friends.',
  'My watchlist is longer than One Piece.',
  'Here for the openings, staying for the endings.',
  'I cry at sports anime. Every. Time.',
  'Manga reader trying not to spoil anything. Trying.',
  'Anime podcasts got me here. No regrets.',
  'Collecting figures, dodging spoilers, living my best life.',
];

const SEED_ANTHEMS: { track: string; artist: string }[] = [
  { track: 'Gurenge', artist: 'LiSA' },
  { track: 'Unravel', artist: 'TK from Ling Tosite Sigure' },
  { track: 'Idol', artist: 'YOASOBI' },
  { track: 'Kaibutsu', artist: 'YOASOBI' },
  { track: 'A Cruel Angel\'s Thesis', artist: 'Yoko Takahashi' },
  { track: 'Silhouette', artist: 'KANA-BOON' },
  { track: 'Again', artist: 'YUI' },
  { track: 'Blue Bird', artist: 'Ikimonogakari' },
];

export const bioFor = (name: string): string =>
  SEED_BIOS[hashStr(name) % SEED_BIOS.length];

export const anthemFor = (name: string): { track: string; artist: string } =>
  SEED_ANTHEMS[hashStr(name + ':anthem') % SEED_ANTHEMS.length];

export const bannerFor = (name: string): number =>
  hashStr(name + ':banner') % BANNERS.length;

/** 3 deterministic favorite anime (MAL ids) for a community member. */
export function showcaseFor(name: string): number[] {
  const h = hashStr(name + ':show');
  const n = FALLBACK_ANIME.length;
  const ids = [h % n, (h >> 3) % n, (h >> 6) % n].map((i) => FALLBACK_ANIME[i].id);
  return [...new Set(ids)].slice(0, 3);
}

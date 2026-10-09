import AsyncStorage from '@react-native-async-storage/async-storage';
import { Comment, ListeningStats, MangaEntry, Mutes, Post, Profile, ProgressEntry, Topic, WatchEntry } from '../types';
import { SEED_COMMENTS, SEED_POSTS, SEED_REACTIONS } from '../data/seed';

export const K = {
  posts: 'aniverse:posts:v1',
  comments: 'aniverse:comments:v1',
  likes: 'aniverse:likes:v1',       // string[] of post ids
  commentLikes: 'aniverse:commentLikes:v1', // string[] of comment ids
  votes: 'aniverse:votes:v1',       // Record<pollId, optionIndex>
  watch: 'aniverse:watchlist:v1',   // WatchEntry[]
  profile: 'aniverse:profile:v1',   // Profile
  subs: 'aniverse:subs:v1',         // PodcastShow[]
  seeded: 'aniverse:seeded:v1',
  reactions: 'aniverse:reactions:v1',   // Record<postId, Record<emoji, number>>
  myReactions: 'aniverse:myReactions:v1', // Record<postId, emoji>
  mutes: 'aniverse:mutes:v1',           // Mutes
  predictions: 'aniverse:predictions:v1', // Record<pollId, 'right'|'wrong'>
  listening: 'aniverse:listening:v1',   // ListeningStats
  checkins: 'aniverse:checkins:v1',     // string[] YYYY-MM-DD
  onboarded: 'aniverse:onboarded:v1',
  progress: 'aniverse:progress:v1',     // Record<animeId, ProgressEntry>
  favTopics: 'aniverse:favTopics:v1',   // Topic[]
  manga: 'aniverse:manga:v1',           // MangaEntry[]
  lastCommentAt: 'aniverse:lastCommentAt:v1', // epoch ms (comment slow mode)
  studioTab: 'aniverse:studioTab:v1',   // string (avatar studio last category)
  openStudio: 'aniverse:openStudio:v1', // 'yes' → open AvatarStudio after onboarding
};

async function get<T>(key: string, fb: T): Promise<T> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fb;
  } catch {
    return fb;
  }
}

async function set(key: string, v: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(v));
}

/** First-run seeding so the feed feels alive. */
export async function ensureSeeded(): Promise<void> {
  const done = await get<string | null>(K.seeded, null);
  if (done) {
    // v1 users upgrading: skip the new onboarding quiz, keep their data
    const ob = await get<string | null>(K.onboarded, null);
    if (!ob) await set(K.onboarded, 'yes');
    return;
  }
  await set(K.posts, SEED_POSTS);
  await set(K.comments, SEED_COMMENTS);
  await set(K.likes, []);
  await set(K.commentLikes, []);
  await set(K.votes, {});
  await set(K.watch, []);
  await set(K.profile, {
    username: 'NewOtaku',
    bio: 'Just here for the anime talk 🎌',
    color: '#FF4D6D',
  } as Profile);
  await set(K.subs, []);
  await set(K.reactions, SEED_REACTIONS);
  await set(K.myReactions, {});
  await set(K.mutes, { words: [], anime: [] } as Mutes);
  await set(K.predictions, {});
  await set(K.listening, { episodesCompleted: 0, secondsListened: 0, completedIds: [] } as ListeningStats);
  await set(K.checkins, []);
  await set(K.progress, {});
  await set(K.favTopics, []);
  await set(K.seeded, 'yes');
}

export const store = {
  // posts
  posts: () => get<Post[]>(K.posts, []),
  savePosts: (p: Post[]) => set(K.posts, p),
  // comments: Record<postId, Comment[]>
  comments: () => get<Record<string, Comment[]>>(K.comments, {}),
  saveComments: (c: Record<string, Comment[]>) => set(K.comments, c),
  // likes
  likes: () => get<string[]>(K.likes, []),
  saveLikes: (l: string[]) => set(K.likes, l),
  commentLikes: () => get<string[]>(K.commentLikes, []),
  saveCommentLikes: (l: string[]) => set(K.commentLikes, l),
  // poll votes
  votes: () => get<Record<string, number>>(K.votes, {}),
  saveVotes: (v: Record<string, number>) => set(K.votes, v),
  // watchlist
  watchlist: () => get<WatchEntry[]>(K.watch, []),
  saveWatchlist: (w: WatchEntry[]) => set(K.watch, w),
  // profile
  profile: async () => {
    const p = await get<Profile>(K.profile, { username: 'NewOtaku', bio: '', color: '#FF4D6D', banner: 0, theme: 0 });
    // migrate older profiles
    if (p.banner === undefined) p.banner = 0;
    if (p.theme === undefined) p.theme = 0;
    if (!Array.isArray(p.showcase)) p.showcase = [];
    if (!Array.isArray(p.anthemHistory)) p.anthemHistory = [];
    return p;
  },
  studioTab: () => get<string>(K.studioTab, 'skin'),
  saveStudioTab: (t: string) => set(K.studioTab, t),
  wantsStudio: () => get<string>(K.openStudio, ''),
  setWantsStudio: (v: string) => set(K.openStudio, v),
  saveProfile: (p: Profile) => set(K.profile, p),
  // podcast subscriptions
  subs: () => get<import('../types').PodcastShow[]>(K.subs, []),
  saveSubs: (s: import('../types').PodcastShow[]) => set(K.subs, s),
  // reactions
  reactions: () => get<Record<string, Record<string, number>>>(K.reactions, {}),
  saveReactions: (r: Record<string, Record<string, number>>) => set(K.reactions, r),
  myReactions: () => get<Record<string, string>>(K.myReactions, {}),
  saveMyReactions: (r: Record<string, string>) => set(K.myReactions, r),
  // mutes
  mutes: () => get<Mutes>(K.mutes, { words: [], anime: [] }),
  saveMutes: (m: Mutes) => set(K.mutes, m),
  // predictions
  predictions: () => get<Record<string, 'right' | 'wrong'>>(K.predictions, {}),
  savePredictions: (p: Record<string, 'right' | 'wrong'>) => set(K.predictions, p),
  // listening stats
  listening: () =>
    get<ListeningStats>(K.listening, { episodesCompleted: 0, secondsListened: 0, completedIds: [] }),
  saveListening: (l: ListeningStats) => set(K.listening, l),
  // daily check-ins (YYYY-MM-DD)
  checkins: () => get<string[]>(K.checkins, []),
  saveCheckins: (c: string[]) => set(K.checkins, c),
  // per-anime watch progress
  progress: () => get<Record<number, ProgressEntry>>(K.progress, {}),
  saveProgress: (p: Record<number, ProgressEntry>) => set(K.progress, p),
  // manga shelf
  manga: () => get<MangaEntry[]>(K.manga, []),
  saveManga: (m: MangaEntry[]) => set(K.manga, m),
  // comment slow mode
  lastCommentAt: () => get<number>(K.lastCommentAt, 0),
  saveLastCommentAt: (t: number) => set(K.lastCommentAt, t),
  // onboarding
  onboarded: () => get<string | null>(K.onboarded, null),
  setOnboarded: () => set(K.onboarded, 'yes'),
  favTopics: () => get<Topic[]>(K.favTopics, []),
  saveFavTopics: (t: Topic[]) => set(K.favTopics, t),
};

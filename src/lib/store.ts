import AsyncStorage from '@react-native-async-storage/async-storage';
import { Comment, Post, Profile, WatchEntry } from '../types';
import { SEED_COMMENTS, SEED_POSTS } from '../data/seed';

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
  if (done) return;
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
  profile: () =>
    get<Profile>(K.profile, { username: 'NewOtaku', bio: '', color: '#FF4D6D' }),
  saveProfile: (p: Profile) => set(K.profile, p),
  // podcast subscriptions
  subs: () => get<import('../types').PodcastShow[]>(K.subs, []),
  saveSubs: (s: import('../types').PodcastShow[]) => set(K.subs, s),
};

export type Topic =
  | 'Episode Talk' | 'Theories' | 'Recommendations' | 'Art & Cosplay'
  | 'News' | 'Hot Takes' | 'Help' | 'General';

export interface PollOption { text: string; votes: number; }
export interface Poll { id: string; question: string; options: PollOption[]; prediction?: boolean; }

export interface Post {
  id: string;
  author: string;
  authorColor: string;
  avatar?: AvatarConfig | null;
  photoUri?: string | null;
  topic: Topic;
  title: string;
  body: string;
  spoiler: boolean;
  animeTag?: string;
  poll?: Poll;
  createdAt: number;
  likes: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorColor: string;
  avatar?: AvatarConfig | null;
  photoUri?: string | null;
  body: string;
  createdAt: number;
  likes: number;
  parentId?: string;
}

export interface AnimeItem {
  id: number;
  title: string;
  image: string;
  score?: number;
  scoredBy?: number;
  synopsis: string;
  genres: string[];
  episodes?: number;
  status: string;
  year?: number;
}

export interface PodcastShow {
  id: number;
  name: string;
  artist: string;
  art: string;
  feedUrl: string;
  episodeCount?: number;
  genre: string;
}

export interface Episode {
  id: string;
  title: string;
  pubDate: string;
  duration: string; // raw, e.g. "1:12:04" or "3720"
  audioUrl: string;
  description: string;
}

export type WatchStatus = 'watching' | 'completed' | 'plan' | 'dropped' | 'onhold';
export interface WatchEntry { anime: AnimeItem; status: WatchStatus; addedAt: number; note?: string; }

export interface ProgressEntry { title: string; watched: number; total?: number; hideSpoilers: boolean; }

export interface ListeningStats { episodesCompleted: number; secondsListened: number; completedIds: string[]; }

export interface Mutes { words: string[]; anime: string[]; }

export interface Profile { username: string; bio: string; color: string; avatar?: AvatarConfig | null; photoUri?: string | null; banner: number; bannerPhoto?: string | null; anthem?: Anthem | null; showcase?: number[]; pinnedPostId?: string | null; }

export interface Anthem {
  track: string;
  artist: string;
  artwork?: string | null;
  previewUrl?: string | null;
}

export interface AvatarConfig {
  skin: number;
  face: number;
  eyes: number;
  eyeColor: number;
  brows: number;
  mouth: number;
  hair: number;
  hairColor: number;
  accessory: number;
  bg: number;
}

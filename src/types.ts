export type Topic =
  | 'Episode Talk' | 'Theories' | 'Recommendations' | 'Art & Cosplay'
  | 'News' | 'Hot Takes' | 'Help' | 'General';

export interface PollOption { text: string; votes: number; }
export interface Poll { id: string; question: string; options: PollOption[]; }

export interface Post {
  id: string;
  author: string;
  authorColor: string;
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
  body: string;
  createdAt: number;
  likes: number;
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

export type WatchStatus = 'watching' | 'completed' | 'plan';
export interface WatchEntry { anime: AnimeItem; status: WatchStatus; addedAt: number; }

export interface Profile { username: string; bio: string; color: string; }

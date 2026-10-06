// Music search via the iTunes Search API — no auth needed, 30s previews included.
export interface TrackResult {
  track: string;
  artist: string;
  artwork: string | null;
  previewUrl: string | null;
}

export async function searchTracks(q: string): Promise<TrackResult[]> {
  const url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}` +
    `&media=music&entity=song&limit=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('search failed');
  const data = await res.json();
  return (data.results || []).map((r: any): TrackResult => ({
    track: r.trackName || 'Unknown track',
    artist: r.artistName || 'Unknown artist',
    artwork: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '600x600') : null,
    previewUrl: r.previewUrl || null,
  }));
}

/** Deep link that opens the track search inside the Spotify app / web player. */
export function spotifySearchUrl(track: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${track} ${artist}`)}`;
}

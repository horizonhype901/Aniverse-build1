import React, { useCallback, useState } from 'react';
import {
  Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C, R } from '../theme';
import { store } from '../lib/store';
import { ListeningStats, Mutes, PodcastShow, Post, Profile, ProgressEntry, WatchEntry, WatchStatus } from '../types';
import { Avatar } from '../components/PostCard';
import { fmtClock } from '../lib/format';

const FILTERS: { key: WatchStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'watching', label: 'Watching' },
  { key: 'completed', label: 'Completed' },
  { key: 'plan', label: 'Plan to Watch' },
  { key: 'onhold', label: 'On Hold' },
  { key: 'dropped', label: 'Dropped' },
];
const COLORS = ['#FF4D6D', '#8B5CF6', '#22D3EE', '#F472B6', '#FFC94D', '#4ADE80'];
const STATUS_LABEL: Record<WatchStatus, string> = {
  watching: '▶️ Watching', completed: '✅ Completed', plan: '📌 Plan to Watch',
  onhold: '⏸️ On Hold', dropped: '🗑️ Dropped',
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
function streakDays(days: string[]): number {
  const set = new Set(days);
  let s = 0;
  const d = new Date();
  if (!set.has(isoDay(d))) d.setDate(d.getDate() - 1);
  while (set.has(isoDay(d))) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const [profile, setProfile] = useState<Profile>({ username: '', bio: '', color: COLORS[0] });
  const [editing, setEditing] = useState(false);
  const [watch, setWatch] = useState<WatchEntry[]>([]);
  const [subs, setSubs] = useState<PodcastShow[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgressEntry>>({});
  const [checkins, setCheckins] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Record<string, 'right' | 'wrong'>>({});
  const [listening, setListening] = useState<ListeningStats>({ episodesCompleted: 0, secondsListened: 0, completedIds: [] });
  const [mutes, setMutes] = useState<Mutes>({ words: [], anime: [] });
  const [muteWord, setMuteWord] = useState('');
  const [muteAnime, setMuteAnime] = useState('');
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');

  const load = useCallback(async () => {
    const [p, w, s, posts, pg, ci, pr, li, mu] = await Promise.all([
      store.profile(), store.watchlist(), store.subs(), store.posts(),
      store.progress(), store.checkins(), store.predictions(),
      store.listening(), store.mutes(),
    ]);
    setProfile(p);
    setWatch(w);
    setSubs(s);
    setMyPosts(posts.filter((x) => x.author === p.username));
    setProgress(pg);
    setCheckins(ci);
    setPredictions(pr);
    setListening(li);
    setMutes(mu);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    const clean = { ...profile, username: profile.username.trim() || 'NewOtaku' };
    setProfile(clean);
    await store.saveProfile(clean);
    setEditing(false);
    load();
  };

  const removeWatch = async (id: number) => {
    const next = watch.filter((x) => x.anime.id !== id);
    setWatch(next);
    await store.saveWatchlist(next);
  };

  const addMuteWord = async () => {
    const w = muteWord.trim().toLowerCase();
    if (!w || mutes.words.includes(w)) return;
    const nm = { ...mutes, words: [...mutes.words, w] };
    setMutes(nm);
    await store.saveMutes(nm);
    setMuteWord('');
  };
  const addMuteAnime = async () => {
    const a = muteAnime.trim();
    if (!a || mutes.anime.some((x) => x.toLowerCase() === a.toLowerCase())) return;
    const nm = { ...mutes, anime: [...mutes.anime, a] };
    setMutes(nm);
    await store.saveMutes(nm);
    setMuteAnime('');
  };
  const removeMute = async (kind: 'words' | 'anime', val: string) => {
    const nm = { ...mutes, [kind]: mutes[kind].filter((x) => x !== val) };
    setMutes(nm);
    await store.saveMutes(nm);
  };

  const shown = watch.filter((x) => filter === 'all' || x.status === filter);

  // ---- stats ----
  const epsWatched = Object.values(progress).reduce((a, e) => a + e.watched, 0);
  const hoursWatched = (epsWatched * 24) / 60;
  const streak = streakDays(checkins);
  const predEntries = Object.values(predictions);
  const predRight = predEntries.filter((x) => x === 'right').length;
  const genreCount: Record<string, number> = {};
  for (const x of watch) for (const g of x.anime.genres || []) genreCount[g] = (genreCount[g] || 0) + 1;
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  return (
    <View style={s.root}>
      <View style={s.header}><Text style={s.title}>Profile</Text></View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.card}>
          <View style={s.topRow}>
            <Avatar name={profile.username || '?'} color={profile.color} size={64} avatar={profile.avatar} photoUri={profile.photoUri} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Pressable style={s.avatarBtn} onPress={() => nav.navigate('AvatarStudio')}>
                <Text style={s.avatarBtnText}>🎨 Edit avatar</Text>
              </Pressable>
              {editing ? (
                <>
                  <TextInput style={s.edit} value={profile.username}
                    onChangeText={(v) => setProfile({ ...profile, username: v })}
                    placeholderTextColor={C.faint} maxLength={24} />
                  <TextInput style={[s.edit, { marginTop: 6 }]} value={profile.bio}
                    onChangeText={(v) => setProfile({ ...profile, bio: v })}
                    placeholder="Bio" placeholderTextColor={C.faint} maxLength={80} />
                  <View style={s.colorRow}>
                    {COLORS.map((c) => (
                      <Pressable key={c} onPress={() => setProfile({ ...profile, color: c })}
                        style={[s.dot, { backgroundColor: c }, profile.color === c && s.dotActive]} />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.name}>{profile.username}</Text>
                  {!!profile.bio && <Text style={s.bio}>{profile.bio}</Text>}
                </>
              )}
            </View>
          </View>
          <Pressable style={s.editBtn} onPress={() => (editing ? save() : setEditing(true))}>
            <Text style={s.editBtnText}>{editing ? '✓ Save' : '✏️ Edit profile'}</Text>
          </Pressable>
        </View>

        <View style={s.stats}>
          {[
            [myPosts.length, 'Posts'],
            [watch.length, 'Watchlist'],
            [subs.length, 'Podcasts'],
          ].map(([n, label]) => (
            <View key={label as string} style={s.stat}>
              <Text style={s.statN}>{n}</Text>
              <Text style={s.statL}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Stats dashboard */}
        <Text style={s.secTitle}>📊 My Stats</Text>
        <View style={s.statGrid}>
          <View style={s.statCard}><Text style={s.statBig}>📺 {epsWatched}</Text><Text style={s.statLbl}>episodes tracked</Text></View>
          <View style={s.statCard}><Text style={s.statBig}>⏱️ {hoursWatched >= 1 ? `${Math.round(hoursWatched)}h` : `${epsWatched * 24}m`}</Text><Text style={s.statLbl}>watch time</Text></View>
          <View style={s.statCard}><Text style={s.statBig}>🔥 {streak}</Text><Text style={s.statLbl}>day streak</Text></View>
          <View style={s.statCard}><Text style={s.statBig}>🔮 {predRight}/{predEntries.length}</Text><Text style={s.statLbl}>predictions right</Text></View>
          <View style={s.statCard}><Text style={s.statBig}>🎙️ {listening.episodesCompleted}</Text><Text style={s.statLbl}>podcast eps done</Text></View>
          <View style={s.statCard}><Text style={s.statBig}>🎧 {fmtClock(listening.secondsListened)}</Text><Text style={s.statLbl}>listened</Text></View>
        </View>
        {topGenres.length > 0 && (
          <Text style={s.genreLine}>Your DNA: {topGenres.join(' • ')}</Text>
        )}

        <Text style={s.secTitle}>📺 My Watchlist</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }} style={{ maxHeight: 44 }}>
          {FILTERS.map((f) => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)}
              style={[s.fchip, filter === f.key && s.fchipActive]}>
              <Text style={[s.fchipText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {shown.length === 0 ? (
          <Text style={s.empty}>Nothing here yet — find anime in Discover and tap ＋</Text>
        ) : shown.map((x) => (
          <Pressable key={x.anime.id} style={s.row}
            onPress={() => nav.navigate('AnimeDetail', { anime: x.anime })}>
            {!!x.anime.image && <Image source={{ uri: x.anime.image }} style={s.thumb} />}
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>{x.anime.title}</Text>
              <Text style={s.rowSub}>{STATUS_LABEL[x.status]}{x.note ? ` — ${x.note}` : ''}</Text>
            </View>
            <Pressable onPress={() => removeWatch(x.anime.id)}><Text style={s.remove}>✕</Text></Pressable>
          </Pressable>
        ))}

        <Text style={s.secTitle}>🙈 Muted words & anime</Text>
        <View style={s.card}>
          <View style={s.muteRow}>
            <TextInput style={[s.edit, { flex: 1 }]} value={muteWord} onChangeText={setMuteWord}
              placeholder="Mute a word (e.g. isekai)" placeholderTextColor={C.faint}
              onSubmitEditing={addMuteWord} />
            <Pressable style={s.muteAdd} onPress={addMuteWord}><Text style={s.muteAddText}>＋</Text></Pressable>
          </View>
          <View style={s.muteRow}>
            <TextInput style={[s.edit, { flex: 1 }]} value={muteAnime} onChangeText={setMuteAnime}
              placeholder="Mute an anime (e.g. One Piece)" placeholderTextColor={C.faint}
              onSubmitEditing={addMuteAnime} />
            <Pressable style={s.muteAdd} onPress={addMuteAnime}><Text style={s.muteAddText}>＋</Text></Pressable>
          </View>
          <View style={s.muteChips}>
            {mutes.words.map((w) => (
              <Pressable key={'w' + w} style={s.mchip} onPress={() => removeMute('words', w)}>
                <Text style={s.mchipText}>"{w}" ✕</Text>
              </Pressable>
            ))}
            {mutes.anime.map((a) => (
              <Pressable key={'a' + a} style={[s.mchip, s.mchipAnime]} onPress={() => removeMute('anime', a)}>
                <Text style={s.mchipText}>🎌 {a} ✕</Text>
              </Pressable>
            ))}
            {mutes.words.length === 0 && mutes.anime.length === 0 && (
              <Text style={s.empty}>Nothing muted — the feed shows everything.</Text>
            )}
          </View>
        </View>

        <Text style={s.secTitle}>🎙️ Subscribed Podcasts</Text>
        {subs.length === 0 ? (
          <Text style={s.empty}>No subscriptions yet — browse the Podcasts tab</Text>
        ) : subs.map((x) => (
          <Pressable key={x.id} style={s.row}
            onPress={() => nav.navigate('ShowDetail', { show: x })}>
            {!!x.art && <Image source={{ uri: x.art }} style={s.thumb} />}
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>{x.name}</Text>
              <Text style={s.rowSub} numberOfLines={1}>{x.artist}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))}

        <Text style={s.secTitle}>💬 My Posts</Text>
        {myPosts.length === 0 ? (
          <Text style={s.empty}>You haven't posted yet — tap ＋ on the Feed</Text>
        ) : myPosts.map((x) => (
          <Pressable key={x.id} style={s.row}
            onPress={() => nav.navigate('PostDetail', { postId: x.id })}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={2}>{x.title}</Text>
              <Text style={s.rowSub}>💬 {x.topic}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  title: { color: C.text, fontSize: 24, fontWeight: '900' },
  card: { backgroundColor: C.card, borderRadius: R.lg, margin: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: C.text, fontSize: 20, fontWeight: '900' },
  bio: { color: C.muted, fontSize: 13, marginTop: 4 },
  edit: { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, color: C.text, padding: 8, fontSize: 14 },
  colorRow: { flexDirection: 'row', marginTop: 8 },
  dot: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
  dotActive: { borderWidth: 2, borderColor: '#fff' },
  editBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText: { color: C.secondary, fontWeight: '800' },
  avatarBtn: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: C.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  avatarBtnText: { color: '#fff', fontWeight: '800' },
  stats: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 6 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: C.border },
  statN: { color: C.text, fontSize: 20, fontWeight: '900' },
  statL: { color: C.faint, fontSize: 11, marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8 },
  statCard: { width: '31%', backgroundColor: C.card, borderRadius: R.md, padding: 10, margin: '1%', borderWidth: 1, borderColor: C.border },
  statBig: { color: C.text, fontSize: 15, fontWeight: '900' },
  statLbl: { color: C.faint, fontSize: 10, marginTop: 2 },
  genreLine: { color: C.secondary, fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginTop: 6 },
  secTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginHorizontal: 16, marginTop: 14, marginBottom: 6 },
  fchip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, alignSelf: 'center' },
  fchipActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  fchipText: { color: C.muted, fontWeight: '700', fontSize: 12 },
  empty: { color: C.faint, fontSize: 13, marginHorizontal: 16, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, marginHorizontal: 12, marginVertical: 4, padding: 10, borderWidth: 1, borderColor: C.border },
  thumb: { width: 44, height: 62, borderRadius: 8, marginRight: 10, backgroundColor: C.card2 },
  rowTitle: { color: C.text, fontWeight: '700', fontSize: 14 },
  rowSub: { color: C.faint, fontSize: 12, marginTop: 3 },
  remove: { color: C.faint, fontSize: 16, padding: 6 },
  chev: { color: C.faint, fontSize: 22 },
  muteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  muteAdd: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  muteAddText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  muteChips: { flexDirection: 'row', flexWrap: 'wrap' },
  mchip: { backgroundColor: C.card2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  mchipAnime: { borderColor: C.accent },
  mchipText: { color: C.text, fontSize: 12, fontWeight: '600' },
});

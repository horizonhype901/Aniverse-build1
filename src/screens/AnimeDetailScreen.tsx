import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';
import { animeFull } from '../lib/api';
import { store } from '../lib/store';
import { AnimeItem, ProgressEntry, WatchStatus } from '../types';
import { compact } from '../lib/format';

const STATUSES: { key: WatchStatus; label: string }[] = [
  { key: 'watching', label: '▶️ Watching' },
  { key: 'completed', label: '✅ Completed' },
  { key: 'plan', label: '📌 Plan to Watch' },
  { key: 'onhold', label: '⏸️ On Hold' },
  { key: 'dropped', label: '🗑️ Dropped' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AnimeDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const passed: AnimeItem | undefined = route.params?.anime;
  const animeId: number | undefined = route.params?.animeId || passed?.id;

  const [anime, setAnime] = useState<AnimeItem | null>(passed || null);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<ProgressEntry | null>(null);
  const [pace, setPace] = useState(0); // episodes per active day, learned

  useEffect(() => {
    (async () => {
      if (animeId) {
        try {
          const full = await animeFull(animeId);
          setAnime((prev) => ({ ...prev, ...full, id: animeId } as AnimeItem));
        } catch {
          /* offline — passed data stands */
        }
        const w = await store.watchlist();
        const e = w.find((x) => x.anime.id === animeId);
        setStatus(e ? e.status : null);
        setNote(e?.note || '');
        const pg = await store.progress();
        setProgress(pg[animeId] || null);
        // personal pace: episodes per active day, learned from check-ins
        const days = await store.checkins();
        const totalEps = Object.values(pg).reduce((a, e: any) => a + (e.watched || 0), 0);
        setPace(days.length > 0 && totalEps > 0 ? totalEps / days.length : 0);
      }
    })();
  }, [animeId]);

  const setWatch = async (s: WatchStatus | null, n?: string) => {
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const w = await store.watchlist();
    const rest = w.filter((x) => x.anime.id !== anime.id);
    if (s) rest.unshift({ anime, status: s, addedAt: Date.now(), note: n });
    await store.saveWatchlist(rest);
    setStatus(s);
    if (n !== undefined) setNote(n);
  };

  const bumpProgress = async (delta: number) => {
    if (!anime || !animeId) return;
    const pg = await store.progress();
    const cur = pg[animeId] || {
      title: anime.title,
      watched: 0,
      total: anime.episodes,
      hideSpoilers: false,
    };
    const cap = cur.total || anime.episodes || 500;
    const watched = Math.max(0, Math.min(cap, cur.watched + delta));
    const next = { ...cur, watched, total: cur.total ?? anime.episodes, title: anime.title };
    pg[animeId] = next;
    await store.saveProgress(pg);
    setProgress(next);
    // daily check-in for streaks
    const days = await store.checkins();
    const t = todayStr();
    if (!days.includes(t)) {
      await store.saveCheckins([...days, t].slice(-365));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // auto-suggest completed when reaching the total
    if (next.total && watched >= next.total && status !== 'completed') {
      setWatch('completed');
    }
  };

  const toggleShield = async () => {
    if (!anime || !animeId || !progress) return;
    const pg = await store.progress();
    pg[animeId] = { ...progress, hideSpoilers: !progress.hideSpoilers };
    await store.saveProgress(pg);
    setProgress(pg[animeId]);
  };

  const discuss = () => {
    if (!anime) return;
    nav.navigate('Composer', {
      prefill: { topic: 'Episode Talk', title: `[${anime.title}] `, animeTag: anime.title },
    });
  };

  const remaining = progress?.total ? Math.max(0, progress.total - progress.watched) : null;
  const eta = (() => {
    if (remaining === null || remaining <= 0) return null;
    const hours = `${Math.floor((remaining * 24) / 60)}h ${(remaining * 24) % 60}m`;
    if (pace > 0) {
      const days = Math.max(1, Math.ceil(remaining / pace));
      return `≈ ${hours} left · ~${days}d at your pace`;
    }
    return `≈ ${hours} left`;
  })();

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>Anime Details</Text>
        <View style={{ width: 60 }} />
      </View>
      {!anime ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={s.top}>
            <Image source={{ uri: anime.image }} style={s.poster} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{anime.title}</Text>
              <Text style={s.score}>
                {anime.score ? `⭐ ${anime.score.toFixed(2)}` : '⭐ --'}
                {anime.scoredBy ? <Text style={s.scoreBy}> ({compact(anime.scoredBy)})</Text> : null}
              </Text>
              <Text style={s.meta}>
                {[anime.year, anime.episodes ? `${anime.episodes} eps` : null, anime.status]
                  .filter(Boolean).join(' • ')}
              </Text>
            </View>
          </View>

          <View style={s.genres}>
            {anime.genres.map((g) => (
              <View key={g} style={s.genre}><Text style={s.genreText}>{g}</Text></View>
            ))}
          </View>

          <Text style={s.synopsis}>{anime.synopsis}</Text>

          {/* Watch progress */}
          <View style={s.card}>
            <Text style={s.cardTitle}>📺 My progress</Text>
            <View style={s.stepRow}>
              <Pressable style={s.stepBtn} onPress={() => bumpProgress(-1)}>
                <Text style={s.stepText}>−</Text>
              </Pressable>
              <Text style={s.stepCount}>
                {progress?.watched || 0}{progress?.total ? ` / ${progress.total}` : ''} eps
              </Text>
              <Pressable style={s.stepBtn} onPress={() => bumpProgress(1)}>
                <Text style={s.stepText}>＋</Text>
              </Pressable>
            </View>
            {eta && <Text style={s.eta}>{eta}</Text>}
            {progress && (
              <View style={s.shieldRow}>
                <Text style={s.shieldLabel}>🛡️ Hide spoilers for this anime</Text>
                <Switch
                  value={progress.hideSpoilers}
                  onValueChange={toggleShield}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              </View>
            )}
            {!progress && (
              <Pressable style={s.startTrack} onPress={() => bumpProgress(0)}>
                <Text style={s.startTrackText}>Start tracking episodes</Text>
              </Pressable>
            )}
          </View>

          <View style={s.actions}>
            {status === null ? (
              <Pressable style={s.addBtn} onPress={() => setWatch('watching')}>
                <Text style={s.addText}>＋ Add to Watchlist</Text>
              </Pressable>
            ) : (
              <View>
                <View style={s.statusRow}>
                  {STATUSES.map((x) => (
                    <Pressable
                      key={x.key}
                      onPress={() => setWatch(x.key, x.key === 'dropped' ? note : undefined)}
                      style={[s.statusChip, status === x.key && s.statusActive]}
                    >
                      <Text style={[s.statusText, status === x.key && { color: '#fff' }]}>{x.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setWatch(null)}>
                    <Text style={s.remove}>Remove</Text>
                  </Pressable>
                </View>
                {status === 'dropped' && (
                  <TextInput
                    style={s.noteInput}
                    value={note}
                    onChangeText={(v) => {
                      setNote(v);
                      setWatch('dropped', v);
                    }}
                    placeholder="Why did you drop it? (pacing, art, bored…)"
                    placeholderTextColor={C.faint}
                  />
                )}
              </View>
            )}
            <Pressable style={s.discussBtn} onPress={discuss}>
              <Text style={s.discussText}>💬 Discuss this anime</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 17, fontWeight: '700', width: 60 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  top: { flexDirection: 'row', padding: 16 },
  poster: { width: 120, height: 175, borderRadius: R.md, marginRight: 14, backgroundColor: C.card2 },
  title: { color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 6 },
  score: { color: C.gold, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  scoreBy: { color: C.faint, fontSize: 12, fontWeight: '400' },
  meta: { color: C.muted, fontSize: 13 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8 },
  genre: { backgroundColor: C.card2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  genreText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  synopsis: { color: C.muted, fontSize: 14, lineHeight: 22, paddingHorizontal: 16 },
  card: { backgroundColor: C.card, borderRadius: R.lg, margin: 16, marginBottom: 0, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  stepText: { color: C.text, fontSize: 22, fontWeight: '700' },
  stepCount: { color: C.text, fontSize: 17, fontWeight: '800', marginHorizontal: 18 },
  eta: { color: C.faint, textAlign: 'center', marginTop: 8, fontSize: 13 },
  shieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  shieldLabel: { color: C.text, fontWeight: '600', fontSize: 14 },
  startTrack: { alignSelf: 'center', marginTop: 4, backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  startTrackText: { color: C.secondary, fontWeight: '700' },
  actions: { padding: 16 },
  addBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 14, alignItems: 'center', marginBottom: 10 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  statusChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  statusActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  statusText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  remove: { color: C.faint, fontWeight: '600', marginLeft: 4 },
  noteInput: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.text, padding: 10, fontSize: 14, marginBottom: 10 },
  discussBtn: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.secondary },
  discussText: { color: C.secondary, fontWeight: '800', fontSize: 16 },
});

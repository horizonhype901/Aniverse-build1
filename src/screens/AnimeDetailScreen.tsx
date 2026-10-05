import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';
import { animeFull } from '../lib/api';
import { store } from '../lib/store';
import { AnimeItem, WatchStatus } from '../types';
import { compact } from '../lib/format';

const STATUSES: { key: WatchStatus; label: string }[] = [
  { key: 'watching', label: '▶️ Watching' },
  { key: 'completed', label: '✅ Completed' },
  { key: 'plan', label: '📌 Plan to Watch' },
];

export default function AnimeDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const passed: AnimeItem | undefined = route.params?.anime;
  const animeId: number | undefined = route.params?.animeId || passed?.id;

  const [anime, setAnime] = useState<AnimeItem | null>(passed || null);
  const [status, setStatus] = useState<WatchStatus | null>(null);

  useEffect(() => {
    (async () => {
      // Enrich with live data when possible; keep the passed object on failure
      if (animeId) {
        try {
          const full = await animeFull(animeId);
          setAnime((prev) => ({ ...prev, ...full, id: animeId } as AnimeItem));
        } catch {
          /* offline — passed data stands */
        }
      }
      if (animeId) {
        const w = await store.watchlist();
        const e = w.find((x) => x.anime.id === animeId);
        setStatus(e ? e.status : null);
      }
    })();
  }, [animeId]);

  const setWatch = async (s: WatchStatus | null) => {
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const w = await store.watchlist();
    const rest = w.filter((x) => x.anime.id !== anime.id);
    if (s) rest.unshift({ anime, status: s, addedAt: Date.now() });
    await store.saveWatchlist(rest);
    setStatus(s);
  };

  const discuss = () => {
    if (!anime) return;
    nav.navigate('Composer', {
      prefill: { topic: 'Episode Talk', title: `[${anime.title}] `, animeTag: anime.title },
    });
  };

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

          <View style={s.actions}>
            {status === null ? (
              <Pressable style={s.addBtn} onPress={() => setWatch('watching')}>
                <Text style={s.addText}>＋ Add to Watchlist</Text>
              </Pressable>
            ) : (
              <View style={s.statusRow}>
                {STATUSES.map((x) => (
                  <Pressable
                    key={x.key}
                    onPress={() => setWatch(x.key)}
                    style={[s.statusChip, status === x.key && s.statusActive]}
                  >
                    <Text style={[s.statusText, status === x.key && { color: '#fff' }]}>{x.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setWatch(null)}>
                  <Text style={s.remove}>Remove</Text>
                </Pressable>
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
  actions: { padding: 16 },
  addBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 14, alignItems: 'center', marginBottom: 10 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  statusChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  statusActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  statusText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  remove: { color: C.faint, fontWeight: '600', marginLeft: 4 },
  discussBtn: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.secondary },
  discussText: { color: C.secondary, fontWeight: '800', fontSize: 16 },
});

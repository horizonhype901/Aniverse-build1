import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, R } from '../theme';
import { searchAnime, seasonNow, topAiring } from '../lib/api';
import { FALLBACK_ANIME, VIBES, ANIME_VIBES, Vibe } from '../data/seed';
import { AnimeItem } from '../types';
import AnimeCard from '../components/AnimeCard';

function Section({ title, items, onPress }: { title: string; items: AnimeItem[]; onPress: (a: AnimeItem) => void }) {
  if (items.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(x) => String(x.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => <AnimeCard anime={item} onPress={() => onPress(item)} />}
      />
    </View>
  );
}

export default function DiscoverScreen() {
  const nav = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[] | null>(null);
  const [airing, setAiring] = useState<AnimeItem[]>([]);
  const [season, setSeason] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [vibe, setVibe] = useState<'All' | Vibe>('All');

  const load = async () => {
    setLoading(true);
    setError('');
    setOffline(false);
    try {
      const [a, b] = await Promise.all([topAiring(), seasonNow()]);
      setAiring(a);
      setSeason(b);
    } catch (e: any) {
      // API unreachable — fall back to the bundled catalog so the tab still works
      setAiring(FALLBACK_ANIME);
      setSeason([...FALLBACK_ANIME].reverse());
      setOffline(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doSearch = async () => {
    const q = query.trim();
    if (!q) { setResults(null); return; }
    setSearching(true);
    try {
      setResults(await searchAnime(q));
    } catch {
      // Offline search across the bundled catalog
      const lq = q.toLowerCase();
      setResults(
        FALLBACK_ANIME.filter(
          (a) =>
            a.title.toLowerCase().includes(lq) ||
            a.genres.some((g) => g.toLowerCase().includes(lq))
        )
      );
      setOffline(true);
    }
    setSearching(false);
  };

  const open = (a: AnimeItem) => nav.navigate('AnimeDetail', { anime: a });

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const aotd = airing.length > 0 ? airing[dayOfYear % airing.length] : null;
  const vibeMatches = vibe === 'All' ? [] : FALLBACK_ANIME.filter((a) => (ANIME_VIBES[a.id] || []).includes(vibe));

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Discover Anime</Text>
        {offline && <Text style={s.offline}>📶 Offline catalog — connect for live data</Text>}
      </View>
      <View style={s.searchRow}>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          placeholder="Search 20,000+ anime…"
          placeholderTextColor={C.faint}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults(null); }} style={s.clear}>
            <Text style={s.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {searching ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : results ? (
        <FlatList
          data={results}
          keyExtractor={(x) => String(x.id)}
          numColumns={3}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => <AnimeCard anime={item} onPress={() => open(item)} width={110} />}
          ListEmptyComponent={<Text style={s.empty}>No results for "{query}" 😢</Text>}
        />
      ) : loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} size="large" />
      ) : error ? (
        <View style={s.errBox}>
          <Text style={s.errText}>{error}</Text>
          <Pressable style={s.retry} onPress={load}><Text style={s.retryText}>Retry</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}>
            {(['All', ...VIBES] as const).map((v) => (
              <Pressable key={v} onPress={() => setVibe(v)}
                style={[s.vchip, vibe === v && s.vchipActive]}>
                <Text style={[s.vchipText, vibe === v && { color: '#fff' }]}>
                  {v === 'All' ? '✨ All vibes' : v}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {vibe !== 'All' ? (
            <View>
              <Text style={s.sectionTitle}>🎭 {vibe} anime</Text>
              <FlatList
                data={vibeMatches}
                keyExtractor={(x) => String(x.id)}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={{ padding: 12 }}
                columnWrapperStyle={{ justifyContent: 'flex-start' }}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 12, marginBottom: 12 }}>
                    <AnimeCard anime={item} onPress={() => open(item)} width={110} />
                  </View>
                )}
                ListEmptyComponent={<Text style={s.empty}>No {vibe} anime in the catalog yet.</Text>}
              />
            </View>
          ) : (
            <>
              {aotd && (
                <Pressable style={s.aotd} onPress={() => open(aotd)}>
                  <Image source={{ uri: aotd.image }} style={s.aotdImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.aotdKicker}>✨ ANIME OF THE DAY</Text>
                    <Text style={s.aotdTitle} numberOfLines={2}>{aotd.title}</Text>
                    <Text style={s.aotdMeta}>
                      {aotd.score ? `⭐ ${aotd.score.toFixed(2)}  ` : ''}{aotd.genres.slice(0, 2).join(' • ')}
                    </Text>
                  </View>
                </Pressable>
              )}
              <Section title="🔥 Airing Now" items={airing} onPress={open} />
              <Section title="📅 This Season" items={season} onPress={open} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  title: { color: C.text, fontSize: 24, fontWeight: '900' },
  offline: { color: C.gold, fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8 },
  search: { flex: 1, backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, fontSize: 15 },
  clear: { position: 'absolute', right: 12, padding: 6 },
  clearText: { color: C.muted, fontSize: 16 },
  section: { marginTop: 14 },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '800', marginHorizontal: 14, marginBottom: 8 },
  vchip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  vchipActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  vchipText: { color: C.muted, fontWeight: '700', fontSize: 12 },
  empty: { color: C.faint, textAlign: 'center', marginTop: 60, fontSize: 15 },
  errBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  errText: { color: C.muted, textAlign: 'center', marginBottom: 12 },
  retry: { backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
  aotd: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.lg, margin: 12, padding: 12, borderWidth: 1, borderColor: C.gold + '55', alignItems: 'center' },
  aotdImg: { width: 70, height: 100, borderRadius: R.md, marginRight: 12 },
  aotdKicker: { color: C.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  aotdTitle: { color: C.text, fontSize: 17, fontWeight: '800', marginVertical: 4 },
  aotdMeta: { color: C.muted, fontSize: 12 },
});

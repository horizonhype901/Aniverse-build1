import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';
import { searchPodcasts } from '../lib/api';
import { store } from '../lib/store';
import { PodcastShow } from '../types';

export default function PodcastsScreen() {
  const nav = useNavigation<any>();
  const [query, setQuery] = useState('anime');
  const [shows, setShows] = useState<PodcastShow[]>([]);
  const [subs, setSubs] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const doSearch = async (term: string) => {
    setLoading(true);
    setError('');
    try {
      setShows(await searchPodcasts(term || 'anime'));
    } catch {
      setError('Could not load podcasts. Check your connection and retry.');
      setShows([]);
    }
    setLoading(false);
  };

  useEffect(() => { doSearch('anime'); }, []);
  useFocusEffect(() => {
    (async () => setSubs(await store.subs()))();
    return () => {};
  });

  const toggleSub = async (show: PodcastShow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const has = subs.some((x) => x.id === show.id);
    const next = has ? subs.filter((x) => x.id !== show.id) : [...subs, show];
    setSubs(next);
    await store.saveSubs(next);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>🎙️ Anime Podcasts</Text>
        <Text style={s.sub}>Real shows, real episodes, in-app player</Text>
      </View>
      <View style={s.searchRow}>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch(query)}
          placeholder="Search podcasts…"
          placeholderTextColor={C.faint}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} size="large" />
      ) : error ? (
        <View style={s.errBox}>
          <Text style={s.errText}>{error}</Text>
          <Pressable style={s.retry} onPress={() => doSearch(query)}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={shows}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const subbed = subs.some((x) => x.id === item.id);
            return (
              <Pressable style={s.row} onPress={() => nav.navigate('ShowDetail', { show: item })}>
                {!!item.art && <Image source={{ uri: item.art }} style={s.art} />}
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.artist} numberOfLines={1}>{item.artist}</Text>
                  <Text style={s.meta}>
                    {item.episodeCount ? `${item.episodeCount} eps • ` : ''}{item.genre}
                  </Text>
                </View>
                <Pressable
                  style={[s.subBtn, subbed && s.subbed]}
                  onPress={() => toggleSub(item)}
                >
                  <Text style={[s.subText, subbed && { color: C.green }]}>
                    {subbed ? '✓' : '＋'}
                  </Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  title: { color: C.text, fontSize: 24, fontWeight: '900' },
  sub: { color: C.faint, fontSize: 13, marginTop: 2 },
  searchRow: { marginHorizontal: 12, marginVertical: 8 },
  search: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.lg, marginHorizontal: 12, marginVertical: 5, padding: 10, borderWidth: 1, borderColor: C.border },
  art: { width: 64, height: 64, borderRadius: R.md, marginRight: 12, backgroundColor: C.card2 },
  name: { color: C.text, fontWeight: '800', fontSize: 14 },
  artist: { color: C.muted, fontSize: 12, marginTop: 2 },
  meta: { color: C.faint, fontSize: 11, marginTop: 2 },
  subBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  subbed: { borderColor: C.green },
  subText: { color: C.primary, fontSize: 18, fontWeight: '800' },
  errBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  errText: { color: C.muted, textAlign: 'center', marginBottom: 12 },
  retry: { backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
});

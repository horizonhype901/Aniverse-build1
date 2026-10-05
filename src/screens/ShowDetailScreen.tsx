import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';
import { fetchEpisodes } from '../lib/api';
import { store } from '../lib/store';
import { useAudio } from '../lib/audio';
import { Episode, PodcastShow } from '../types';
import { fmtClock, fmtDate, parseDur } from '../lib/format';

const RATES = [1, 1.25, 1.5, 2];

function PlayerCard({ show }: { show: PodcastShow }) {
  const { now, playing, toggle, seekBy, seekTo, setRate, rate, next, prev, player } = useAudio();
  const status = useAudioPlayerStatus(player);
  if (!now || now.show.id !== show.id) return null;

  return (
    <View style={s.player}>
      <Text style={s.pTitle} numberOfLines={2}>{now.episode.title}</Text>
      <View style={s.track}>
        <View style={[s.trackFill, { width: `${status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0}%` }]} />
      </View>
      <View style={s.pTimes}>
        <Text style={s.pTime}>{fmtClock(status.currentTime)}</Text>
        <Text style={s.pTime}>{fmtClock(status.duration)}</Text>
      </View>
      <View style={s.controls}>
        <Pressable onPress={prev}><Text style={s.cBtn}>⏮</Text></Pressable>
        <Pressable onPress={() => seekBy(-15)}><Text style={s.cBtn}>↺15</Text></Pressable>
        <Pressable onPress={toggle} style={s.bigBtn}>
          <Text style={s.bigBtnText}>{playing ? '⏸' : '▶️'}</Text>
        </Pressable>
        <Pressable onPress={() => seekBy(15)}><Text style={s.cBtn}>↻15</Text></Pressable>
        <Pressable onPress={next}><Text style={s.cBtn}>⏭</Text></Pressable>
      </View>
      <View style={s.rates}>
        {RATES.map((r) => (
          <Pressable key={r} onPress={() => setRate(r)}
            style={[s.rate, rate === r && s.rateActive]}>
            <Text style={[s.rateText, rate === r && { color: '#fff' }]}>{r}x</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ShowDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const show: PodcastShow = route.params.show;
  const audio = useAudio();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subbed, setSubbed] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setEpisodes(await fetchEpisodes(show.feedUrl));
    } catch {
      setError('Could not load episodes from this feed.');
    }
    setLoading(false);
    setSubbed((await store.subs()).some((x) => x.id === show.id));
  };

  useEffect(() => { load(); }, []);

  const toggleSub = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const subs = await store.subs();
    const has = subs.some((x) => x.id === show.id);
    await store.saveSubs(has ? subs.filter((x) => x.id !== show.id) : [...subs, show]);
    setSubbed(!has);
  };

  const currentId = audio.now?.show.id === show.id ? audio.now.episode.id : null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>Podcast</Text>
        <View style={{ width: 60 }} />
      </View>
      <FlatList
        data={episodes}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View style={s.showHead}>
              {!!show.art && <Image source={{ uri: show.art }} style={s.art} />}
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{show.name}</Text>
                <Text style={s.artist}>{show.artist}</Text>
                <Pressable style={[s.subBtn, subbed && s.subbed]} onPress={toggleSub}>
                  <Text style={[s.subText, subbed && { color: C.green }]}>
                    {subbed ? '✓ Subscribed' : '＋ Subscribe'}
                  </Text>
                </Pressable>
              </View>
            </View>
            <PlayerCard show={show} />
            <Text style={s.epTitle}>Episodes</Text>
          </>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
          : error ? <Text style={s.err}>{error}</Text>
          : <Text style={s.err}>No episodes found.</Text>
        }
        renderItem={({ item }) => {
          const isCurrent = currentId === item.id;
          return (
            <Pressable
              style={[s.ep, isCurrent && s.epActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                audio.play(item, show, episodes);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.epName, isCurrent && { color: C.primary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={s.epMeta}>
                  {fmtDate(item.pubDate)}{item.duration ? ` • ${fmtClock(parseDur(item.duration))}` : ''}
                </Text>
                {!!item.description && (
                  <Text style={s.epDesc} numberOfLines={2}>{item.description}</Text>
                )}
              </View>
              <Text style={s.playIcon}>{isCurrent && audio.playing ? '⏸' : '▶️'}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 17, fontWeight: '700', width: 60 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  showHead: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  art: { width: 110, height: 110, borderRadius: R.lg, marginRight: 14, backgroundColor: C.card2 },
  name: { color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  artist: { color: C.muted, fontSize: 13, marginBottom: 10 },
  subBtn: { alignSelf: 'flex-start', backgroundColor: C.card2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  subbed: { borderColor: C.green },
  subText: { color: C.primary, fontWeight: '800' },
  epTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  ep: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, marginHorizontal: 12, marginVertical: 4, padding: 12, borderWidth: 1, borderColor: C.border },
  epActive: { borderColor: C.primary },
  epName: { color: C.text, fontWeight: '700', fontSize: 14 },
  epMeta: { color: C.faint, fontSize: 11, marginTop: 3 },
  epDesc: { color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  playIcon: { fontSize: 22, marginLeft: 10 },
  err: { color: C.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  player: { backgroundColor: '#241B45', borderRadius: R.lg, marginHorizontal: 12, marginBottom: 8, padding: 14, borderWidth: 1, borderColor: C.secondary + '66' },
  pTitle: { color: C.text, fontWeight: '800', fontSize: 14, marginBottom: 10 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#00000066' },
  trackFill: { height: 5, borderRadius: 3, backgroundColor: C.primary },
  pTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  pTime: { color: C.muted, fontSize: 11 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cBtn: { color: C.text, fontSize: 20, paddingHorizontal: 12 },
  bigBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  bigBtnText: { fontSize: 22 },
  rates: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  rate: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginHorizontal: 4 },
  rateActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  rateText: { color: C.muted, fontWeight: '700', fontSize: 12 },
});

import React, { useEffect, useState } from 'react';
import {
  Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { C, R } from '../theme';
import { store } from '../lib/store';
import { Post, Profile, WatchEntry } from '../types';
import { searchTracks, TrackResult } from '../lib/music';
import { BANNERS, BANNER_NAMES, THEMES } from './options';
import { BannerThumb, BannerView } from './Banner';
import AnthemCard from './AnthemCard';

export default function ProfileStudioScreen() {
  const nav = useNavigation<any>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [watch, setWatch] = useState<WatchEntry[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  // anthem search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const previewPlayer = useAudioPlayer(null);
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  useEffect(() => {
    (async () => {
      const p = await store.profile();
      const [w, posts] = await Promise.all([store.watchlist(), store.posts()]);
      setProfile(p);
      setWatch(w);
      setMyPosts(posts.filter((x) => x.author === p.username));
    })();
    return () => { previewPlayer.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    await store.saveProfile(next);
  };

  const pickBannerPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [16, 7], quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      update({ bannerPhoto: res.assets[0].uri });
    }
  };

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await searchTracks(q));
    } catch {
      Alert.alert('Search failed', 'Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const togglePreview = (t: TrackResult) => {
    if (!t.previewUrl) return;
    if (playingUrl === t.previewUrl && previewStatus.playing) {
      previewPlayer.pause();
      setPlayingUrl(null);
    } else {
      previewPlayer.replace({ uri: t.previewUrl });
      previewPlayer.play();
      setPlayingUrl(t.previewUrl);
    }
  };

  const setAnthem = (t: TrackResult) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    previewPlayer.pause();
    setPlayingUrl(null);
    const hist = [profile?.anthem, ...(profile?.anthemHistory ?? [])]
      .filter(Boolean)
      .filter((a, i, arr) => arr.findIndex((x) => x!.track === a!.track && x!.artist === a!.artist) === i)
      .slice(0, 5) as { track: string; artist: string; artwork?: string | null; previewUrl?: string | null }[];
    update({
      anthem: { track: t.track, artist: t.artist, artwork: t.artwork, previewUrl: t.previewUrl },
      anthemHistory: hist,
    });
  };

  const toggleShowcase = (id: number) => {
    const cur = profile?.showcase ?? [];
    if (cur.includes(id)) {
      update({ showcase: cur.filter((x) => x !== id) });
    } else if (cur.length >= 3) {
      Alert.alert('Max 3 favorites', 'Remove one first to add another.');
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      update({ showcase: [...cur, id] });
    }
  };

  const togglePin = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({ pinnedPostId: profile?.pinnedPostId === id ? null : id });
  };

  if (!profile) return <View style={s.root} />;
  const showcase = profile.showcase ?? [];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Done</Text></Pressable>
        <Text style={s.headerTitle}>Customize Profile</Text>
        <Pressable onPress={() => nav.navigate('UserProfile', { previewProfile: profile })}>
          <Text style={s.previewLink}>👁 Preview</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* live banner preview */}
        <View style={{ margin: 12, marginBottom: 0 }}>
          <BannerView banner={profile.banner ?? 0} bannerPhoto={profile.bannerPhoto} height={90} />
        </View>

        <Text style={s.sec}>🖼️ Banner</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {BANNERS.map((_, i) => (
            <Pressable key={i} onPress={() => update({ banner: i, bannerPhoto: null })} style={{ marginRight: 10, alignItems: 'center' }}>
              <View style={[(profile.banner ?? 0) === i && !profile.bannerPhoto && s.thumbActive]}>
                <BannerThumb index={i} />
              </View>
              <Text style={s.thumbName}>{BANNER_NAMES[i]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.rowBtns}>
          <Pressable style={s.toolBtn} onPress={pickBannerPhoto}>
            <Text style={s.toolText}>📷 Upload photo</Text>
          </Pressable>
          {!!profile.bannerPhoto && (
            <Pressable style={s.toolBtn} onPress={() => update({ bannerPhoto: null })}>
              <Text style={s.toolText}>✕ Remove photo</Text>
            </Pressable>
          )}
        </View>

        <Text style={s.sec}>🎨 Profile theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {THEMES.map((t, i) => (
            <Pressable key={t.name} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ theme: i }); }}
              style={[s.themeChip, (profile.theme ?? 0) === i && s.themeActive]}>
              <View style={[s.themeDot, { backgroundColor: t.accent }]} />
              <Text style={s.themeName}>{t.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={s.sec}>🎵 Profile anthem</Text>
        <View style={{ paddingHorizontal: 12 }}>
          {profile.anthem && <AnthemCard anthem={profile.anthem} />}
          {profile.anthem && (
            <Pressable style={[s.toolBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
              onPress={() => update({ anthem: null })}>
              <Text style={s.toolText}>✕ Remove anthem</Text>
            </Pressable>
          )}
          <View style={s.searchRow}>
            <TextInput style={s.searchInput} value={query} onChangeText={setQuery}
              placeholder="Search songs, artists…" placeholderTextColor={C.faint}
              onSubmitEditing={doSearch} returnKeyType="search" />
            <Pressable style={s.searchBtn} onPress={doSearch}>
              <Text style={s.searchBtnText}>{searching ? '…' : '🔍'}</Text>
            </Pressable>
          </View>
          {results.map((t, i) => (
            <View key={i} style={s.trackRow}>
              {t.artwork
                ? <Image source={{ uri: t.artwork }} style={s.trackArt} />
                : <View style={[s.trackArt, s.trackArtFallback]}><Text>🎵</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={s.trackName} numberOfLines={1}>{t.track}</Text>
                <Text style={s.trackArtist} numberOfLines={1}>{t.artist}</Text>
              </View>
              {!!t.previewUrl && (
                <Pressable style={s.miniBtn} onPress={() => togglePreview(t)}>
                  <Text>{playingUrl === t.previewUrl && previewStatus.playing ? '⏸' : '▶'}</Text>
                </Pressable>
              )}
              <Pressable style={s.setBtn} onPress={() => setAnthem(t)}>
                <Text style={s.setBtnText}>Set</Text>
              </Pressable>
            </View>
          ))}
          <Text style={s.hint}>Previews play right here; the Spotify button opens the track in Spotify.</Text>
          {(profile.anthemHistory ?? []).length > 0 && (
            <>
              <Text style={s.subSec}>🕘 Previously</Text>
              {(profile.anthemHistory ?? []).map((a, i) => (
                <View key={i} style={s.trackRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.trackName} numberOfLines={1}>{a.track}</Text>
                    <Text style={s.trackArtist} numberOfLines={1}>{a.artist}</Text>
                  </View>
                  <Pressable style={s.setBtn} onPress={() => setAnthem({
                    track: a.track, artist: a.artist, artwork: a.artwork ?? null, previewUrl: a.previewUrl ?? null,
                  })}>
                    <Text style={s.setBtnText}>Restore</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </View>

        <Text style={s.sec}>⭐ Favorite anime ({showcase.length}/3)</Text>
        {watch.length === 0 ? (
          <Text style={s.empty}>Add anime to your watchlist first, then feature your top 3 here.</Text>
        ) : (
          <View style={{ paddingHorizontal: 12 }}>
            {watch.slice(0, 20).map((w) => {
              const on = showcase.includes(w.anime.id);
              return (
                <Pressable key={w.anime.id} style={[s.pickRow, on && s.pickRowOn]} onPress={() => toggleShowcase(w.anime.id)}>
                  <Text style={[s.pickName, { flex: 1 }]} numberOfLines={1}>{w.anime.title}</Text>
                  <Text style={s.pickCheck}>{on ? '✓' : '＋'}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={s.sec}>📌 Pinned post</Text>
        {myPosts.length === 0 ? (
          <Text style={s.empty}>Your posts will appear here once you post.</Text>
        ) : (
          <View style={{ paddingHorizontal: 12 }}>
            {myPosts.slice(0, 10).map((p) => {
              const pinned = profile.pinnedPostId === p.id;
              return (
                <Pressable key={p.id} style={[s.pickRow, pinned && s.pickRowOn]} onPress={() => togglePin(p.id)}>
                  <Text style={[s.pickName, { flex: 1 }]} numberOfLines={2}>{p.title}</Text>
                  <Text style={s.pickCheck}>{pinned ? '📌' : '＋'}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 16, fontWeight: '700', width: 70 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  previewLink: { color: C.secondary, fontWeight: '800', fontSize: 14, width: 70, textAlign: 'right' },
  sec: { color: C.text, fontWeight: '800', fontSize: 16, marginHorizontal: 16, marginTop: 18, marginBottom: 8 },
  subSec: { color: C.muted, fontWeight: '700', fontSize: 13, marginTop: 12, marginBottom: 4 },
  themeChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 },
  themeActive: { borderColor: C.primary, backgroundColor: C.card2 },
  themeDot: { width: 16, height: 16, borderRadius: 8, marginRight: 8 },
  themeName: { color: C.text, fontWeight: '700', fontSize: 13 },
  thumbActive: { borderWidth: 2, borderColor: C.primary, borderRadius: 10, padding: 2 },
  thumbName: { color: C.muted, fontSize: 10, marginTop: 4 },
  rowBtns: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 10 },
  toolBtn: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: C.border },
  toolText: { color: C.text, fontWeight: '700', fontSize: 13 },
  searchRow: { flexDirection: 'row', marginTop: 10 },
  searchInput: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  searchBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', marginLeft: 8 },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  trackRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 8, marginTop: 8, borderWidth: 1, borderColor: C.border },
  trackArt: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  trackArtFallback: { backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  trackName: { color: C.text, fontWeight: '700', fontSize: 14 },
  trackArtist: { color: C.muted, fontSize: 12 },
  miniBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  setBtn: { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 6 },
  setBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  hint: { color: C.faint, fontSize: 11, marginTop: 8 },
  empty: { color: C.faint, fontSize: 13, marginHorizontal: 16, marginBottom: 8 },
  pickRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  pickRowOn: { borderColor: C.primary, backgroundColor: C.card2 },
  pickName: { color: C.text, fontWeight: '600', fontSize: 14 },
  pickCheck: { color: C.primary, fontWeight: '900', fontSize: 16, marginLeft: 8 },
});

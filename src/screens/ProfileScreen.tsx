import React, { useCallback, useState } from 'react';
import {
  Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C, R } from '../theme';
import { store } from '../lib/store';
import { PodcastShow, Post, Profile, WatchEntry, WatchStatus } from '../types';
import { Avatar } from '../components/PostCard';

const FILTERS: { key: WatchStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'watching', label: 'Watching' },
  { key: 'completed', label: 'Completed' },
  { key: 'plan', label: 'Plan to Watch' },
];
const COLORS = ['#FF4D6D', '#8B5CF6', '#22D3EE', '#F472B6', '#FFC94D', '#4ADE80'];

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const [profile, setProfile] = useState<Profile>({ username: '', bio: '', color: COLORS[0] });
  const [editing, setEditing] = useState(false);
  const [watch, setWatch] = useState<WatchEntry[]>([]);
  const [subs, setSubs] = useState<PodcastShow[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');

  const load = useCallback(async () => {
    const [p, w, s, posts] = await Promise.all([
      store.profile(), store.watchlist(), store.subs(), store.posts(),
    ]);
    setProfile(p);
    setWatch(w);
    setSubs(s);
    setMyPosts(posts.filter((x) => x.author === p.username));
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

  const shown = watch.filter((x) => filter === 'all' || x.status === filter);

  return (
    <View style={s.root}>
      <View style={s.header}><Text style={s.title}>Profile</Text></View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.card}>
          <View style={s.topRow}>
            <Avatar name={profile.username || '?'} color={profile.color} size={64} />
            <View style={{ flex: 1, marginLeft: 12 }}>
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
              <Text style={s.rowSub}>{x.status === 'watching' ? '▶️ Watching' : x.status === 'completed' ? '✅ Completed' : '📌 Plan to Watch'}</Text>
            </View>
            <Pressable onPress={() => removeWatch(x.anime.id)}><Text style={s.remove}>✕</Text></Pressable>
          </Pressable>
        ))}

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
              <Text style={s.rowSub}>❤️ {x.likes} • {x.topic}</Text>
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
  stats: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 6 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: C.border },
  statN: { color: C.text, fontSize: 20, fontWeight: '900' },
  statL: { color: C.faint, fontSize: 11, marginTop: 2 },
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
});

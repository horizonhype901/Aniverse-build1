import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { C, R } from '../theme';
import { store } from '../lib/store';
import { AnimeItem, Post, Profile, WatchEntry } from '../types';
import { FALLBACK_ANIME } from '../data/seed';
import { avatarFor as avatarCfgFor } from '../avatar/options';
import { anthemFor, bannerFor, bioFor, showcaseFor } from './options';
import { Avatar } from '../components/PostCard';
import PostCard from '../components/PostCard';
import { BannerView } from './Banner';
import AnthemCard from './AnthemCard';

function findAnime(id: number, watch: WatchEntry[]): AnimeItem | undefined {
  return watch.find((w) => w.anime.id === id)?.anime ?? FALLBACK_ANIME.find((a) => a.id === id);
}

export default function UserProfileScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const previewProfile: Profile | undefined = route.params?.previewProfile;
  const author: string | undefined = route.params?.author;

  const [me, setMe] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [watch, setWatch] = useState<WatchEntry[]>([]);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const prof: Profile | null = previewProfile ?? (author
    ? {
        username: author,
        bio: bioFor(author),
        color: '#8B5CF6',
        avatar: avatarCfgFor(author),
        banner: bannerFor(author),
        anthem: anthemFor(author),
        showcase: showcaseFor(author),
      }
    : null);

  const load = useCallback(async () => {
    const p = await store.profile();
    setMe(p.username);
    const [all, comments, w, rx, mrx] = await Promise.all([
      store.posts(), store.comments(), store.watchlist(), store.reactions(), store.myReactions(),
    ]);
    const name = previewProfile ? p.username : author;
    setPosts(all.filter((x) => x.author === name));
    const flat = Object.values(comments).flat() as any[];
    setCommentCount(flat.filter((c: any) => c.author === name).length);
    const counts: Record<string, number> = {};
    for (const [pid, list] of Object.entries(comments)) counts[pid] = (list as any[]).length;
    setCommentCounts(counts);
    setReactions(rx);
    setMyReactions(mrx);
    setWatch(w);
  }, [author, previewProfile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!prof) {
    return (
      <View style={s.root}>
        <Text style={s.empty}>Profile not found.</Text>
      </View>
    );
  }

  const isMe = prof.username === me;
  const showcase = (prof.showcase ?? [])
    .map((id) => findAnime(id, watch))
    .filter(Boolean) as AnimeItem[];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{prof.username}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.card}>
          <BannerView banner={prof.banner ?? 0} bannerPhoto={prof.bannerPhoto} height={100} />
          <View style={s.topRow}>
            <View style={s.avatarOverlap}>
              <Avatar name={prof.username} color={prof.color} size={72} avatar={prof.avatar} photoUri={prof.photoUri} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{prof.username}</Text>
              {!!prof.bio && <Text style={s.bio}>{prof.bio}</Text>}
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 4 }}>
            {(previewProfile || isMe) && (
              <View style={s.meChip}>
                <Text style={s.meChipText}>
                  {previewProfile ? '👁 This is how visitors see you' : '👋 This is you'}
                </Text>
              </View>
            )}
            {!!prof.anthem && (
              <View style={{ marginTop: 6 }}>
                <AnthemCard anthem={prof.anthem} />
              </View>
            )}
          </View>

          {showcase.length > 0 && (
            <View style={{ paddingHorizontal: 14 }}>
              <Text style={s.secTitle}>⭐ Favorites</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {showcase.map((a) => (
                  <Pressable key={a.id} style={s.tile}
                    onPress={() => nav.navigate('AnimeDetail', { anime: a })}>
                    {a.image ? (
                      <Image source={{ uri: a.image }} style={s.tileImg} />
                    ) : (
                      <View style={[s.tileImg, s.tileFallback]}>
                        <Text style={s.tileFallbackText}>{a.title.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={s.tileTitle} numberOfLines={2}>{a.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={s.stats}>
            <View style={s.stat}><Text style={s.statN}>{posts.length}</Text><Text style={s.statL}>Posts</Text></View>
            <View style={s.stat}><Text style={s.statN}>{commentCount}</Text><Text style={s.statL}>Comments</Text></View>
            <View style={s.stat}><Text style={s.statN}>{showcase.length}</Text><Text style={s.statL}>Favorites</Text></View>
          </View>
        </View>

        <Text style={s.secTitle2}>💬 Posts</Text>
        {posts.length === 0 ? (
          <Text style={s.empty}>No posts yet.</Text>
        ) : (
          posts.map((x) => (
            <PostCard key={x.id} post={x}
              reactions={reactions[x.id] || {}}
              myReaction={myReactions[x.id] || null}
              commentCount={commentCounts[x.id] || 0}
              voted={null}
              onReact={() => {}}
              onOpen={() => nav.navigate('PostDetail', { postId: x.id })}
              onVote={() => {}}
              onAvatarPress={() => {}} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 16, fontWeight: '700', width: 60 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, margin: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: -28 },
  avatarOverlap: { borderWidth: 3, borderColor: C.card, borderRadius: 40, overflow: 'hidden' },
  name: { color: C.text, fontSize: 20, fontWeight: '900', marginLeft: 10 },
  bio: { color: C.muted, fontSize: 13, marginTop: 2, marginLeft: 10 },
  meChip: { backgroundColor: C.card2, borderRadius: 12, padding: 8, marginTop: 10, alignItems: 'center' },
  meChipText: { color: C.secondary, fontWeight: '700', fontSize: 12 },
  secTitle: { color: C.text, fontWeight: '800', fontSize: 15, marginTop: 12, marginBottom: 8 },
  secTitle2: { color: C.text, fontWeight: '800', fontSize: 16, marginHorizontal: 16, marginTop: 6, marginBottom: 8 },
  stats: { flexDirection: 'row', padding: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statN: { color: C.text, fontSize: 18, fontWeight: '900' },
  statL: { color: C.faint, fontSize: 11, marginTop: 2 },
  tile: { width: 96, marginRight: 10 },
  tileImg: { width: 96, height: 128, borderRadius: 10, backgroundColor: C.card2 },
  tileFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  tileFallbackText: { color: C.primary, fontSize: 32, fontWeight: '900' },
  tileTitle: { color: C.text, fontSize: 11, fontWeight: '600', marginTop: 4 },
  empty: { color: C.faint, fontSize: 13, marginHorizontal: 16, marginVertical: 12 },
});

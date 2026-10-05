import React, { useCallback, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, R, TOPIC_COLORS } from '../theme';
import { TOPICS } from '../data/seed';
import { ensureSeeded, store } from '../lib/store';
import { Poll, Post, Topic } from '../types';
import PostCard from '../components/PostCard';

function hotScore(p: Post): number {
  const hours = (Date.now() - p.createdAt) / 3600000;
  return p.likes / Math.pow(hours + 2, 1.3);
}

export default function FeedScreen() {
  const nav = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [topic, setTopic] = useState<'All' | Topic>('All');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await ensureSeeded();
    const [p, c, l, v] = await Promise.all([
      store.posts(), store.comments(), store.likes(), store.votes(),
    ]);
    setPosts(p);
    const counts: Record<string, number> = {};
    for (const id of Object.keys(c)) counts[id] = c[id].length;
    setCommentCounts(counts);
    setLikes(l);
    setVotes(v);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleLike = async (post: Post) => {
    const has = likes.includes(post.id);
    const next = has ? likes.filter((x) => x !== post.id) : [...likes, post.id];
    setLikes(next);
    await store.saveLikes(next);
    const updated = posts.map((x) =>
      x.id === post.id ? { ...x, likes: x.likes + (has ? -1 : 1) } : x
    );
    setPosts(updated);
    await store.savePosts(updated);
  };

  const castVote = async (poll: Poll, idx: number) => {
    if (votes[poll.id] !== undefined && votes[poll.id] !== null) return;
    const nv = { ...votes, [poll.id]: idx };
    setVotes(nv);
    await store.saveVotes(nv);
    const updated = posts.map((x) => {
      if (x.poll?.id === poll.id) {
        const options = x.poll.options.map((o, i) =>
          i === idx ? { ...o, votes: o.votes + 1 } : o
        );
        return { ...x, poll: { ...x.poll, options } };
      }
      return x;
    });
    setPosts(updated);
    await store.savePosts(updated);
  };

  const filtered = posts.filter((x) => topic === 'All' || x.topic === topic);
  const sorted = [...filtered].sort((a, b) =>
    sort === 'hot' ? hotScore(b) - hotScore(a) : b.createdAt - a.createdAt
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>Ani<Text style={{ color: C.secondary }}>Verse</Text></Text>
        <Pressable
          style={s.sortBtn}
          onPress={() => setSort(sort === 'hot' ? 'new' : 'hot')}
        >
          <Text style={s.sortText}>{sort === 'hot' ? '🔥 Hot' : '🆕 New'}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {TOPICS.map((t) => {
          const active = topic === t;
          const color = t === 'All' ? C.primary : TOPIC_COLORS[t] || C.muted;
          return (
            <Pressable
              key={t}
              onPress={() => setTopic(t)}
              style={[s.chip, active && { backgroundColor: color, borderColor: color }]}
            >
              <Text style={[s.chipText, active && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={sorted}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={likes.includes(item.id)}
            likeCount={item.likes}
            commentCount={commentCounts[item.id] || 0}
            voted={votes[item.poll?.id || ''] ?? null}
            onLike={() => toggleLike(item)}
            onOpen={() => nav.navigate('PostDetail', { postId: item.id })}
            onVote={(i) => item.poll && castVote(item.poll, i)}
          />
        )}
        ListEmptyComponent={
          <Text style={s.empty}>No posts here yet — start the conversation! 🎌</Text>
        }
      />

      <Pressable
        style={s.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          nav.navigate('Composer', {});
        }}
      >
        <Text style={s.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  logo: { color: C.primary, fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  sortBtn: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  sortText: { color: C.text, fontWeight: '700' },
  chips: { maxHeight: 46, marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: C.card, alignSelf: 'center' },
  chipText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  empty: { color: C.faint, textAlign: 'center', marginTop: 60, fontSize: 15 },
  fab: { position: 'absolute', right: 18, bottom: 26, width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', marginTop: -2 },
});

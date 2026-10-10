import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, TOPIC_COLORS } from '../theme';
import { TOPICS } from '../data/seed';
import { ensureSeeded, store } from '../lib/store';
import { Mutes, Poll, Post, ProgressEntry, Topic } from '../types';
import PostCard from '../components/PostCard';
import BreakNudge from '../components/BreakNudge';
import {
  addFeedSeconds, formatFeedTime, loadScreenTime, recordBreak, recordNudgeShown, shouldNudge,
} from '../lib/screentime';

function hotScore(p: Post): number {
  const hours = (Date.now() - p.createdAt) / 3600000;
  const reactions = 0;
  return (p.likes + reactions) / Math.pow(hours + 2, 1.3);
}

export default function FeedScreen() {
  const nav = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [predictions, setPredictions] = useState<Record<string, 'right' | 'wrong'>>({});
  const [mutes, setMutes] = useState<Mutes>({ words: [], anime: [] });
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [topic, setTopic] = useState<'All' | Topic>('All');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [refreshing, setRefreshing] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeMin, setNudgeMin] = useState(30);
  const [animeOnly, setAnimeOnly] = useState(false);
  const [calmMode, setCalmMode] = useState(false); // 😌 calm mode hides counts
  const [feedTime, setFeedTime] = useState('⏱️ 0m'); // ⏱️ continuous session-time pill

  const load = useCallback(async () => {
    await ensureSeeded();
    const [p, c, r, mr, v, pr, m, pg, ao, cm] = await Promise.all([
      store.posts(), store.comments(), store.reactions(), store.myReactions(),
      store.votes(), store.predictions(), store.mutes(), store.progress(),
      store.animeOnly(), store.calmMode(),
    ]);
    setPosts(p);
    const counts: Record<string, number> = {};
    for (const id of Object.keys(c)) counts[id] = c[id].length;
    setCommentCounts(counts);
    setReactions(r);
    setMyReactions(mr);
    setVotes(v);
    setPredictions(pr);
    setMutes(m);
    setProgress(pg);
    setAnimeOnly(ao);
    setCalmMode(cm);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // 🌱 screen-time tracking: accumulate focused feed seconds; nudge at threshold
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadScreenTime().then((st) => {
        if (alive) {
          setNudgeMin(st.thresholdMin);
          setFeedTime(formatFeedTime(st.feedSeconds));
        }
      });
      const id = setInterval(async () => {
        const st = await addFeedSeconds(5);
        if (!alive) return;
        setFeedTime(formatFeedTime(st.feedSeconds)); // ⏱️ live session-time pill
        if (shouldNudge(st)) {
          await recordNudgeShown();
          setNudgeMin(st.thresholdMin);
          setNudgeOpen(true);
        }
      }, 5000);
      return () => {
        alive = false;
        clearInterval(id);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleReaction = async (post: Post, emoji: string) => {
    const mine = myReactions[post.id];
    const counts = { ...(reactions[post.id] || {}) };
    const nextMine = { ...myReactions };
    if (mine === emoji) {
      counts[emoji] = Math.max(0, (counts[emoji] || 1) - 1);
      delete nextMine[post.id];
    } else {
      if (mine) counts[mine] = Math.max(0, (counts[mine] || 1) - 1);
      counts[emoji] = (counts[emoji] || 0) + 1;
      nextMine[post.id] = emoji;
    }
    const nextReactions = { ...reactions, [post.id]: counts };
    setReactions(nextReactions);
    setMyReactions(nextMine);
    await store.saveReactions(nextReactions);
    await store.saveMyReactions(nextMine);
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

  const markPrediction = async (poll: Poll, mark: 'right' | 'wrong') => {
    const np = { ...predictions, [poll.id]: mark };
    setPredictions(np);
    await store.savePredictions(np);
    Haptics.notificationAsync(
      mark === 'right'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
  };

  // Titles with spoiler protection enabled (matched by anime title)
  const shieldedTitles = useMemo(() => {
    const s = new Set<string>();
    for (const e of Object.values(progress)) {
      if (e.hideSpoilers) s.add(e.title.toLowerCase());
    }
    return s;
  }, [progress]);

  // "You're on episode X of Y" explainer for shielded posts
  const shieldHintFor = (animeTag?: string): string | undefined => {
    if (!animeTag) return undefined;
    const e = Object.values(progress).find(
      (p) => p.hideSpoilers && p.title.toLowerCase() === animeTag.toLowerCase()
    );
    if (!e) return undefined;
    return `${e.watched}${e.total ? ` of ${e.total}` : ''}`;
  };

  // 🙈 one-tap spoiler shield: enable hideSpoilers for an anime title from the feed
  const quickShield = async (tag: string) => {
    const pg = await store.progress();
    const key = Object.keys(pg).find(
      (k) => pg[k].title.toLowerCase() === tag.toLowerCase()
    ) || `t:${tag.toLowerCase()}`;
    const cur = pg[key] || { title: tag, watched: 0, hideSpoilers: false };
    pg[key] = { ...cur, hideSpoilers: true, title: cur.title || tag };
    await store.saveProgress(pg);
    setProgress(pg);
  };

  const mutedWords = useMemo(() => mutes.words.map((w) => w.toLowerCase()), [mutes]);
  const mutedAnime = useMemo(() => new Set(mutes.anime.map((a) => a.toLowerCase())), [mutes]);

  const visible = posts.filter((x) => {
    if (topic !== 'All' && x.topic !== topic) return false;
    if (animeOnly && x.mangaComparisons) return false; // 📺 anime-only lane
    if (x.animeTag && mutedAnime.has(x.animeTag.toLowerCase())) return false;
    if (mutedWords.length > 0) {
      const hay = `${x.title} ${x.body}`.toLowerCase();
      if (mutedWords.some((w) => w && hay.includes(w))) return false;
    }
    return true;
  });

  const sorted = [...visible].sort((a, b) =>
    sort === 'hot' ? hotScore(b) - hotScore(a) : b.createdAt - a.createdAt
  );

  const mutedCount = posts.length - visible.length - (posts.length - posts.filter((x) => topic === 'All' || x.topic === topic).length);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>Ani<Text style={{ color: C.secondary }}>Verse</Text></Text>
        <View style={s.headerRight}>
          <Text
            style={s.timePill}
            accessibilityLabel={`Time spent in feed today: ${feedTime.replace('⏱️ ', '')}`}
          >
            {feedTime}
          </Text>
          <Pressable
            style={s.sortBtn}
            onPress={() => setSort(sort === 'hot' ? 'new' : 'hot')}
          >
            <Text style={s.sortText}>{sort === 'hot' ? '🔥 Hot' : '🆕 New'}</Text>
          </Pressable>
        </View>
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
        <Pressable
          onPress={async () => {
            const next = !animeOnly;
            setAnimeOnly(next);
            await store.saveAnimeOnly(next);
          }}
          style={[s.chip, animeOnly && { backgroundColor: C.gold, borderColor: C.gold }]}
          accessibilityLabel="Anime-only mode: hide posts comparing to the manga"
        >
          <Text style={[s.chipText, animeOnly && { color: '#fff' }]}>📺 Anime-only</Text>
        </Pressable>
      </ScrollView>

      {mutedCount > 0 && (
        <Text style={s.mutedNote}>
          🙈 {mutedCount} {mutedCount === 1 ? 'post' : 'posts'} hidden by your mute filters
        </Text>
      )}
      {animeOnly && (
        <Text style={s.mutedNote}>📺 Anime-only mode — manga-comparison posts hidden</Text>
      )}
      <Text style={s.sortNote}>
        {sort === 'hot'
          ? '🔥 Hot = ranked by likes & recency — no black-box algorithm'
          : '🆕 New = purely chronological, newest first'}
      </Text>

      <FlatList
        data={sorted}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const strict =
            item.spoiler &&
            !!item.animeTag &&
            shieldedTitles.has(item.animeTag.toLowerCase());
          return (
            <PostCard
              post={item}
              reactions={reactions[item.id] || {}}
              myReaction={myReactions[item.id] || null}
              commentCount={commentCounts[item.id] || 0}
              voted={votes[item.poll?.id || ''] ?? null}
              predictionMark={item.poll ? predictions[item.poll.id] ?? null : null}
              strictSpoiler={strict}
              hideCounts={calmMode}
              onReact={(e) => toggleReaction(item, e)}
              onOpen={() => nav.navigate('PostDetail', { postId: item.id })}
              onAvatarPress={() => nav.navigate('UserProfile', { author: item.author })}
              shieldHint={shieldHintFor(item.animeTag)}
              onShieldAnime={quickShield}
              onVote={(i) => item.poll && castVote(item.poll, i)}
              onMarkPrediction={(m) => item.poll && markPrediction(item.poll, m)}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={s.empty}>No posts here yet — start the conversation! 🎌</Text>
        }
        ListFooterComponent={
          sorted.length > 0 ? (
            <View style={s.caughtUp}>
              <Text style={s.caughtUpEmoji}>🎉</Text>
              <Text style={s.caughtUpText}>You're all caught up!</Text>
              <Text style={s.caughtUpSub}>No infinite scroll here — go watch some anime. 📺</Text>
            </View>
          ) : undefined
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

      <BreakNudge
        visible={nudgeOpen}
        minutes={nudgeMin}
        onKeepScrolling={async () => {
          await recordNudgeShown();
          setNudgeOpen(false);
        }}
        onTakeBreak={() => recordBreak()}
        onDismiss={() => setNudgeOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  logo: { color: C.primary, fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  sortBtn: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  sortText: { color: C.text, fontWeight: '700' },
  timePill: { color: C.muted, fontSize: 13, fontWeight: '600', marginRight: 10, fontVariant: ['tabular-nums'] },
  chips: { maxHeight: 46, marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: C.card, alignSelf: 'center' },
  chipText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  mutedNote: { color: C.faint, fontSize: 12, textAlign: 'center', marginBottom: 4 },
  sortNote: { color: C.faint, fontSize: 11, textAlign: 'center', marginBottom: 6, opacity: 0.8 },
  empty: { color: C.faint, textAlign: 'center', marginTop: 60, fontSize: 15 },
  caughtUp: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 30 },
  caughtUpEmoji: { fontSize: 40, marginBottom: 8 },
  caughtUpText: { color: C.text, fontSize: 17, fontWeight: '800' },
  caughtUpSub: { color: C.faint, fontSize: 13, marginTop: 6, textAlign: 'center' },
  fab: { position: 'absolute', right: 18, bottom: 26, width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', marginTop: -2 },
});

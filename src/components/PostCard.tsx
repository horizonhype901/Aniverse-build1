import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, R, TOPIC_COLORS } from '../theme';
import { Poll, Post } from '../types';
import { compact, timeAgo } from '../lib/format';

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[s.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function PollVote({
  poll, voted, onVote,
}: { poll: Poll; voted: number | null; onVote: (i: number) => void }) {
  const total = poll.options.reduce((a, o) => a + o.votes, 0) || 1;
  return (
    <View style={s.poll}>
      <Text style={s.pollQ}>📊 {poll.question}</Text>
      {poll.options.map((o, i) => {
        const pct = Math.round((o.votes / total) * 100);
        const mine = voted === i;
        return (
          <Pressable
            key={i}
            disabled={voted !== null}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onVote(i);
            }}
            style={[s.opt, mine && s.optMine]}
          >
            <View style={[s.optFill, { width: `${pct}%`, backgroundColor: mine ? C.primary : C.secondary }]} />
            <Text style={s.optText}>{o.text}</Text>
            <Text style={s.optPct}>{voted !== null ? `${pct}%` : 'vote'}</Text>
          </Pressable>
        );
      })}
      <Text style={s.pollTotal}>{total.toLocaleString()} votes</Text>
    </View>
  );
}

interface Props {
  post: Post;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  voted: number | null;
  onLike: () => void;
  onOpen: () => void;
  onVote: (i: number) => void;
  expanded?: boolean;
}

export default function PostCard(p: Props) {
  const { post } = p;
  const [revealed, setRevealed] = useState(false);
  const topicColor = TOPIC_COLORS[post.topic] || C.muted;

  const share = async () => {
    try {
      await Share.share({ message: `${post.title}\n\n${post.body}\n\n— via AniVerse` });
    } catch {}
  };

  const body = (
    <>
      <View style={s.head}>
        <Avatar name={post.author} color={post.authorColor} />
        <View style={{ flex: 1 }}>
          <Text style={s.author}>{post.author}</Text>
          <Text style={s.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={[s.topic, { borderColor: topicColor }]}>
          <Text style={[s.topicText, { color: topicColor }]}>{post.topic}</Text>
        </View>
      </View>
      <Text style={s.title}>{post.title}</Text>
      {post.spoiler && !revealed ? (
        <Pressable style={s.spoilerBox} onPress={() => setRevealed(true)}>
          <Text style={s.spoilerText}>⚠️ Spoiler hidden — tap to reveal</Text>
        </Pressable>
      ) : (
        <Text style={s.body} numberOfLines={p.expanded ? undefined : 4}>{post.body}</Text>
      )}
      {post.animeTag ? (
        <View style={s.animeTag}><Text style={s.animeTagText}>🎌 {post.animeTag}</Text></View>
      ) : null}
      {post.poll ? <PollVote poll={post.poll} voted={p.voted} onVote={p.onVote} /> : null}
    </>
  );

  return (
    <View style={s.card}>
      <Pressable onPress={p.onOpen}>{body}</Pressable>
      <View style={s.foot}>
        <Pressable
          style={s.footBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            p.onLike();
          }}
        >
          <Text style={[s.footText, p.liked && { color: C.primary }]}>
            {p.liked ? '❤️' : '🤍'} {compact(p.likeCount)}
          </Text>
        </Pressable>
        <Pressable style={s.footBtn} onPress={p.onOpen}>
          <Text style={s.footText}>💬 {compact(p.commentCount)}</Text>
        </Pressable>
        <Pressable style={s.footBtn} onPress={share}>
          <Text style={s.footText}>↗ Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.lg, marginHorizontal: 12, marginVertical: 6, padding: 14, borderWidth: 1, borderColor: C.border },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '800' },
  author: { color: C.text, fontWeight: '700', fontSize: 14 },
  time: { color: C.faint, fontSize: 12 },
  topic: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  topicText: { fontSize: 11, fontWeight: '700' },
  title: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  body: { color: C.muted, fontSize: 14, lineHeight: 20 },
  spoilerBox: { backgroundColor: C.spoiler, borderRadius: R.md, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  spoilerText: { color: C.gold, fontWeight: '700' },
  animeTag: { alignSelf: 'flex-start', backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8 },
  animeTagText: { color: C.accent, fontSize: 12, fontWeight: '600' },
  foot: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  footBtn: { marginRight: 22, paddingVertical: 4 },
  footText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  poll: { marginTop: 10, backgroundColor: C.surface, borderRadius: R.md, padding: 10 },
  pollQ: { color: C.text, fontWeight: '700', marginBottom: 8 },
  opt: { position: 'relative', overflow: 'hidden', borderRadius: 8, backgroundColor: C.card2, marginBottom: 6, padding: 10, borderWidth: 1, borderColor: C.border },
  optMine: { borderColor: C.primary },
  optFill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.25 },
  optText: { color: C.text, fontWeight: '600' },
  optPct: { position: 'absolute', right: 10, top: 10, color: C.muted, fontSize: 12, fontWeight: '700' },
  pollTotal: { color: C.faint, fontSize: 12, marginTop: 2 },
});

import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { store } from '../lib/store';
import { Comment, Poll, Post, ProgressEntry } from '../types';
import PostCard, { Avatar } from '../components/PostCard';
import { timeAgo } from '../lib/format';

export default function PostDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [predictions, setPredictions] = useState<Record<string, 'right' | 'wrong'>>({});
  const [progress, setProgress] = useState<Record<number, ProgressEntry>>({});
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    const [posts, all, cl, r, mr, v, pr, pg] = await Promise.all([
      store.posts(), store.comments(), store.commentLikes(),
      store.reactions(), store.myReactions(), store.votes(),
      store.predictions(), store.progress(),
    ]);
    setPost(posts.find((x) => x.id === postId) || null);
    setComments((all[postId] || []).slice().sort((a, b) => b.createdAt - a.createdAt));
    setCommentLikes(cl);
    setReactions(r);
    setMyReactions(mr);
    setVotes(v);
    setPredictions(pr);
    setProgress(pg);
  }, [postId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleReaction = async (emoji: string) => {
    if (!post) return;
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

  const toggleCommentLike = async (c: Comment) => {
    const has = commentLikes.includes(c.id);
    const fixed = has ? commentLikes.filter((x) => x !== c.id) : [...commentLikes, c.id];
    setCommentLikes(fixed);
    await store.saveCommentLikes(fixed);
    const all = await store.comments();
    const list = (all[postId] || []).map((x) =>
      x.id === c.id ? { ...x, likes: x.likes + (has ? -1 : 1) } : x
    );
    all[postId] = list;
    await store.saveComments(all);
    setComments(list.slice().sort((a, b) => b.createdAt - a.createdAt));
  };

  const castVote = async (poll: Poll, idx: number) => {
    if (votes[poll.id] !== undefined && votes[poll.id] !== null) return;
    const nv = { ...votes, [poll.id]: idx };
    setVotes(nv);
    await store.saveVotes(nv);
    const posts = await store.posts();
    const updated = posts.map((x) => {
      if (x.poll?.id === poll.id) {
        const options = x.poll.options.map((o, i) =>
          i === idx ? { ...o, votes: o.votes + 1 } : o
        );
        return { ...x, poll: { ...x.poll, options } };
      }
      return x;
    });
    await store.savePosts(updated);
    setPost(updated.find((x) => x.id === postId) || null);
  };

  const markPrediction = async (poll: Poll, mark: 'right' | 'wrong') => {
    const np = { ...predictions, [poll.id]: mark };
    setPredictions(np);
    await store.savePredictions(np);
  };

  const sendComment = async () => {
    if (!draft.trim() || !post) return;
    const profile = await store.profile();
    const c: Comment = {
      id: `c-${Date.now()}`,
      postId: post.id,
      author: profile.username,
      authorColor: profile.color,
      avatar: profile.avatar ?? null,
      photoUri: profile.photoUri ?? null,
      body: draft.trim(),
      createdAt: Date.now(),
      likes: 0,
      parentId: replyTo?.id,
    };
    const all = await store.comments();
    const list = [c, ...(all[post.id] || [])];
    all[post.id] = list;
    await store.saveComments(all);
    setComments(list.slice().sort((a, b) => b.createdAt - a.createdAt));
    setDraft('');
    setReplyTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const { tops, repliesByParent } = useMemo(() => {
    const t = comments.filter((c) => !c.parentId);
    const r: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (c.parentId) {
        if (!r[c.parentId]) r[c.parentId] = [];
        r[c.parentId].push(c);
      }
    }
    for (const k of Object.keys(r)) r[k].sort((a, b) => a.createdAt - b.createdAt);
    return { tops: t, repliesByParent: r };
  }, [comments]);

  const renderComment = (c: Comment, nested = false) => (
    <View key={c.id}>
      <View style={[s.comment, nested && s.nested]}>
        <Avatar name={c.author} color={c.authorColor} size={nested ? 28 : 34} avatar={c.avatar} photoUri={c.photoUri} />
        <View style={{ flex: 1 }}>
          <View style={s.cHead}>
            <Text style={s.cAuthor}>{c.author}</Text>
            <Text style={s.cTime}>{timeAgo(c.createdAt)}</Text>
          </View>
          <Text style={s.cBody}>{c.body}</Text>
          <View style={s.cActions}>
            <Pressable onPress={() => toggleCommentLike(c)}>
              <Text style={[s.cLike, commentLikes.includes(c.id) && { color: C.primary }]}>
                {commentLikes.includes(c.id) ? '❤️' : '🤍'} {c.likes}
              </Text>
            </Pressable>
            {!nested && (
              <Pressable onPress={() => setReplyTo(c)}>
                <Text style={s.cReply}>↩ Reply</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      {!nested &&
        (repliesByParent[c.id] || []).map((r) => renderComment(r, true))}
    </View>
  );

  if (!post) {
    return (
      <View style={s.root}>
        <Text style={s.loading}>Loading thread…</Text>
      </View>
    );
  }

  const strict =
    post.spoiler &&
    !!post.animeTag &&
    Object.values(progress).some(
      (e) => e.hideSpoilers && e.title.toLowerCase() === post.animeTag!.toLowerCase()
    );

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.headerTitle}>Thread</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <PostCard
          post={post}
          reactions={reactions[post.id] || {}}
          myReaction={myReactions[post.id] || null}
          commentCount={comments.length}
          voted={votes[post.poll?.id || ''] ?? null}
          predictionMark={post.poll ? predictions[post.poll.id] ?? null : null}
          strictSpoiler={strict}
          onReact={toggleReaction}
          onOpen={() => {}}
          onVote={(i) => post.poll && castVote(post.poll, i)}
          onMarkPrediction={(m) => post.poll && markPrediction(post.poll, m)}
          expanded
        />
        <Text style={s.cTitle}>💬 {comments.length} {comments.length === 1 ? 'reply' : 'replies'}</Text>
        {tops.map((c) => renderComment(c))}
      </ScrollView>
      {replyTo && (
        <View style={s.replyBar}>
          <Text style={s.replyText}>↩ Replying to {replyTo.author}</Text>
          <Pressable onPress={() => setReplyTo(null)}>
            <Text style={s.replyCancel}>✕</Text>
          </Pressable>
        </View>
      )}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={replyTo ? `Reply to ${replyTo.author}…` : 'Add your take…'}
          placeholderTextColor={C.faint}
          multiline
        />
        <Pressable style={[s.send, !draft.trim() && s.sendDim]} onPress={sendComment}>
          <Text style={s.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { color: C.muted, textAlign: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 17, fontWeight: '700', width: 60 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  cTitle: { color: C.text, fontWeight: '800', fontSize: 15, marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  comment: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, marginHorizontal: 12, marginVertical: 4, padding: 12 },
  nested: { marginLeft: 34, backgroundColor: C.card, borderLeftWidth: 2, borderLeftColor: C.secondary },
  cHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  cAuthor: { color: C.text, fontWeight: '700', fontSize: 13, marginRight: 8 },
  cTime: { color: C.faint, fontSize: 11 },
  cBody: { color: C.muted, fontSize: 14, lineHeight: 20 },
  cActions: { flexDirection: 'row', marginTop: 6 },
  cLike: { color: C.faint, fontSize: 12, fontWeight: '700', marginRight: 16 },
  cReply: { color: C.secondary, fontSize: 12, fontWeight: '700' },
  replyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.card2 },
  replyText: { color: C.secondary, fontSize: 13, fontWeight: '600' },
  replyCancel: { color: C.muted, fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendDim: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 18 },
});

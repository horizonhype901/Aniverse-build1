import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { store } from '../lib/store';
import { Comment, Poll, Post } from '../types';
import PostCard, { Avatar } from '../components/PostCard';
import { timeAgo } from '../lib/format';

export default function PostDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    const [posts, all, l, cl, v] = await Promise.all([
      store.posts(), store.comments(), store.likes(), store.commentLikes(), store.votes(),
    ]);
    setPost(posts.find((x) => x.id === postId) || null);
    setComments((all[postId] || []).slice().sort((a, b) => b.createdAt - a.createdAt));
    setLikes(l);
    setCommentLikes(cl);
    setVotes(v);
  }, [postId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleLike = async () => {
    if (!post) return;
    const has = likes.includes(post.id);
    const next = has ? likes.filter((x) => x !== post.id) : [...likes, post.id];
    setLikes(next);
    await store.saveLikes(next);
    const posts = await store.posts();
    const updated = posts.map((x) =>
      x.id === post.id ? { ...x, likes: x.likes + (has ? -1 : 1) } : x
    );
    await store.savePosts(updated);
    setPost(updated.find((x) => x.id === post.id) || null);
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

  const sendComment = async () => {
    if (!draft.trim() || !post) return;
    const profile = await store.profile();
    const c: Comment = {
      id: `c-${Date.now()}`,
      postId: post.id,
      author: profile.username,
      authorColor: profile.color,
      body: draft.trim(),
      createdAt: Date.now(),
      likes: 0,
    };
    const all = await store.comments();
    const list = [c, ...(all[post.id] || [])];
    all[post.id] = list;
    await store.saveComments(all);
    setComments(list);
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!post) {
    return (
      <View style={s.root}>
        <Text style={s.loading}>Loading thread…</Text>
      </View>
    );
  }

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
          liked={likes.includes(post.id)}
          likeCount={post.likes}
          commentCount={comments.length}
          voted={votes[post.poll?.id || ''] ?? null}
          onLike={toggleLike}
          onOpen={() => {}}
          onVote={(i) => post.poll && castVote(post.poll, i)}
          expanded
        />
        <Text style={s.cTitle}>💬 {comments.length} {comments.length === 1 ? 'reply' : 'replies'}</Text>
        {comments.map((c) => (
          <View key={c.id} style={s.comment}>
            <Avatar name={c.author} color={c.authorColor} size={34} />
            <View style={{ flex: 1 }}>
              <View style={s.cHead}>
                <Text style={s.cAuthor}>{c.author}</Text>
                <Text style={s.cTime}>{timeAgo(c.createdAt)}</Text>
              </View>
              <Text style={s.cBody}>{c.body}</Text>
              <Pressable onPress={() => toggleCommentLike(c)}>
                <Text style={[s.cLike, commentLikes.includes(c.id) && { color: C.primary }]}>
                  {commentLikes.includes(c.id) ? '❤️' : '🤍'} {c.likes}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Add your take…"
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
  cHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  cAuthor: { color: C.text, fontWeight: '700', fontSize: 13, marginRight: 8 },
  cTime: { color: C.faint, fontSize: 11 },
  cBody: { color: C.muted, fontSize: 14, lineHeight: 20 },
  cLike: { color: C.faint, fontSize: 12, fontWeight: '700', marginTop: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendDim: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 18 },
});

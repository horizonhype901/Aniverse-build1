import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { C, R, TOPIC_COLORS } from '../theme';
import { TOPICS } from '../data/seed';
import { store } from '../lib/store';
import { heatCheck } from '../lib/kindness';
import { Post, Topic } from '../types';

const AVATAR_COLORS = ['#FF4D6D', '#8B5CF6', '#22D3EE', '#F472B6', '#FFC94D', '#4ADE80', '#FB7185'];

export default function ComposerScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const prefill = route.params?.prefill || {};

  const [topic, setTopic] = useState<Topic>(prefill.topic || 'General');
  const [title, setTitle] = useState(prefill.title || '');
  const [body, setBody] = useState('');
  const [animeTag, setAnimeTag] = useState(prefill.animeTag || '');
  const [credit, setCredit] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [mangaCmp, setMangaCmp] = useState(false); // 📺 thread lanes: post compares anime to manga/LN
  const [pollOn, setPollOn] = useState(false);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);
  const [prediction, setPrediction] = useState(false);

  const setOpt = (i: number, v: string) => {
    const n = [...pollOpts];
    n[i] = v;
    setPollOpts(n);
  };

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Almost there', 'Give your post a title and some text.');
      return;
    }
    if (pollOn) {
      const clean = pollOpts.map((o) => o.trim()).filter(Boolean);
      if (!pollQ.trim() || clean.length < 2) {
        Alert.alert('Poll needs work', 'Add a question and at least 2 options.');
        return;
      }
    }
    // 🌡️ kindness nudge: heated drafts get a speed bump, never a block
    const heat = heatCheck(`${title}\n${body}`);
    if (heat.level === 'hot') {
      Alert.alert(
        '🌡️ Reads a bit heated',
        `This post tripped the chill filter (${heat.flags.join('; ')}). AniVerse is a chill zone — want to tone it down, or post as-is?`,
        [
          { text: '✏️ Let me edit', style: 'cancel' },
          { text: 'Post anyway', onPress: () => doSubmit() },
        ]
      );
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    const profile = await store.profile();
    const cleanOpts = pollOpts.map((o) => o.trim()).filter(Boolean);
    const post: Post = {
      id: `u-${Date.now()}`,
      author: profile.username,
      authorColor: profile.color,
      avatar: profile.avatar ?? null,
      photoUri: profile.photoUri ?? null,
      topic,
      title: title.trim(),
      body: body.trim(),
      spoiler,
      mangaComparisons: topic === 'Episode Talk' ? mangaCmp : false,
      animeTag: animeTag.trim() || undefined,
      credit: credit.trim() || undefined,
      poll: pollOn
        ? {
            id: `poll-u-${Date.now()}`,
            question: pollQ.trim(),
            options: cleanOpts.map((t) => ({ text: t, votes: 0 })),
            prediction: prediction || undefined,
          }
        : undefined,
      createdAt: Date.now(),
      likes: 0,
    };
    const posts = await store.posts();
    await store.savePosts([post, ...posts]);
    nav.goBack();
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.cancel}>✕</Text></Pressable>
        <Text style={s.headerTitle}>New Post</Text>
        <Pressable style={s.postBtn} onPress={submit}><Text style={s.postText}>Post</Text></Pressable>
      </View>
      <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Topic</Text>
        <View style={s.topicGrid}>
          {TOPICS.filter((t) => t !== 'All').map((t) => {
            const active = topic === t;
            const color = TOPIC_COLORS[t] || C.muted;
            return (
              <Pressable
                key={t}
                onPress={() => setTopic(t as Topic)}
                style={[s.topicChip, active && { backgroundColor: color, borderColor: color }]}
              >
                <Text style={[s.topicText, active && { color: '#fff' }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.label}>Title</Text>
        <TextInput style={s.input} value={title} onChangeText={setTitle}
          placeholder="What's the discussion?" placeholderTextColor={C.faint} />

        <Text style={s.label}>Body</Text>
        <TextInput style={[s.input, s.multiline]} value={body} onChangeText={setBody}
          placeholder="Share your take, theory, or question..." placeholderTextColor={C.faint}
          multiline textAlignVertical="top" />

        <Text style={s.label}>Anime tag (optional)</Text>
        <TextInput style={s.input} value={animeTag} onChangeText={setAnimeTag}
          placeholder="e.g. Frieren: Beyond Journey's End" placeholderTextColor={C.faint} />

        {topic === 'Art & Cosplay' && (
          <>
            <Text style={s.label}>🎨 Artist credit</Text>
            <TextInput style={s.input} value={credit} onChangeText={setCredit}
              placeholder="Who made this? (handle or name)" placeholderTextColor={C.faint} />
            <Text style={s.creditHint}>
              Always credit the original artist — reposts without credit are
              the #1 complaint in fan-art communities.
            </Text>
          </>
        )}

        <View style={s.row}>
          <Text style={s.rowLabel}>⚠️ Contains spoilers</Text>
          <Switch value={spoiler} onValueChange={setSpoiler}
            trackColor={{ true: C.primary }} thumbColor="#fff" />
        </View>
        {topic === 'Episode Talk' && (
          <View style={s.row}>
            <Text style={s.rowLabel}>📖 Compares to the manga / LN</Text>
            <Switch value={mangaCmp} onValueChange={setMangaCmp}
              trackColor={{ true: C.gold }} thumbColor="#fff" />
          </View>
        )}
        <View style={s.row}>
          <Text style={s.rowLabel}>📊 Add a poll</Text>
          <Switch value={pollOn} onValueChange={setPollOn}
            trackColor={{ true: C.secondary }} thumbColor="#fff" />
        </View>

        {pollOn && (
          <View style={s.pollBox}>
            <TextInput style={s.input} value={pollQ} onChangeText={setPollQ}
              placeholder="Poll question" placeholderTextColor={C.faint} />
            {pollOpts.map((o, i) => (
              <TextInput key={i} style={s.input} value={o}
                onChangeText={(v) => setOpt(i, v)}
                placeholder={`Option ${i + 1}`} placeholderTextColor={C.faint} />
            ))}
            {pollOpts.length < 4 && (
              <Pressable onPress={() => setPollOpts([...pollOpts, ''])}>
                <Text style={s.addOpt}>＋ Add option</Text>
              </Pressable>
            )}
            <View style={s.row}>
              <Text style={s.rowLabel}>🔮 This is a prediction</Text>
              <Switch value={prediction} onValueChange={setPrediction}
                trackColor={{ true: C.gold }} thumbColor="#fff" />
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  cancel: { color: C.muted, fontSize: 22 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  postBtn: { backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  postText: { color: '#fff', fontWeight: '800' },
  body: { flex: 1, padding: 16 },
  label: { color: C.muted, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  topicChip: { borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8, backgroundColor: C.card },
  topicText: { color: C.muted, fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, fontSize: 15, marginBottom: 10 },
  multiline: { minHeight: 120 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { color: C.text, fontWeight: '600', fontSize: 15 },
  creditHint: { color: C.faint, fontSize: 12, marginTop: -6, marginBottom: 10, lineHeight: 17 },
  pollBox: { backgroundColor: C.surface, borderRadius: R.md, padding: 10, borderWidth: 1, borderColor: C.border },
  addOpt: { color: C.secondary, fontWeight: '700', padding: 8 },
});

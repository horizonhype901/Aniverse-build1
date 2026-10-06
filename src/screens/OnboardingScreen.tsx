import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, R, TOPIC_COLORS } from '../theme';
import { FALLBACK_ANIME, QUIZ_ANIME_IDS, TOPICS } from '../data/seed';
import { store } from '../lib/store';
import { Topic } from '../types';

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Topic[]>([]);

  const quizAnime = QUIZ_ANIME_IDS.map(
    (id) => FALLBACK_ANIME.find((a) => a.id === id)!
  ).filter(Boolean);
  const current = quizAnime[idx];

  const answer = async (kind: 'seen' | 'want' | 'skip') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (kind !== 'skip' && current) {
      const w = await store.watchlist();
      if (!w.some((x) => x.anime.id === current.id)) {
        w.unshift({
          anime: current,
          status: kind === 'seen' ? 'completed' : 'plan',
          addedAt: Date.now(),
        });
        await store.saveWatchlist(w);
      }
      if (kind === 'seen') {
        const pg = await store.progress();
        pg[current.id] = {
          title: current.title,
          watched: current.episodes || 24,
          total: current.episodes,
          hideSpoilers: false,
        };
        await store.saveProgress(pg);
      }
    }
    if (idx + 1 < quizAnime.length) setIdx(idx + 1);
    else setStep(1);
  };

  const toggleTopic = (t: Topic) => {
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  };

  const finish = async () => {
    await store.saveFavTopics(picked);
    await store.setOnboarded();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone();
  };

  if (step === 0 && current) {
    return (
      <View style={s.root}>
        <Text style={s.kicker}>STEP 1 OF 2</Text>
        <Text style={s.title}>What have you watched?</Text>
        <Text style={s.sub}>{idx + 1} of {quizAnime.length}</Text>
        <View style={s.card}>
          <View style={s.posterPh}>
            <Text style={s.posterEmoji}>🎌</Text>
          </View>
          <Text style={s.animeTitle}>{current.title}</Text>
          <Text style={s.animeMeta}>
            {current.score ? `⭐ ${current.score.toFixed(2)}  ` : ''}
            {(current.genres || []).slice(0, 3).join(' • ')}
          </Text>
          <Text style={s.animeSyn} numberOfLines={3}>{current.synopsis}</Text>
        </View>
        <View style={s.btnRow}>
          <Pressable style={[s.btn, s.skip]} onPress={() => answer('skip')}>
            <Text style={s.btnText}>⏭ Skip</Text>
          </Pressable>
          <Pressable style={[s.btn, s.want]} onPress={() => answer('want')}>
            <Text style={s.btnText}>📌 Want</Text>
          </Pressable>
          <Pressable style={[s.btn, s.seen]} onPress={() => answer('seen')}>
            <Text style={[s.btnText, { color: '#fff' }]}>✅ Seen</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Text style={s.kicker}>STEP 2 OF 2</Text>
      <Text style={s.title}>What do you want to talk about?</Text>
      <Text style={s.sub}>Pick a few — your feed will favor them.</Text>
      <ScrollView contentContainerStyle={s.topicWrap}>
        {TOPICS.filter((t) => t !== 'All').map((t) => {
          const active = picked.includes(t as Topic);
          const color = TOPIC_COLORS[t] || C.muted;
          return (
            <Pressable
              key={t}
              onPress={() => toggleTopic(t as Topic)}
              style={[s.topic, active && { backgroundColor: color, borderColor: color }]}
            >
              <Text style={[s.topicText, active && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={[s.finish, picked.length === 0 && s.finishDim]} onPress={finish}>
        <Text style={s.finishText}>
          {picked.length === 0 ? 'Skip for now' : `Let's go 🎌 (${picked.length} topics)`}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 70, alignItems: 'center' },
  kicker: { color: C.secondary, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  title: { color: C.text, fontSize: 26, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  sub: { color: C.faint, marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: 20, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  posterPh: { width: 110, height: 150, borderRadius: R.md, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  posterEmoji: { fontSize: 48 },
  animeTitle: { color: C.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  animeMeta: { color: C.gold, fontSize: 13, marginTop: 6, fontWeight: '600' },
  animeSyn: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  btnRow: { flexDirection: 'row', marginTop: 24, width: '100%', justifyContent: 'space-between' },
  btn: { flex: 1, borderRadius: R.lg, padding: 14, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  skip: {},
  want: { borderColor: C.secondary },
  seen: { backgroundColor: C.primary, borderColor: C.primary },
  btnText: { color: C.text, fontWeight: '800' },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10 },
  topic: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, margin: 5 },
  topicText: { color: C.muted, fontWeight: '700' },
  finish: { backgroundColor: C.primary, borderRadius: R.lg, padding: 16, width: '100%', alignItems: 'center', marginTop: 16 },
  finishDim: { opacity: 0.7 },
  finishText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export interface Badge { id: string; emoji: string; name: string; desc: string; }

export interface BadgeStats {
  eps: number;
  streak: number;
  predRight: number;
  predTotal: number;
  podEps: number;
  comments: number;
  posts: number;
  checkinDays: number;
  showcaseCount: number;
  hasAnthem: boolean;
  breakStreak: number;
}

export function computeBadges(s: BadgeStats): Badge[] {
  const b: Badge[] = [];
  if (s.streak >= 7) b.push({ id: 'streak7', emoji: '🔥', name: 'Week Warrior', desc: '7-day anime streak' });
  if (s.checkinDays >= 30) b.push({ id: 'regular', emoji: '🗓️', name: 'Regular', desc: '30 active days' });
  if (s.eps >= 100) b.push({ id: 'century', emoji: '📺', name: 'Century Club', desc: '100 episodes tracked' });
  if (s.predRight >= 5) b.push({ id: 'oracle', emoji: '🔮', name: 'Oracle', desc: '5 predictions called right' });
  else if (s.predTotal >= 1) b.push({ id: 'seer', emoji: '🔮', name: 'Rookie Seer', desc: 'Made a prediction' });
  if (s.podEps >= 10) b.push({ id: 'podhead', emoji: '🎙️', name: 'Podhead', desc: '10 podcast episodes finished' });
  if (s.comments >= 25) b.push({ id: 'chatter', emoji: '💬', name: 'Chatterbox', desc: '25 comments posted' });
  if (s.posts >= 10) b.push({ id: 'poster', emoji: '✍️', name: 'Poster', desc: '10 posts published' });
  if (s.showcaseCount >= 3) b.push({ id: 'curator', emoji: '⭐', name: 'Curator', desc: 'Showcased 3 favorites' });
  if (s.hasAnthem) b.push({ id: 'anthem', emoji: '🎵', name: 'Anthem Set', desc: 'Set a profile anthem' });
  if (s.breakStreak >= 3) b.push({ id: 'touchgrass', emoji: '🌱', name: 'Touch Grass', desc: 'Took a screen-time break 3 days in a row' });
  return b;
}

const ALL: Badge[] = [
  { id: 'streak7', emoji: '🔥', name: 'Week Warrior', desc: '7-day anime streak' },
  { id: 'regular', emoji: '🗓️', name: 'Regular', desc: '30 active days' },
  { id: 'century', emoji: '📺', name: 'Century Club', desc: '100 episodes tracked' },
  { id: 'oracle', emoji: '🔮', name: 'Oracle', desc: '5 predictions called right' },
  { id: 'podhead', emoji: '🎙️', name: 'Podhead', desc: '10 podcast episodes finished' },
  { id: 'chatter', emoji: '💬', name: 'Chatterbox', desc: '25 comments posted' },
  { id: 'poster', emoji: '✍️', name: 'Poster', desc: '10 posts published' },
  { id: 'curator', emoji: '⭐', name: 'Curator', desc: 'Showcased 3 favorites' },
  { id: 'anthem', emoji: '🎵', name: 'Anthem Set', desc: 'Set a profile anthem' },
  { id: 'touchgrass', emoji: '🌱', name: 'Touch Grass', desc: 'Took a screen-time break 3 days in a row' },
];

/** Deterministic badges for community members. */
export function badgesFor(name: string): Badge[] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const n = 2 + (h % 3);
  const out: Badge[] = [];
  for (let i = 0; i < n; i++) out.push(ALL[(h >> (i * 4)) % ALL.length]);
  return [...new Map(out.map((b) => [b.id, b])).values()];
}

export function BadgesRow({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
      {badges.map((b) => (
        <Pressable key={b.id} style={s.chip} onPress={() => Alert.alert(`${b.emoji} ${b.name}`, b.desc)}>
          <Text style={s.emoji}>{b.emoji}</Text>
          <Text style={s.name}>{b.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: C.border },
  emoji: { fontSize: 16, marginRight: 6 },
  name: { color: C.text, fontWeight: '700', fontSize: 12 },
});

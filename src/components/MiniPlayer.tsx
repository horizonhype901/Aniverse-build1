import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAudioPlayerStatus } from 'expo-audio';
import { C } from '../theme';
import { useAudio } from '../lib/audio';
import { fmtClock } from '../lib/format';

export default function MiniPlayer() {
  const { now, playing, toggle, close, player } = useAudio();
  const status = useAudioPlayerStatus(player);
  const nav = useNavigation<any>();

  if (!now) return null;
  const pct = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
      <View style={s.row}>
        <Pressable onPress={toggle} style={s.playBtn}>
          <Text style={s.playText}>{playing ? '⏸' : '▶️'}</Text>
        </Pressable>
        <Pressable
          style={s.meta}
          onPress={() => nav.navigate('ShowDetail', { show: now.show })}
        >
          {!!now.show.art && <Image source={{ uri: now.show.art }} style={s.art} />}
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{now.episode.title}</Text>
            <Text style={s.sub} numberOfLines={1}>
              {now.show.name} • {fmtClock(status.currentTime)} / {fmtClock(status.duration)}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={close} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#241B45', borderTopWidth: 1, borderTopColor: C.border },
  bar: { height: 3, backgroundColor: '#00000055' },
  fill: { height: 3, backgroundColor: C.primary },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  playText: { fontSize: 16 },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  art: { width: 38, height: 38, borderRadius: 8, marginRight: 8 },
  title: { color: C.text, fontWeight: '700', fontSize: 13 },
  sub: { color: C.muted, fontSize: 11 },
  closeBtn: { padding: 8 },
  closeText: { color: C.muted, fontSize: 16 },
});

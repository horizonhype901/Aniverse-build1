import React, { useEffect } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { C, R } from '../theme';
import { Anthem } from '../types';
import { spotifySearchUrl } from '../lib/music';
import { useAudio } from '../lib/audio';

export default function AnthemCard({ anthem }: { anthem: Anthem }) {
  const player = useAudioPlayer(anthem.previewUrl ?? null);
  const status = useAudioPlayerStatus(player);
  const { now, playing } = useAudio();

  useEffect(() => {
    if (anthem.previewUrl) player.replace({ uri: anthem.previewUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anthem.previewUrl]);

  // Pause the anthem when a podcast starts playing
  useEffect(() => {
    if (now && playing) player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, playing]);

  useEffect(() => () => { player.pause(); }, [player]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.playing) player.pause();
    else player.play();
  };

  const openSpotify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(spotifySearchUrl(anthem.track, anthem.artist));
  };

  return (
    <View style={s.card}>
      {anthem.artwork ? (
        <Image source={{ uri: anthem.artwork }} style={s.art} />
      ) : (
        <View style={[s.art, s.artFallback]}><Text style={{ fontSize: 26 }}>🎵</Text></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.label}>🎵 PROFILE ANTHEM</Text>
        <Text style={s.track} numberOfLines={1}>{anthem.track}</Text>
        <Text style={s.artist} numberOfLines={1}>{anthem.artist}</Text>
      </View>
      {!!anthem.previewUrl && (
        <Pressable style={s.playBtn} onPress={toggle}>
          <Text style={s.playText}>{status.playing ? '⏸' : '▶'}</Text>
        </Pressable>
      )}
      <Pressable style={s.spotBtn} onPress={openSpotify}>
        <Text style={s.spotText}>🟢 Spotify</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: R.md, padding: 10, marginTop: 10, borderWidth: 1, borderColor: C.border },
  art: { width: 52, height: 52, borderRadius: 8, marginRight: 10 },
  artFallback: { backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  track: { color: C.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
  artist: { color: C.muted, fontSize: 13 },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  playText: { color: '#fff', fontSize: 16 },
  spotBtn: { backgroundColor: '#1DB954', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  spotText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
